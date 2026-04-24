const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');

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

// Generate room design
router.post('/generate-design', auth, async (req, res) => {
  try {
    const { roomType, style, budget, preferences, dimensions } = req.body;

    const prompt = `You are an expert interior designer. Generate a detailed design suggestion for a ${roomType} with:
- Style: ${style || 'modern'}
- Budget: ${budget ? `$${budget}` : 'flexible'}
- Preferences: ${preferences || 'none specified'}
- Dimensions: ${dimensions || 'standard size'}

Provide a JSON response with:
{
  "designName": "name",
  "description": "overall description",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "furnitureSuggestions": [{"name": "", "category": "", "estimatedPrice": 0, "reason": ""}],
  "layoutTips": [],
  "materialRecommendations": [],
  "lightingAdvice": "",
  "accentIdeas": []
}`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are an expert interior designer. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const designSuggestion = parseAIJson(aiResult.content);

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'design',
        prompt: JSON.stringify({ roomType, style, budget, preferences, dimensions }),
        result: JSON.stringify(designSuggestion),
        modelUsed: aiResult.model,
        tokensUsed: aiResult.tokensUsed || 0
      }
    });

    res.json({ success: true, design: designSuggestion });
  } catch (error) {
    console.error('Generate design error:', error);
    res.status(500).json({ error: 'Failed to generate design', message: error.message });
  }
});

// Generate color palette
router.post('/generate-palette', auth, async (req, res) => {
  try {
    const { mood, style, roomType, baseColor } = req.body;

    const prompt = `Generate a professional interior design color palette for:
- Mood: ${mood || 'calm and inviting'}
- Style: ${style || 'modern'}
- Room Type: ${roomType || 'living room'}
${baseColor ? `- Base Color: ${baseColor}` : ''}

Respond with JSON:
{
  "paletteName": "",
  "colors": [{"hex": "#XXXXXX", "name": "", "usage": ""}],
  "mood": "",
  "combinations": [{"primary": "#XXX", "accent": "#XXX", "description": ""}]
}`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are a color theory expert for interior design. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const palette = parseAIJson(aiResult.content);

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'palette',
        prompt: JSON.stringify({ mood, style, roomType, baseColor }),
        result: JSON.stringify(palette),
        modelUsed: aiResult.model
      }
    });

    res.json({ success: true, palette });
  } catch (error) {
    console.error('Generate palette error:', error);
    res.status(500).json({ error: 'Failed to generate palette', message: error.message });
  }
});

// Recommend furniture
router.post('/recommend-furniture', auth, async (req, res) => {
  try {
    const { roomType, style, budget, existingFurniture, dimensions } = req.body;

    const prompt = `Recommend furniture for:
- Room: ${roomType || 'living room'}
- Style: ${style || 'modern'}
- Budget: ${budget ? `$${budget}` : 'flexible'}
- Existing: ${existingFurniture || 'none'}
- Dimensions: ${dimensions || 'standard'}

Respond with JSON:
{
  "recommendations": [{"name": "", "category": "", "style": "", "estimatedPrice": 0, "dimensions": "", "material": "", "color": "", "reason": "", "alternatives": []}],
  "layoutSuggestion": "",
  "totalEstimatedCost": 0
}`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are a furniture and interior design expert. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const recommendations = parseAIJson(aiResult.content);

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'furniture',
        prompt: JSON.stringify({ roomType, style, budget, existingFurniture, dimensions }),
        result: JSON.stringify(recommendations),
        modelUsed: aiResult.model
      }
    });

    res.json({ success: true, recommendations });
  } catch (error) {
    console.error('Recommend furniture error:', error);
    res.status(500).json({ error: 'Failed to recommend furniture', message: error.message });
  }
});

// Analyze room
router.post('/analyze-room', auth, async (req, res) => {
  try {
    const { description, currentIssues, goals } = req.body;

    const prompt = `Analyze this room and provide improvement suggestions:
- Description: ${description}
- Current Issues: ${currentIssues || 'none specified'}
- Goals: ${goals || 'general improvement'}

Respond with JSON:
{
  "analysis": {"currentState": "", "strengths": [], "weaknesses": []},
  "improvements": [{"area": "", "suggestion": "", "priority": "high/medium/low", "estimatedCost": "", "difficulty": "easy/moderate/challenging"}],
  "quickWins": [],
  "longTermGoals": []
}`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are an interior design consultant. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const analysis = parseAIJson(aiResult.content);

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'room-analysis',
        prompt: JSON.stringify({ description, currentIssues, goals }),
        result: JSON.stringify(analysis),
        modelUsed: aiResult.model
      }
    });

    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Analyze room error:', error);
    res.status(500).json({ error: 'Failed to analyze room', message: error.message });
  }
});

