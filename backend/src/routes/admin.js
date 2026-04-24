const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// List all users (admin only)
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { search, page = 1, limit = 20, sort_by = 'createdAt', sort_order = 'desc' } = req.query;
    const take = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (Math.max(1, parseInt(page)) - 1) * take;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const allowedSortCols = ['id', 'name', 'email', 'role', 'createdAt'];
    const sortCol = allowedSortCols.includes(sort_by) ? sort_by : 'createdAt';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true
        },
        orderBy: { [sortCol]: sort_order.toLowerCase() === 'asc' ? 'asc' : 'desc' },
        take,
        skip
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: users,
      pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) }
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin', 'editor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: user, admin, or editor' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true, emailVerified: true }
    });

    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Admin update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;
