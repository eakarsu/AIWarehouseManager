const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all home staging records
router.get('/', auth, async (req, res) => {
  try {
    const { roomId, limit = 20, offset = 0 } = req.query;

    const where = {
      room: { floorPlan: { userId: req.user.id } }
    };
    if (roomId) where.roomId = roomId;

    const [records, total] = await Promise.all([
      prisma.homeStaging.findMany({
        where,
        include: {
          room: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.homeStaging.count({ where })
    ]);

    res.json({ data: records, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get home staging error:', error);
    res.status(500).json({ error: 'Failed to get home staging records' });
  }
});

// Get single home staging record
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await prisma.homeStaging.findFirst({
      where: {
        id: req.params.id,
        room: { floorPlan: { userId: req.user.id } }
      },
      include: {
        room: { select: { id: true, name: true } }
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Home staging record not found' });
    }

    res.json(record);
  } catch (error) {
    console.error('Get home staging error:', error);
    res.status(500).json({ error: 'Failed to get home staging record' });
  }
});

// Delete home staging record
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.homeStaging.findFirst({
      where: { id: req.params.id, room: { floorPlan: { userId: req.user.id } } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Home staging record not found' });
    }

    await prisma.homeStaging.delete({ where: { id: req.params.id } });
    res.json({ message: 'Home staging record deleted successfully' });
  } catch (error) {
    console.error('Delete home staging error:', error);
    res.status(500).json({ error: 'Failed to delete home staging record' });
  }
});

module.exports = router;
