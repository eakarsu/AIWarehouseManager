const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get furniture categories (must be before /:id)
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await prisma.furniture.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// Get all furniture
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, style, minPrice, maxPrice, limit = 20, offset = 0 } = req.query;
    const where = {};

    if (category) where.category = category;
    if (style) where.style = style;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const furniture = await prisma.furniture.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.furniture.count({ where });

    res.json({ furniture, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get furniture error:', error);
    res.status(500).json({ error: 'Failed to get furniture' });
  }
});

// Get single furniture item
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const furniture = await prisma.furniture.findUnique({
      where: { id: req.params.id },
      include: {
        room: { select: { id: true, name: true, style: true } }
      }
    });

    if (!furniture) {
      return res.status(404).json({ error: 'Furniture not found' });
    }

    res.json(furniture);
  } catch (error) {
    console.error('Get furniture error:', error);
    res.status(500).json({ error: 'Failed to get furniture' });
  }
});

// Create furniture
router.post('/', auth, async (req, res) => {
  try {
    const { roomId, name, category, style, description, price, dimensions, imageUrl, modelUrl, arReady, storeUrl, storeName } = req.body;

    const furniture = await prisma.furniture.create({
      data: {
        roomId,
        name,
        category,
        style,
        description,
        price: price ? parseFloat(price) : null,
        dimensions,
        imageUrl,
        modelUrl,
        arReady: arReady || false,
        storeUrl,
        storeName
      }
    });

    res.status(201).json(furniture);
  } catch (error) {
    console.error('Create furniture error:', error);
    res.status(500).json({ error: 'Failed to create furniture' });
  }
});

// Update furniture
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, style, description, price, dimensions, imageUrl, modelUrl, arReady, storeUrl, storeName } = req.body;

    const furniture = await prisma.furniture.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(style !== undefined && { style }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(dimensions !== undefined && { dimensions }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(modelUrl !== undefined && { modelUrl }),
        ...(arReady !== undefined && { arReady }),
        ...(storeUrl !== undefined && { storeUrl }),
        ...(storeName !== undefined && { storeName })
      }
    });

    res.json(furniture);
  } catch (error) {
    console.error('Update furniture error:', error);
    res.status(500).json({ error: 'Failed to update furniture' });
  }
});

// Delete furniture
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.furniture.delete({ where: { id: req.params.id } });
    res.json({ message: 'Furniture deleted successfully' });
  } catch (error) {
    console.error('Delete furniture error:', error);
    res.status(500).json({ error: 'Failed to delete furniture' });
  }
});

module.exports = router;
