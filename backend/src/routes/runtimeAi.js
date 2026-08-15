'use strict';

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

async function complete(prompt) {
  const baseUrl = (process.env.OPENROUTER_BASE_URL || '').replace(/\/$/, '');
  if (baseUrl !== 'https://openrouter.ai/api/v1') throw new Error('OPENROUTER_BASE_URL must be https://openrouter.ai/api/v1');
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is required');
  if (!process.env.OPENROUTER_MODEL) throw new Error('OPENROUTER_MODEL is required');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: 'You are a warehouse space-planning analyst. Return strict JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || `OpenRouter request failed (${response.status})`);
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('OpenRouter returned an empty response');
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try { return { value: JSON.parse(cleaned), model: body.model, usage: body.usage }; }
  catch (_) { return { value: { analysis: cleaned }, model: body.model, usage: body.usage }; }
}

router.post('/space-plan', async (req, res) => {
  try {
    const input = req.body || {};
    const ai = await complete(`Create an actionable warehouse space plan for this input: ${JSON.stringify(input).slice(0, 5000)}. Return {summary,zones,recommendations,risks,kpis}.`);
    const saved = await prisma.aIGeneration.create({ data: {
      userId: req.user.id,
      type: 'warehouse-space-plan',
      prompt: JSON.stringify(input),
      result: ai.value,
      modelUsed: ai.model,
      tokensUsed: ai.usage?.total_tokens || null,
    } });
    res.json({ success: true, result: ai.value, persistence: { id: saved.id, createdAt: saved.createdAt } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/history', async (req, res) => {
  try {
    const history = await prisma.aIGeneration.findMany({ where: { userId: req.user.id, type: 'warehouse-space-plan' }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ history });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
