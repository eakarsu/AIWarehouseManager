const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth } = require('../middleware/auth');
const { analyzeLayoutOptimization } = require('../services/openrouter');

// Get all layout optimizations for the user
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const optimizations = await prisma.layoutOptimization.findMany({
      where: { floorPlan: { userId: req.user.id } },
      include: { floorPlan: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    const total = await prisma.layoutOptimization.count({ where: { floorPlan: { userId: req.user.id } } });
    res.json({ data: optimizations, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Error fetching layout optimizations:', error);
    res.status(500).json({ error: 'Failed to fetch layout optimizations' });
  }
});

// Get all layout optimizations for a floor plan
router.get('/floor-plan/:floorPlanId', auth, async (req, res) => {
  try {
    const optimizations = await prisma.layoutOptimization.findMany({
      where: { floorPlanId: req.params.floorPlanId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(optimizations);
  } catch (error) {
    console.error('Error fetching layout optimizations:', error);
    res.status(500).json({ error: 'Failed to fetch layout optimizations' });
  }
});

// Get a single layout optimization
router.get('/:id', auth, async (req, res) => {
  try {
    const optimization = await prisma.layoutOptimization.findUnique({
      where: { id: req.params.id }
    });
    if (!optimization) {
      return res.status(404).json({ error: 'Layout optimization not found' });
    }
    res.json(optimization);
  } catch (error) {
    console.error('Error fetching layout optimization:', error);
    res.status(500).json({ error: 'Failed to fetch layout optimization' });
  }
});

// Generate a new layout optimization
router.post('/generate', auth, async (req, res) => {
  try {
    const { floorPlanId } = req.body;

    const floorPlan = await prisma.floorPlan.findUnique({
      where: { id: floorPlanId },
      include: { rooms: true }
    });

    if (!floorPlan) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }

    const floorPlanData = {
      name: floorPlan.name,
      total_area: floorPlan.totalArea,
      rooms: floorPlan.rooms.map(r => ({
        name: r.name,
        room_type: r.roomType,
        width: r.width,
        length: r.length,
        area: r.area
      }))
    };

    const result = await analyzeLayoutOptimization(floorPlanData);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    let optimizationData = {};
    try {
      const content = result.optimization;
      const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        optimizationData = JSON.parse(codeBlockMatch[1]);
      }
    } catch (e) {
      console.error('Failed to parse layout optimization JSON:', e);
    }

    const optimization = await prisma.layoutOptimization.create({
      data: {
        floorPlanId,
        trafficFlow: optimizationData.traffic_flow || null,
        efficiencyScore: optimizationData.efficiency_score || null,
        naturalLight: optimizationData.natural_light || null,
        privacyAnalysis: optimizationData.privacy_analysis || null,
        noiseZones: optimizationData.noise_zones || null,
        furnitureSuggestions: optimizationData.furniture_suggestions || null,
        fullResult: optimizationData,
        modelUsed: result.model
      }
    });

    res.json({
      optimization,
      analysis: result.optimization,
      model: result.model,
      processingTimeMs: result.processingTimeMs
    });
  } catch (error) {
    console.error('Error generating layout optimization:', error);
    res.status(500).json({ error: 'Failed to generate layout optimization' });
  }
});

// Delete a layout optimization
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.layoutOptimization.delete({ where: { id: req.params.id } });
    res.json({ message: 'Layout optimization deleted' });
  } catch (error) {
    console.error('Error deleting layout optimization:', error);
    res.status(500).json({ error: 'Failed to delete layout optimization' });
  }
});

module.exports = router;
