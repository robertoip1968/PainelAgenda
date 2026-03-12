/**
 * API Backend — Painel Agenda
 * Roda na VPS (porta 3000), conecta ao PostgreSQL.
 *
 * Variáveis de ambiente necessárias:
 *   DB_HOST=ia.cursatto.com.br
 *   DB_PORT=5432
 *   DB_USER=<usuario>
 *   DB_PASSWORD=<senha>
 *   DB_NAME=<nome_do_banco>
 *   PORT=3000  (opcional)
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// Funcao de mapeamento do status de atendimento
// (DB continua com: scheduled | canceled | rescheduled | done | no_show)
function mapStatusToDb(input) {
  const v = String(input ?? 'scheduled').toLowerCase();

  // DB (permitidos pelo CHECK)
  if (['scheduled', 'canceled', 'rescheduled', 'done', 'no_show'].includes(v)) return v;

  // Compatibilidade (caso algum front antigo ainda envie outros códigos)
  const legacy = {
    waiting: 'scheduled',
    confirmed: 'scheduled',
    queue: 'scheduled',
    'in-progress': 'scheduled',

    completed: 'done',
    absent: 'no_show',

    cancelado: 'canceled',
    cancelled: 'canceled',

    reagendado: 'rescheduled',

    'no-show': 'no_show',
  };

  return legacy[v] ?? 'scheduled';
}


// ─── Pool de conexão PostgreSQL ─────────────────────
const pool = new Pool({
  host: process.env.DB_HOST || 'ia.cursatto.com.br',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'painelagenda',
  max: 20,
  idleTimeoutMillis: 30000,
});

// ─── Tenant cache + proteção contra "tempestade" ─────────────────────────
const TENANT_CACHE_TTL_MS = 60_000; // 1 min (ajuste se quiser)
const tenantCache = new Map(); // slug -> { slug, schema_name, primary_domain, expiresAt }

let tenantFailUntil = 0; // circuit breaker: se der erro no DB, pausa tentativas por X ms
let tenantErrLastLog = 0;
let tenantErrSuppressed = 0;

function logTenantErrorThrottled(err) {
  const now = Date.now();
  // loga no máximo 1x a cada 5s
  if (now - tenantErrLastLog > 5000) {
    const suppressed = tenantErrSuppressed;
    tenantErrSuppressed = 0;
    tenantErrLastLog = now;

    console.error('Erro ao resolver tenant:', err?.message || err);
    if (suppressed > 0) console.error(`(suprimidos ${suppressed} erros iguais nos últimos 5s)`);
  } else {
    tenantErrSuppressed++;
  }
}

async function resolveTenant(slug) {
  const now = Date.now();

  // breaker ativo: não martela o banco
  if (now < tenantFailUntil) {
    const e = new Error('Tenant resolver em backoff (DB instável/erro de credencial).');
    e.code = 'TENANT_BACKOFF';
    throw e;
  }

  const cached = tenantCache.get(slug);
  if (cached && cached.expiresAt > now) return cached;

  const result = await pool.query(
    `SELECT slug, schema_name, primary_domain
       FROM public.tenants
      WHERE slug = $1 AND active = true
      LIMIT 1`,
    [slug]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const value = {
    slug: row.slug,
    schema_name: row.schema_name,
    primary_domain: row.primary_domain,
    expiresAt: now + TENANT_CACHE_TTL_MS,
  };

  tenantCache.set(slug, value);
  return value;
}


// ─── Auth (JWT) ─────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_NOW';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

// ─── Middleware: resolver tenant e setar schema ────────
app.use('/api', async (req, res, next) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'];
    if (!tenantSlug) return res.status(400).json({ error: 'X-Tenant-Slug ausente' });

    const tenant = await resolveTenant(String(tenantSlug));
    if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado ou inativo' });

    req.tenantSlug = tenant.slug;
    req.schemaName = tenant.schema_name;

    next();
  } catch (err) {
    // Se DB falhar, entra em backoff por 15s (evita "derrubar" a VPS)
    if (err?.code === 'TENANT_BACKOFF') {
      return res.status(503).json({ error: 'Resolver de tenant temporariamente indisponível. Tente novamente.' });
    }

    tenantFailUntil = Date.now() + 15_000;
    logTenantErrorThrottled(err);

    return res.status(500).json({ error: 'Erro interno ao resolver tenant' });
  }
});

// Helper: executa query dentro do schema do tenant
// options.statementTimeoutMs (number): aplica SET LOCAL statement_timeout apenas para esta transação
async function tenantQuery(schemaName, text, params = [], options = {}) {
  const client = await pool.connect();

  // Sanitiza o schema e coloca entre aspas para evitar problemas
  const safeSchema = String(schemaName).replace(/"/g, '""');

  try {
    await client.query('BEGIN');
    if (options && typeof options.statementTimeoutMs === 'number') {
      const st = Math.max(0, Math.floor(options.statementTimeoutMs));
      // Não usa bind aqui (SET LOCAL nem sempre aceita parâmetro via driver)
      await client.query(`SET LOCAL statement_timeout = ${st}`);
    }
    await client.query(`SET LOCAL search_path TO "${safeSchema}", public`);
    const result = await client.query(text, params);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

// ─── Auth helpers ───────────────────────────────────────────────
function getBearerToken(req) {
  const h = String(req.headers.authorization || '');
  if (!h.toLowerCase().startsWith('bearer ')) return '';
  return h.slice(7).trim();
}

function publicUser(row) {
  if (!row) return row;
  const { senha_hash, ...safe } = row;
  return safe;
}

// Middleware: exige token para /api/* (exceto /api/tenant e /api/auth/*)
function authGuard(req, res, next) {
  const p = String(req.path || '');

  // rotas públicas
  if (p === '/tenant') return next();
  if (p.startsWith('/auth/login')) return next();
  if (p.startsWith('/auth/me')) return next();

  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Não autenticado' });

  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Protege endpoints /api/* (exceto rotas públicas)
app.use('/api', authGuard);

// ─── Endpoint: Tenant info ──────────────────────────
app.get('/api/tenant', async (req, res) => {
  try {
    const slug = req.headers['x-tenant-slug'];
    if (!slug) return res.status(400).json({ error: 'Slug ausente' });

    const tenant = await resolveTenant(String(slug));
    if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });

    res.json({
      slug: tenant.slug,
      schema_name: tenant.schema_name,
      primary_domain: tenant.primary_domain,
    });
  } catch (err) {
    if (err?.code === 'TENANT_BACKOFF') {
      return res.status(503).json({ error: 'Temporariamente indisponível' });
    }
    tenantFailUntil = Date.now() + 15_000;
    logTenantErrorThrottled(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ─── AUTH: Login ───────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const identifier = String(email ?? '').trim().toLowerCase();
    const pass = String(password ?? '');

    if (!identifier || !pass) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const result = await tenantQuery(
      req.schemaName,
      `SELECT id, nome, username, email, nivel, senha_hash, ativo, celular, last_login_at, created_at, updated_at
       FROM users
       WHERE ativo = true
         AND (lower(email) = $1 OR lower(username) = $1)
       LIMIT 1`,
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const user = result.rows[0];

    const hash = String(user.senha_hash || '');
    let ok = false;

    // Aceita bcrypt e (temporariamente) texto puro para facilitar migração
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      ok = bcrypt.compareSync(pass, hash);
    } else {
      ok = pass === hash;
    }

    if (!ok) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

    // Atualiza last_login_at
    await tenantQuery(req.schemaName, `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`, [user.id]);

    const tenantSlug = String(req.headers['x-tenant-slug'] || '');

    const token = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
        username: user.username,
        nivel: user.nivel,
        tenant: tenantSlug,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno no login' });
  }
});

// ─── AUTH: Me ───────────────────────────────────────────────────
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Não autenticado' });

    const payload = jwt.verify(token, JWT_SECRET);

    const result = await tenantQuery(
      req.schemaName,
      `SELECT id, nome, username, email, nivel, ativo, celular, last_login_at, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [payload.user_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
});

// ─── PROFISSIONAIS ─────────────────────────────────────────────
app.get('/api/professionals', async (req, res) => {
  try {
    const result = await tenantQuery(req.schemaName, 'SELECT * FROM professionals ORDER BY full_name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/professionals/:id', async (req, res) => {
  try {
    const result = await tenantQuery(req.schemaName, 'SELECT * FROM professionals WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profissional não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/professionals', async (req, res) => {
  try {
    const data = req.body || {};
    const result = await tenantQuery(
      req.schemaName,
      `INSERT INTO professionals (full_name, area, specialty_id, numero_conselho, phone, email, is_active)
       VALUES ($1,$2,$3,$4,$5,$6, true)
       RETURNING *`,
      [data.full_name, data.area, data.specialty_id, data.numero_conselho, data.phone, data.email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/professionals/:id', async (req, res) => {
  try {
    const data = req.body || {};
    const result = await tenantQuery(
      req.schemaName,
      `UPDATE professionals
       SET full_name=$1, area=$2, specialty_id=$3, numero_conselho=$4, phone=$5, email=$6, updated_at=NOW()
       WHERE id=$7
       RETURNING *`,
      [data.full_name, data.area, data.specialty_id, data.numero_conselho, data.phone, data.email, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/professionals/:id', async (req, res) => {
  try {
    await tenantQuery(req.schemaName, 'DELETE FROM professionals WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PACIENTES (clients) ───────────────────────────────────────
app.get('/api/patients', async (req, res) => {
  try {
    const result = await tenantQuery(req.schemaName, 'SELECT * FROM clients ORDER BY full_name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const result = await tenantQuery(req.schemaName, 'SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Paciente não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const data = req.body || {};
    const result = await tenantQuery(
      req.schemaName,
      `INSERT INTO clients (full_name, cpf, birth_date, sex, phone, email, zip_code, street, number, complement, neighborhood, city, state_uf, insurance_plan_id, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true)
       RETURNING *`,
      [
        data.full_name,
        data.cpf,
        data.birth_date,
        data.sex,
        data.phone,
        data.email,
        data.zip_code,
        data.street,
        data.number,
        data.complement,
        data.neighborhood,
        data.city,
        data.state_uf,
        data.insurance_plan_id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const data = req.body || {};
    const result = await tenantQuery(
      req.schemaName,
      `UPDATE clients
       SET full_name=$1, cpf=$2, birth_date=$3, sex=$4, phone=$5, email=$6, zip_code=$7, street=$8, number=$9, complement=$10,
           neighborhood=$11, city=$12, state_uf=$13, insurance_plan_id=$14, updated_at=NOW()
       WHERE id=$15
       RETURNING *`,
      [
        data.full_name,
        data.cpf,
        data.birth_date,
        data.sex,
        data.phone,
        data.email,
        data.zip_code,
        data.street,
        data.number,
        data.complement,
        data.neighborhood,
        data.city,
        data.state_uf,
        data.insurance_plan_id,
        req.params.id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    await tenantQuery(req.schemaName, 'DELETE FROM clients WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── MENSAGENS (historico_chat) ─────────────────────
app.get('/api/messages', async (req, res) => {
  try {
    const phone = String(req.query.phone ?? '').trim();
    const client = String(req.query.client ?? '').trim();
    const direction = String(req.query.direction ?? '').trim(); // received | sent | ''
    const intent = String(req.query.intent ?? '').trim();
    const date = String(req.query.date ?? '').trim(); // YYYY-MM-DD

    const limit = Math.min(parseInt(String(req.query.limit ?? '200'), 10) || 200, 1000);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0);

    let sql = `
      SELECT
        id::text AS id,
        telefone_cliente AS phone,
        nome_cliente AS client,
        CASE
          WHEN lower(direcao) IN ('recebida','received','in','entrada','incoming') THEN 'received'
          WHEN lower(direcao) IN ('enviada','sent','out','saida','outgoing') THEN 'sent'
          ELSE lower(direcao)
        END AS direction,
        mensagem AS text,
        COALESCE(intencao, '') AS intent,
        datahora AS "dateTime"
      FROM historico_chat
      WHERE 1=1
    `;

    const params = [];

    if (phone) {
      params.push(`%${phone}%`);
      sql += ` AND telefone_cliente ILIKE $${params.length}`;
    }

    if (client) {
      params.push(`%${client}%`);
      sql += ` AND nome_cliente ILIKE $${params.length}`;
    }

    if (direction === 'received') {
      sql += ` AND lower(direcao) IN ('recebida','received','in','entrada','incoming')`;
    } else if (direction === 'sent') {
      sql += ` AND lower(direcao) IN ('enviada','sent','out','saida','outgoing')`;
    }

    if (intent) {
      params.push(intent);
      sql += ` AND COALESCE(intencao,'') ILIKE $${params.length}`;
    }

    if (date) {
      params.push(date);
      sql += ` AND datahora::date = $${params.length}::date`;
    }

    params.push(limit);
    sql += ` ORDER BY datahora DESC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const result = await tenantQuery(req.schemaName, sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── APPOINTMENTS / SPECIALTIES / HEALTH INSURANCES / DASHBOARD ──
// (mantive o restante do seu arquivo como está no ZIP)

app.get('/api/appointments', async (req, res) => {
  try {
    const date = req.query.date;
    const professionalId = req.query.professional_id;

    let query = 'SELECT * FROM appointments';
    const params = [];
    const conditions = [];

    if (date) {
      params.push(date);
      conditions.push(`DATE(inicio) = $${params.length}`);
    }

    if (professionalId) {
      params.push(professionalId);
      conditions.push(`professional_id = $${params.length}`);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY inicio';

    const result = await tenantQuery(req.schemaName, query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {

    const data = req.body || {};

    const client_id = data.client_id ? Number(data.client_id) : null;

    const cliente_nome = String(data.cliente_nome ?? data.patientName ?? '').trim();

    // telefone: aceita cliente_telefone OU phone (do formData do modal)
    const cliente_telefone = String(
      data.cliente_telefone ?? data.phone ?? data.celular ?? data.telefone ?? ''
    ).trim();

    const professional_id = data.professional_id ? Number(data.professional_id) : (
      data.profissional_id ? Number(data.profissional_id) : null
    );

    const insurance_plan_id =
      data.insurance_plan_id != null
        ? Number(data.insurance_plan_id)
        : (data.healthInsurance && data.healthInsurance !== 'particular'
            ? Number(data.healthInsurance)
            : null);

    const service_id = data.service_id ? Number(data.service_id) : null;

    const tipo = data.tipo ?? 'consultation';
    const inicio = data.inicio;
    const fim = data.fim;

    const status = mapStatusToDb(data.status ?? 'scheduled');

    const observacao = data.observacao ?? data.notes ?? null;

    // validacoes (para numero cair em erro 500 do Postgres)

    if (!cliente_nome) return res.status(400).json({ error: 'cliente_nome é obrigatório' });
    if (!cliente_telefone) return res.status(400).json({ error: 'cliente_telefone é obrigatório' });
    if (!inicio || !fim) return res.status(400).json({ error: 'inicio e fim são obrigatórios' });
    if (!professional_id) return res.status(400).json({ error: 'professional_id é obrigatório' });

    const result = await tenantQuery(
      req.schemaName,
      `
      INSERT INTO appointments
        (client_id, cliente_nome, cliente_telefone, tipo, inicio, fim, status, observacao,
         professional_id, service_id, insurance_plan_id)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        client_id,
        cliente_nome,
        cliente_telefone,
        tipo,
        inicio,
        fim,
        status,
        observacao,
        professional_id,
        service_id,
        insurance_plan_id,
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const data = req.body || {};

    const client_id = data.client_id ? Number(data.client_id) : null;

    const cliente_nome = String(data.cliente_nome ?? data.patientName ?? '').trim();

    const cliente_telefone = String(
      data.cliente_telefone ?? data.phone ?? data.celular ?? data.telefone ?? ''
    ).trim();

    const professional_id = data.professional_id ? Number(data.professional_id) : (
      data.profissional_id ? Number(data.profissional_id) : null
    );

    const insurance_plan_id =
      data.insurance_plan_id != null
        ? Number(data.insurance_plan_id)
        : (data.healthInsurance && data.healthInsurance !== 'particular'
            ? Number(data.healthInsurance)
            : null);

    const service_id = data.service_id ? Number(data.service_id) : null;

    const tipo = data.tipo ?? 'consultation';
    const inicio = data.inicio;
    const fim = data.fim;
    const status = mapStatusToDb(data.status ?? 'scheduled');
    const observacao = data.observacao ?? data.notes ?? null;

    if (!cliente_nome) return res.status(400).json({ error: 'cliente_nome é obrigatório' });
    if (!cliente_telefone) return res.status(400).json({ error: 'cliente_telefone é obrigatório' });
    if (!inicio || !fim) return res.status(400).json({ error: 'inicio e fim são obrigatórios' });
    if (!professional_id) return res.status(400).json({ error: 'professional_id é obrigatório' });

    const result = await tenantQuery(
      req.schemaName,
      `
      UPDATE appointments
         SET client_id=$1,
             cliente_nome=$2,
             cliente_telefone=$3,
             tipo=$4,
             inicio=$5,
             fim=$6,
             status=$7,
             observacao=$8,
             professional_id=$9,
             service_id=$10,
             insurance_plan_id=$11,
             updated_at=NOW()
       WHERE id=$12
       RETURNING *
      `,
      [
        client_id,
        cliente_nome,
        cliente_telefone,
        tipo,
        inicio,
        fim,
        status,
        observacao,
        professional_id,
        service_id,
        insurance_plan_id,
        req.params.id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/appointments/:id/status', async (req, res) => {
  try {
    const status = mapStatusToDb(req.body?.status);
    const result = await tenantQuery(
      req.schemaName,
      `UPDATE appointments SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await tenantQuery(req.schemaName, 'DELETE FROM appointments WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/specialties', async (req, res) => {
  try {
    const result = await tenantQuery(req.schemaName, 'SELECT * FROM specialties ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/specialties', async (req, res) => {
  try {
    const { name, is_active } = req.body || {};
    const result = await tenantQuery(
      req.schemaName,
      `INSERT INTO specialties (name, is_active)
       VALUES ($1,$2)
       RETURNING *`,
      [name, is_active ?? true]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/specialties/:id', async (req, res) => {
  try {
    const { name, is_active } = req.body || {};
    const result = await tenantQuery(
      req.schemaName,
      `UPDATE specialties SET name=$1, is_active=$2 WHERE id=$3 RETURNING *`,
      [name, is_active ?? true, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/specialties/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const result = await tenantQuery(
      req.schemaName,
      `DELETE FROM specialties WHERE id=$1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Especialidade não encontrada' });
    }

    return res.json({ ok: true });
  } catch (err) {
    // FK violation (especialidade em uso)
    if (err && err.code === '23503') {
      return res.status(409).json({
        error: 'Esta especialidade está vinculada a profissionais. Remova os vínculos antes de excluir.',
      });
    }

    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Convênios (insurance_plans no BD) ───────────────────────────
// Mantém o endpoint /api/health-insurances por compatibilidade com o front,
// mas usa a tabela insurance_plans (coluna is_active) no schema do tenant.

app.get('/api/health-insurances', async (req, res) => {
  try {
    const result = await tenantQuery(
      req.schemaName,
      `
      SELECT
        id::text AS id,
        name,
        is_active AS active,
        created_at,
        updated_at
      FROM insurance_plans
      ORDER BY name
      `
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/health-insurances', async (req, res) => {
  try {
    const { name, active, is_active } = req.body || {};
    const flag = (active ?? is_active ?? true);

    const result = await tenantQuery(
      req.schemaName,
      `
      INSERT INTO insurance_plans (name, is_active)
      VALUES ($1, $2)
      RETURNING id::text AS id, name, is_active AS active, created_at, updated_at
      `,
      [name, flag]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/health-insurances/:id', async (req, res) => {
  try {
    const { name, active, is_active } = req.body || {};
    const flag = (active ?? is_active ?? true);

    const result = await tenantQuery(
      req.schemaName,
      `
      UPDATE insurance_plans
      SET name = $1,
          is_active = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING id::text AS id, name, is_active AS active, created_at, updated_at
      `,
      [name, flag, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ═══════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════

// Converte minutos (float) para label "15min" ou "—"
function minutesToLabel(minutes) {
  if (minutes === null || minutes === undefined) return '—';
  const m = Math.round(Number(minutes));
  if (!Number.isFinite(m) || m <= 0) return '—';
  return `${m}min`;
}

// ─── Dashboard: helpers (faixa de datas com índice-friendly) ────────────────
const DASHBOARD_TZ = process.env.DASHBOARD_TZ || 'America/Cuiaba';
const DASHBOARD_TZ_SAFE = String(DASHBOARD_TZ).replace(/'/g, "");

// Range para colunas timestamptz (appointments.inicio)
function buildRangeClauseTimestamptz(column, date, period, tz = DASHBOARD_TZ_SAFE) {
  const safeTz = String(tz).replace(/'/g, "");

  // Data específica (YYYY-MM-DD): meia-noite no fuso, convertido para timestamptz
  if (date) {
    return {
      clause: `${column} >= ($1::date::timestamp AT TIME ZONE '${safeTz}') AND ${column} < (($1::date + 1)::timestamp AT TIME ZONE '${safeTz}')`,
      params: [date],
    };
  }

  // Semana no fuso, convertido para timestamptz (índice-friendly)
  if (period === 'last') {
    return {
      clause: `${column} >= ((date_trunc('week', (now() AT TIME ZONE '${safeTz}')) - interval '7 day') AT TIME ZONE '${safeTz}')
              AND ${column} < (date_trunc('week', (now() AT TIME ZONE '${safeTz}')) AT TIME ZONE '${safeTz}')`,
      params: [],
    };
  }

  return {
    clause: `${column} >= (date_trunc('week', (now() AT TIME ZONE '${safeTz}')) AT TIME ZONE '${safeTz}')
            AND ${column} < ((date_trunc('week', (now() AT TIME ZONE '${safeTz}')) + interval '7 day') AT TIME ZONE '${safeTz}')`,
    params: [],
  };
}

// Range para colunas timestamp sem tz (historico_chat.datahora)
function buildRangeClauseTimestamp(column, date, period, tz = DASHBOARD_TZ_SAFE) {
  const safeTz = String(tz).replace(/'/g, "");

  // Data específica (YYYY-MM-DD): comparando com timestamp local
  if (date) {
    return {
      clause: `${column} >= $1::date::timestamp AND ${column} < ($1::date + 1)::timestamp`,
      params: [date],
    };
  }

  // Semana usando timezone() -> timestamp local
  if (period === 'last') {
    return {
      clause: `${column} >= (date_trunc('week', timezone('${safeTz}', now())) - interval '7 day')
              AND ${column} < date_trunc('week', timezone('${safeTz}', now()))`,
      params: [],
    };
  }

  return {
    clause: `${column} >= date_trunc('week', timezone('${safeTz}', now()))
            AND ${column} < (date_trunc('week', timezone('${safeTz}', now())) + interval '7 day')`,
    params: [],
  };
}

// ─── Dashboard: overview (gráfico + aguardando confirmação) ────────────────
app.get('/api/dashboard/overview', async (req, res) => {
  try {
    const date = String(req.query.date ?? '').trim(); // YYYY-MM-DD
    const period = req.query.period === 'last' ? 'last' : 'current';

    const apptRange = buildRangeClauseTimestamptz('a.inicio', date, period);
    const chatRange = buildRangeClauseTimestamp('hc.datahora', date, period);

    // IMPORTANTE: sequencial (evita abrir várias conexões ao mesmo tempo)
    const appointmentsAgg = await tenantQuery(
      req.schemaName,
      `
      SELECT
        COUNT(*) FILTER (WHERE a.status = 'scheduled')::int AS agendamentos,
        COUNT(*) FILTER (WHERE COALESCE(a.confirmado, false) = true)::int AS confirmacoes,
        COUNT(*) FILTER (WHERE a.status = 'canceled')::int AS cancelamentos,
        COUNT(*) FILTER (WHERE a.status = 'rescheduled')::int AS reagendamentos,
        COUNT(*) FILTER (WHERE a.status = 'no_show')::int AS no_show
      FROM appointments a
      WHERE ${apptRange.clause}
      `,
      apptRange.params,
      { statementTimeoutMs: 4000 }
    );

    const contactsAgg = await tenantQuery(
      req.schemaName,
      `
      SELECT COUNT(DISTINCT NULLIF(TRIM(hc.telefone_cliente), ''))::int AS contatos
      FROM historico_chat hc
      WHERE ${chatRange.clause}
      `,
      chatRange.params,
      { statementTimeoutMs: 4000 }
    );

    const pending = await tenantQuery(
      req.schemaName,
      `
      SELECT
        a.id::text,
        a.cliente_nome,
        COALESCE(p.full_name, 'Sem profissional') AS professional_name,
        a.inicio,
        a.tipo
      FROM appointments a
      LEFT JOIN professionals p ON p.id = a.professional_id
      WHERE a.status IN ('scheduled', 'rescheduled')
        AND COALESCE(a.confirmado, false) = false
        AND a.inicio >= NOW()
      ORDER BY a.inicio ASC
      LIMIT 5
      `,
      [],
      { statementTimeoutMs: 4000 }
    );

    const a = appointmentsAgg.rows[0] || {};
    const c = contactsAgg.rows[0] || {};

    res.json({
      chart: [
        { key: 'contatos', name: 'Contatos', value: c.contatos ?? 0, color: '#3B82F6' },
        { key: 'agendamentos', name: 'Agendamentos', value: a.agendamentos ?? 0, color: '#F472B6' },
        { key: 'confirmacoes', name: 'Confirmações', value: a.confirmacoes ?? 0, color: '#F59E0B' },
        { key: 'cancelamentos', name: 'Cancelamentos', value: a.cancelamentos ?? 0, color: '#10B981' },
        { key: 'reagendamentos', name: 'Reagendamento', value: a.reagendamentos ?? 0, color: '#6EE7B7' },
        { key: 'no_show', name: 'No-show', value: a.no_show ?? 0, color: '#EF4444' },
      ],
      pendingConfirmations: pending.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Dashboard: details (tabela abaixo do gráfico) ─────────────────────────
app.get('/api/dashboard/details', async (req, res) => {
  try {
    const category = String(req.query.category ?? '').trim();
    const date = String(req.query.date ?? '').trim();
    const period = req.query.period === 'last' ? 'last' : 'current';

    const valid = new Set(['contatos', 'agendamentos', 'confirmacoes', 'cancelamentos', 'reagendamentos', 'no_show']);
    if (!valid.has(category)) return res.status(400).json({ error: 'Categoria inválida' });

    if (category === 'contatos') {
      const range = buildRangeClauseTimestamp('hc.datahora', date, period);
      const r = await tenantQuery(
        req.schemaName,
        `
        SELECT DISTINCT ON (COALESCE(NULLIF(TRIM(hc.telefone_cliente), ''), hc.id::text))
          hc.id::text AS id,
          COALESCE(NULLIF(TRIM(hc.nome_cliente), ''), 'Contato sem nome') AS name,
          COALESCE(NULLIF(TRIM(hc.telefone_cliente), ''), '—') AS info,
          TO_CHAR(hc.datahora, 'DD/MM/YYYY') AS date,
          TO_CHAR(hc.datahora, 'HH24:MI') AS time,
          COALESCE(NULLIF(TRIM(hc.tipo_mensagem), ''), 'Mensagem') AS type,
          COALESCE(NULLIF(TRIM(hc.intencao), ''), 'Sem intenção') AS status_text,
          NULL::text AS appointment_status
        FROM historico_chat hc
        WHERE ${range.clause}
        ORDER BY COALESCE(NULLIF(TRIM(hc.telefone_cliente), ''), hc.id::text), hc.datahora DESC
        LIMIT 20
        `,
        range.params,
        { statementTimeoutMs: 4000 }
      );

      return res.json(r.rows);
    }

    const statusMap = {
      agendamentos: `a.status = 'scheduled'`,
      confirmacoes: `COALESCE(a.confirmado, false) = true`,
      cancelamentos: `a.status = 'canceled'`,
      reagendamentos: `a.status = 'rescheduled'`,
      no_show: `a.status = 'no_show'`,
    };

    const range = buildRangeClauseTimestamptz('a.inicio', date, period);
    const r = await tenantQuery(
      req.schemaName,
      `
      SELECT
        a.id::text AS id,
        a.cliente_nome AS name,
        COALESCE(p.full_name, 'Sem profissional') AS info,
        TO_CHAR(a.inicio AT TIME ZONE '${DASHBOARD_TZ_SAFE}', 'DD/MM/YYYY') AS date,
        TO_CHAR(a.inicio AT TIME ZONE '${DASHBOARD_TZ_SAFE}', 'HH24:MI') AS time,
        COALESCE(NULLIF(TRIM(a.tipo), ''), '—') AS type,
        a.status AS appointment_status,
        CASE
          WHEN COALESCE(a.confirmado, false) = true THEN 'Confirmado'
          ELSE 'Pendente'
        END AS status_text
      FROM appointments a
      LEFT JOIN professionals p ON p.id = a.professional_id
      WHERE ${range.clause}
        AND ${statusMap[category]}
      ORDER BY a.inicio DESC
      LIMIT 20
      `,
      range.params,
      { statementTimeoutMs: 4000 }
    );

    return res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Calcula "Tempo Médio de Espera" de forma resiliente:
// - Se existir coluna de fila/início real, usa ela
// - Senão, usa duração média (fim - inicio) como fallback (melhor que fixo)
async function computeAvgWaitMinutes(schemaName) {
  // Descobrir colunas existentes em appointments
  const colsRes = await tenantQuery(
    schemaName,
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = 'appointments'
    `,
    [schemaName]
  );

  const cols = new Set(colsRes.rows.map(r => String(r.column_name)));

  // Tentativas (só colunas "permitidas" pra evitar query quebrar)
  // 1) checkin_at -> started_at (ou variações)
  const startCandidates = ['checkin_at', 'fila_entrada_at', 'queue_at'];
  const endCandidates = ['started_at', 'start_at', 'inicio_real', 'inicio_atendimento', 'in_progress_at'];

  let waitStartCol = startCandidates.find(c => cols.has(c));
  let waitEndCol = endCandidates.find(c => cols.has(c));

  // Se encontrou par de colunas, calcula média de (end - start) em minutos (hoje)
  if (waitStartCol && waitEndCol) {
    const q = `
      SELECT AVG(EXTRACT(EPOCH FROM (${waitEndCol} - ${waitStartCol})) / 60.0) AS minutes
      FROM appointments
      WHERE ${waitStartCol} IS NOT NULL
        AND ${waitEndCol} IS NOT NULL
        AND ${waitStartCol}::date = CURRENT_DATE
    `;
    const r = await tenantQuery(schemaName, q);
    return r.rows?.[0]?.minutes ?? null;
  }

  // 2) Fallback: duração média (fim - inicio) para atendimentos concluídos (hoje)
  if (cols.has('fim') && cols.has('inicio')) {
    const q = `
      SELECT AVG(EXTRACT(EPOCH FROM (fim - inicio)) / 60.0) AS minutes
      FROM appointments
      WHERE inicio::date = CURRENT_DATE
        AND fim IS NOT NULL
        AND inicio IS NOT NULL
        AND status IN ('done')
    `;
    const r = await tenantQuery(schemaName, q);
    return r.rows?.[0]?.minutes ?? null;
  }

  return null;
}

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [appts, pats, profs, avgMin] = await Promise.all([
      tenantQuery(req.schemaName, "SELECT COUNT(*)::int as count FROM appointments WHERE inicio::date = CURRENT_DATE"),
      tenantQuery(req.schemaName, "SELECT COUNT(*)::int as count FROM clients WHERE is_active = true"),
      tenantQuery(req.schemaName, "SELECT COUNT(*)::int as count FROM professionals WHERE is_active = true"),
      computeAvgWaitMinutes(req.schemaName),
    ]);

    res.json({
      appointments_today: appts.rows[0].count,
      patients_total: pats.rows[0].count,
      professionals_active: profs.rows[0].count,
      avg_wait_time: minutesToLabel(avgMin),
      // opcional (útil pro futuro):
      avg_wait_time_minutes: avgMin === null ? null : Number(avgMin),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
