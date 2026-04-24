const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all estimates
router.get('/', auth, async (req, res) => {
  try {
    const { floorPlanId, search, page = 1, limit = 20 } = req.query;
    const take = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (Math.max(1, parseInt(page)) - 1) * take;

    const where = {
      floorPlan: { userId: req.user.id }
    };

    if (floorPlanId) where.floorPlanId = floorPlanId;

    if (search) {
      where.OR = [
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [estimates, total] = await Promise.all([
      prisma.projectEstimate.findMany({
        where,
        include: {
          floorPlan: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      prisma.projectEstimate.count({ where })
    ]);

    res.json({
      data: estimates,
      pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) }
    });
  } catch (error) {
    console.error('Get estimates error:', error);
    res.status(500).json({ error: 'Failed to get estimates' });
  }
});

// Get single estimate
router.get('/:id', auth, async (req, res) => {
  try {
    const estimate = await prisma.projectEstimate.findFirst({
      where: {
        id: req.params.id,
        floorPlan: { userId: req.user.id }
      },
      include: {
        floorPlan: { select: { id: true, name: true } }
      }
    });

    if (!estimate) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    res.json(estimate);
  } catch (error) {
    console.error('Get estimate error:', error);
    res.status(500).json({ error: 'Failed to get estimate' });
  }
});

// Create estimate
router.post('/', auth, async (req, res) => {
  try {
    const { floorPlanId, laborCost, materialCost, timelineDays, status, notes } = req.body;

    const floorPlan = await prisma.floorPlan.findFirst({
      where: { id: floorPlanId, userId: req.user.id }
    });

    if (!floorPlan) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const totalCost = (parseFloat(laborCost) || 0) + (parseFloat(materialCost) || 0);

    const estimate = await prisma.projectEstimate.create({
      data: {
        floorPlanId,
        laborCost: laborCost ? parseFloat(laborCost) : 0,
        materialCost: materialCost ? parseFloat(materialCost) : 0,
        totalCost,
        timelineDays: timelineDays ? parseInt(timelineDays) : null,
        status: status || 'draft',
        notes
      }
    });

    res.status(201).json(estimate);
  } catch (error) {
    console.error('Create estimate error:', error);
    res.status(500).json({ error: 'Failed to create estimate' });
  }
});

// Update estimate
router.put('/:id', auth, async (req, res) => {
  try {
    const { laborCost, materialCost, timelineDays, status, notes } = req.body;

    const existing = await prisma.projectEstimate.findFirst({
      where: { id: req.params.id, floorPlan: { userId: req.user.id } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    const newLaborCost = laborCost !== undefined ? parseFloat(laborCost) : existing.laborCost;
    const newMaterialCost = materialCost !== undefined ? parseFloat(materialCost) : existing.materialCost;
    const totalCost = (newLaborCost || 0) + (newMaterialCost || 0);

    const estimate = await prisma.projectEstimate.update({
      where: { id: req.params.id },
      data: {
        ...(laborCost !== undefined && { laborCost: parseFloat(laborCost) }),
        ...(materialCost !== undefined && { materialCost: parseFloat(materialCost) }),
        totalCost,
        ...(timelineDays !== undefined && { timelineDays: parseInt(timelineDays) }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes })
      }
    });

    res.json(estimate);
  } catch (error) {
    console.error('Update estimate error:', error);
    res.status(500).json({ error: 'Failed to update estimate' });
  }
});

// Delete estimate
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await prisma.projectEstimate.findFirst({
      where: { id: req.params.id, floorPlan: { userId: req.user.id } }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Estimate not found' });
    }

    await prisma.projectEstimate.delete({ where: { id: req.params.id } });

    res.json({ message: 'Estimate deleted successfully' });
  } catch (error) {
    console.error('Delete estimate error:', error);
    res.status(500).json({ error: 'Failed to delete estimate' });
  }
});

module.exports = router;
