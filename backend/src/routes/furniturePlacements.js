const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all furniture placements
router.get('/', auth, async (req, res) => {
  try {
    const { roomId, limit = 20, offset = 0 } = req.query;

    const where = {
      room: { floorPlan: { userId: req.user.id } }
    };
    if (roomId) where.roomId = roomId;

    const [placements, total] = await Promise.all([
      prisma.furniturePlacement.findMany({
        where,
        include: {
          room: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.furniturePlacement.count({ where })
    ]);

    res.json({ data: placements, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get furniture placements error:', error);
    res.status(500).json({ error: 'Failed to get furniture placements' });
  }
});

// Get single furniture placement
router.get('/:id', auth, async (req, res) => {
  try {
    const placement = await prisma.furniturePlacement.findFirst({
      where: {
        id: req.params.id,
        room: { floorPlan: { userId: req.user.id } }
      },
      include: {
        room: { select: { id: true, name: true } }
      }
    });

    if (!placement) {
      return res.status(404).json({ error: 'Furniture placement not found' });
    }

    res.json(placement);
  } catch (error) {
    console.error('Get furniture placement error:', error);
    res.status(500).json({ error: 'Failed to get furniture placement' });
  }
});

// Delete furniture placement
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.furniturePlacement.findFirst({
      where: { id: req.params.id, room: { floorPlan: { userId: req.user.id } } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Furniture placement not found' });
    }

    await prisma.furniturePlacement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Furniture placement deleted successfully' });
  } catch (error) {
    console.error('Delete furniture placement error:', error);
    res.status(500).json({ error: 'Failed to delete furniture placement' });
  }
});

module.exports = router;
