require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/floor-plans', require('./routes/floorPlans'));
app.use('/api/floor-plan-rooms', require('./routes/floorPlanRooms'));
app.use('/api/renovation-suggestions', require('./routes/renovationSuggestions'));
app.use('/api/project-estimates', require('./routes/projectEstimates'));
app.use('/api/designs', require('./routes/designs'));
app.use('/api/design-rooms', require('./routes/designRooms'));
app.use('/api/furniture', require('./routes/furniture'));
app.use('/api/palettes', require('./routes/palettes'));
app.use('/api/styles', require('./routes/styles'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/contractors', require('./routes/contractors'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/inspirations', require('./routes/inspirations'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai-design', require('./routes/aiDesign'));
app.use('/api/ar', require('./routes/ar'));
app.use('/api/shopping', require('./routes/shopping'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/export', require('./routes/export'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Floor plan AI results endpoints
app.use('/api/full-analyses', require('./routes/fullAnalyses'));
app.use('/api/room-detections', require('./routes/roomDetections'));
app.use('/api/home-staging', require('./routes/homeStaging'));
app.use('/api/furniture-placements', require('./routes/furniturePlacements'));
app.use('/api/maintenance-predictions', require('./routes/maintenancePredictions'));
app.use('/api/energy-audits', require('./routes/energyAudits'));
app.use('/api/home-inspections', require('./routes/homeInspections'));
app.use('/api/layout-optimizations', require('./routes/layoutOptimizations'));
app.use('/api/room-dimensions', require('./routes/roomDimensions'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
