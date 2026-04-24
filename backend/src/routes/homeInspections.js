const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth } = require('../middleware/auth');
const { generateHomeInspection } = require('../services/openrouter');

// Get all home inspections for the user
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const inspections = await prisma.homeInspection.findMany({
      where: { floorPlan: { userId: req.user.id } },
      include: { floorPlan: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    const total = await prisma.homeInspection.count({ where: { floorPlan: { userId: req.user.id } } });
    res.json({ data: inspections, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Error fetching home inspections:', error);
    res.status(500).json({ error: 'Failed to fetch home inspections' });
  }
});

// Get all home inspections for a floor plan
router.get('/floor-plan/:floorPlanId', auth, async (req, res) => {
  try {
    const inspections = await prisma.homeInspection.findMany({
      where: { floorPlanId: req.params.floorPlanId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching home inspections:', error);
    res.status(500).json({ error: 'Failed to fetch home inspections' });
  }
});

// Get a single home inspection
router.get('/:id', auth, async (req, res) => {
  try {
    const inspection = await prisma.homeInspection.findUnique({
      where: { id: req.params.id }
    });
    if (!inspection) {
      return res.status(404).json({ error: 'Home inspection not found' });
    }
    res.json(inspection);
  } catch (error) {
    console.error('Error fetching home inspection:', error);
    res.status(500).json({ error: 'Failed to fetch home inspection' });
  }
});

// Generate a new home inspection
router.post('/generate', auth, async (req, res) => {
  try {
    const { floorPlanId, inspectionType } = req.body;

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
        area: r.area
      }))
    };

    const result = await generateHomeInspection(floorPlanData, inspectionType);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    let inspectionData = {};
    try {
      const content = result.analysis;
      const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        inspectionData = JSON.parse(codeBlockMatch[1]);
      }
    } catch (e) {
      console.error('Failed to parse home inspection JSON:', e);
    }

    const inspection = await prisma.homeInspection.create({
      data: {
        floorPlanId,
        inspectionType: inspectionData.inspection_type || inspectionType || 'general',
        overallCondition: inspectionData.overall_condition || null,
        issuesFound: inspectionData.issues_found || null,
        criticalIssues: inspectionData.critical_issues || null,
        estimatedRepairCost: inspectionData.estimated_repair_cost || null,
        modelUsed: result.model
      }
    });

    res.json({
      inspection,
      analysis: result.analysis,
      model: result.model,
      processingTimeMs: result.processingTimeMs
    });
  } catch (error) {
    console.error('Error generating home inspection:', error);
    res.status(500).json({ error: 'Failed to generate home inspection' });
  }
});

// Delete a home inspection
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.homeInspection.delete({ where: { id: req.params.id } });
    res.json({ message: 'Home inspection deleted' });
  } catch (error) {
    console.error('Error deleting home inspection:', error);
    res.status(500).json({ error: 'Failed to delete home inspection' });
  }
});

module.exports = router;
