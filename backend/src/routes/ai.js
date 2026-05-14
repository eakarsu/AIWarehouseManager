const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');
const { callOpenRouter, callOpenRouterWithRetry } = require('../services/openrouter');

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

// Apply pass 4: small wrapper used by mechanical backlog endpoints.
// Throws an AIKeyMissingError when OPENROUTER_API_KEY is unset so handlers
// can return 503 instead of bubbling up a 500.
class AIKeyMissingError extends Error {
  constructor() {
    super('AI not configured: OPENROUTER_API_KEY is missing');
    this.code = 'AI_KEY_MISSING';
  }
}

async function runChat(systemPrompt, userPrompt, { temperature = 0.5, maxTokens = 4000 } = {}) {
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
  const content = data?.choices?.[0]?.message?.content || '';
  return { content, model: data?.model, usage: data?.usage };
}

function tryParseJson(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/```(?:json)?/gi, '').replace(/```/g, '');
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  const candidate = objMatch ? objMatch[0] : (arrMatch ? arrMatch[0] : null);
  if (!candidate) return null;
  try { return JSON.parse(candidate); } catch { return null; }
}

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Convert image to PNG for AI vision API
async function ensurePngDataUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
  try {
    const base64Data = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const pngBuffer = await sharp(buffer)
      .resize(1500, 1500, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  } catch (err) {
    console.error('Image conversion error:', err.message);
    return dataUrl;
  }
}

// Strip markdown code blocks
function stripCodeBlocks(content) {
  if (!content) return content;
  return content.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
}

// Parse JSON from AI response
function parseAIJson(content) {
  try {
    const cleaned = stripCodeBlocks(content);
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
  } catch {
    return { raw: content };
  }
}

