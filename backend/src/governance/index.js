'use strict';
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { createRouter } = require('./router');
const { evaluate } = require('./domain');

const prisma = new PrismaClient();
function jsonSafe(value) {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, jsonSafe(child)]));
  }
  return value;
}
const db = {
  async query(text, params = []) {
    const rows = await prisma.$queryRawUnsafe(text, ...params);
    const normalized = Array.isArray(rows) ? jsonSafe(rows) : [];
    return { rows: normalized, rowCount: normalized.length };
  }
};

function auth(req, res, next) {
  const secret = process.env.JWT_SECRET || '';
  const token = req.headers.authorization && req.headers.authorization.match(/^Bearer (.+)$/)?.[1];
  if (secret.length < 32) return res.status(503).json({ error: 'secure JWT configuration required' });
  if (!token) return res.status(401).json({ error: 'bearer token required' });
  try { req.user = jwt.verify(token, secret, { algorithms: ['HS256'] }); }
  catch (_) { return res.status(401).json({ error: 'invalid token' }); }
  next();
}

module.exports = createRouter({
  db,
  auth,
  evaluate,
  workflow: 'warehouse-operations',
  providers: ["telemetry","erp","wms","tms","scada","gis","iot-device","weather","maintenance","notification"],
  approverRoles: ["operator","warehouse_reviewer","safety_reviewer","admin"]
});
