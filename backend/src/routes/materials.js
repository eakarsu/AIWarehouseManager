const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get material categories (must be before /:id)
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await prisma.material.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get all materials
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, limit = 20, offset = 0 } = req.query;
    const where = {};

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: { name: 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.material.count({ where });

    res.json({ materials, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to get materials' });
  }
});

// Get single material
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: req.params.id }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json(material);
  } catch (error) {
    console.error('Get material error:', error);
    res.status(500).json({ error: 'Failed to get material' });
  }
});

// Create material
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, description, texture, color, price, imageUrl, unit, supplier, inStock } = req.body;

    const material = await prisma.material.create({
      data: {
        name,
        category,
        description,
        texture,
        color,
        unitPrice: price ? parseFloat(price) : null,
        imageUrl,
        unit,
        supplier,
        inStock: inStock !== undefined ? inStock : true
      }
    });

    res.status(201).json(material);
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

// Update material
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, description, texture, color, price, imageUrl, unit, supplier, inStock } = req.body;

    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(texture !== undefined && { texture }),
        ...(color !== undefined && { color }),
        ...(price !== undefined && { unitPrice: parseFloat(price) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(unit !== undefined && { unit }),
        ...(supplier !== undefined && { supplier }),
        ...(inStock !== undefined && { inStock })
      }
    });

    res.json(material);
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

// Delete material
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.material.delete({ where: { id: req.params.id } });
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
});

module.exports = router;
