// // === Batch 09 Gaps & Frontend Mounts ===
// Auto-generated gap-nonai endpoints for AIWarehouseManager.
// Calls OpenRouter via native fetch (no SDK); lazily creates gap_features table.
const express = require('express');
const router = express.Router();

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function runAI(system, user) {
  if (!process.env.OPENROUTER_API_KEY) {
    const e = new Error('OPENROUTER_API_KEY missing'); e.statusCode = 503; throw e;
  }
  const r = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages: [
      { role: 'system', content: system }, { role: 'user', content: user }
    ], max_tokens: 1500, temperature: 0.4 })
  });
  if (!r.ok) { const e = new Error(`AI ${r.status}`); e.statusCode = 502; throw e; }
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content || '';
  let parsed = null;
  try { const m = content.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); } catch {}
  return { raw: content, parsed, model: data?.model };
}

let _persistInit = false;
async function persist(feature, input, output) {
  // Lazy gap_features table — best-effort, swallow errors so AI still works.
  try {
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    if (!_persistInit) {
      await p.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS gap_features (id SERIAL PRIMARY KEY, feature TEXT, input JSONB, output JSONB, created_at TIMESTAMPTZ DEFAULT NOW())');
      _persistInit = true;
    }
    await p.$executeRawUnsafe('INSERT INTO gap_features(feature, input, output) VALUES ($1, $2::jsonb, $3::jsonb)', feature, JSON.stringify(input || {}), JSON.stringify(output || {}));
  } catch { /* swallow */ }
}

// POST /api/gap-nonai-aiwarehousemanager/invoicepayment-tracking-and-milestone-billing
// Invoice/payment tracking and milestone billing
router.post('/invoicepayment-tracking-and-milestone-billing', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Invoice/payment tracking and milestone billing\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('invoicepayment-tracking-and-milestone-billing', req.body, ai);
    res.json({ feature: 'invoicepayment-tracking-and-milestone-billing', title: 'Invoice/payment tracking and milestone billing', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiwarehousemanager/client-communication-portal-messaging-thread
// Client communication portal / messaging thread
router.post('/client-communication-portal-messaging-thread', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Client communication portal / messaging thread\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('client-communication-portal-messaging-thread', req.body, ai);
    res.json({ feature: 'client-communication-portal-messaging-thread', title: 'Client communication portal / messaging thread', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiwarehousemanager/project-timeline-gantt-tracking-with-dependencies
// Project timeline (Gantt) tracking with dependencies
router.post('/project-timeline-gantt-tracking-with-dependencies', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Project timeline (Gantt) tracking with dependencies\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('project-timeline-gantt-tracking-with-dependencies', req.body, ai);
    res.json({ feature: 'project-timeline-gantt-tracking-with-dependencies', title: 'Project timeline (Gantt) tracking with dependencies', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiwarehousemanager/bulk-import-from-photos-folder-ingest
// Bulk import from photos (folder ingest)
router.post('/bulk-import-from-photos-folder-ingest', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Bulk import from photos (folder ingest)\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('bulk-import-from-photos-folder-ingest', req.body, ai);
    res.json({ feature: 'bulk-import-from-photos-folder-ingest', title: 'Bulk import from photos (folder ingest)', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-aiwarehousemanager/vendorsupplier-order-tracking-integrated-to-shopping-lists
// Vendor/supplier order tracking integrated to shopping lists
router.post('/vendorsupplier-order-tracking-integrated-to-shopping-lists', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Vendor/supplier order tracking integrated to shopping lists\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('vendorsupplier-order-tracking-integrated-to-shopping-lists', req.body, ai);
    res.json({ feature: 'vendorsupplier-order-tracking-integrated-to-shopping-lists', title: 'Vendor/supplier order tracking integrated to shopping lists', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

module.exports = router;
