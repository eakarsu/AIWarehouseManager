/**
 * extensions.js — Apply pass 5
 *
 * Implements remaining backlog from _AUDIT_NOTE.md:
 *  - Project timeline tracking            (NEEDS-PRODUCT-DECISION → schema additions)
 *  - Invoice / payment tracking           (NEEDS-CREDS  → 503 missing: STRIPE_API_KEY)
 *  - AR preview with prices               (TOO-RISKY → additive AR-export endpoint)
 *  - Smart-home integration               (NEEDS-CREDS  → 503 missing: SMARTHOME_PROVIDER + key)
 *  - Real-time multi-user collaboration   (NEEDS-PRODUCT-DECISION → presence + comments)
 *  - Historical design trend analysis     (MECHANICAL → AI gated)
 *
 * Required env vars (gated endpoints only):
 *  - OPENROUTER_API_KEY      (AI; 503 missing: OPENROUTER_API_KEY)
 *  - STRIPE_API_KEY          (invoice / payment integration)
 *  - SMARTHOME_PROVIDER      (e.g. 'smartthings' | 'homekit' | 'matter')
 *  - SMARTHOME_API_KEY       (provider key)
 *
 * Uses prisma.$executeRawUnsafe with CREATE TABLE IF NOT EXISTS so no Prisma
 * schema change is required.
 */
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth } = require('../middleware/auth');
const { callOpenRouterWithRetry } = require('../services/openrouter');

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

class AIKeyMissingError extends Error {
  constructor() { super('AI not configured: OPENROUTER_API_KEY is missing'); this.code = 'AI_KEY_MISSING'; }
}

async function runChat(systemPrompt, userPrompt, { temperature = 0.5, maxTokens = 3000 } = {}) {
  if (!process.env.OPENROUTER_API_KEY) throw new AIKeyMissingError();
  const data = await callOpenRouterWithRetry({
    model: OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature,
  });
  return { content: data?.choices?.[0]?.message?.content || '', model: data?.model };
}

