const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Get subscription plans
router.get('/plans', async (req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      designsPerMonth: 5,
      features: [
        'Basic AI analysis',
        '5 designs per month',
        'Standard floor plan analysis',
        'Community support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19.99,
      designsPerMonth: 50,
      features: [
        'Advanced AI analysis & design',
        '50 designs per month',
        'Custom color palettes',
        'AR visualization',
        'Priority support',
        'PDF export'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 49.99,
      designsPerMonth: -1,
      features: [
        'Unlimited AI generations',
        'Unlimited designs & analyses',
        'Team collaboration',
        'Custom AI training',
        'API access',
        'Dedicated support',
        'White-label options'
      ]
    }
  ];

  res.json(plans);
});

// Get current subscription
router.get('/current', auth, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.id, status: 'active' },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return res.json({
        plan: 'free',
        status: 'active',
        creditsUsed: 0,
        creditsLimit: 5
      });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Subscribe to a plan
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { plan, paymentMethod } = req.body;

    const planDetails = {
      free: { creditsUsed: 0, creditsLimit: 5 },
      pro: { creditsUsed: 0, creditsLimit: 50 },
      enterprise: { creditsUsed: 0, creditsLimit: -1 }
    };

    if (!planDetails[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: req.user.id },
      update: {
        plan,
        status: 'active',
        creditsUsed: planDetails[plan].creditsUsed,
        creditsLimit: planDetails[plan].creditsLimit,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      create: {
        userId: req.user.id,
        plan,
        status: 'active',
        creditsUsed: planDetails[plan].creditsUsed,
        creditsLimit: planDetails[plan].creditsLimit,
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.id, status: 'active' }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription' });
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled' }
    });

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Use a design credit
router.post('/use-credit', auth, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.id, status: 'active' }
    });

    if (!subscription) {
      return res.status(403).json({ error: 'No active subscription' });
    }

    if (subscription.creditsLimit > 0 && subscription.creditsUsed >= subscription.creditsLimit) {
      return res.status(403).json({ error: 'No design credits left' });
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { creditsUsed: { increment: 1 } }
    });

    const creditsRemaining = subscription.creditsLimit < 0 ? -1 : subscription.creditsLimit - subscription.creditsUsed - 1;
    res.json({ success: true, creditsUsed: subscription.creditsUsed + 1, creditsLimit: subscription.creditsLimit, creditsRemaining });
  } catch (error) {
    console.error('Use credit error:', error);
    res.status(500).json({ error: 'Failed to use credit' });
  }
});

// Subscription history
router.get('/history', auth, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(subscriptions);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get subscription history' });
  }
});

module.exports = router;
