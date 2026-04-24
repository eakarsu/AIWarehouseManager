const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all templates
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { style, roomType, search, page = 1, limit = 20 } = req.query;
    const take = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (Math.max(1, parseInt(page)) - 1) * take;

    const where = {};

    if (style) where.style = style;
    if (roomType) where.roomType = roomType;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { style: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.designTemplate.findMany({
        where,
        orderBy: { popularity: 'desc' },
        take,
        skip
      }),
      prisma.designTemplate.count({ where })
    ]);

    res.json({
      data: templates,
      pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

// Get single template
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const template = await prisma.designTemplate.findUnique({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// Create template
router.post('/', auth, async (req, res) => {
  try {
    const { name, style, description, roomType, features, colorPalette } = req.body;

    const template = await prisma.designTemplate.create({
      data: {
        name,
        style,
        description,
        roomType,
        features: features ? JSON.stringify(features) : null,
        colorPalette: colorPalette ? JSON.stringify(colorPalette) : null
      }
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, style, description, roomType, features, colorPalette } = req.body;

    const template = await prisma.designTemplate.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(style !== undefined && { style }),
        ...(description !== undefined && { description }),
        ...(roomType !== undefined && { roomType }),
        ...(features !== undefined && { features: JSON.stringify(features) }),
        ...(colorPalette !== undefined && { colorPalette: JSON.stringify(colorPalette) })
      }
    });

    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.designTemplate.delete({ where: { id: req.params.id } });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;