// Analyze floor plan with image
router.post('/analyze', auth, upload.single('image'), async (req, res) => {
  try {
    const { floorPlanId, analysisType = 'full' } = req.body;
    let imageBase64 = req.body.imageData;

    if (req.file) {
      imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    if (imageBase64) {
      imageBase64 = await ensurePngDataUrl(imageBase64);
    }

    const systemPrompt = 'You are an expert architect and floor plan analyst. Analyze the floor plan image and provide detailed insights. Always respond with valid JSON.';

    const prompts = {
      full: 'Analyze this floor plan completely. Provide room dimensions, layout assessment, traffic flow, and improvement suggestions in JSON format with keys: rooms (array with name, type, estimatedArea), layoutScore (1-100), trafficFlow, strengths (array), weaknesses (array), suggestions (array).',
      dimensions: 'Analyze this floor plan and estimate room dimensions. Respond with JSON: { "rooms": [{ "name": "", "type": "", "estimatedWidth": 0, "estimatedLength": 0, "estimatedArea": 0 }] }',
      suggestions: 'Analyze this floor plan and provide renovation suggestions. Respond with JSON: { "suggestions": [{ "title": "", "description": "", "category": "", "priority": "high/medium/low", "estimatedCost": 0, "difficulty": "easy/moderate/hard" }] }',
      cost: 'Analyze this floor plan and estimate renovation costs. Respond with JSON: { "laborCost": 0, "materialCost": 0, "totalCost": 0, "timelineDays": 0, "breakdown": [] }',
      materials: 'Analyze this floor plan and recommend materials. Respond with JSON: { "materials": [{ "name": "", "category": "", "description": "", "estimatedPrice": 0, "application": "" }] }',
      optimize: 'Analyze this floor plan and suggest layout optimizations. Respond with JSON: { "trafficFlow": "", "efficiencyScore": 0, "naturalLight": "", "privacyAnalysis": "", "suggestions": [] }'
    };

    const userContent = [];
    if (imageBase64) {
      const base64Part = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${base64Part}` }
      });
    }
    userContent.push({ type: 'text', text: prompts[analysisType] || prompts.full });

    const startTime = Date.now();
    const aiResult = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);

    const processingTimeMs = Date.now() - startTime;
    const analysis = aiResult.content;
    const parsedData = parseAIJson(analysis);

    // Auto-create floor plan if needed
    let effectiveFloorPlanId = floorPlanId;
    if (!effectiveFloorPlanId && imageBase64) {
      const fp = await prisma.floorPlan.create({
        data: {
          userId: req.user.id,
          name: `Uploaded Analysis - ${new Date().toLocaleDateString()}`,
          imageData: imageBase64,
          status: 'analyzed'
        }
      });
      effectiveFloorPlanId = fp.id;
    }

    // Save to AI analysis history
    if (effectiveFloorPlanId) {
      await prisma.aIAnalysis.create({
        data: {
          floorPlanId: effectiveFloorPlanId,
          analysisType,
          result: parsedData,
          modelUsed: aiResult.model,
          tokensUsed: aiResult.tokensUsed,
          processingTimeMs
        }
      });

      // Save to type-specific table
      if (analysisType === 'full') {
        await prisma.fullAnalysis.create({
          data: { floorPlanId: effectiveFloorPlanId, fullResult: analysis, modelUsed: aiResult.model }
        });
      } else if (analysisType === 'optimize') {
        await prisma.layoutOptimization.create({
          data: {
            floorPlanId: effectiveFloorPlanId,
            trafficFlow: parsedData.trafficFlow || '',
            efficiencyScore: parsedData.efficiencyScore || null,
            naturalLight: parsedData.naturalLight || '',
            privacyAnalysis: parsedData.privacyAnalysis || '',
            fullResult: parsedData,
            modelUsed: aiResult.model
          }
        });
      }

      // Update floor plan status
      await prisma.floorPlan.update({
        where: { id: effectiveFloorPlanId },
        data: { status: 'analyzed' }
      });
    }

    res.json({
      success: true,
      analysis,
      parsedData,
      floorPlanId: effectiveFloorPlanId,
      model: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      processingTimeMs
    });
  } catch (error) {
    console.error('AI analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze floor plan', message: error.message });
  }
});

// AI suggestions for a room
router.post('/suggestions', auth, async (req, res) => {
  try {
    const { roomId } = req.body;

    const room = await prisma.floorPlanRoom.findFirst({
      where: { id: roomId, floorPlan: { userId: req.user.id } },
      include: { floorPlan: true }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const prompt = `Generate renovation suggestions for a ${room.roomType || 'room'} named "${room.name}" with dimensions ${room.width || '?'}x${room.length || '?'} feet, height ${room.height || '?'} feet. Respond with JSON: { "suggestions": [{ "title": "", "description": "", "category": "", "priority": "high/medium/low", "estimatedCost": 0, "difficulty": "easy/moderate/hard", "timeline": "" }] }`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are an expert renovation consultant. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsedData = parseAIJson(aiResult.content);

    // Save suggestions
    if (parsedData.suggestions && Array.isArray(parsedData.suggestions)) {
      for (const s of parsedData.suggestions) {
        await prisma.renovationSuggestion.create({
          data: {
            floorPlanId: room.floorPlanId,
            roomId: room.id,
            title: s.title || 'AI Suggestion',
            description: s.description || '',
            category: s.category || 'other',
            priority: s.priority || 'medium',
            estimatedCost: s.estimatedCost || 0,
            difficulty: s.difficulty || 'moderate',
            timeline: s.timeline || '',
            status: 'pending'
          }
        });
      }
    }

    res.json({ success: true, suggestions: parsedData.suggestions || parsedData, model: aiResult.model });
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions', message: error.message });
  }
});

// AI cost estimate
router.post('/estimate', auth, async (req, res) => {
  try {
    const { floorPlanId } = req.body;

    const floorPlan = await prisma.floorPlan.findFirst({
      where: { id: floorPlanId, userId: req.user.id },
      include: { rooms: true }
    });

    if (!floorPlan) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }

    const roomInfo = floorPlan.rooms.map(r => `${r.name} (${r.roomType}, ${r.area || '?'} sqft)`).join(', ');
    const prompt = `Estimate renovation costs for a floor plan "${floorPlan.name}" with total area ${floorPlan.totalArea || '?'} sqft. Rooms: ${roomInfo || 'Not specified'}. Respond with JSON: { "name": "", "description": "", "laborCost": 0, "materialCost": 0, "totalCost": 0, "timelineDays": 0, "breakdown": [{ "item": "", "cost": 0 }] }`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are an expert construction cost estimator. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsedData = parseAIJson(aiResult.content);

    // Save estimate
    await prisma.projectEstimate.create({
      data: {
        floorPlanId,
        laborCost: parsedData.laborCost || 0,
        materialCost: parsedData.materialCost || 0,
        totalCost: parsedData.totalCost || 0,
        timelineDays: parsedData.timelineDays || null,
        status: 'draft',
        notes: parsedData.description || aiResult.content
      }
    });

    res.json({ success: true, estimate: parsedData, model: aiResult.model });
  } catch (error) {
    console.error('AI estimate error:', error);
    res.status(500).json({ error: 'Failed to generate estimate', message: error.message });
  }
});

// AI material recommendations
router.post('/materials', auth, async (req, res) => {
  try {
    const { roomId, style } = req.body;

    const room = await prisma.floorPlanRoom.findFirst({
      where: { id: roomId, floorPlan: { userId: req.user.id } }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const prompt = `Recommend materials for a ${room.roomType || 'room'} named "${room.name}" in ${style || 'modern'} style. Respond with JSON: { "materials": [{ "name": "", "category": "", "description": "", "estimatedPrice": 0, "unit": "", "application": "" }] }`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are a materials and construction expert. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsedData = parseAIJson(aiResult.content);

    res.json({ success: true, recommendations: parsedData, model: aiResult.model });
  } catch (error) {
    console.error('AI materials error:', error);
    res.status(500).json({ error: 'Failed to recommend materials', message: error.message });
  }
});

// AI layout optimization
router.post('/optimize', auth, async (req, res) => {
  try {
    const { floorPlanId } = req.body;

    const floorPlan = await prisma.floorPlan.findFirst({
      where: { id: floorPlanId, userId: req.user.id },
      include: { rooms: true }
    });

    if (!floorPlan) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }

    const roomInfo = floorPlan.rooms.map(r => `${r.name} (${r.roomType}, ${r.width || '?'}x${r.length || '?'})`).join(', ');
    const prompt = `Optimize the layout for floor plan "${floorPlan.name}" (${floorPlan.totalArea || '?'} sqft). Rooms: ${roomInfo || 'Not specified'}. Respond with JSON: { "trafficFlow": "", "efficiencyScore": 0, "naturalLight": "", "privacyAnalysis": "", "noiseZones": "", "furnitureSuggestions": "", "layoutModifications": "", "suggestions": [] }`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are an expert space planner and architect. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsedData = parseAIJson(aiResult.content);

    await prisma.layoutOptimization.create({
      data: {
        floorPlanId,
        trafficFlow: parsedData.trafficFlow || '',
        efficiencyScore: parsedData.efficiencyScore || null,
        naturalLight: parsedData.naturalLight || '',
        privacyAnalysis: parsedData.privacyAnalysis || '',
        noiseZones: parsedData.noiseZones || '',
        furnitureSuggestions: parsedData.furnitureSuggestions || '',
        fullResult: parsedData,
        modelUsed: aiResult.model
      }
    });

    res.json({ success: true, optimization: parsedData, model: aiResult.model });
  } catch (error) {
    console.error('AI optimize error:', error);
    res.status(500).json({ error: 'Failed to optimize layout', message: error.message });
  }
});

// AI room detection
router.post('/detect-rooms', auth, upload.single('image'), async (req, res) => {
  try {
    let imageBase64 = req.body.imageData;
    if (req.file) {
      imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    if (imageBase64) {
      imageBase64 = await ensurePngDataUrl(imageBase64);
    }

    const userContent = [];
    if (imageBase64) {
      const base64Part = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      userContent.push({ type: 'image_url', image_url: { url: `data:image/png;base64,${base64Part}` } });
    }
    userContent.push({ type: 'text', text: 'Detect all rooms in this floor plan. Respond with JSON: { "rooms": [{ "name": "", "type": "", "estimatedWidth": 0, "estimatedLength": 0, "estimatedArea": 0, "features": [] }] }' });

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are an expert floor plan analyst. Detect and identify all rooms. Always respond with valid JSON.' },
      { role: 'user', content: userContent }
    ]);

    const parsedData = parseAIJson(aiResult.content);

    // Save detection
    if (req.body.floorPlanId) {
      await prisma.roomDetection.create({
        data: {
          floorPlanId: req.body.floorPlanId,
          detectedRooms: parsedData,
          modelUsed: aiResult.model,
          totalRooms: parsedData.rooms ? parsedData.rooms.length : 0
        }
      });
    }

    res.json({ success: true, detection: parsedData, model: aiResult.model });
  } catch (error) {
    console.error('AI detect rooms error:', error);
    res.status(500).json({ error: 'Failed to detect rooms', message: error.message });
  }
});

// AI home staging
router.post('/home-staging', auth, async (req, res) => {
  try {
    const { floorPlanId, roomType, targetBuyer, budget } = req.body;

    const prompt = `Create a home staging plan for a ${roomType || 'living room'} targeting ${targetBuyer || 'general buyers'} with budget $${budget || 5000}. Respond with JSON: { "stagingPlan": "", "furnitureList": [{ "item": "", "purpose": "", "estimatedCost": 0 }], "colorScheme": [], "tips": [], "totalEstimatedCost": 0 }`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are a professional home staging expert. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsedData = parseAIJson(aiResult.content);

    // HomeStaging requires a roomId (FloorPlanRoom), save only if roomId is provided
    if (req.body.roomId) {
      await prisma.homeStaging.create({
        data: {
          roomId: req.body.roomId,
          stagingStyle: roomType || 'living room',
          targetBuyer: targetBuyer || 'general',
          recommendations: parsedData,
          modelUsed: aiResult.model
        }
      });
    }

    res.json({ success: true, staging: parsedData, model: aiResult.model });
  } catch (error) {
    console.error('AI home staging error:', error);
    res.status(500).json({ error: 'Failed to generate staging plan', message: error.message });
  }
});

// AI furniture placement
router.post('/furniture-placement', auth, async (req, res) => {
  try {
    const { floorPlanId, roomId, roomType, dimensions, existingFurniture } = req.body;

    const prompt = `Suggest optimal furniture placement for a ${roomType || 'room'} with dimensions ${dimensions || 'standard'}. Existing furniture: ${existingFurniture || 'none'}. Respond with JSON: { "placements": [{ "furniture": "", "position": "", "reason": "" }], "trafficFlow": "", "focalPoint": "", "tips": [] }`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are an expert interior space planner. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsedData = parseAIJson(aiResult.content);

    // FurniturePlacement requires a roomId (FloorPlanRoom)
    if (roomId) {
      await prisma.furniturePlacement.create({
        data: {
          roomId,
          furnitureItems: parsedData,
          modelUsed: aiResult.model
        }
      });
    }

    res.json({ success: true, placement: parsedData, model: aiResult.model });
  } catch (error) {
    console.error('AI furniture placement error:', error);
    res.status(500).json({ error: 'Failed to generate placement plan', message: error.message });
  }
});

// AI maintenance prediction
router.post('/maintenance-prediction', auth, async (req, res) => {
  try {
    const { floorPlanId, homeAge, lastRenovation, concerns } = req.body;

    const prompt = `Predict maintenance needs for a home aged ${homeAge || '?'} years, last renovated ${lastRenovation || '?'}. Concerns: ${concerns || 'general'}. Respond with JSON: { "predictions": [{ "area": "", "issue": "", "urgency": "high/medium/low", "estimatedCost": 0, "timeframe": "" }], "preventiveMeasures": [], "annualBudget": 0 }`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are a home maintenance and building systems expert. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsedData = parseAIJson(aiResult.content);

    if (floorPlanId) {
      await prisma.maintenancePrediction.create({
        data: {
          floorPlanId,
          predictions: parsedData,
          totalAnnualCost: parsedData.annualBudget || null,
          modelUsed: aiResult.model
        }
      });
    }

    res.json({ success: true, predictions: parsedData, model: aiResult.model });
  } catch (error) {
    console.error('AI maintenance prediction error:', error);
    res.status(500).json({ error: 'Failed to predict maintenance', message: error.message });
  }
});

// AI energy audit
router.post('/energy-audit', auth, async (req, res) => {
  try {
    const { floorPlanId, homeType, squareFootage, yearBuilt, heatingType, coolingType } = req.body;

    const prompt = `Perform an energy audit for a ${homeType || 'house'}, ${squareFootage || '?'} sqft, built ${yearBuilt || '?'}. Heating: ${heatingType || '?'}, Cooling: ${coolingType || '?'}. Respond with JSON: { "energyScore": 0, "improvements": [{ "area": "", "recommendation": "", "estimatedSavings": 0, "cost": 0, "paybackPeriod": "" }], "annualEnergyCost": 0, "potentialSavings": 0 }`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are a certified energy auditor. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsedData = parseAIJson(aiResult.content);

    if (floorPlanId) {
      await prisma.energyAudit.create({
        data: {
          floorPlanId,
          efficiencyScore: parsedData.energyScore || null,
          annualCostEstimate: parsedData.annualEnergyCost || null,
          potentialSavings: parsedData.potentialSavings || null,
          recommendations: parsedData,
          modelUsed: aiResult.model
        }
      });
    }

    res.json({ success: true, audit: parsedData, model: aiResult.model });
  } catch (error) {
    console.error('AI energy audit error:', error);
    res.status(500).json({ error: 'Failed to perform energy audit', message: error.message });
  }
});

// AI home inspection
router.post('/home-inspection', auth, async (req, res) => {
  try {
    const { floorPlanId, propertyType, age, knownIssues } = req.body;

    const prompt = `Perform a virtual home inspection for a ${propertyType || 'house'}, age ${age || '?'} years. Known issues: ${knownIssues || 'none'}. Respond with JSON: { "overallCondition": "", "score": 0, "findings": [{ "area": "", "condition": "good/fair/poor/critical", "issue": "", "recommendation": "", "estimatedCost": 0 }], "priorityRepairs": [], "estimatedTotalCost": 0 }`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are a certified home inspector. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const parsedData = parseAIJson(aiResult.content);

    if (floorPlanId) {
      await prisma.homeInspection.create({
        data: {
          floorPlanId,
          inspectionType: propertyType || 'general',
          overallCondition: parsedData.overallCondition || null,
          issuesFound: parsedData.findings || null,
          criticalIssues: parsedData.priorityRepairs ? parsedData.priorityRepairs.length : null,
          estimatedRepairCost: parsedData.estimatedTotalCost || null,
          modelUsed: aiResult.model
        }
      });
    }

    res.json({ success: true, inspection: parsedData, model: aiResult.model });
  } catch (error) {
    console.error('AI home inspection error:', error);
    res.status(500).json({ error: 'Failed to perform inspection', message: error.message });
  }
});

// AI analysis history
router.get('/history', auth, async (req, res) => {
  try {
    const { analysisType, floorPlanId, limit = 20, offset = 0 } = req.query;

    const where = {
      floorPlan: { userId: req.user.id }
    };

    if (analysisType) where.analysisType = analysisType;
    if (floorPlanId) where.floorPlanId = floorPlanId;

    const [analyses, total] = await Promise.all([
      prisma.aIAnalysis.findMany({
        where,
        include: {
          floorPlan: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.aIAnalysis.count({ where })
    ]);

    res.json({ analyses, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get AI history error:', error);
    res.status(500).json({ error: 'Failed to get AI history' });
  }
});

// ---------------------------------------------------------------------------
// Apply pass 4 — mechanical backlog endpoints
// ---------------------------------------------------------------------------

// POST /api/ai/material-wear-prediction
// Predicts wear/failure timeline for a list of materials in a given environment.
// Body: { materials: string|string[], environment?, usage_intensity?, climate?, notes? }
router.post('/material-wear-prediction', auth, async (req, res) => {
  try {
    let { materials, environment, usage_intensity, climate, notes } = req.body || {};
    if (!materials) return res.status(400).json({ error: 'materials is required (array or comma-separated string)' });
    if (typeof materials === 'string') {
      materials = materials.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({ error: 'materials must be a non-empty list' });
    }

    const systemPrompt = 'You are a materials science expert with deep knowledge of building/interior material lifecycles, wear mechanisms, and maintenance economics. Always reply in valid JSON.';
    const userPrompt = `Predict wear and replacement timelines for the following materials.

ENVIRONMENT: ${environment || 'typical residential interior'}
USAGE INTENSITY: ${usage_intensity || 'normal household'}
CLIMATE: ${climate || 'temperate'}
ADDITIONAL NOTES: ${notes || 'none'}

MATERIALS:
${materials.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Return ONLY valid JSON of this shape:
{
  "predictions": [
    {
      "material": "<input material>",
      "expected_lifespan_years": <number>,
      "wear_drivers": ["<string>"],
      "early_warning_signs": ["<string>"],
      "preventive_maintenance": ["<string>"],
      "replacement_cost_estimate_usd": "<low-high range string>",
      "risk_level": "<low|medium|high>"
    }
  ],
  "overall_recommendations": ["<string>"]
}
No markdown, JSON only.`;

    const ai = await runChat(systemPrompt, userPrompt, { temperature: 0.4, maxTokens: 3000 });
    const parsed = tryParseJson(ai.content);

    res.json({
      type: 'material-wear-prediction',
      input: { materials, environment, usage_intensity, climate },
      result: parsed,
      raw: parsed ? null : ai.content,
      model: ai.model,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') {
      return res.status(503).json({ error: err.message });
    }
    console.error('material-wear-prediction error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/ai/contractor-match
// Ranks contractors against a job description / required skills.
// Body: { job_description, required_skills?: string|string[], budget?, timeline?, location?, contractor_ids?: string[] }
router.post('/contractor-match', auth, async (req, res) => {
  try {
    let { job_description, required_skills, budget, timeline, location, contractor_ids } = req.body || {};
    if (!job_description || typeof job_description !== 'string' || job_description.trim().length < 5) {
      return res.status(400).json({ error: 'job_description is required (min 5 chars)' });
    }
    if (typeof required_skills === 'string') {
      required_skills = required_skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Pull a candidate pool — limit to 25 to keep prompt size sane.
    const where = {};
    if (Array.isArray(contractor_ids) && contractor_ids.length > 0) {
      where.id = { in: contractor_ids };
    }
    const contractors = await prisma.contractor.findMany({
      where,
      orderBy: { rating: 'desc' },
      take: Array.isArray(contractor_ids) && contractor_ids.length > 0 ? contractor_ids.length : 25,
    }).catch((e) => {
      console.error('contractor-match: failed to load contractors', e.message);
      return [];
    });

    if (contractors.length === 0) {
      return res.status(404).json({ error: 'No contractors found to match against. Add contractors first or pass contractor_ids.' });
    }

    const safePool = contractors.map(c => ({
      id: c.id,
      name: c.name,
      company: c.company,
      specialty: c.specialty,
      rating: c.rating,
      hourlyRate: c.hourlyRate,
      availability: c.availability,
      location: c.location,
      verified: c.verified,
    }));

    const systemPrompt = 'You are an expert construction project manager and contractor matchmaker. Score each candidate on fit to the job and explain reasoning. Always respond in valid JSON.';
    const userPrompt = `Match contractors to this job.

JOB DESCRIPTION:
${job_description}

REQUIRED SKILLS: ${(Array.isArray(required_skills) && required_skills.length) ? required_skills.join(', ') : 'derive from description'}
BUDGET: ${budget || 'not specified'}
TIMELINE: ${timeline || 'not specified'}
LOCATION: ${location || 'not specified'}

CANDIDATE POOL (${safePool.length}):
${JSON.stringify(safePool, null, 2)}

Return ONLY valid JSON of this shape:
{
  "ranked_candidates": [
    {
      "contractor_id": "<id from pool>",
      "name": "<name>",
      "match_score": <0-100>,
      "strengths": ["<string>"],
      "concerns": ["<string>"],
      "estimated_quote_range_usd": "<low-high>",
      "recommendation": "<short rationale>"
    }
  ],
  "top_pick_id": "<id>",
  "decision_summary": "<one paragraph>"
}
Rank from highest to lowest match_score. No markdown.`;

    const ai = await runChat(systemPrompt, userPrompt, { temperature: 0.3, maxTokens: 3500 });
    const parsed = tryParseJson(ai.content);

    res.json({
      type: 'contractor-match',
      job_description,
      candidates_considered: safePool.length,
      result: parsed,
      raw: parsed ? null : ai.content,
      model: ai.model,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    if (err.code === 'AI_KEY_MISSING') {
      return res.status(503).json({ error: err.message });
    }
    console.error('contractor-match error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
