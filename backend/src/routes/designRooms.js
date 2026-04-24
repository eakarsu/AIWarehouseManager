const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all design rooms for the user
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await prisma.designRoom.findMany({
      where: { design: { userId: req.user.id } },
      include: {
        design: { select: { id: true, title: true } },
        _count: { select: { furniture: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(rooms);
  } catch (error) {
    console.error('Get design rooms error:', error);
    res.status(500).json({ error: 'Failed to get design rooms' });
  }
});

// Get all rooms for a design
router.get('/design/:designId', auth, async (req, res) => {
  try {
    const rooms = await prisma.designRoom.findMany({
      where: { designId: req.params.designId },
      include: {
        furniture: true,
        _count: { select: { furniture: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// Get single room
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await prisma.designRoom.findUnique({
      where: { id: req.params.id },
      include: {
        design: { select: { id: true, title: true, userId: true } },
        furniture: true
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
    const { designId, name, style, width, height, length, notes } = req.body;

    // Verify design ownership
    const design = await prisma.design.findUnique({ where: { id: designId } });
    if (!design || design.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const room = await prisma.designRoom.create({
      data: {
        designId,
        name,
        style,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        length: length ? parseFloat(length) : null,
        notes
      },
      include: { furniture: true }
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
    const { name, style, width, height, length, notes } = req.body;

    const existing = await prisma.designRoom.findUnique({
      where: { id: req.params.id },
      include: { design: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (existing.design.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const room = await prisma.designRoom.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(style !== undefined && { style }),
        ...(width !== undefined && { width: parseFloat(width) }),
        ...(height !== undefined && { height: parseFloat(height) }),
        ...(length !== undefined && { length: parseFloat(length) }),
        ...(notes !== undefined && { notes })
      },
      include: { furniture: true }
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
    const existing = await prisma.designRoom.findUnique({
      where: { id: req.params.id },
      include: { design: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (existing.design.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.designRoom.delete({ where: { id: req.params.id } });

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;
