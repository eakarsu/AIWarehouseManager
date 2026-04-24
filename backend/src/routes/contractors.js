const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get all contractors
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { specialty, availability, search, page = 1, limit = 20 } = req.query;
    const take = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (Math.max(1, parseInt(page)) - 1) * take;

    const where = {};

    if (specialty) where.specialty = specialty;
    if (availability) where.availability = availability;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [contractors, total] = await Promise.all([
      prisma.contractor.findMany({
        where,
        orderBy: { rating: 'desc' },
        take,
        skip
      }),
      prisma.contractor.count({ where })
    ]);

    res.json({
      data: contractors,
      pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) }
    });
  } catch (error) {
    console.error('Get contractors error:', error);
    res.status(500).json({ error: 'Failed to get contractors' });
  }
});

// Get single contractor
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const contractor = await prisma.contractor.findUnique({
      where: { id: req.params.id }
    });

    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    res.json(contractor);
  } catch (error) {
    console.error('Get contractor error:', error);
    res.status(500).json({ error: 'Failed to get contractor' });
  }
});

// Create contractor
router.post('/', auth, async (req, res) => {
  try {
    const { name, company, specialty, email, phone, rating, hourlyRate, availability, location, verified } = req.body;

    const contractor = await prisma.contractor.create({
      data: {
        name,
        company,
        specialty,
        email,
        phone,
        rating: rating ? parseFloat(rating) : null,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        availability,
        location,
        verified: verified || false
      }
    });

    res.status(201).json(contractor);
  } catch (error) {
    console.error('Create contractor error:', error);
    res.status(500).json({ error: 'Failed to create contractor' });
  }
});

// Update contractor
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, company, specialty, email, phone, rating, hourlyRate, availability, location, verified } = req.body;

    const contractor = await prisma.contractor.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(company !== undefined && { company }),
        ...(specialty !== undefined && { specialty }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(rating !== undefined && { rating: parseFloat(rating) }),
        ...(hourlyRate !== undefined && { hourlyRate: parseFloat(hourlyRate) }),
        ...(availability !== undefined && { availability }),
        ...(location !== undefined && { location }),
        ...(verified !== undefined && { verified })
      }
    });

    res.json(contractor);
  } catch (error) {
    console.error('Update contractor error:', error);
    res.status(500).json({ error: 'Failed to update contractor' });
  }
});

// Delete contractor
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.contractor.delete({ where: { id: req.params.id } });
    res.json({ message: 'Contractor deleted successfully' });
  } catch (error) {
    console.error('Delete contractor error:', error);
    res.status(500).json({ error: 'Failed to delete contractor' });
  }
});

module.exports = router;
