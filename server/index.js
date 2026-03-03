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

// ─── Pool de conexão PostgreSQL ─────────────────────
const pool = new Pool({
  host: process.env.DB_HOST || 'ia.cursatto.com.br',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'painelagenda',
  max: 20,
  idleTimeoutMillis: 30000,
});

// ─── Auth (JWT) ─────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_NOW';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

// ─── Middleware: resolver tenant e setar schema ────────
app.use('/api', async (req, res, next) => {
  const slug = req.headers['x-tenant-slug'];
  if (!slug) {
    return res.status(400).json({ error: 'Header X-Tenant-Slug é obrigatório' });
  }

  try {
    // Busca o schema_name do tenant na tabela pública
    const result = await pool.query(
      'SELECT schema_name FROM public.tenants WHERE slug = $1 AND active = true',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    req.schemaName = result.rows[0].schema_name;
    next();
  } catch (err) {
    console.error('Erro ao resolver tenant:', err);
    res.status(500).json({ error: 'Erro interno ao resolver tenant' });
  }
});

// Helper: executa query dentro do schema do tenant
async function tenantQuery(schemaName, text, params = []) {
  const client = await pool.connect();

  // Sanitiza o schema e coloca entre aspas para evitar problemas
  const safeSchema = String(schemaName).replace(/"/g, '""');

  try {
    await client.query('BEGIN');
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

    const result = await pool.query(
      `SELECT slug, schema_name, primary_domain
       FROM public.tenants
       WHERE slug = $1 AND active = true
       LIMIT 1`,
      [slug]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant não encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
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
    const result = await tenantQuery(
      req.schemaName,
      `INSERT INTO appointments (cliente_id, cliente_nome, inicio, fim, profissional_id, convenio_id, observacao, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        data.cliente_id,
        data.cliente_nome,
        data.inicio,
        data.fim,
        data.profissional_id,
        data.convenio_id,
        data.observacao,
        data.status || 'scheduled',
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
    const result = await tenantQuery(
      req.schemaName,
      `UPDATE appointments
       SET cliente_id=$1, cliente_nome=$2, inicio=$3, fim=$4, profissional_id=$5, convenio_id=$6, observacao=$7, status=$8, updated_at=NOW()
       WHERE id=$9
       RETURNING *`,
      [
        data.cliente_id,
        data.cliente_nome,
        data.inicio,
        data.fim,
        data.profissional_id,
        data.convenio_id,
        data.observacao,
        data.status,
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
    const { status } = req.body || {};
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
      `UPDATE specialties SET name=$1, is_active=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [name, is_active ?? true, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health-insurances', async (req, res) => {
  try {
    const result = await tenantQuery(req.schemaName, 'SELECT * FROM health_insurances ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/health-insurances', async (req, res) => {
  try {
    const { name, active } = req.body || {};
    const result = await tenantQuery(
      req.schemaName,
      `INSERT INTO health_insurances (name, active)
       VALUES ($1,$2)
       RETURNING *`,
      [name, active ?? true]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/health-insurances/:id', async (req, res) => {
  try {
    const { name, active } = req.body || {};
    const result = await tenantQuery(
      req.schemaName,
      `UPDATE health_insurances SET name=$1, active=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [name, active ?? true, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [appointmentsToday, patientsTotal, professionalsActive] = await Promise.all([
      tenantQuery(req.schemaName, 'SELECT COUNT(*) as count FROM appointments WHERE DATE(inicio) = $1', [today]),
      tenantQuery(req.schemaName, 'SELECT COUNT(*) as count FROM clients WHERE is_active = true'),
      tenantQuery(req.schemaName, 'SELECT COUNT(*) as count FROM professionals WHERE is_active = true'),
    ]);

    res.json({
      appointments_today: parseInt(appointmentsToday.rows[0].count, 10),
      patients_total: parseInt(patientsTotal.rows[0].count, 10),
      professionals_active: parseInt(professionalsActive.rows[0].count, 10),
      avg_wait_time: '15min',
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
