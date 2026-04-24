const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth } = require('../middleware/auth');
const { auditEnergyEfficiency } = require('../services/openrouter');

// Get all energy audits for the user
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const audits = await prisma.energyAudit.findMany({
      where: { floorPlan: { userId: req.user.id } },
      include: { floorPlan: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    const total = await prisma.energyAudit.count({ where: { floorPlan: { userId: req.user.id } } });
    res.json({ data: audits, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Error fetching energy audits:', error);
    res.status(500).json({ error: 'Failed to fetch energy audits' });
  }
});

// Get all energy audits for a floor plan
router.get('/floor-plan/:floorPlanId', auth, async (req, res) => {
  try {
    const audits = await prisma.energyAudit.findMany({
      where: { floorPlanId: req.params.floorPlanId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(audits);
  } catch (error) {
    console.error('Error fetching energy audits:', error);
    res.status(500).json({ error: 'Failed to fetch energy audits' });
  }
});

// Get a single energy audit
router.get('/:id', auth, async (req, res) => {
  try {
    const audit = await prisma.energyAudit.findUnique({
      where: { id: req.params.id }
    });
    if (!audit) {
      return res.status(404).json({ error: 'Energy audit not found' });
    }
    res.json(audit);
  } catch (error) {
    console.error('Error fetching energy audit:', error);
    res.status(500).json({ error: 'Failed to fetch energy audit' });
  }
});

// Generate a new energy audit
router.post('/generate', auth, async (req, res) => {
  try {
    const { floorPlanId, climateZone } = req.body;

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

    const result = await auditEnergyEfficiency(floorPlanData, climateZone);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    let auditData = {};
    try {
      const content = result.analysis;
      const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        auditData = JSON.parse(codeBlockMatch[1]);
      }
    } catch (e) {
      console.error('Failed to parse energy audit JSON:', e);
    }

    const audit = await prisma.energyAudit.create({
      data: {
        floorPlanId,
        efficiencyScore: auditData.efficiency_score || null,
        annualCostEstimate: auditData.annual_cost_estimate || null,
        potentialSavings: auditData.potential_savings || null,
        recommendations: auditData.recommendations || null,
        carbonFootprint: auditData.carbon_footprint || null,
        modelUsed: result.model
      }
    });

    res.json({
      audit,
      analysis: result.analysis,
      model: result.model,
      processingTimeMs: result.processingTimeMs
    });
  } catch (error) {
    console.error('Error generating energy audit:', error);
    res.status(500).json({ error: 'Failed to generate energy audit' });
  }
});

// Delete an energy audit
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.energyAudit.delete({ where: { id: req.params.id } });
    res.json({ message: 'Energy audit deleted' });
  } catch (error) {
    console.error('Error deleting energy audit:', error);
    res.status(500).json({ error: 'Failed to delete energy audit' });
  }
});

module.exports = router;
