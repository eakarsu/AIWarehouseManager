const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all color palettes
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { style, mood, limit = 20, offset = 0 } = req.query;
    const where = {};

    if (style) where.style = style;
    if (mood) where.mood = mood;

    const palettes = await prisma.colorPalette.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.colorPalette.count({ where });

    res.json({ palettes, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get palettes error:', error);
    res.status(500).json({ error: 'Failed to get palettes' });
  }
});

// Get single palette
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const palette = await prisma.colorPalette.findUnique({
      where: { id: req.params.id }
    });

    if (!palette) {
      return res.status(404).json({ error: 'Palette not found' });
    }

    res.json(palette);
  } catch (error) {
    console.error('Get palette error:', error);
    res.status(500).json({ error: 'Failed to get palette' });
  }
});

// Create palette
router.post('/', auth, async (req, res) => {
  try {
    const { name, colors, style, mood } = req.body;

    const palette = await prisma.colorPalette.create({
      data: {
        name,
        colors: typeof colors === 'string' ? JSON.parse(colors) : (colors || []),
        style,
        mood
      }
    });

    res.status(201).json(palette);
  } catch (error) {
    console.error('Create palette error:', error);
    res.status(500).json({ error: 'Failed to create palette' });
  }
});

// Update palette
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, colors, style, mood } = req.body;

    const palette = await prisma.colorPalette.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(colors !== undefined && { colors: typeof colors === 'string' ? JSON.parse(colors) : colors }),
        ...(style !== undefined && { style }),
        ...(mood !== undefined && { mood })
      }
    });

    res.json(palette);
  } catch (error) {
    console.error('Update palette error:', error);
    res.status(500).json({ error: 'Failed to update palette' });
  }
});

// Delete palette
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.colorPalette.delete({ where: { id: req.params.id } });
    res.json({ message: 'Palette deleted successfully' });
  } catch (error) {
    console.error('Delete palette error:', error);
    res.status(500).json({ error: 'Failed to delete palette' });
  }
});

module.exports = router;