// Generate style guide
router.post('/generate-style-guide', auth, async (req, res) => {
  try {
    const { style, preferences, homeType } = req.body;

    const prompt = `Create a comprehensive interior design style guide for:
- Style: ${style || 'modern minimalist'}
- Preferences: ${preferences || 'clean and functional'}
- Home Type: ${homeType || 'apartment'}

Respond with JSON:
{
  "styleName": "",
  "overview": "",
  "keyElements": [],
  "colorScheme": {"primary": [], "secondary": [], "accents": []},
  "materials": [{"name": "", "usage": "", "alternatives": []}],
  "furnitureStyles": [],
  "patterns": [],
  "lighting": {"natural": "", "artificial": []},
  "doAndDont": {"do": [], "dont": []},
  "inspirationKeywords": []
}`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are an interior design style expert. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const styleGuide = parseAIJson(aiResult.content);

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'style-guide',
        prompt: JSON.stringify({ style, preferences, homeType }),
        result: JSON.stringify(styleGuide),
        modelUsed: aiResult.model
      }
    });

    res.json({ success: true, styleGuide });
  } catch (error) {
    console.error('Generate style guide error:', error);
    res.status(500).json({ error: 'Failed to generate style guide', message: error.message });
  }
});

// Match style
router.post('/match-style', auth, async (req, res) => {
  try {
    const { preferences, lifestyle, colorPreferences, spaceType, budgetRange } = req.body;

    const prompt = `Match interior design styles to these preferences:
- Preferences: ${preferences || 'Not specified'}
- Lifestyle: ${lifestyle || 'Not specified'}
- Colors: ${colorPreferences || 'No preference'}
- Space: ${spaceType || 'General'}
- Budget: ${budgetRange || 'Flexible'}

Respond with JSON:
{
  "primaryMatch": {"styleName": "", "matchScore": 0, "description": "", "keyCharacteristics": [], "recommendedColors": [], "typicalMaterials": [], "priceRange": ""},
  "alternativeMatches": [{"styleName": "", "matchScore": 0, "whyItFits": "", "keyDifference": ""}],
  "styleBlendSuggestion": {"combination": "", "description": "", "ratio": ""},
  "personalizedTips": [],
  "avoidStyles": [{"styleName": "", "reason": ""}]
}`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are an expert interior design style consultant. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const styleMatch = parseAIJson(aiResult.content);

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'style-match',
        prompt: JSON.stringify({ preferences, lifestyle, colorPreferences, spaceType, budgetRange }),
        result: JSON.stringify(styleMatch),
        modelUsed: aiResult.model,
        tokensUsed: aiResult.tokensUsed || 0
      }
    });

    res.json({ success: true, styleMatch });
  } catch (error) {
    console.error('Style match error:', error);
    res.status(500).json({ error: 'Failed to match style', message: error.message });
  }
});

// Plan budget
router.post('/plan-budget', auth, async (req, res) => {
  try {
    const { totalBudget, roomType, style, priorities, existingItems, timeline } = req.body;

    const prompt = `Create a budget plan for interior design:
- Budget: $${totalBudget || 10000}
- Room: ${roomType || 'Living Room'}
- Style: ${style || 'Modern'}
- Priorities: ${priorities || 'Quality furniture'}
- Existing: ${existingItems || 'None'}
- Timeline: ${timeline || 'Flexible'}

Respond with JSON:
{
  "budgetSummary": {"totalBudget": 0, "recommendedSpend": 0, "contingencyFund": 0, "potentialSavings": 0},
  "categoryBreakdown": [{"category": "", "allocation": 0, "percentage": 0, "priority": "", "items": []}],
  "phaseTimeline": [{"phase": 1, "name": "", "budget": 0, "duration": "", "items": []}],
  "savingStrategies": [{"strategy": "", "potentialSavings": "", "implementation": ""}],
  "splurgeVsSave": {"worthSplurging": [], "okayToSave": []},
  "hiddenCosts": [],
  "budgetWarnings": []
}`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are an expert interior design budget planner. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const budgetPlan = parseAIJson(aiResult.content);

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'budget-plan',
        prompt: JSON.stringify({ totalBudget, roomType, style, priorities, existingItems, timeline }),
        result: JSON.stringify(budgetPlan),
        modelUsed: aiResult.model,
        tokensUsed: aiResult.tokensUsed || 0
      }
    });

    res.json({ success: true, budgetPlan });
  } catch (error) {
    console.error('Budget plan error:', error);
    res.status(500).json({ error: 'Failed to create budget plan', message: error.message });
  }
});

