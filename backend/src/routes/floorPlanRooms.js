const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all rooms (optionally filter by floor_plan_id)
router.get('/', auth, async (req, res) => {
  try {
    const { floorPlanId, search, page = 1, limit = 20 } = req.query;
    const take = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (Math.max(1, parseInt(page)) - 1) * take;

    const where = {
      floorPlan: { userId: req.user.id }
    };

    if (floorPlanId) {
      where.floorPlanId = floorPlanId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { roomType: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [rooms, total] = await Promise.all([
      prisma.floorPlanRoom.findMany({
        where,
        include: {
          floorPlan: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      prisma.floorPlanRoom.count({ where })
    ]);

    res.json({
      data: rooms,
      pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// Get single room
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await prisma.floorPlanRoom.findFirst({
      where: {
        id: req.params.id,
        floorPlan: { userId: req.user.id }
      },
      include: {
        floorPlan: { select: { id: true, name: true } }
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Create room
router.post('/', auth, async (req, res) => {
  try {
    const { floorPlanId, name, roomType, width, length, height, features } = req.body;

    // Verify floor plan ownership
    const floorPlan = await prisma.floorPlan.findFirst({
      where: { id: floorPlanId, userId: req.user.id }
    });

    if (!floorPlan) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const area = width && length ? parseFloat(width) * parseFloat(length) : null;

    const room = await prisma.floorPlanRoom.create({
      data: {
        floorPlanId,
        name,
        roomType,
        width: width ? parseFloat(width) : null,
        length: length ? parseFloat(length) : null,
        height: height ? parseFloat(height) : 9,
        area,
        features: features || null
      }
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Update room
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, roomType, width, length, height, features } = req.body;

    const existing = await prisma.floorPlanRoom.findFirst({
      where: { id: req.params.id, floorPlan: { userId: req.user.id } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const newWidth = width !== undefined ? parseFloat(width) : existing.width;
    const newLength = length !== undefined ? parseFloat(length) : existing.length;
    const area = newWidth && newLength ? newWidth * newLength : existing.area;

    const room = await prisma.floorPlanRoom.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(roomType !== undefined && { roomType }),
        ...(width !== undefined && { width: parseFloat(width) }),
        ...(length !== undefined && { length: parseFloat(length) }),
        ...(height !== undefined && { height: parseFloat(height) }),
        area,
        ...(features !== undefined && { features })
      }
    });

    res.json(room);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.floorPlanRoom.findFirst({
      where: { id: req.params.id, floorPlan: { userId: req.user.id } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await prisma.floorPlanRoom.delete({ where: { id: req.params.id } });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;
