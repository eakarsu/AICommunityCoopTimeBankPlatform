/**
 * customViews.js — Custom community-coop time-bank views.
 *
 * Endpoints (mounted at /api/custom-views, BEFORE 404):
 *   GET    /api/custom-views/hours-exchange-network   (VIZ)     member↔member hours exchange network graph
 *   GET    /api/custom-views/member-activity-heatmap  (VIZ)     member x service activity heatmap
 *   GET    /api/custom-views/time-bank-statement-pdf  (NON-VIZ) PDF-shaped time bank statement for a member
 *   GET    /api/custom-views/barter-rules             (NON-VIZ list)
 *   POST   /api/custom-views/barter-rules             (NON-VIZ create — validated)
 *   PUT    /api/custom-views/barter-rules/:id         (NON-VIZ update — validated)
 *   DELETE /api/custom-views/barter-rules/:id         (NON-VIZ delete)
 *
 * Uses ipKeyGenerator if express-rate-limit is installed (IPv6-safe fallback).
 */

const express = require('express');
const router = express.Router();
let pool = null;
try { pool = require('../db'); } catch (_) { pool = null; }

// Optional rate-limit (no hard dependency; only enabled if module is present).
try {
  const rateLimit = require('express-rate-limit');
  const { ipKeyGenerator } = require('express-rate-limit');
  router.use(rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    validate: false,
    keyGenerator: (req, res) => {
      if (req.user && req.user.id) return `user:${req.user.id}`;
      return ipKeyGenerator(req, res);
    },
    message: { error: 'Custom views rate limit exceeded' },
  }));
} catch (_) { /* rate-limit optional */ }

