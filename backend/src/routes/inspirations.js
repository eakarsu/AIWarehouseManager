const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get inspiration styles (must be before /:id)
router.get('/meta/styles', async (req, res) => {
  try {
    const styles = await prisma.inspiration.groupBy({
      by: ['style'],
      _count: { style: true }
    });
    res.json(styles.filter(s => s.style));
  } catch (error) {
    console.error('Get styles error:', error);
    res.status(500).json({ error: 'Failed to get styles' });
  }
});

// Get inspiration room types (must be before /:id)
router.get('/meta/room-types', async (req, res) => {
  try {
    const roomTypes = await prisma.inspiration.groupBy({
      by: ['roomType'],
      _count: { roomType: true }
    });
    res.json(roomTypes.filter(r => r.roomType));
  } catch (error) {
    console.error('Get room types error:', error);
    res.status(500).json({ error: 'Failed to get room types' });
  }
});

// Get all inspirations
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { style, roomType, limit = 20, offset = 0 } = req.query;
    const where = {};
    if (style) where.style = style;
    if (roomType) where.roomType = roomType;

    const inspirations = await prisma.inspiration.findMany({
      where,
      orderBy: { likes: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.inspiration.count({ where });

    res.json({ inspirations, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get inspirations error:', error);
    res.status(500).json({ error: 'Failed to get inspirations' });
  }
});

// Get single inspiration
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const inspiration = await prisma.inspiration.findUnique({
      where: { id: req.params.id }
    });

    if (!inspiration) {
      return res.status(404).json({ error: 'Inspiration not found' });
    }

    res.json(inspiration);
  } catch (error) {
    console.error('Get inspiration error:', error);
    res.status(500).json({ error: 'Failed to get inspiration' });
  }
});

// Create inspiration
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, imageUrl, style, roomType, tags } = req.body;

    const inspiration = await prisma.inspiration.create({
      data: {
        title,
        description,
        imageUrl,
        style,
        roomType,
        tags: Array.isArray(tags) ? tags.join(',') : tags
      }
    });

    res.status(201).json(inspiration);
  } catch (error) {
    console.error('Create inspiration error:', error);
    res.status(500).json({ error: 'Failed to create inspiration' });
  }
});

// Update inspiration
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, imageUrl, style, roomType, tags } = req.body;

    const inspiration = await prisma.inspiration.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(style !== undefined && { style }),
        ...(roomType !== undefined && { roomType }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags.join(',') : tags })
      }
    });

    res.json(inspiration);
  } catch (error) {
    console.error('Update inspiration error:', error);
    res.status(500).json({ error: 'Failed to update inspiration' });
  }
});

// Delete inspiration
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.inspiration.delete({ where: { id: req.params.id } });
    res.json({ message: 'Inspiration deleted successfully' });
  } catch (error) {
    console.error('Delete inspiration error:', error);
    res.status(500).json({ error: 'Failed to delete inspiration' });
  }
});

// Like inspiration
router.post('/:id/like', optionalAuth, async (req, res) => {
  try {
    const inspiration = await prisma.inspiration.update({
      where: { id: req.params.id },
      data: { likes: { increment: 1 } }
    });

    res.json({ likes: inspiration.likes });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Failed to like inspiration' });
  }
});

module.exports = router;
