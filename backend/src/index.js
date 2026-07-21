'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { auth } = require('./middleware/auth');
const governanceRouter = require('./governance');

for (const name of ['DATABASE_URL', 'GOVERNANCE_TENANT_ID']) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5000;
const generatedRoutesEnabled = process.env.ENABLE_GENERATED_FEATURES === 'true' && process.env.NODE_ENV !== 'production';

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/auth/register', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

app.use('/api/auth', require('./routes/auth'));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', generatedRoutesEnabled, timestamp: new Date().toISOString() });
});

app.use('/api', auth);
app.use('/api/governance', governanceRouter);

const legacyRoutes = [
  ['/api/floor-plans', './routes/floorPlans'], ['/api/floor-plan-rooms', './routes/floorPlanRooms'],
  ['/api/renovation-suggestions', './routes/renovationSuggestions'], ['/api/project-estimates', './routes/projectEstimates'],
  ['/api/designs', './routes/designs'], ['/api/design-rooms', './routes/designRooms'],
  ['/api/furniture', './routes/furniture'], ['/api/palettes', './routes/palettes'],
  ['/api/styles', './routes/styles'], ['/api/materials', './routes/materials'],
  ['/api/contractors', './routes/contractors'], ['/api/templates', './routes/templates'],
  ['/api/inspirations', './routes/inspirations'], ['/api/shopping', './routes/shopping'],
  ['/api/subscriptions', './routes/subscriptions'], ['/api/export', './routes/export'],
  ['/api/admin', './routes/admin'], ['/api/dashboard', './routes/dashboard'],
  ['/api/custom', './routes/customFeatures'], ['/api/custom-views', './routes/customViews'],
  ['/api/bin-replenishment-queue', './routes/binReplenishmentQueue']
];
legacyRoutes.forEach(([mount, modulePath]) => app.use(mount, require(modulePath)));

if (generatedRoutesEnabled) {
  const generatedRoutes = [
    ['/api/ai', './routes/ai'], ['/api/ai-design', './routes/aiDesign'], ['/api/ar', './routes/ar'],
    ['/api/full-analyses', './routes/fullAnalyses'], ['/api/room-detections', './routes/roomDetections'],
    ['/api/home-staging', './routes/homeStaging'], ['/api/furniture-placements', './routes/furniturePlacements'],
    ['/api/maintenance-predictions', './routes/maintenancePredictions'], ['/api/energy-audits', './routes/energyAudits'],
    ['/api/home-inspections', './routes/homeInspections'], ['/api/layout-optimizations', './routes/layoutOptimizations'],
    ['/api/room-dimensions', './routes/roomDimensions']
  ];
  generatedRoutes.forEach(([mount, modulePath]) => app.use(mount, require(modulePath)));
}

app.use((req, res) => res.status(404).json({ error: 'not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled request error:', err.message);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
