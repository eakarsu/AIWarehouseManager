const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all designs
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, style, roomType, limit = 20, offset = 0 } = req.query;
    const where = {};

    if (req.user) {
      where.userId = req.user.id;
    } else {
      where.status = 'published';
    }

    if (status && req.user) where.status = status;
    if (style) where.style = style;
    if (roomType) where.roomType = roomType;

    const designs = await prisma.design.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        rooms: { take: 3 },
        _count: { select: { rooms: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.design.count({ where });

    res.json({ designs, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get designs error:', error);
    res.status(500).json({ error: 'Failed to get designs' });
  }
});

// Get single design
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const design = await prisma.design.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true } },
        rooms: {
          include: { furniture: true }
        }
      }
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json(design);
  } catch (error) {
    console.error('Get design error:', error);
    res.status(500).json({ error: 'Failed to get design' });
  }
});

// Create design
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, style, roomType, budget, imageUrl } = req.body;

    const design = await prisma.design.create({
      data: {
        userId: req.user.id,
        title: title || 'Untitled Design',
        description,
        style,
        roomType,
        budget: budget ? parseFloat(budget) : null,
        imageUrl
      },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(design);
  } catch (error) {
    console.error('Create design error:', error);
    res.status(500).json({ error: 'Failed to create design' });
  }
});

// Update design
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, style, roomType, budget, imageUrl, status } = req.body;

    const existing = await prisma.design.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Design not found' });
    }
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const design = await prisma.design.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(style !== undefined && { style }),
        ...(roomType !== undefined && { roomType }),
        ...(budget !== undefined && { budget: parseFloat(budget) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(status !== undefined && { status })
      },
      include: {
        user: { select: { id: true, name: true } },
        rooms: true
      }
    });

    res.json(design);
  } catch (error) {
    console.error('Update design error:', error);
    res.status(500).json({ error: 'Failed to update design' });
  }
});

// Delete design
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.design.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Design not found' });
    }
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.design.delete({ where: { id: req.params.id } });

    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Delete design error:', error);
    res.status(500).json({ error: 'Failed to delete design' });
  }
});

module.exports = router;
