const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth } = require('../middleware/auth');

// Get all room dimensions for the user
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const dimensions = await prisma.roomDimension.findMany({
      where: { room: { floorPlan: { userId: req.user.id } } },
      include: { room: { select: { id: true, name: true, roomType: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    const total = await prisma.roomDimension.count({ where: { room: { floorPlan: { userId: req.user.id } } } });
    res.json({ data: dimensions, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Error fetching room dimensions:', error);
    res.status(500).json({ error: 'Failed to fetch room dimensions' });
  }
});

// Get all room dimensions for a room
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const dimensions = await prisma.roomDimension.findMany({
      where: { roomId: req.params.roomId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(dimensions);
  } catch (error) {
    console.error('Error fetching room dimensions:', error);
    res.status(500).json({ error: 'Failed to fetch room dimensions' });
  }
});

// Get a single room dimension record
router.get('/:id', auth, async (req, res) => {
  try {
    const dimension = await prisma.roomDimension.findUnique({
      where: { id: req.params.id }
    });
    if (!dimension) {
      return res.status(404).json({ error: 'Room dimension not found' });
    }
    res.json(dimension);
  } catch (error) {
    console.error('Error fetching room dimension:', error);
    res.status(500).json({ error: 'Failed to fetch room dimension' });
  }
});

// Create a new room dimension record
router.post('/', auth, async (req, res) => {
  try {
    const { roomId, dimensions, features, modelUsed } = req.body;

    const room = await prisma.floorPlanRoom.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const dimension = await prisma.roomDimension.create({
      data: {
        roomId,
        dimensions: dimensions || null,
        features: features || null,
        modelUsed: modelUsed || null
      }
    });

    res.status(201).json(dimension);
  } catch (error) {
    console.error('Error creating room dimension:', error);
    res.status(500).json({ error: 'Failed to create room dimension' });
  }
});

// Delete a room dimension record
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.roomDimension.delete({ where: { id: req.params.id } });
    res.json({ message: 'Room dimension deleted' });
  } catch (error) {
    console.error('Error deleting room dimension:', error);
    res.status(500).json({ error: 'Failed to delete room dimension' });
  }
});

module.exports = router;
