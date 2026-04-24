const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get AR-ready furniture (must be before /:id)
router.get('/furniture/ar-ready', auth, async (req, res) => {
  try {
    const furniture = await prisma.furniture.findMany({
      where: {
        modelUrl: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(furniture);
  } catch (error) {
    console.error('Get AR furniture error:', error);
    res.status(500).json({ error: 'Failed to get AR furniture' });
  }
});

// Get all AR sessions
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const where = { userId: req.user.id };

    const sessions = await prisma.aRSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.aRSession.count({ where });

    res.json({ sessions, total, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (error) {
    console.error('Get AR sessions error:', error);
    res.status(500).json({ error: 'Failed to get AR sessions' });
  }
});

// Get single AR session
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await prisma.aRSession.findUnique({
      where: { id: req.params.id }
    });

    if (!session) {
      return res.status(404).json({ error: 'AR session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get AR session error:', error);
    res.status(500).json({ error: 'Failed to get AR session' });
  }
});

// Create AR session
router.post('/', auth, async (req, res) => {
  try {
    const { name, roomWidth, roomLength, roomHeight, furniture } = req.body;

    const session = await prisma.aRSession.create({
      data: {
        userId: req.user.id,
        name: name || `AR Session ${new Date().toLocaleDateString()}`,
        roomWidth: roomWidth ? parseFloat(roomWidth) : null,
        roomLength: roomLength ? parseFloat(roomLength) : null,
        roomHeight: roomHeight ? parseFloat(roomHeight) : null,
        furniture: furniture || null
      }
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Create AR session error:', error);
    res.status(500).json({ error: 'Failed to create AR session' });
  }
});

// Update AR session
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, roomWidth, roomLength, roomHeight, furniture, snapshot } = req.body;

    const existing = await prisma.aRSession.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'AR session not found' });
    }

    const session = await prisma.aRSession.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(roomWidth !== undefined && { roomWidth: parseFloat(roomWidth) }),
        ...(roomLength !== undefined && { roomLength: parseFloat(roomLength) }),
        ...(roomHeight !== undefined && { roomHeight: parseFloat(roomHeight) }),
        ...(furniture !== undefined && { furniture }),
        ...(snapshot !== undefined && { snapshot })
      }
    });

    res.json(session);
  } catch (error) {
    console.error('Update AR session error:', error);
    res.status(500).json({ error: 'Failed to update AR session' });
  }
});

// Delete AR session
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.aRSession.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'AR session not found' });
    }

    await prisma.aRSession.delete({ where: { id: req.params.id } });

    res.json({ message: 'AR session deleted successfully' });
  } catch (error) {
    console.error('Delete AR session error:', error);
    res.status(500).json({ error: 'Failed to delete AR session' });
  }
});

// Save AR snapshot
router.post('/:id/snapshot', auth, async (req, res) => {
  try {
    const { furniture, snapshot } = req.body;

    const existing = await prisma.aRSession.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'AR session not found' });
    }

    const session = await prisma.aRSession.update({
      where: { id: req.params.id },
      data: {
        ...(furniture !== undefined && { furniture }),
        ...(snapshot !== undefined && { snapshot })
      }
    });

    res.json({ success: true, session });
  } catch (error) {
    console.error('Save snapshot error:', error);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

module.exports = router;
