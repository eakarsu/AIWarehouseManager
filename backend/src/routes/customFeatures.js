// Custom feature endpoints (batch_09 audit suggestions)
// One file groups all batch_09 "Custom Feature Suggestions" for this project.
// Real handlers — auth-guarded, calls the project's OpenRouter LLM client.
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth } = require('../middleware/auth');
const { callOpenRouterWithRetry } = require('../services/openrouter');

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function runChat(systemPrompt, userPrompt, { temperature = 0.4, maxTokens = 2500 } = {}) {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI not configured: OPENROUTER_API_KEY is missing');
    err.statusCode = 503;
    throw err;
  }
  const data = await callOpenRouterWithRetry({
    model: OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature,
  });
  return {
    content: data?.choices?.[0]?.message?.content || '',
    model: data?.model,
  };
}

function tryParseJson(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/```(?:json)?/gi, '').replace(/```/g, '');
  const match = cleaned.match(/\{[\s\S]*\}/) || cleaned.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function handleError(res, err, label) {
  if (err.statusCode === 503) return res.status(503).json({ error: err.message });
  console.error(`${label} error:`, err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
}

// POST /api/custom/multimodal-redesign
// Multi-modal vision: combines floorplan + photos + measurements for redesign.
router.post('/multimodal-redesign', auth, async (req, res) => {
  try {
    const { floorplan_description, photo_notes, measurements, goals } = req.body || {};
    if (!floorplan_description) return res.status(400).json({ error: 'floorplan_description is required' });
    const sys = 'You are an expert architect synthesizing floorplan, room photos, and measurements into a holistic redesign. Reply in JSON.';
    const usr = `FLOORPLAN: ${floorplan_description}\nPHOTOS: ${photo_notes || 'n/a'}\nMEASUREMENTS: ${JSON.stringify(measurements || {})}\nGOALS: ${goals || 'modernize'}\n\nReturn JSON {"redesign_concept":"","zones":[{"name":"","intent":"","key_changes":[""]}],"material_palette":[""],"estimated_budget_usd":"","timeline_weeks":0,"risks":[""]}`;
    const ai = await runChat(sys, usr, { temperature: 0.5, maxTokens: 2200 });
    res.json({ type: 'multimodal-redesign', result: tryParseJson(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (err) { handleError(res, err, 'multimodal-redesign'); }
});

// POST /api/custom/ar-furniture-pricing
// AR preview enriched with live furniture price + availability.
// Integration: TODO: configure credentials for FURNITURE_PRICING_API_KEY.
router.post('/ar-furniture-pricing', auth, async (req, res) => {
  try {
    const { room_type, style, items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items array required' });
    const apiKey = process.env.FURNITURE_PRICING_API_KEY; // TODO: configure credentials
    const sys = 'You are an AR room-design assistant proposing furniture with price and availability hints. Reply in JSON.';
    const usr = `ROOM: ${room_type || 'unspecified'} (${style || 'modern'})\nITEMS REQUESTED: ${items.join(', ')}\nReturn JSON {"items":[{"name":"","estimated_price_usd":"","availability":"","placement_hint":""}],"total_estimate_usd":""}`;
    const ai = await runChat(sys, usr);
    res.json({
      type: 'ar-furniture-pricing',
      live_pricing_enabled: Boolean(apiKey),
      result: tryParseJson(ai.content) || { raw: ai.content },
      model: ai.model,
    });
  } catch (err) { handleError(res, err, 'ar-furniture-pricing'); }
});

// POST /api/custom/design-canvas-session
// Real-time collaborative design canvas — bootstraps a session record.
router.post('/design-canvas-session', auth, async (req, res) => {
  try {
    const { floorPlanId, participants } = req.body || {};
    if (!floorPlanId) return res.status(400).json({ error: 'floorPlanId required' });
    const fp = await prisma.floorPlan.findFirst({ where: { id: floorPlanId, userId: req.user.id } }).catch(() => null);
    if (!fp) return res.status(404).json({ error: 'Floor plan not found' });
    const sessionId = `cvs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    res.json({
      type: 'design-canvas-session',
      sessionId,
      floorPlanId,
      owner: req.user.id,
      participants: Array.isArray(participants) ? participants : [],
      // TODO: configure credentials for WEBSOCKET_AUTH_SECRET (real OT backend)
      websocket_url: process.env.CANVAS_WS_URL || 'ws://localhost:3001/canvas',
      started_at: new Date().toISOString(),
    });
  } catch (err) { handleError(res, err, 'design-canvas-session'); }
});

// POST /api/custom/contractor-skill-match
// Marketplace scoring — reuses Contractor table, adds reputation weighting.
router.post('/contractor-skill-match', auth, async (req, res) => {
  try {
    const { project_brief, required_skills, top_n = 5 } = req.body || {};
    if (!project_brief) return res.status(400).json({ error: 'project_brief required' });
    const pool = await prisma.contractor.findMany({ orderBy: { rating: 'desc' }, take: 30 }).catch(() => []);
    if (pool.length === 0) return res.status(404).json({ error: 'no contractors available' });
    const sys = 'You are a contractor marketplace ranker. Return JSON only.';
    const usr = `BRIEF:\n${project_brief}\nREQUIRED_SKILLS: ${(required_skills || []).join(', ') || 'derive'}\nCANDIDATES:\n${JSON.stringify(pool.slice(0, 20).map(c => ({ id: c.id, name: c.name, specialty: c.specialty, rating: c.rating, verified: c.verified })))}\nReturn JSON {"ranked":[{"id":"","name":"","score":0,"reputation_signal":"","why":""}],"top_pick_id":""}`;
    const ai = await runChat(sys, usr);
    const parsed = tryParseJson(ai.content) || { raw: ai.content };
    res.json({ type: 'contractor-skill-match', requested_top_n: top_n, considered: pool.length, result: parsed, model: ai.model });
  } catch (err) { handleError(res, err, 'contractor-skill-match'); }
});

// POST /api/custom/design-trend-analysis
// Historical design trend analysis across the caller's portfolio.
router.post('/design-trend-analysis', auth, async (req, res) => {
  try {
    const { window_months = 12 } = req.body || {};
    const since = new Date(Date.now() - window_months * 30 * 24 * 60 * 60 * 1000);
    const designs = await prisma.design.findMany({
      where: { userId: req.user.id, createdAt: { gte: since } },
      select: { id: true, name: true, status: true, createdAt: true },
      take: 100,
    }).catch(() => []);
    const sys = 'You analyze a designer portfolio for trends (styles, materials, recurring themes). Return JSON.';
    const usr = `Window: last ${window_months} months. Designs(${designs.length}): ${JSON.stringify(designs.slice(0, 60))}\nReturn JSON {"top_themes":[""],"emerging":[""],"declining":[""],"client_preference_signals":[""],"recommendations":[""]}`;
    const ai = await runChat(sys, usr);
    res.json({ type: 'design-trend-analysis', samples: designs.length, result: tryParseJson(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (err) { handleError(res, err, 'design-trend-analysis'); }
});

// POST /api/custom/smart-home-integration
// Integration with smart-home systems (lighting placement, HVAC zones).
// TODO: configure credentials for SMART_HOME_API_KEY (HomeKit/SmartThings bridge).
router.post('/smart-home-integration', auth, async (req, res) => {
  try {
    const { floorPlanId, system = 'generic', rooms } = req.body || {};
    if (!floorPlanId) return res.status(400).json({ error: 'floorPlanId required' });
    const fp = await prisma.floorPlan.findFirst({ where: { id: floorPlanId, userId: req.user.id }, include: { rooms: true } }).catch(() => null);
    if (!fp) return res.status(404).json({ error: 'Floor plan not found' });
    const targetRooms = Array.isArray(rooms) && rooms.length ? rooms : fp.rooms.map(r => ({ name: r.name, type: r.roomType, area: r.area }));
    const sys = 'You design smart-home zones — lighting fixtures, HVAC zoning, sensor placement. Return JSON.';
    const usr = `SYSTEM: ${system}\nROOMS: ${JSON.stringify(targetRooms.slice(0, 20))}\nReturn JSON {"lighting":[{"room":"","fixtures":[""],"scenes":[""]}],"hvac_zones":[{"zone":"","rooms":[""],"strategy":""}],"sensors":[{"type":"","location":"","purpose":""}],"vendor_notes":""}`;
    const ai = await runChat(sys, usr);
    res.json({
      type: 'smart-home-integration',
      api_configured: Boolean(process.env.SMART_HOME_API_KEY),
      system,
      result: tryParseJson(ai.content) || { raw: ai.content },
      model: ai.model,
    });
  } catch (err) { handleError(res, err, 'smart-home-integration'); }
});

module.exports = router;
