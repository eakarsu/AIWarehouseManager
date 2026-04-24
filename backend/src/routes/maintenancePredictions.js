const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all maintenance predictions
router.get('/', auth, async (req, res) => {
  try {
    const { floorPlanId, limit = 20, offset = 0 } = req.query;

    const where = {
      floorPlan: { userId: req.user.id }
    };
    if (floorPlanId) where.floorPlanId = floorPlanId;

    const [predictions, total] = await Promise.all([
      prisma.maintenancePrediction.findMany({
        where,
        include: {
          floorPlan: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.maintenancePrediction.count({ where })
    ]);

    res.json({ data: predictions, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get maintenance predictions error:', error);
    res.status(500).json({ error: 'Failed to get maintenance predictions' });
  }
});

// Get single maintenance prediction
router.get('/:id', auth, async (req, res) => {
  try {
    const prediction = await prisma.maintenancePrediction.findFirst({
      where: {
        id: req.params.id,
        floorPlan: { userId: req.user.id }
      },
      include: {
        floorPlan: { select: { id: true, name: true } }
      }
    });

    if (!prediction) {
      return res.status(404).json({ error: 'Maintenance prediction not found' });
    }

    res.json(prediction);
  } catch (error) {
    console.error('Get maintenance prediction error:', error);
    res.status(500).json({ error: 'Failed to get maintenance prediction' });
  }
});

// Delete maintenance prediction
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.maintenancePrediction.findFirst({
      where: { id: req.params.id, floorPlan: { userId: req.user.id } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Maintenance prediction not found' });
    }

    await prisma.maintenancePrediction.delete({ where: { id: req.params.id } });
    res.json({ message: 'Maintenance prediction deleted successfully' });
  } catch (error) {
    console.error('Delete maintenance prediction error:', error);
    res.status(500).json({ error: 'Failed to delete maintenance prediction' });
  }
});

module.exports = router;
