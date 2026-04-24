const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all style presets
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const styles = await prisma.stylePreset.findMany({
      orderBy: { popularity: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.stylePreset.count();

    res.json({ styles, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get styles error:', error);
    res.status(500).json({ error: 'Failed to get styles' });
  }
});

// Get single style preset (increments popularity)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const style = await prisma.stylePreset.findUnique({
      where: { id: req.params.id }
    });

    if (!style) {
      return res.status(404).json({ error: 'Style not found' });
    }

    // Increment popularity
    await prisma.stylePreset.update({
      where: { id: req.params.id },
      data: { popularity: { increment: 1 } }
    });

    res.json(style);
  } catch (error) {
    console.error('Get style error:', error);
    res.status(500).json({ error: 'Failed to get style' });
  }
});

// Create style preset
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, style: styleType, roomType, features, colorPalette, imageUrl } = req.body;

    const newStyle = await prisma.stylePreset.create({
      data: {
        name,
        description,
        style: styleType || name,
        roomType,
        features: features || null,
        colorPalette: colorPalette || null,
        imageUrl
      }
    });

    res.status(201).json(newStyle);
  } catch (error) {
    console.error('Create style error:', error);
    res.status(500).json({ error: 'Failed to create style' });
  }
});

// Update style preset
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, style: styleType, roomType, features, colorPalette, imageUrl } = req.body;

    const updatedStyle = await prisma.stylePreset.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(styleType !== undefined && { style: styleType }),
        ...(roomType !== undefined && { roomType }),
        ...(features !== undefined && { features }),
        ...(colorPalette !== undefined && { colorPalette }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    });

    res.json(updatedStyle);
  } catch (error) {
    console.error('Update style error:', error);
    res.status(500).json({ error: 'Failed to update style' });
  }
});

// Delete style preset
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.stylePreset.delete({ where: { id: req.params.id } });
    res.json({ message: 'Style deleted successfully' });
  } catch (error) {
    console.error('Delete style error:', error);
    res.status(500).json({ error: 'Failed to delete style' });
  }
});

module.exports = router;
