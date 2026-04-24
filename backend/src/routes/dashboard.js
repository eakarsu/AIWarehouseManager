const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get combined dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      floorPlanCount,
      roomCount,
      suggestionCount,
      estimateCount,
      designCount,
      designRoomCount,
      furnitureCount,
      paletteCount,
      shoppingListCount,
      aiAnalysisCount,
      recentFloorPlans,
      recentDesigns,
      activeSubscription
    ] = await Promise.all([
      prisma.floorPlan.count({ where: { userId } }),
      prisma.floorPlanRoom.count({ where: { floorPlan: { userId } } }),
      prisma.renovationSuggestion.count({ where: { floorPlan: { userId } } }),
      prisma.projectEstimate.count({ where: { floorPlan: { userId } } }),
      prisma.design.count({ where: { userId } }),
      prisma.designRoom.count({ where: { design: { userId } } }),
      prisma.furniture.count(),
      prisma.colorPalette.count(),
      prisma.shoppingList.count({ where: { userId } }),
      prisma.aIAnalysis.count({ where: { floorPlan: { userId } } }),
      prisma.floorPlan.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, status: true, createdAt: true }
      }),
      prisma.design.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, style: true, status: true, createdAt: true }
      }),
      prisma.subscription.findFirst({
        where: { userId, status: 'active' },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      stats: {
        floorPlans: {
          total: floorPlanCount,
          rooms: roomCount,
          suggestions: suggestionCount,
          estimates: estimateCount
        },
        interiorDesign: {
          designs: designCount,
          rooms: designRoomCount,
          furniture: furnitureCount,
          palettes: paletteCount
        },
        ai: {
          analyses: aiAnalysisCount
        },
        shopping: {
          lists: shoppingListCount
        }
      },
      recent: {
        floorPlans: recentFloorPlans,
        designs: recentDesigns
      },
      subscription: activeSubscription || {
        plan: 'free',
        status: 'active',
        creditsUsed: 0,
        creditsLimit: 5
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

module.exports = router;
