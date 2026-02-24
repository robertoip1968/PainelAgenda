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

// ─── Middleware: setar search_path por tenant ────────
app.use('/api', async (req, res, next) => {
  const slug = req.headers['x-tenant-slug'];
  if (!slug) {
    return res.status(400).json({ error: 'Header X-Tenant-Slug é obrigatório' });
  }

  try {
    // Busca o schema_name do tenant na tabela pública
    const result = await pool.query(
      'SELECT schema_name FROM public.tenants WHERE slug = $1 AND is_active = true',
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
  try {
    await client.query(`SET LOCAL search_path = ${schemaName}, public`);
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// ─── Endpoint: Tenant info ──────────────────────────
app.get('/api/tenant', async (req, res) => {
  const slug = req.headers['x-tenant-slug'];
  if (!slug) return res.status(400).json({ error: 'Slug ausente' });

  try {
    const result = await pool.query(
      'SELECT slug, schema_name, primary_domain FROM public.tenants WHERE slug = $1',
      [slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ═══════════════════════════════════════════════════
// PROFISSIONAIS
// ═══════════════════════════════════════════════════
app.get('/api/professionals', async (req, res) => {
  try {
    const result = await tenantQuery(req.schemaName, `
      SELECT p.*, s.name as "specialtyName"
      FROM professionals p
      LEFT JOIN specialties s ON s.id = p.specialty_id
      ORDER BY p.full_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/professionals/:id', async (req, res) => {
  try {
    const result = await tenantQuery(req.schemaName,
      'SELECT p.*, s.name as "specialtyName" FROM professionals p LEFT JOIN specialties s ON s.id = p.specialty_id WHERE p.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/professionals', async (req, res) => {
  const { full_name, area, specialty_id, numero_conselho, email, phone, is_active } = req.body;
  try {
    const result = await tenantQuery(req.schemaName,
      `INSERT INTO professionals (full_name, area, specialty_id, numero_conselho, email, phone, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [full_name, area, specialty_id, numero_conselho, email, phone, is_active ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/professionals/:id', async (req, res) => {
  const { full_name, area, specialty_id, numero_conselho, email, phone, is_active } = req.body;
  try {
    const result = await tenantQuery(req.schemaName,
      `UPDATE professionals SET full_name=$1, area=$2, specialty_id=$3, numero_conselho=$4, email=$5, phone=$6, is_active=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [full_name, area, specialty_id, numero_conselho, email, phone, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
// PACIENTES (clients)
// ═══════════════════════════════════════════════════
app.get('/api/patients', async (req, res) => {
  try {
    const result = await tenantQuery(req.schemaName,
      'SELECT * FROM clients ORDER BY full_name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const result = await tenantQuery(req.schemaName,
      'SELECT * FROM clients WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', async (req, res) => {
  const { full_name, cpf, birth_date, sex, phone, email, zip_code, street, number, complement, neighborhood, city, state_uf, insurance_plan_id } = req.body;
  try {
    const result = await tenantQuery(req.schemaName,
      `INSERT INTO clients (full_name, cpf, birth_date, sex, phone, email, zip_code, street, number, complement, neighborhood, city, state_uf, insurance_plan_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [full_name, cpf, birth_date, sex, phone, email, zip_code, street, number, complement, neighborhood, city, state_uf, insurance_plan_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  const { full_name, cpf, birth_date, sex, phone, email, zip_code, street, number, complement, neighborhood, city, state_uf, insurance_plan_id } = req.body;
  try {
    const result = await tenantQuery(req.schemaName,
      `UPDATE clients SET full_name=$1, cpf=$2, birth_date=$3, sex=$4, phone=$5, email=$6, zip_code=$7, street=$8, number=$9, complement=$10, neighborhood=$11, city=$12, state_uf=$13, insurance_plan_id=$14, updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [full_name, cpf, birth_date, sex, phone, email, zip_code, street, number, complement, neighborhood, city, state_uf, insurance_plan_id, req.params.id]
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
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
// AGENDAMENTOS
// ═══════════════════════════════════════════════════
app.get('/api/appointments', async (req, res) => {
  const { date, professional_id } = req.query;
  try {
    let query = `
      SELECT a.*, p.full_name as "professionalName"
      FROM appointments a
      LEFT JOIN professionals p ON p.id = a.professional_id
      WHERE 1=1
    `;
    const params = [];
    if (date) {
      params.push(date);
      query += ` AND DATE(a.inicio) = $${params.length}`;
    }
    if (professional_id) {
      params.push(professional_id);
      query += ` AND a.professional_id = $${params.length}`;
    }
    query += ' ORDER BY a.inicio';

    const result = await tenantQuery(req.schemaName, query, params);

    // Adiciona campos auxiliares de exibição
    const rows = result.rows.map(row => ({
      ...row,
      date: row.inicio ? row.inicio.toISOString().split('T')[0] : '',
      time: row.inicio ? row.inicio.toISOString().split('T')[1]?.substring(0, 5) : '',
    }));

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  const { cliente_nome, cliente_telefone, tipo, inicio, fim, status, observacao, professional_id, service_id } = req.body;
  try {
    const result = await tenantQuery(req.schemaName,
      `INSERT INTO appointments (cliente_nome, cliente_telefone, tipo, inicio, fim, status, observacao, professional_id, service_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [cliente_nome, cliente_telefone, tipo, inicio, fim, status || 'waiting', observacao, professional_id, service_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  const { cliente_nome, cliente_telefone, tipo, inicio, fim, status, observacao, professional_id, service_id } = req.body;
  try {
    const result = await tenantQuery(req.schemaName,
      `UPDATE appointments SET cliente_nome=$1, cliente_telefone=$2, tipo=$3, inicio=$4, fim=$5, status=$6, observacao=$7, professional_id=$8, service_id=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [cliente_nome, cliente_telefone, tipo, inicio, fim, status, observacao, professional_id, service_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/appointments/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const result = await tenantQuery(req.schemaName,
      'UPDATE appointments SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
// ESPECIALIDADES
// ═══════════════════════════════════════════════════
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
  const { name, is_active } = req.body;
  try {
    const result = await tenantQuery(req.schemaName,
      'INSERT INTO specialties (name, is_active) VALUES ($1, $2) RETURNING *',
      [name, is_active ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/specialties/:id', async (req, res) => {
  const { name, is_active } = req.body;
  try {
    const result = await tenantQuery(req.schemaName,
      'UPDATE specialties SET name=$1, is_active=$2 WHERE id=$3 RETURNING *',
      [name, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════
// CONVÊNIOS
// ═══════════════════════════════════════════════════
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
  const { name, active } = req.body;
  try {
    const result = await tenantQuery(req.schemaName,
      'INSERT INTO health_insurances (name, active) VALUES ($1, $2) RETURNING *',
      [name, active ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/health-insurances/:id', async (req, res) => {
  const { name, active } = req.body;
  try {
    const result = await tenantQuery(req.schemaName,
      'UPDATE health_insurances SET name=$1, active=$2 WHERE id=$3 RETURNING *',
      [name, active, req.params.id]
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
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [appts, pats, profs] = await Promise.all([
      tenantQuery(req.schemaName, 'SELECT COUNT(*) as count FROM appointments WHERE DATE(inicio) = $1', [today]),
      tenantQuery(req.schemaName, 'SELECT COUNT(*) as count FROM clients WHERE is_active = true'),
      tenantQuery(req.schemaName, 'SELECT COUNT(*) as count FROM professionals WHERE is_active = true'),
    ]);

    res.json({
      appointments_today: parseInt(appts.rows[0].count),
      patients_total: parseInt(pats.rows[0].count),
      professionals_active: parseInt(profs.rows[0].count),
      avg_wait_time: '15min',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ──────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
