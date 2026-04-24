const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, optionalAuth, adminOnly } = require('../middleware/auth');

// Helper to fetch image as buffer
async function fetchImageBuffer(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch (err) {
    console.log('Failed to fetch image:', err.message);
  }
  return null;
}

// Export design as PDF
router.get('/design/:id/pdf', auth, async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');

    const design = await prisma.design.findUnique({
      where: { id: req.params.id },
      include: {
        rooms: {
          include: { furniture: true }
        },
        user: { select: { name: true, email: true } }
      }
    });

    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }
    if (design.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `${design.title} - Design Proposal`,
        Author: 'AI Warehouse Manager',
        Subject: 'Design Proposal'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${design.title.replace(/[^a-zA-Z0-9]/g, '_')}_proposal.pdf"`);
    doc.pipe(res);

    const primaryColor = '#2563eb';
    const textColor = '#1f2937';
    const lightGray = '#6b7280';

    // Header
    doc.fontSize(28).fillColor(primaryColor).text('AI Warehouse Manager', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor(lightGray).text('Design Proposal', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(24).fillColor(textColor).text(design.title, { align: 'center' });
    doc.moveDown(1);

    // Design image
    const imageUrl = design.imageUrl;
    if (imageUrl) {
      try {
        const imageBuffer = await fetchImageBuffer(imageUrl);
        if (imageBuffer) {
          const imgWidth = 400;
          const xPos = (doc.page.width - imgWidth) / 2;
          doc.image(imageBuffer, xPos, doc.y, { width: imgWidth });
          doc.y += 220;
        }
      } catch (imgErr) {
        console.log('Could not add image to PDF:', imgErr.message);
      }
    }

    doc.moveDown(1);

    // Details
    doc.fontSize(14).fillColor(primaryColor).text('Design Details');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor(textColor);

    const details = [
      ['Style', design.style || 'Not specified'],
      ['Room Type', design.roomType || 'Not specified'],
      ['Budget', design.budget ? `$${design.budget.toLocaleString()}` : 'Flexible'],
      ['Status', design.status || 'Draft'],
      ['Created', new Date(design.createdAt).toLocaleDateString()]
    ];

    details.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
         .font('Helvetica').text(value);
    });

    doc.moveDown(1.5);

    if (design.description) {
      doc.fontSize(14).fillColor(primaryColor).text('Description');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(textColor).text(design.description);
      doc.moveDown(1.5);
    }

    // Rooms
    if (design.rooms && design.rooms.length > 0) {
      doc.fontSize(14).fillColor(primaryColor).text('Rooms');
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(textColor);

      design.rooms.forEach((room, index) => {
        doc.font('Helvetica-Bold').text(`${index + 1}. ${room.name}`, { continued: true });
        doc.font('Helvetica').text(` (${room.style || 'N/A'})`);
        if (room.width && room.length) {
          doc.fillColor(lightGray).text(`   Dimensions: ${room.width}m x ${room.length}m${room.height ? ` x ${room.height}m` : ''}`);
        }
        doc.fillColor(textColor);
      });
      doc.moveDown(1.5);
    }

    // Furniture (collected from all rooms)
    const allFurniture = design.rooms.flatMap(room => room.furniture || []);
    if (allFurniture.length > 0) {
      if (doc.y > 600) doc.addPage();

      doc.fontSize(14).fillColor(primaryColor).text('Furniture List');
      doc.moveDown(0.5);

      let totalPrice = 0;
      allFurniture.forEach((item, i) => {
        if (doc.y > 730) doc.addPage();
        doc.fontSize(10).fillColor(textColor);
        doc.font('Helvetica-Bold').text(`${i + 1}. ${item.name || 'Unnamed'}`, { continued: true });
        doc.font('Helvetica').text(` - ${item.category || 'N/A'} - ${item.price ? '$' + item.price.toLocaleString() : 'N/A'}`);
        if (item.price) totalPrice += item.price;
      });

      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor)
         .text(`Total Estimated Cost: $${totalPrice.toLocaleString()}`);
      doc.font('Helvetica');
      doc.moveDown(1.5);
    }

    // Footer
    doc.addPage();
    doc.fontSize(10).fillColor(lightGray).text('Generated by AI Warehouse Manager', { align: 'center' });
    doc.moveDown(0.5);
    doc.text(`Prepared for: ${design.user.name || design.user.email}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(9).text('This design proposal is generated by AI and should be reviewed by a professional before implementation.', { align: 'center', width: 400 });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF', message: error.message });
  }
});

// Export shopping list as PDF
router.get('/shopping/:id/pdf', auth, async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');

    const list = await prisma.shoppingList.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' }
        },
        user: { select: { name: true, email: true } }
      }
    });

    if (!list) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }
    if (list.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: { Title: `${list.name} - Shopping List`, Author: 'AI Warehouse Manager' }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${list.name.replace(/[^a-zA-Z0-9]/g, '_')}_shopping_list.pdf"`);
    doc.pipe(res);

    const primaryColor = '#2563eb';
    const textColor = '#1f2937';
    const lightGray = '#6b7280';
    const successColor = '#10b981';

    doc.fontSize(28).fillColor(primaryColor).text('Shopping List', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor(textColor).text(list.name, { align: 'center' });

    doc.moveDown(2);

    const totalItems = list.items.length;
    const purchasedItems = list.items.filter(i => i.purchased).length;
    const totalPrice = list.items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

    doc.fontSize(12).fillColor(textColor);
    doc.text(`Total Items: ${totalItems}   Purchased: ${purchasedItems}/${totalItems}   Total: $${totalPrice.toLocaleString()}`);
    doc.moveDown(1.5);

    // Group by store
    const itemsByStore = {};
    list.items.forEach(item => {
      const store = item.storeName || 'Other';
      if (!itemsByStore[store]) itemsByStore[store] = [];
      itemsByStore[store].push(item);
    });

    Object.entries(itemsByStore).forEach(([store, items]) => {
      if (doc.y > 650) doc.addPage();
      const storeTotal = items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);
      doc.fontSize(14).fillColor(primaryColor).text(`${store} ($${storeTotal.toLocaleString()})`);
      doc.moveDown(0.3);

      items.forEach((item) => {
        if (doc.y > 750) doc.addPage();
        const checkbox = item.purchased ? '[x]' : '[ ]';
        const priceText = item.price ? `$${(item.price * item.quantity).toLocaleString()}` : '';
        const qtyText = item.quantity > 1 ? ` (x${item.quantity})` : '';
        doc.fontSize(10).fillColor(item.purchased ? successColor : textColor)
           .text(`${checkbox} ${item.name}${qtyText}`, 60, doc.y, { continued: true, width: 350 })
           .text(priceText, { align: 'right' });
        if (item.notes) {
          doc.fontSize(8).fillColor(lightGray).text(`    Note: ${item.notes}`, 60);
        }
      });

      doc.moveDown(1);
    });

    doc.moveDown(2);
    doc.fontSize(9).fillColor(lightGray).text(`Generated on ${new Date().toLocaleDateString()} by AI Warehouse Manager`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Export shopping list PDF error:', error);
    res.status(500).json({ error: 'Failed to export PDF', message: error.message });
  }
});

module.exports = router;
