const express = require('express');
const router = express.Router();

let rows = [
  { id: 1, zone: 'A-pick', bin: 'A-14-03', sku: 'TOTE-BLUE-27', onHand: 8, min: 24, replenishmentQty: 64, status: 'urgent' },
  { id: 2, zone: 'B-bulk', bin: 'B-02-11', sku: 'LABEL-THERMAL', onHand: 18, min: 20, replenishmentQty: 40, status: 'watch' },
  { id: 3, zone: 'C-pick', bin: 'C-09-08', sku: 'WRAP-500', onHand: 44, min: 36, replenishmentQty: 0, status: 'clear' }
];

router.get('/', (req, res) => {
  const summary = rows.reduce((acc, r) => {
    acc.total += 1;
    acc.urgent += r.status === 'urgent' ? 1 : 0;
    acc.replenishmentQty += Number(r.replenishmentQty || 0);
    return acc;
  }, { total: 0, urgent: 0, replenishmentQty: 0 });
  res.json({ rows, summary });
});

router.post('/', (req, res) => {
  const item = {
    id: Date.now(),
    zone: req.body.zone || 'unassigned',
    bin: req.body.bin || 'bin-pending',
    sku: req.body.sku || 'sku-pending',
    onHand: Number(req.body.onHand || 0),
    min: Number(req.body.min || 0),
    replenishmentQty: Number(req.body.replenishmentQty || 0),
    status: req.body.status || 'watch'
  };
  rows = [item, ...rows];
  res.status(201).json(item);
});

module.exports = router;
