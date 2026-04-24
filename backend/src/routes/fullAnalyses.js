const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all full analyses
router.get('/', auth, async (req, res) => {
  try {
    const { floorPlanId, limit = 20, offset = 0 } = req.query;

    const where = {
      floorPlan: { userId: req.user.id }
    };
    if (floorPlanId) where.floorPlanId = floorPlanId;

    const [analyses, total] = await Promise.all([
      prisma.fullAnalysis.findMany({
        where,
        include: {
          floorPlan: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.fullAnalysis.count({ where })
    ]);

    res.json({ data: analyses, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get full analyses error:', error);
    res.status(500).json({ error: 'Failed to get full analyses' });
  }
});

// Get single full analysis
router.get('/:id', auth, async (req, res) => {
  try {
    const analysis = await prisma.fullAnalysis.findFirst({
      where: {
        id: req.params.id,
        floorPlan: { userId: req.user.id }
      },
      include: {
        floorPlan: { select: { id: true, name: true } }
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Full analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Get full analysis error:', error);
    res.status(500).json({ error: 'Failed to get full analysis' });
  }
});

// Delete full analysis
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.fullAnalysis.findFirst({
      where: { id: req.params.id, floorPlan: { userId: req.user.id } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Full analysis not found' });
    }

    await prisma.fullAnalysis.delete({ where: { id: req.params.id } });
    res.json({ message: 'Full analysis deleted successfully' });
  } catch (error) {
    console.error('Delete full analysis error:', error);
    res.status(500).json({ error: 'Failed to delete full analysis' });
  }
});

module.exports = router;