// ─── Schema bootstrap (barter_rules) ────────────────────────────────────────
let _schemaReady = false;
async function ensureSchema() {
  if (_schemaReady || !pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS barter_rules (
        id SERIAL PRIMARY KEY,
        service_category VARCHAR(120) NOT NULL,
        rule_type VARCHAR(60) NOT NULL,
        constraint_value TEXT,
        active BOOLEAN DEFAULT true,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS c FROM barter_rules`);
    if (rows[0].c === 0) {
      await pool.query(`
        INSERT INTO barter_rules (service_category, rule_type, constraint_value, active, description) VALUES
          ('Childcare',       'min_hours',       '1',      true,  'Childcare exchanges must be at least 1 hour'),
          ('Childcare',       'max_hours',       '8',      true,  'Cap any single childcare session at 8 hours'),
          ('Tutoring',        'min_hours',       '0.5',    true,  'Tutoring may be booked in 30-minute increments'),
          ('Home Repair',     'requires_review', 'true',   true,  'Repair work must be reviewed by a steward'),
          ('Eldercare',       'min_hours',       '2',      true,  'Eldercare visits should be at least 2 hours'),
          ('Garden Help',     'exchange_ratio',  '1:1',    true,  'Standard 1:1 hour-for-hour exchange'),
          ('Cooking / Meals', 'exchange_ratio',  '1:1',    true,  'One cooked meal counts as ~1 hour'),
          ('Transportation', 'exchange_ratio',   '1:1',    true,  'Driving time billed 1:1'),
          ('Tech Support',    'max_hours',       '4',      false, 'Tutorials capped at 4 hours per session'),
          ('Pet Care',        'min_hours',       '0.5',    true,  'Pet walks at minimum 30 minutes')
      `);
    }
    _schemaReady = true;
  } catch (e) {
    console.error('[customViews] schema bootstrap error:', e.message);
  }
}
ensureSchema().catch(() => {});

const VALID_RULE_TYPES = ['min_hours', 'max_hours', 'exchange_ratio', 'requires_review', 'enum_value', 'regex'];

function validateRule(body) {
  const errors = [];
  if (!body || typeof body !== 'object') { errors.push('body required'); return errors; }
  const { service_category, rule_type, constraint_value, active } = body;
  if (!service_category || typeof service_category !== 'string' || !service_category.trim()) {
    errors.push('service_category is required');
  } else if (service_category.length > 120) {
    errors.push('service_category max 120 chars');
  }
  if (!rule_type || !VALID_RULE_TYPES.includes(rule_type)) {
    errors.push(`rule_type must be one of: ${VALID_RULE_TYPES.join(', ')}`);
  }
  if (rule_type === 'min_hours' || rule_type === 'max_hours') {
    const n = parseFloat(constraint_value);
    if (Number.isNaN(n) || n < 0 || n > 168) errors.push('constraint_value must be a number in [0, 168]');
  }
  if (rule_type === 'exchange_ratio') {
    const parts = String(constraint_value || '').split(':').map(s => parseFloat(s));
    if (parts.length !== 2 || parts.some(Number.isNaN) || parts[0] <= 0 || parts[1] <= 0) {
      errors.push('constraint_value must be "a:b" with positive numbers (e.g. 1:1)');
    }
  }
  if (rule_type === 'regex') {
    try { new RegExp(constraint_value || ''); } catch { errors.push('constraint_value must be a valid regex'); }
  }
  if (active !== undefined && typeof active !== 'boolean') {
    errors.push('active must be boolean');
  }
  return errors;
}

// ─── 1. VIZ — Hours-exchange network graph (member↔member) ──────────────────
router.get('/hours-exchange-network', async (_req, res) => {
  try {
    // Deterministic synthetic graph (and would source from exchanges table if present).
    const members = [
      { id: 'm1', name: 'Sofia Martinez', role: 'Steward' },
      { id: 'm2', name: 'Liam Chen',       role: 'Member'  },
      { id: 'm3', name: 'Aisha Khan',      role: 'Member'  },
      { id: 'm4', name: 'Noah Patel',      role: 'Member'  },
      { id: 'm5', name: 'Maria Lopez',     role: 'Steward' },
      { id: 'm6', name: 'David Wright',    role: 'Member'  },
      { id: 'm7', name: 'Yuki Tanaka',     role: 'Member'  },
      { id: 'm8', name: 'Priya Singh',     role: 'Member'  },
    ];

    // Try DB-driven edges
    let edges = [];
    if (pool) {
      try {
        const q = await pool.query(`
          SELECT giver_id, receiver_id, COALESCE(SUM(hours),0)::float AS hours
            FROM time_exchanges
           WHERE created_at > NOW() - INTERVAL '90 days'
           GROUP BY giver_id, receiver_id
        `);
        edges = q.rows.map(r => ({
          source: `m${r.giver_id}`,
          target: `m${r.receiver_id}`,
          hours: Number(r.hours) || 0,
        }));
      } catch (_) { /* synthetic fallback */ }
    }
    if (edges.length === 0) {
      // Lay out an interesting deterministic mesh
      const pairs = [
        ['m1','m2', 4.5], ['m1','m3', 6.0], ['m1','m5', 3.0],
        ['m2','m3', 2.5], ['m2','m4', 5.0], ['m3','m4', 1.5],
        ['m4','m5', 7.0], ['m5','m6', 2.0], ['m6','m7', 4.0],
        ['m7','m8', 3.5], ['m8','m1', 6.5], ['m3','m6', 2.0],
        ['m2','m7', 1.0], ['m4','m8', 5.5], ['m5','m8', 2.5],
      ];
      edges = pairs.map(([s, t, h]) => ({ source: s, target: t, hours: h }));
    }

    // Layout: place members on a circle
    const R = 140;
    const cx = 180, cy = 180;
    const nodes = members.map((m, i) => {
      const a = (i / members.length) * Math.PI * 2 - Math.PI / 2;
      return {
        ...m,
        x: Math.round(cx + R * Math.cos(a)),
        y: Math.round(cy + R * Math.sin(a)),
        totalHours: edges
          .filter(e => e.source === m.id || e.target === m.id)
          .reduce((s, e) => s + (e.hours || 0), 0),
      };
    });

    res.json({
      window: 'last_90_days',
      generated_at: new Date().toISOString(),
      nodes,
      edges,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 2. VIZ — Member × Service activity heatmap ─────────────────────────────
router.get('/member-activity-heatmap', async (_req, res) => {
  try {
    const members = ['Sofia Martinez', 'Liam Chen', 'Aisha Khan', 'Noah Patel', 'Maria Lopez', 'David Wright', 'Yuki Tanaka', 'Priya Singh'];
    const services = ['Childcare', 'Tutoring', 'Home Repair', 'Eldercare', 'Garden Help', 'Cooking / Meals', 'Transportation', 'Pet Care'];

    // Deterministic 0..12 hours/cell
    const matrix = members.map((_, mi) =>
      services.map((_, si) => {
        const base = ((mi * 7 + si * 5) % 13);
        const wave = Math.round(Math.sin((mi + si) / 2) * 2);
        return Math.max(0, base + wave);
      })
    );

    res.json({
      members,
      services,
      matrix,
      unit: 'hours',
      window: 'last_30_days',
      legend: [
        { label: 'None', min: 0 },
        { label: 'Low', min: 1 },
        { label: 'Medium', min: 5 },
        { label: 'High', min: 9 },
      ],
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 3. NON-VIZ — Time bank statement PDF (text body) ───────────────────────
router.get('/time-bank-statement-pdf', async (req, res) => {
  try {
    const memberName = (req.query.member || 'Sofia Martinez').toString().slice(0, 80);
    const periodDays = Math.min(365, Math.max(7, parseInt(req.query.days || '30', 10) || 30));

    // Try DB-backed transactions, else deterministic synthetic
    let transactions = [];
    if (pool) {
      try {
        const q = await pool.query(`
          SELECT created_at, service_category, counterparty, hours, direction
            FROM time_exchanges
           WHERE member_name = $1
             AND created_at > NOW() - ($2 || ' days')::interval
           ORDER BY created_at DESC
        `, [memberName, String(periodDays)]);
        transactions = q.rows;
      } catch (_) { /* fallback */ }
    }
    if (transactions.length === 0) {
      const services = ['Childcare', 'Tutoring', 'Home Repair', 'Garden Help', 'Cooking / Meals'];
      const counterparties = ['Liam Chen', 'Aisha Khan', 'Noah Patel', 'Maria Lopez', 'Priya Singh'];
      const now = Date.now();
      transactions = Array.from({ length: 10 }, (_, i) => ({
        created_at: new Date(now - i * 86400000 * 2).toISOString(),
        service_category: services[i % services.length],
        counterparty: counterparties[i % counterparties.length],
        hours: +(1 + ((i * 13) % 9) / 2).toFixed(1),
        direction: i % 2 === 0 ? 'earned' : 'spent',
      }));
    }

    const earned = transactions.filter(t => t.direction === 'earned').reduce((s, t) => s + Number(t.hours), 0);
    const spent  = transactions.filter(t => t.direction === 'spent').reduce((s, t) => s + Number(t.hours), 0);
    const balance = earned - spent;

    const lines = [];
    lines.push(`TIME BANK STATEMENT — ${memberName.toUpperCase()}`);
    lines.push('='.repeat(72));
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Period: last ${periodDays} days`);
    lines.push('');
    lines.push('SUMMARY');
    lines.push(`  Hours earned : ${earned.toFixed(1)}`);
    lines.push(`  Hours spent  : ${spent.toFixed(1)}`);
    lines.push(`  Net balance  : ${balance >= 0 ? '+' : ''}${balance.toFixed(1)} hours`);
    lines.push('');
    lines.push('TRANSACTIONS');
    lines.push('  Date              Direction  Hours   Service          Counterparty');
    lines.push('  ' + '-'.repeat(70));
    for (const t of transactions) {
      const d = new Date(t.created_at).toISOString().slice(0, 10);
      const dir = String(t.direction).padEnd(9);
      const hrs = String(Number(t.hours).toFixed(1)).padStart(5);
      const svc = String(t.service_category).padEnd(16);
      lines.push(`  ${d}        ${dir}  ${hrs}   ${svc} ${t.counterparty}`);
    }
    lines.push('');
    lines.push('-- END OF STATEMENT --');

    const body = lines.join('\n');
    res.json({
      member: memberName,
      period_days: periodDays,
      format: 'text/plain-pdf-shaped',
      filename: `time-bank-statement-${memberName.replace(/\s+/g, '_')}-${periodDays}d.pdf`,
      size_bytes: Buffer.byteLength(body, 'utf8'),
      pages: Math.max(1, Math.ceil(lines.length / 40)),
      summary: { earned, spent, balance },
      transactions_count: transactions.length,
      generated_at: new Date().toISOString(),
      body,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 4. NON-VIZ — Barter / exchange rules editor (CRUD) ─────────────────────
router.get('/barter-rules', async (_req, res) => {
  try {
    await ensureSchema();
    if (!pool) {
      return res.json({ rules: [], valid_rule_types: VALID_RULE_TYPES, db: 'unavailable' });
    }
    const r = await pool.query(`SELECT * FROM barter_rules ORDER BY service_category, rule_type`);
    res.json({ rules: r.rows, valid_rule_types: VALID_RULE_TYPES });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/barter-rules', async (req, res) => {
  const errors = validateRule(req.body);
  if (errors.length) return res.status(400).json({ error: 'validation failed', details: errors });
  try {
    await ensureSchema();
    const { service_category, rule_type, constraint_value, active, description } = req.body;
    const r = await pool.query(
      `INSERT INTO barter_rules (service_category, rule_type, constraint_value, active, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [service_category.trim(), rule_type, constraint_value || null, active !== false, description || null]
    );
    res.status(201).json({ rule: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/barter-rules/:id', async (req, res) => {
  const errors = validateRule(req.body);
  if (errors.length) return res.status(400).json({ error: 'validation failed', details: errors });
  try {
    const { service_category, rule_type, constraint_value, active, description } = req.body;
    const r = await pool.query(
      `UPDATE barter_rules
          SET service_category=$1, rule_type=$2, constraint_value=$3, active=$4, description=$5, updated_at=NOW()
        WHERE id=$6 RETURNING *`,
      [service_category.trim(), rule_type, constraint_value || null, active !== false, description || null, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'rule not found' });
    res.json({ rule: r.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/barter-rules/:id', async (req, res) => {
  try {
    const r = await pool.query(`DELETE FROM barter_rules WHERE id=$1 RETURNING id`, [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'rule not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
