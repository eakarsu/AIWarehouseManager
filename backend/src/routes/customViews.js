// customViews.js — bespoke warehouse-management endpoints
// Synthesizes data deterministically so it works without the warehouse schema.
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

// Deterministic pseudo-random based on seed string
function seeded(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// GET /api/custom-views/floor-heatmap
// Returns SVG-friendly grid of warehouse aisles/bins with fill % and pick frequency.
router.get('/floor-heatmap', (req, res) => {
  const aisles = ['A', 'B', 'C', 'D', 'E', 'F'];
  const binsPerAisle = 12;
  const rnd = seeded('warehouse-floor-v1');
  const cells = [];
  for (let r = 0; r < aisles.length; r++) {
    for (let c = 0; c < binsPerAisle; c++) {
      const fillPct = Math.round(rnd() * 100);
      const pickFreq = Math.round(rnd() * 250);
      cells.push({
        id: `${aisles[r]}-${String(c + 1).padStart(2, '0')}`,
        aisle: aisles[r],
        bin: c + 1,
        row: r,
        col: c,
        fillPct,
        pickFreq,
        sku: `SKU-${aisles[r]}${1000 + c}`,
        category: ['Electronics', 'Apparel', 'Grocery', 'Hardware', 'Pharma'][Math.floor(rnd() * 5)],
      });
    }
  }
  res.json({
    rows: aisles.length,
    cols: binsPerAisle,
    aisles,
    cells,
    legend: {
      fill: [
        { label: 'Empty', range: [0, 25], color: '#dbeafe' },
        { label: 'Low', range: [25, 50], color: '#93c5fd' },
        { label: 'Medium', range: [50, 75], color: '#3b82f6' },
        { label: 'High', range: [75, 100], color: '#1d4ed8' },
      ],
    },
    generatedAt: new Date().toISOString(),
  });
});

// GET /api/custom-views/inventory-turnover
// Returns multi-line turnover per SKU category over 12 months.
router.get('/inventory-turnover', (req, res) => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const categories = ['Electronics', 'Apparel', 'Grocery', 'Hardware', 'Pharma'];
  const rnd = seeded('turnover-v1');

  // Per-category baseline turnover ratios (annualized, then we vary per month)
  const baselines = {
    Electronics: 6,
    Apparel: 4,
    Grocery: 14,
    Hardware: 3,
    Pharma: 8,
  };

  const series = months.map((m, idx) => {
    const row = { month: m };
    categories.forEach((cat) => {
      // Seasonal wave + jitter
      const seasonal = 1 + 0.35 * Math.sin((idx / 12) * 2 * Math.PI + categories.indexOf(cat));
      const jitter = 0.85 + rnd() * 0.3;
      row[cat] = +(baselines[cat] * seasonal * jitter).toFixed(2);
    });
    return row;
  });

  res.json({
    categories,
    series,
    unit: 'turns/year (rolling)',
    generatedAt: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// POST /api/custom-views/pick-list
// Generates a PDF pick list for an order. Items grouped by aisle.
// Body: { orderNumber, picker, items? }
//   items: [{ sku, qty, description?, bin? }]  (optional — falls back to seeded sample order)
// Returns: application/pdf stream
// ---------------------------------------------------------------------------
router.post('/pick-list', (req, res) => {
  const { orderNumber, picker, items } = req.body || {};
  const orderNo = String(orderNumber || `ORD-${Date.now().toString().slice(-6)}`);
  const pickerName = String(picker || 'Unassigned');

  // If no items given, synthesize a deterministic sample so the endpoint always works.
  const aisles = ['A', 'B', 'C', 'D', 'E', 'F'];
  let lineItems = Array.isArray(items) && items.length > 0 ? items : null;
  if (!lineItems) {
    const rnd = seeded(`picklist-${orderNo}`);
    const count = 6 + Math.floor(rnd() * 6); // 6-11 lines
    lineItems = Array.from({ length: count }, (_, i) => {
      const aisle = aisles[Math.floor(rnd() * aisles.length)];
      const binNum = 1 + Math.floor(rnd() * 12);
      return {
        sku: `SKU-${aisle}${1000 + binNum}`,
        description: ['Widget', 'Gadget', 'Bracket', 'Cable', 'Module', 'Panel'][i % 6] + ` ${i + 1}`,
        qty: 1 + Math.floor(rnd() * 8),
        bin: `${aisle}-${String(binNum).padStart(2, '0')}`,
      };
    });
  } else {
    // Normalize incoming items; derive bin/aisle from SKU when missing.
    lineItems = lineItems.map((it, i) => {
      const sku = String(it.sku || `SKU-${i}`);
      let bin = it.bin;
      if (!bin) {
        const m = sku.match(/^SKU-([A-F])(\d{3,})/);
        if (m) bin = `${m[1]}-${String(parseInt(m[2], 10) - 1000).padStart(2, '0')}`;
        else bin = 'UNASSIGNED';
      }
      return {
        sku,
        description: String(it.description || ''),
        qty: Number(it.qty) || 1,
        bin,
      };
    });
  }

  // Group by aisle (first char of bin).
  const groups = {};
  lineItems.forEach((it) => {
    const aisle = (it.bin || 'U').split('-')[0] || 'U';
    if (!groups[aisle]) groups[aisle] = [];
    groups[aisle].push(it);
  });
  Object.keys(groups).forEach((a) => {
    groups[a].sort((x, y) => String(x.bin).localeCompare(String(y.bin)));
  });
  const sortedAisles = Object.keys(groups).sort();
  const totalQty = lineItems.reduce((s, it) => s + (Number(it.qty) || 0), 0);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="pick-list-${orderNo}.pdf"`
  );

  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
  doc.pipe(res);

  // Header
  doc.fontSize(20).fillColor('#111827').text('Warehouse Pick List', { align: 'left' });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#6b7280')
    .text(`Generated: ${new Date().toISOString()}`);
  doc.moveDown(0.8);

  doc.fontSize(12).fillColor('#111827');
  doc.text(`Order #: ${orderNo}`);
  doc.text(`Picker:  ${pickerName}`);
  doc.text(`Lines:   ${lineItems.length}    Total Qty: ${totalQty}`);
  doc.moveDown(0.8);

  // Per-aisle sections
  sortedAisles.forEach((aisle) => {
    doc.moveDown(0.4);
    doc.fontSize(13).fillColor('#1d4ed8').text(`Aisle ${aisle}`, { underline: true });
    doc.moveDown(0.2);

    // Table header
    const cols = { bin: 60, sku: 160, desc: 320, qty: 480 };
    const startY = doc.y;
    doc.fontSize(10).fillColor('#374151');
    doc.text('Bin', cols.bin, startY);
    doc.text('SKU', cols.sku, startY);
    doc.text('Description', cols.desc, startY);
    doc.text('Qty', cols.qty, startY, { width: 40, align: 'right' });
    doc.moveTo(50, startY + 14).lineTo(545, startY + 14).strokeColor('#d1d5db').stroke();
    doc.y = startY + 18;

    groups[aisle].forEach((it) => {
      const rowY = doc.y;
      if (rowY > 720) {
        doc.addPage();
      }
      const y = doc.y;
      doc.fillColor('#111827').fontSize(10);
      doc.text(String(it.bin), cols.bin, y);
      doc.text(String(it.sku), cols.sku, y);
      doc.text(String(it.description || ''), cols.desc, y, { width: 150 });
      doc.text(String(it.qty), cols.qty, y, { width: 40, align: 'right' });
      // Pick checkbox
      doc.rect(525, y + 1, 10, 10).strokeColor('#9ca3af').stroke();
      doc.y = y + 16;
    });
  });

  doc.moveDown(1.2);
  doc.fontSize(9).fillColor('#6b7280')
    .text('Signature: ______________________________    Date: ____________', 50, doc.y);

  doc.end();
});

// ---------------------------------------------------------------------------
// POST /api/custom-views/inventory-adjust
// Applies bulk inventory adjustments. Returns { applied, errors }.
// Body: { location, rows: [{ sku, delta, note? }] }
// (Deterministic stub — no DB schema for warehouse inventory.)
// ---------------------------------------------------------------------------
router.post('/inventory-adjust', (req, res) => {
  const body = req.body || {};
  const location = String(body.location || '').trim();
  const rows = Array.isArray(body.rows) ? body.rows : [];

  const errors = [];
  if (!location) {
    errors.push({ row: -1, message: 'location is required' });
  }
  if (rows.length === 0) {
    errors.push({ row: -1, message: 'rows is empty' });
  }

  let applied = 0;
  const appliedRows = [];
  rows.forEach((r, idx) => {
    const sku = (r && r.sku ? String(r.sku) : '').trim();
    const deltaRaw = r ? r.delta : undefined;
    const delta = Number(deltaRaw);
    if (!sku) {
      errors.push({ row: idx, sku: sku || null, message: 'sku missing' });
      return;
    }
    if (!Number.isFinite(delta)) {
      errors.push({ row: idx, sku, message: `invalid delta "${deltaRaw}"` });
      return;
    }
    if (!/^SKU-[A-Z0-9-]+$/i.test(sku)) {
      errors.push({ row: idx, sku, message: 'sku format invalid (expected SKU-...)' });
      return;
    }
    applied += 1;
    appliedRows.push({
      sku,
      delta,
      note: r.note ? String(r.note) : '',
      location,
    });
  });

  res.json({
    applied,
    errors,
    location,
    appliedRows,
    summary: {
      totalRows: rows.length,
      netUnits: appliedRows.reduce((s, r) => s + r.delta, 0),
    },
    appliedAt: new Date().toISOString(),
  });
});

module.exports = router;
