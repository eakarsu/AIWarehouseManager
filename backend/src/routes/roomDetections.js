const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all room detections
router.get('/', auth, async (req, res) => {
  try {
    const { floorPlanId, limit = 20, offset = 0 } = req.query;

    const where = {
      floorPlan: { userId: req.user.id }
    };
    if (floorPlanId) where.floorPlanId = floorPlanId;

    const [detections, total] = await Promise.all([
      prisma.roomDetection.findMany({
        where,
        include: {
          floorPlan: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.roomDetection.count({ where })
    ]);

    res.json({ data: detections, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get room detections error:', error);
    res.status(500).json({ error: 'Failed to get room detections' });
  }
});

// Get single room detection
router.get('/:id', auth, async (req, res) => {
  try {
    const detection = await prisma.roomDetection.findFirst({
      where: {
        id: req.params.id,
        floorPlan: { userId: req.user.id }
      },
      include: {
        floorPlan: { select: { id: true, name: true } }
      }
    });

    if (!detection) {
      return res.status(404).json({ error: 'Room detection not found' });
    }

    res.json(detection);
  } catch (error) {
    console.error('Get room detection error:', error);
    res.status(500).json({ error: 'Failed to get room detection' });
  }
});

// Delete room detection
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.roomDetection.findFirst({
      where: { id: req.params.id, floorPlan: { userId: req.user.id } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Room detection not found' });
    }

    await prisma.roomDetection.delete({ where: { id: req.params.id } });
    res.json({ message: 'Room detection deleted successfully' });
  } catch (error) {
    console.error('Delete room detection error:', error);
    res.status(500).json({ error: 'Failed to delete room detection' });
  }
});

module.exports = router;
