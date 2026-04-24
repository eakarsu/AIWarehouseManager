const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all suggestions
router.get('/', auth, async (req, res) => {
  try {
    const { floorPlanId, roomId, search, page = 1, limit = 20 } = req.query;
    const take = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (Math.max(1, parseInt(page)) - 1) * take;

    const where = {
      floorPlan: { userId: req.user.id }
    };

    if (floorPlanId) where.floorPlanId = floorPlanId;
    if (roomId) where.roomId = roomId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [suggestions, total] = await Promise.all([
      prisma.renovationSuggestion.findMany({
        where,
        include: {
          room: { select: { id: true, name: true } },
          floorPlan: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      prisma.renovationSuggestion.count({ where })
    ]);

    res.json({
      data: suggestions,
      pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) }
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Get single suggestion
router.get('/:id', auth, async (req, res) => {
  try {
    const suggestion = await prisma.renovationSuggestion.findFirst({
      where: {
        id: req.params.id,
        floorPlan: { userId: req.user.id }
      },
      include: {
        room: { select: { id: true, name: true } },
        floorPlan: { select: { id: true, name: true } }
      }
    });

    if (!suggestion) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    res.json(suggestion);
  } catch (error) {
    console.error('Get suggestion error:', error);
    res.status(500).json({ error: 'Failed to get suggestion' });
  }
});

// Create suggestion
router.post('/', auth, async (req, res) => {
  try {
    const { floorPlanId, roomId, title, description, category, priority, estimatedCost, difficulty, timeline, status } = req.body;

    // Verify floor plan ownership
    const floorPlan = await prisma.floorPlan.findFirst({
      where: { id: floorPlanId, userId: req.user.id }
    });

    if (!floorPlan) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const suggestion = await prisma.renovationSuggestion.create({
      data: {
        floorPlanId,
        roomId: roomId || null,
        title,
        description,
        category,
        priority: priority || 'medium',
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        difficulty,
        timeline,
        status: status || 'pending'
      }
    });

    res.status(201).json(suggestion);
  } catch (error) {
    console.error('Create suggestion error:', error);
    res.status(500).json({ error: 'Failed to create suggestion' });
  }
});

// Update suggestion
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, category, priority, estimatedCost, difficulty, timeline, status } = req.body;

    const existing = await prisma.renovationSuggestion.findFirst({
      where: { id: req.params.id, floorPlan: { userId: req.user.id } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    const suggestion = await prisma.renovationSuggestion.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(priority !== undefined && { priority }),
        ...(estimatedCost !== undefined && { estimatedCost: parseFloat(estimatedCost) }),
        ...(difficulty !== undefined && { difficulty }),
        ...(timeline !== undefined && { timeline }),
        ...(status !== undefined && { status })
      }
    });

    res.json(suggestion);
  } catch (error) {
    console.error('Update suggestion error:', error);
    res.status(500).json({ error: 'Failed to update suggestion' });
  }
});

// Delete suggestion
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.renovationSuggestion.findFirst({
      where: { id: req.params.id, floorPlan: { userId: req.user.id } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    await prisma.renovationSuggestion.delete({ where: { id: req.params.id } });

    res.json({ message: 'Suggestion deleted successfully' });
  } catch (error) {
    console.error('Delete suggestion error:', error);
    res.status(500).json({ error: 'Failed to delete suggestion' });
  }
});

module.exports = router;
