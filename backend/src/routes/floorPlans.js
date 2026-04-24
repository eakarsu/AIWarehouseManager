const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Convert image to PNG
async function ensurePngDataUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
  try {
    const base64Data = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const pngBuffer = await sharp(buffer)
      .resize(1500, 1500, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  } catch (err) {
    console.error('Image conversion error:', err.message);
    return dataUrl;
  }
}

// Get all floor plans for user
router.get('/', auth, async (req, res) => {
  try {
    const { search, sort_by = 'createdAt', sort_order = 'desc', page = 1, limit = 20 } = req.query;
    const take = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (Math.max(1, parseInt(page)) - 1) * take;

    const where = { userId: req.user.id };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [floorPlans, total] = await Promise.all([
      prisma.floorPlan.findMany({
        where,
        include: {
          _count: { select: { rooms: true, renovationSuggestions: true } }
        },
        orderBy: { [sort_by]: sort_order.toLowerCase() },
        take,
        skip
      }),
      prisma.floorPlan.count({ where })
    ]);

    res.json({
      data: floorPlans,
      pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) }
    });
  } catch (error) {
    console.error('Get floor plans error:', error);
    res.status(500).json({ error: 'Failed to get floor plans' });
  }
});

// Get single floor plan
router.get('/:id', auth, async (req, res) => {
  try {
    const floorPlan = await prisma.floorPlan.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        rooms: { orderBy: { name: 'asc' } },
        renovationSuggestions: { orderBy: { priority: 'desc' } },
        projectEstimates: true
      }
    });

    if (!floorPlan) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }

    res.json(floorPlan);
  } catch (error) {
    console.error('Get floor plan error:', error);
    res.status(500).json({ error: 'Failed to get floor plan' });
  }
});

// Create floor plan
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, totalArea } = req.body;
    let imageData = req.body.imageData;

    if (req.file) {
      imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    if (imageData) {
      imageData = await ensurePngDataUrl(imageData);
    }

    const floorPlan = await prisma.floorPlan.create({
      data: {
        userId: req.user.id,
        name: name || 'Untitled Floor Plan',
        description,
        totalArea: totalArea ? parseFloat(totalArea) : null,
        imageData,
        status: 'pending'
      }
    });

    res.status(201).json(floorPlan);
  } catch (error) {
    console.error('Create floor plan error:', error);
    res.status(500).json({ error: 'Failed to create floor plan' });
  }
});

// Update floor plan
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, description, totalArea, status } = req.body;
    let imageData = req.body.imageData;

    if (req.file) {
      imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    if (imageData) {
      imageData = await ensurePngDataUrl(imageData);
    }

    const existing = await prisma.floorPlan.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }

    const floorPlan = await prisma.floorPlan.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(totalArea !== undefined && { totalArea: parseFloat(totalArea) }),
        ...(status !== undefined && { status }),
        ...(imageData !== undefined && { imageData })
      }
    });

    res.json(floorPlan);
  } catch (error) {
    console.error('Update floor plan error:', error);
    res.status(500).json({ error: 'Failed to update floor plan' });
  }
});

// Delete floor plan
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.floorPlan.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }

    await prisma.floorPlan.delete({ where: { id: req.params.id } });

    res.json({ message: 'Floor plan deleted successfully' });
  } catch (error) {
    console.error('Delete floor plan error:', error);
    res.status(500).json({ error: 'Failed to delete floor plan' });
  }
});

// Bulk delete floor plans
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const result = await prisma.floorPlan.deleteMany({
      where: {
        id: { in: ids },
        userId: req.user.id
      }
    });

    res.json({ message: `${result.count} floor plans deleted successfully`, count: result.count });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Failed to bulk delete floor plans' });
  }
});

// Bulk update status
router.post('/bulk-status', auth, async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ error: 'ids array and status are required' });
    }

    const result = await prisma.floorPlan.updateMany({
      where: {
        id: { in: ids },
        userId: req.user.id
      },
      data: { status }
    });

    res.json({ message: `${result.count} floor plans updated`, count: result.count });
  } catch (error) {
    console.error('Bulk status update error:', error);
    res.status(500).json({ error: 'Failed to bulk update floor plans' });
  }
});

module.exports = router;