// Visualize transformation
router.post('/visualize-transformation', auth, async (req, res) => {
  try {
    const { currentState, desiredStyle, budget, constraints, mustKeep } = req.body;

    const prompt = `Create a before/after transformation plan:
Current: ${currentState || 'Standard room'}
Target: ${desiredStyle || 'Modern Minimalist'}
Budget: $${budget || 15000}
Constraints: ${constraints || 'None'}
Keep: ${mustKeep || 'None'}

Respond with JSON:
{
  "transformationOverview": {"title": "", "tagline": "", "transformationScore": 0, "estimatedBudget": 0, "timelineWeeks": 0},
  "beforeAnalysis": {"currentStyle": "", "strengths": [], "painPoints": [], "potentialScore": 0},
  "afterVision": {"targetStyle": "", "keyImprovements": [], "moodDescription": "", "targetScore": 0},
  "transformationSteps": [{"step": 1, "title": "", "description": "", "category": "", "impact": "", "cost": 0}],
  "colorTransformation": {"before": [], "after": []},
  "furnitureChanges": {"remove": [], "keep": [], "add": []},
  "impactMetrics": {"aestheticImprovement": 0, "functionalityGain": 0, "comfortIncrease": 0, "valueAdd": 0},
  "quickWins": [],
  "biggestImpactChanges": []
}`;

    const aiResult = await callOpenRouter([
      { role: 'system', content: 'You are an expert interior design transformation specialist. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const transformation = parseAIJson(aiResult.content);

    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'transformation',
        prompt: JSON.stringify({ currentState, desiredStyle, budget, constraints, mustKeep }),
        result: JSON.stringify(transformation),
        modelUsed: aiResult.model,
        tokensUsed: aiResult.tokensUsed || 0
      }
    });

    res.json({ success: true, transformation });
  } catch (error) {
    console.error('Transformation error:', error);
    res.status(500).json({ error: 'Failed to visualize transformation', message: error.message });
  }
});

// Generate image
router.post('/generate-image', auth, async (req, res) => {
  try {
    const { style, roomType } = req.body;

    // Image generation would use DALL-E or Replicate in production
    // For now, return a structured response
    await prisma.aIGeneration.create({
      data: {
        userId: req.user.id,
        type: 'image',
        prompt: `${style || 'modern'} ${roomType || 'living room'}`,
        result: JSON.stringify({ message: 'Image generation requires OPENAI_API_KEY or REPLICATE_API_TOKEN' }),
        status: 'completed',
        model: 'pending-configuration'
      }
    });

    res.json({
      success: false,
      error: 'Image generation requires OPENAI_API_KEY or REPLICATE_API_TOKEN environment variables.'
    });
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({ error: 'Failed to generate image', message: error.message });
  }
});

// AI generation history
router.get('/history', auth, async (req, res) => {
  try {
    const { type, limit = 20, offset = 0 } = req.query;
    const where = { userId: req.user.id };
    if (type) where.type = type;

    const generations = await prisma.aIGeneration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.aIGeneration.count({ where });

    res.json({ generations, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Get single generation
router.get('/history/:id', auth, async (req, res) => {
  try {
    const generation = await prisma.aIGeneration.findUnique({
      where: { id: req.params.id }
    });

    if (!generation || generation.userId !== req.user.id) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    res.json(generation);
  } catch (error) {
    console.error('Get generation error:', error);
    res.status(500).json({ error: 'Failed to get generation' });
  }
});

module.exports = router;
