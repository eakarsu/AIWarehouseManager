const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Helper to calculate list total (computed, not stored)
async function getListTotal(listId) {
  const items = await prisma.shoppingListItem.findMany({
    where: { shoppingListId: listId }
  });
  return items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
}

// Get all shopping lists
router.get('/', auth, async (req, res) => {
  try {
    const lists = await prisma.shoppingList.findMany({
      where: { userId: req.user.id },
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const listsWithTotals = lists.map(list => ({
      ...list,
      itemCount: list.items.length,
      purchasedCount: list.items.filter(item => item.purchased).length,
      totalPrice: list.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
    }));

    res.json(listsWithTotals);
  } catch (error) {
    console.error('Get shopping lists error:', error);
    res.status(500).json({ error: 'Failed to get shopping lists' });
  }
});

// Get single shopping list
router.get('/:id', auth, async (req, res) => {
  try {
    const list = await prisma.shoppingList.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }
    if (list.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const summary = {
      itemCount: list.items.length,
      purchasedCount: list.items.filter(i => i.purchased).length,
      totalPrice: list.items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0),
      purchasedTotal: list.items.filter(i => i.purchased).reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0),
      byStore: {}
    };

    list.items.forEach(item => {
      const store = item.storeName || 'Other';
      if (!summary.byStore[store]) {
        summary.byStore[store] = { items: 0, total: 0 };
      }
      summary.byStore[store].items++;
      summary.byStore[store].total += (item.price || 0) * item.quantity;
    });

    res.json({ ...list, summary });
  } catch (error) {
    console.error('Get shopping list error:', error);
    res.status(500).json({ error: 'Failed to get shopping list' });
  }
});

// Create shopping list from design
router.post('/from-design/:designId', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const designId = req.params.designId;

    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: { rooms: { include: { furniture: true } } }
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }
    if (design.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const allFurniture = design.rooms.flatMap(room => room.furniture || []);

    const shoppingList = await prisma.shoppingList.create({
      data: {
        userId: req.user.id,
        designId,
        name: name || `${design.title} Shopping List`,
        items: {
          create: allFurniture.map(f => ({
            name: f.name,
            category: f.category,
            price: f.price,
            quantity: 1,
            storeUrl: f.storeUrl,
            storeName: f.storeName
          }))
        }
      },
      include: {
        items: true
      }
    });

    res.status(201).json(shoppingList);
  } catch (error) {
    console.error('Create shopping list error:', error);
    res.status(500).json({ error: 'Failed to create shopping list' });
  }
});

// Create empty shopping list
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;

    const shoppingList = await prisma.shoppingList.create({
      data: {
        userId: req.user.id,
        name: name || 'My Shopping List'
      },
      include: { items: true }
    });

    res.status(201).json(shoppingList);
  } catch (error) {
    console.error('Create shopping list error:', error);
    res.status(500).json({ error: 'Failed to create shopping list' });
  }
});

// Update shopping list
router.patch('/:id', auth, async (req, res) => {
  try {
    const { name, status } = req.body;

    const list = await prisma.shoppingList.findUnique({ where: { id: req.params.id } });
    if (!list) return res.status(404).json({ error: 'Shopping list not found' });
    if (list.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const updatedList = await prisma.shoppingList.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(status && { status })
      },
      include: { items: true }
    });

    res.json(updatedList);
  } catch (error) {
    console.error('Update shopping list error:', error);
    res.status(500).json({ error: 'Failed to update shopping list' });
  }
});

// Delete shopping list
router.delete('/:id', auth, async (req, res) => {
  try {
    const list = await prisma.shoppingList.findUnique({ where: { id: req.params.id } });
    if (!list) return res.status(404).json({ error: 'Shopping list not found' });
    if (list.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.shoppingList.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete shopping list error:', error);
    res.status(500).json({ error: 'Failed to delete shopping list' });
  }
});

// Add item to list
router.post('/:listId/items', auth, async (req, res) => {
  try {
    const { furnitureId, name, price, quantity, storeUrl, storeName, imageUrl, notes } = req.body;

    const list = await prisma.shoppingList.findUnique({ where: { id: req.params.listId } });
    if (!list) return res.status(404).json({ error: 'Shopping list not found' });
    if (list.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const item = await prisma.shoppingListItem.create({
      data: {
        shoppingListId: req.params.listId,
        furnitureId,
        name,
        price,
        quantity: quantity || 1,
        storeUrl,
        storeName,
        imageUrl,
        notes
      },
      include: { furniture: true }
    });

    await updateListTotal(req.params.listId);

    res.status(201).json(item);
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Update item
router.patch('/items/:itemId', auth, async (req, res) => {
  try {
    const { purchased, quantity, notes, price } = req.body;

    const item = await prisma.shoppingListItem.findUnique({
      where: { id: req.params.itemId },
      include: { shoppingList: true }
    });

    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.shoppingList.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const updatedItem = await prisma.shoppingListItem.update({
      where: { id: req.params.itemId },
      data: {
        ...(purchased !== undefined && { purchased }),
        ...(quantity !== undefined && { quantity }),
        ...(notes !== undefined && { notes }),
        ...(price !== undefined && { price })
      },
      include: { furniture: true }
    });

    await updateListTotal(item.shoppingListId);

    res.json(updatedItem);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
router.delete('/items/:itemId', auth, async (req, res) => {
  try {
    const item = await prisma.shoppingListItem.findUnique({
      where: { id: req.params.itemId },
      include: { shoppingList: true }
    });

    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.shoppingList.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.shoppingListItem.delete({ where: { id: req.params.itemId } });
    await updateListTotal(item.shoppingListId);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