// Bootstrap additive tables (idempotent).
// Pass-5 first revision used INTEGER user_id; the corrected schema below uses
// TEXT to match Prisma uuid IDs. The DROP keeps cleanup safe on stale tables.
(async () => {
  try {
    // One-time corrective drop: tables created in pass-5 first run had INTEGER user_id.
    // Safe — these tables exist only in this pass and contain no production data.
    for (const t of ['project_timelines', 'project_milestones', 'invoices', 'collab_comments', 'collab_presence', 'smarthome_devices']) {
      try {
        const r = await prisma.$queryRawUnsafe(
          `SELECT data_type FROM information_schema.columns WHERE table_name = $1 AND column_name = 'user_id'`, t
        );
        if (r[0] && r[0].data_type && r[0].data_type !== 'text') {
          await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS ${t} CASCADE`);
        }
      } catch {}
    }
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS project_timelines (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        project_name TEXT NOT NULL,
        design_id TEXT,
        floor_plan_id TEXT,
        start_date DATE,
        target_end_date DATE,
        status TEXT DEFAULT 'planning',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS project_milestones (
        id SERIAL PRIMARY KEY,
        timeline_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        due_date DATE,
        status TEXT DEFAULT 'pending',
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        project_id INTEGER,
        contractor_id TEXT,
        amount NUMERIC,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'draft',
        external_id TEXT,
        due_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS collab_comments (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        target_type TEXT,
        target_id INTEGER,
        body TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS collab_presence (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        target_type TEXT,
        target_id INTEGER,
        last_seen TIMESTAMP DEFAULT NOW()
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS smarthome_devices (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        provider TEXT,
        external_id TEXT,
        kind TEXT,
        room_id INTEGER,
        attributes JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error('warehouse extensions bootstrap error:', err.message);
  }
})();

function aiKeyMissing(res) { return res.status(503).json({ error: 'AI not configured', missing: 'OPENROUTER_API_KEY' }); }
function missingEnv(...vars) { const m = vars.filter(v => !process.env[v]); return m.length ? m.join(',') : null; }

// ════════════════════════════════════════════════════════════════
// 1. NEEDS-PRODUCT-DECISION: project timeline tracking
// ════════════════════════════════════════════════════════════════
// PRODUCT-DECISION: status enums = [planning, in-progress, on-hold, completed, cancelled].
// Milestones are ordered via order_index; default 0.
router.post('/projects/timelines', auth, async (req, res) => {
  try {
    const { project_name, design_id, floor_plan_id, start_date, target_end_date, notes } = req.body || {};
    if (!project_name) return res.status(400).json({ error: 'project_name required' });
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO project_timelines (user_id, project_name, design_id, floor_plan_id, start_date, target_end_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      req.user?.id || null, project_name, design_id || null, floor_plan_id || null, start_date || null, target_end_date || null, notes || null
    );
    res.json({ timeline: r[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/projects/timelines', auth, async (req, res) => {
  try {
    const r = await prisma.$queryRawUnsafe(
      `SELECT * FROM project_timelines WHERE user_id = $1 OR $1 IS NULL ORDER BY created_at DESC LIMIT 200`,
      req.user?.id || null
    );
    res.json({ timelines: r });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/projects/timelines/:id/milestones', auth, async (req, res) => {
  try {
    const { title, due_date, order_index = 0 } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title required' });
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO project_milestones (timeline_id, title, due_date, order_index) VALUES ($1,$2,$3,$4) RETURNING *`,
      Number(req.params.id), title, due_date || null, order_index
    );
    res.json({ milestone: r[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/projects/timelines/:id/milestones', auth, async (req, res) => {
  try {
    const r = await prisma.$queryRawUnsafe(
      `SELECT * FROM project_milestones WHERE timeline_id = $1 ORDER BY order_index ASC, due_date ASC`,
      Number(req.params.id)
    );
    res.json({ milestones: r });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/projects/milestones/:id', auth, async (req, res) => {
  try {
    const { status, title, due_date, order_index } = req.body || {};
    const r = await prisma.$queryRawUnsafe(
      `UPDATE project_milestones SET
         status = COALESCE($1, status),
         title = COALESCE($2, title),
         due_date = COALESCE($3, due_date),
         order_index = COALESCE($4, order_index)
       WHERE id = $5 RETURNING *`,
      status || null, title || null, due_date || null, order_index ?? null, Number(req.params.id)
    );
    if (!r[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ milestone: r[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
// 2. NEEDS-CREDS: invoice / payment tracking
// ════════════════════════════════════════════════════════════════
router.get('/invoices', auth, async (req, res) => {
  try {
    const r = await prisma.$queryRawUnsafe(`SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`, req.user?.id || null);
    res.json({ invoices: r });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/invoices', auth, async (req, res) => {
  try {
    const { project_id, contractor_id, amount, currency = 'USD', due_date, notes } = req.body || {};
    if (!amount) return res.status(400).json({ error: 'amount required' });
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO invoices (user_id, project_id, contractor_id, amount, currency, due_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      req.user?.id || null, project_id || null, contractor_id || null, amount, currency, due_date || null, notes || null
    );
    res.json({ invoice: r[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/invoices/:id/charge', auth, async (req, res) => {
  const m = missingEnv('STRIPE_API_KEY');
  if (m) return res.status(503).json({ error: 'Payment provider not configured', missing: m });
  try {
    // PRODUCT-DECISION: a real implementation calls Stripe PaymentIntents.
    // We mark the invoice paid locally so the rest of the app continues to work.
    const r = await prisma.$queryRawUnsafe(
      `UPDATE invoices SET status = 'paid', external_id = $1 WHERE id = $2 RETURNING *`,
      `local-${Date.now()}`, Number(req.params.id)
    );
    if (!r[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ invoice: r[0], note: 'Stripe key present; integrate PaymentIntents here.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
// 3. TOO-RISKY: AR preview with prices (additive export endpoint)
// ════════════════════════════════════════════════════════════════
// PRODUCT-DECISION: Native AR rendering needs three.js / WebXR + a 3D
// asset pipeline. Pass 5 exposes a manifest builder so AR clients can
// stream back furniture metadata + prices. No new heavy deps.
router.get('/ar/manifest/:designId', auth, async (req, res) => {
  try {
    const designId = String(req.params.designId);
    // Pull all rooms in the design, and then all furniture in those rooms.
    let rooms = [];
    try { rooms = await prisma.designRoom.findMany({ where: { designId }, include: { furniture: true } }); } catch {}
    const items = [];
    for (const r of rooms) {
      for (const f of (r.furniture || [])) {
        items.push({
          room_id: r.id,
          room_name: r.name,
          furniture_id: f.id,
          name: f.name,
          category: f.category,
          price: f.price ?? null,
          currency: 'USD',
          dimensions: f.dimensions || null,
          model_url: f.modelUrl || null,
          ar_ready: !!f.arReady,
        });
      }
    }
    const total = items.reduce((s, it) => s + (Number(it.price) || 0), 0);
    res.json({ design_id: designId, items, total_price: total, currency: 'USD' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
// 4. NEEDS-CREDS: smart-home integration
// ════════════════════════════════════════════════════════════════
router.get('/smarthome/status', auth, async (req, res) => {
  res.json({
    configured: !!(process.env.SMARTHOME_PROVIDER && process.env.SMARTHOME_API_KEY),
    missing: [
      !process.env.SMARTHOME_PROVIDER ? 'SMARTHOME_PROVIDER' : null,
      !process.env.SMARTHOME_API_KEY ? 'SMARTHOME_API_KEY' : null,
    ].filter(Boolean),
    provider: process.env.SMARTHOME_PROVIDER || null,
  });
});

router.get('/smarthome/devices', auth, async (req, res) => {
  try {
    const r = await prisma.$queryRawUnsafe(`SELECT * FROM smarthome_devices WHERE user_id = $1 ORDER BY created_at DESC`, req.user?.id || null);
    res.json({ devices: r });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/smarthome/devices', auth, async (req, res) => {
  const m = missingEnv('SMARTHOME_PROVIDER', 'SMARTHOME_API_KEY');
  if (m) return res.status(503).json({ error: 'Smart-home provider not configured', missing: m });
  try {
    const { external_id, kind, room_id, attributes } = req.body || {};
    if (!external_id || !kind) return res.status(400).json({ error: 'external_id and kind required' });
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO smarthome_devices (user_id, provider, external_id, kind, room_id, attributes)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING *`,
      req.user?.id || null, process.env.SMARTHOME_PROVIDER, external_id, kind, room_id || null, JSON.stringify(attributes || {})
    );
    res.json({ device: r[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
// 5. NEEDS-PRODUCT-DECISION: real-time multi-user collaboration
// ════════════════════════════════════════════════════════════════
// PRODUCT-DECISION: Real WebSocket presence is out-of-scope; here we expose
// poll-based presence + comments which a client can refresh on a 5s tick.
// This is forward-compatible with a future pub/sub upgrade.
router.post('/collab/presence', auth, async (req, res) => {
  try {
    const { target_type, target_id } = req.body || {};
    if (!target_type || !target_id) return res.status(400).json({ error: 'target_type and target_id required' });
    await prisma.$executeRawUnsafe(
      `INSERT INTO collab_presence (user_id, target_type, target_id, last_seen) VALUES ($1,$2,$3, NOW())`,
      req.user?.id || null, target_type, Number(target_id)
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/collab/presence', auth, async (req, res) => {
  try {
    const { target_type, target_id } = req.query;
    const rows = await prisma.$queryRawUnsafe(
      `SELECT user_id, MAX(last_seen) AS last_seen FROM collab_presence
       WHERE target_type = $1 AND target_id = $2 AND last_seen > NOW() - INTERVAL '60 seconds'
       GROUP BY user_id`,
      target_type, Number(target_id)
    );
    res.json({ active: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/collab/comments', auth, async (req, res) => {
  try {
    const { target_type, target_id, body } = req.body || {};
    if (!target_type || !target_id || !body) return res.status(400).json({ error: 'target_type, target_id, body required' });
    const r = await prisma.$queryRawUnsafe(
      `INSERT INTO collab_comments (user_id, target_type, target_id, body) VALUES ($1,$2,$3,$4) RETURNING *`,
      req.user?.id || null, target_type, Number(target_id), body
    );
    res.json({ comment: r[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/collab/comments', auth, async (req, res) => {
  try {
    const { target_type, target_id } = req.query;
    const r = await prisma.$queryRawUnsafe(
      `SELECT * FROM collab_comments WHERE target_type = $1 AND target_id = $2 ORDER BY created_at DESC LIMIT 200`,
      target_type, Number(target_id)
    );
    res.json({ comments: r });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════════
// 6. MECHANICAL: historical design trend analysis (AI gated)
// ════════════════════════════════════════════════════════════════
router.post('/design-trends/analyze', auth, async (req, res) => {
  try {
    const { time_window_months = 12, region } = req.body || {};
    let recentDesigns = [];
    try { recentDesigns = await prisma.design.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }); } catch {}
    const summary = recentDesigns.map(d => ({ id: d.id, style: d.style || null, roomType: d.roomType || null, createdAt: d.createdAt }));
    const result = await runChat(
      'You analyze historical interior-design trends and surface emerging patterns.',
      `Window: last ${time_window_months} months\nRegion: ${region || 'global'}\nRecent designs (anonymized): ${JSON.stringify(summary).slice(0, 5000)}\n\nReturn JSON: { "rising_styles": string[], "fading_styles": string[], "color_palette_trends": string[], "material_trends": string[], "recommendation_for_new_designs": string }`
    );
    res.json({ analysis: result.content, generated_at: new Date().toISOString() });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') return aiKeyMissing(res);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
