require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================================
  // Clear existing data (order matters due to foreign keys)
  // ============================================================
  console.log('Clearing existing data...');
  await prisma.shoppingListItem.deleteMany();
  await prisma.shoppingList.deleteMany();
  await prisma.aIGeneration.deleteMany();
  await prisma.aRSession.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.furniture.deleteMany();
  await prisma.designRoom.deleteMany();
  await prisma.design.deleteMany();
  await prisma.colorPalette.deleteMany();
  await prisma.stylePreset.deleteMany();
  await prisma.homeStaging.deleteMany();
  await prisma.furniturePlacement.deleteMany();
  await prisma.roomDimension.deleteMany();
  await prisma.renovationSuggestion.deleteMany();
  await prisma.projectEstimate.deleteMany();
  await prisma.fullAnalysis.deleteMany();
  await prisma.roomDetection.deleteMany();
  await prisma.maintenancePrediction.deleteMany();
  await prisma.energyAudit.deleteMany();
  await prisma.homeInspection.deleteMany();
  await prisma.layoutOptimization.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.floorPlanRoom.deleteMany();
  await prisma.floorPlan.deleteMany();
  await prisma.material.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.designTemplate.deleteMany();
  await prisma.inspiration.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
  console.log('Existing data cleared.\n');

  // ============================================================
  // 1. Users (3)
  // ============================================================
  console.log('Seeding users...');
  const adminPassword = await bcrypt.hash('Admin123!@#', 10);
  const editorPassword = await bcrypt.hash('Editor123!@#', 10);
  const demoPassword = await bcrypt.hash('Demo123!@#', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      emailVerified: true,
    },
  });

  const editorUser = await prisma.user.create({
    data: {
      email: 'editor@example.com',
      password: editorPassword,
      name: 'Editor User',
      role: 'editor',
      emailVerified: true,
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      password: demoPassword,
      name: 'Demo User',
      role: 'user',
      emailVerified: true,
    },
  });

  const allUsers = [adminUser, editorUser, demoUser];
  console.log(`  Created ${allUsers.length} users`);

  // ============================================================
  // 2. Floor Plans (5)
  // ============================================================
  console.log('Seeding floor plans...');
  const floorPlansData = [
    { userId: adminUser.id, name: 'Modern Villa Blueprint', description: 'Spacious 3-bedroom villa with open floor plan', totalArea: 2800.0, status: 'analyzed' },
    { userId: adminUser.id, name: 'Downtown Apartment', description: 'Compact 2-bedroom city apartment', totalArea: 1200.0, status: 'analyzed' },
    { userId: editorUser.id, name: 'Suburban Family Home', description: '4-bedroom family home with backyard', totalArea: 3500.0, status: 'analyzed' },
    { userId: demoUser.id, name: 'Studio Loft', description: 'Open-concept studio loft in converted warehouse', totalArea: 850.0, status: 'pending' },
    { userId: demoUser.id, name: 'Beach House', description: 'Coastal 3-bedroom home with ocean views', totalArea: 2200.0, status: 'in_progress' },
  ];

  const floorPlans = [];
  for (const fp of floorPlansData) {
    const created = await prisma.floorPlan.create({ data: fp });
    floorPlans.push(created);
  }
  console.log(`  Created ${floorPlans.length} floor plans`);

  // ============================================================
  // 3. Rooms (10) - distributed across floor plans
  // ============================================================
  console.log('Seeding rooms...');
  const roomsData = [
    // Villa (3 rooms)
    { floorPlanId: floorPlans[0].id, name: 'Master Bedroom', roomType: 'bedroom', width: 18, length: 20, height: 10, area: 360, positionX: 0, positionY: 0 },
    { floorPlanId: floorPlans[0].id, name: 'Living Room', roomType: 'living_room', width: 25, length: 30, height: 10, area: 750, positionX: 18, positionY: 0 },
    { floorPlanId: floorPlans[0].id, name: 'Kitchen', roomType: 'kitchen', width: 15, length: 20, height: 10, area: 300, positionX: 18, positionY: 30 },
    // Apartment (2 rooms)
    { floorPlanId: floorPlans[1].id, name: 'Bedroom', roomType: 'bedroom', width: 12, length: 14, height: 9, area: 168, positionX: 0, positionY: 0 },
    { floorPlanId: floorPlans[1].id, name: 'Open Living Area', roomType: 'living_room', width: 20, length: 18, height: 9, area: 360, positionX: 12, positionY: 0 },
    // Family Home (3 rooms)
    { floorPlanId: floorPlans[2].id, name: 'Family Room', roomType: 'living_room', width: 22, length: 24, height: 10, area: 528, positionX: 0, positionY: 0 },
    { floorPlanId: floorPlans[2].id, name: 'Home Office', roomType: 'office', width: 12, length: 12, height: 10, area: 144, positionX: 22, positionY: 0 },
    { floorPlanId: floorPlans[2].id, name: 'Guest Bathroom', roomType: 'bathroom', width: 8, length: 10, height: 10, area: 80, positionX: 22, positionY: 12 },
    // Studio Loft (1 room)
    { floorPlanId: floorPlans[3].id, name: 'Open Loft Space', roomType: 'studio', width: 30, length: 28, height: 14, area: 840, positionX: 0, positionY: 0 },
    // Beach House (1 room)
    { floorPlanId: floorPlans[4].id, name: 'Sunroom', roomType: 'sunroom', width: 16, length: 18, height: 10, area: 288, positionX: 0, positionY: 0 },
  ];

  const rooms = [];
  for (const room of roomsData) {
    const created = await prisma.floorPlanRoom.create({ data: room });
    rooms.push(created);
  }
  console.log(`  Created ${rooms.length} rooms`);

  // ============================================================
  // 4. Renovation Suggestions (5)
  // ============================================================
  console.log('Seeding renovation suggestions...');
  const renovationsData = [
    { floorPlanId: floorPlans[0].id, roomId: rooms[1].id, title: 'Install Skylight', description: 'Add a large skylight to bring natural light into the living room.', category: 'lighting', priority: 'high', estimatedCost: 4500, difficulty: 'medium', timeline: '2-3 weeks', status: 'pending' },
    { floorPlanId: floorPlans[0].id, roomId: rooms[2].id, title: 'Kitchen Island Addition', description: 'Install a granite-top kitchen island with built-in storage.', category: 'remodel', priority: 'medium', estimatedCost: 8000, difficulty: 'hard', timeline: '3-4 weeks', status: 'approved' },
    { floorPlanId: floorPlans[1].id, roomId: rooms[3].id, title: 'Walk-in Closet Conversion', description: 'Convert existing closet into a walk-in wardrobe with custom shelving.', category: 'storage', priority: 'low', estimatedCost: 3200, difficulty: 'easy', timeline: '1 week', status: 'pending' },
    { floorPlanId: floorPlans[2].id, roomId: rooms[5].id, title: 'Hardwood Floor Refinish', description: 'Sand and refinish existing hardwood floors in the family room.', category: 'flooring', priority: 'medium', estimatedCost: 2800, difficulty: 'medium', timeline: '3-5 days', status: 'in_progress' },
    { floorPlanId: floorPlans[4].id, roomId: rooms[9].id, title: 'Impact Window Upgrade', description: 'Replace existing windows with hurricane-rated impact glass.', category: 'windows', priority: 'high', estimatedCost: 12000, difficulty: 'hard', timeline: '1-2 weeks', status: 'pending' },
  ];

  for (const r of renovationsData) {
    await prisma.renovationSuggestion.create({ data: r });
  }
  console.log('  Created 5 renovation suggestions');

  // ============================================================
  // 5. Project Estimates (3)
  // ============================================================
  console.log('Seeding project estimates...');
  const estimatesData = [
    { floorPlanId: floorPlans[0].id, laborCost: 15000, materialCost: 12500, totalCost: 27500, timelineDays: 45, status: 'approved', notes: 'Full villa renovation including kitchen and living room upgrades.' },
    { floorPlanId: floorPlans[1].id, laborCost: 5000, materialCost: 3200, totalCost: 8200, timelineDays: 14, status: 'draft', notes: 'Apartment bedroom and closet conversion project.' },
    { floorPlanId: floorPlans[2].id, laborCost: 8500, materialCost: 6800, totalCost: 15300, timelineDays: 30, status: 'pending', notes: 'Family home flooring and office renovation.' },
  ];

  for (const e of estimatesData) {
    await prisma.projectEstimate.create({ data: e });
  }
  console.log('  Created 3 project estimates');

  // ============================================================
  // 6. Designs (5) - interior design projects
  // ============================================================
  console.log('Seeding designs...');
  const designsData = [
    { userId: adminUser.id, title: 'Modern Minimalist Living', description: 'Clean lines and neutral tones for a contemporary living space.', style: 'modern', roomType: 'living_room', status: 'completed', budget: 15000 },
    { userId: adminUser.id, title: 'Cozy Scandinavian Bedroom', description: 'Warm woods, soft textiles, and hygge-inspired decor.', style: 'scandinavian', roomType: 'bedroom', status: 'completed', budget: 8000 },
    { userId: editorUser.id, title: 'Industrial Home Office', description: 'Exposed brick, metal accents, and functional workspace.', style: 'industrial', roomType: 'office', status: 'in_progress', budget: 6500 },
    { userId: demoUser.id, title: 'Bohemian Studio Retreat', description: 'Eclectic patterns, plants, and global-inspired textiles.', style: 'bohemian', roomType: 'studio', status: 'draft', budget: 4000 },
    { userId: demoUser.id, title: 'Coastal Kitchen Refresh', description: 'Light blues, natural textures, and beachy vibes for the kitchen.', style: 'coastal', roomType: 'kitchen', status: 'draft', budget: 10000 },
  ];

  const designs = [];
  for (const d of designsData) {
    const created = await prisma.design.create({ data: d });
    designs.push(created);
  }
  console.log(`  Created ${designs.length} designs`);

  // ============================================================
  // 7. Design Rooms (5)
  // ============================================================
  console.log('Seeding design rooms...');
  const designRoomsData = [
    { designId: designs[0].id, name: 'Main Living Area', width: 25, length: 30, height: 10, style: 'modern', notes: 'Open concept with floor-to-ceiling windows.' },
    { designId: designs[1].id, name: 'Master Suite', width: 18, length: 20, height: 9, style: 'scandinavian', notes: 'South-facing with warm morning light.' },
    { designId: designs[2].id, name: 'Office Den', width: 14, length: 12, height: 10, style: 'industrial', notes: 'Converted garage space with concrete floors.' },
    { designId: designs[3].id, name: 'Studio Main Floor', width: 28, length: 30, height: 14, style: 'bohemian', notes: 'Double-height ceilings, exposed beams.' },
    { designId: designs[4].id, name: 'Open Kitchen', width: 16, length: 20, height: 9, style: 'coastal', notes: 'Flows into dining nook with ocean view.' },
  ];

  const designRooms = [];
  for (const dr of designRoomsData) {
    const created = await prisma.designRoom.create({ data: dr });
    designRooms.push(created);
  }
  console.log(`  Created ${designRooms.length} design rooms`);

  // ============================================================
  // 8. Furniture (10) - across categories
  // ============================================================
  console.log('Seeding furniture...');
  const furnitureData = [
    { name: 'Velvet Sectional Sofa', category: 'sofa', style: 'modern', description: 'L-shaped sectional in deep navy velvet.', price: 2800, dimensions: { width: 110, depth: 85, height: 34 }, roomId: designRooms[0].id },
    { name: 'Eames Lounge Chair', category: 'chair', style: 'mid-century', description: 'Classic walnut and black leather lounge chair with ottoman.', price: 1200, dimensions: { width: 33, depth: 33, height: 32 }, roomId: designRooms[0].id },
    { name: 'Marble Dining Table', category: 'table', style: 'modern', description: 'Carrara marble top with brushed brass legs.', price: 3500, dimensions: { width: 72, depth: 36, height: 30 }, roomId: designRooms[0].id },
    { name: 'Platform Bed Frame', category: 'bed', style: 'scandinavian', description: 'Low-profile oak platform bed, king size.', price: 1800, dimensions: { width: 80, depth: 84, height: 14 }, roomId: designRooms[1].id },
    { name: 'Standing Desk', category: 'desk', style: 'industrial', description: 'Electric sit-stand desk with walnut top and matte black frame.', price: 950, dimensions: { width: 60, depth: 30, height: 48 }, roomId: designRooms[2].id },
    { name: 'Arc Floor Lamp', category: 'lamp', style: 'modern', description: 'Brushed nickel arc lamp with linen drum shade.', price: 380, dimensions: { width: 14, depth: 40, height: 77 }, roomId: designRooms[0].id },
    { name: 'Industrial Bookshelf', category: 'bookshelf', style: 'industrial', description: '5-tier iron and reclaimed wood bookshelf.', price: 650, dimensions: { width: 36, depth: 14, height: 72 }, roomId: designRooms[2].id },
    { name: 'Rattan Accent Chair', category: 'chair', style: 'bohemian', description: 'Handwoven rattan peacock chair with cushion.', price: 420, dimensions: { width: 30, depth: 28, height: 56 }, roomId: designRooms[3].id },
    { name: 'Ceramic Table Lamp', category: 'lamp', style: 'coastal', description: 'Blue-glazed ceramic base with white linen shade.', price: 165, dimensions: { width: 12, depth: 12, height: 24 }, roomId: designRooms[4].id },
    { name: 'Teak Console Table', category: 'table', style: 'scandinavian', description: 'Slim teak console table for entryways.', price: 580, dimensions: { width: 48, depth: 14, height: 30 }, roomId: designRooms[1].id },
  ];

  for (const f of furnitureData) {
    await prisma.furniture.create({ data: f });
  }
  console.log('  Created 10 furniture items');

  // ============================================================
  // 9. Color Palettes (5) with hex color arrays
  // ============================================================
  console.log('Seeding color palettes...');
  const palettesData = [
    { name: 'Midnight Modern', colors: [{ hex: '#1A1A2E', name: 'Deep Navy' }, { hex: '#16213E', name: 'Dark Blue' }, { hex: '#0F3460', name: 'Royal Blue' }, { hex: '#E94560', name: 'Coral Red' }, { hex: '#F5F5F5', name: 'Off White' }], style: 'modern', mood: 'sophisticated' },
    { name: 'Nordic Calm', colors: [{ hex: '#F7F7F2', name: 'Warm White' }, { hex: '#E8DED2', name: 'Oat' }, { hex: '#A3B18A', name: 'Sage Green' }, { hex: '#588157', name: 'Forest' }, { hex: '#344E41', name: 'Deep Pine' }], style: 'scandinavian', mood: 'serene' },
    { name: 'Urban Edge', colors: [{ hex: '#2D2D2D', name: 'Charcoal' }, { hex: '#4A4A4A', name: 'Graphite' }, { hex: '#B85C38', name: 'Rust' }, { hex: '#E0C097', name: 'Sand' }, { hex: '#FCF8E8', name: 'Cream' }], style: 'industrial', mood: 'bold' },
    { name: 'Desert Boho', colors: [{ hex: '#D4A373', name: 'Terracotta' }, { hex: '#FAEDCD', name: 'Parchment' }, { hex: '#CCD5AE', name: 'Olive' }, { hex: '#E9EDC9', name: 'Pale Sage' }, { hex: '#FEFAE0', name: 'Ivory' }], style: 'bohemian', mood: 'warm' },
    { name: 'Ocean Breeze', colors: [{ hex: '#CAF0F8', name: 'Pale Aqua' }, { hex: '#90E0EF', name: 'Sky Blue' }, { hex: '#00B4D8', name: 'Cerulean' }, { hex: '#0077B6', name: 'Ocean' }, { hex: '#023E8A', name: 'Deep Sea' }], style: 'coastal', mood: 'refreshing' },
  ];

  for (const p of palettesData) {
    await prisma.colorPalette.create({ data: p });
  }
  console.log('  Created 5 color palettes');

  // ============================================================
  // 10. Style Presets (5)
  // ============================================================
  console.log('Seeding style presets...');
  const stylePresetsData = [
    { name: 'Modern', style: 'modern', description: 'Clean lines, neutral colors, and minimal ornamentation. Focuses on function and simplicity.', roomType: 'living_room', features: ['open-plan', 'large-windows', 'built-in-storage', 'statement-lighting'], colorPalette: { primary: '#1A1A2E', secondary: '#F5F5F5', accent: '#E94560' }, popularity: 95 },
    { name: 'Minimalist', style: 'minimalist', description: 'Less is more. Uncluttered spaces with essential furnishings and a restrained palette.', roomType: 'bedroom', features: ['hidden-storage', 'monochrome', 'natural-materials', 'clean-surfaces'], colorPalette: { primary: '#FFFFFF', secondary: '#F0F0F0', accent: '#000000' }, popularity: 88 },
    { name: 'Industrial', style: 'industrial', description: 'Raw, unfinished elements. Exposed brick, metal, and reclaimed materials.', roomType: 'office', features: ['exposed-brick', 'metal-fixtures', 'concrete-floors', 'open-ductwork'], colorPalette: { primary: '#2D2D2D', secondary: '#B85C38', accent: '#E0C097' }, popularity: 76 },
    { name: 'Scandinavian', style: 'scandinavian', description: 'Warm minimalism with natural materials, cozy textiles, and plenty of light.', roomType: 'bedroom', features: ['natural-wood', 'cozy-textiles', 'plants', 'ambient-lighting'], colorPalette: { primary: '#F7F7F2', secondary: '#A3B18A', accent: '#588157' }, popularity: 82 },
    { name: 'Bohemian', style: 'bohemian', description: 'Eclectic, layered, and full of personality. Mix of patterns, textures, and global influences.', roomType: 'studio', features: ['layered-textiles', 'vintage-pieces', 'indoor-plants', 'macrame'], colorPalette: { primary: '#D4A373', secondary: '#CCD5AE', accent: '#FAEDCD' }, popularity: 70 },
  ];

  for (const sp of stylePresetsData) {
    await prisma.stylePreset.create({ data: sp });
  }
  console.log('  Created 5 style presets');

  // ============================================================
  // 11. Materials (10)
  // ============================================================
  console.log('Seeding materials...');
  const materialsData = [
    { name: 'White Oak Hardwood', category: 'wood', description: 'Premium white oak planks for flooring and furniture.', unitPrice: 12.50, unit: 'sq ft', supplier: 'Lumber Depot', inStock: true, color: '#C4A882' },
    { name: 'Carrara Marble', category: 'marble', description: 'Italian Carrara marble slabs for countertops.', unitPrice: 75.00, unit: 'sq ft', supplier: 'Stone World', inStock: true, color: '#F0EDE8' },
    { name: 'Absolute Black Granite', category: 'granite', description: 'Polished black granite for kitchen surfaces.', unitPrice: 55.00, unit: 'sq ft', supplier: 'Stone World', inStock: true, color: '#1A1A1A' },
    { name: 'Subway Ceramic Tile', category: 'ceramic', description: 'Classic 3x6 white subway tiles for backsplash.', unitPrice: 4.50, unit: 'sq ft', supplier: 'Tile Warehouse', inStock: true, color: '#FFFFFF' },
    { name: 'Tempered Glass Panel', category: 'glass', description: 'Clear tempered glass panels for partitions and shelving.', unitPrice: 28.00, unit: 'sq ft', supplier: 'GlassCo', inStock: true, color: '#E8F4F8' },
    { name: 'Brushed Steel Sheet', category: 'steel', description: 'Brushed stainless steel sheets for fixtures and accents.', unitPrice: 35.00, unit: 'sq ft', supplier: 'MetalCraft', inStock: true, color: '#C0C0C0' },
    { name: 'Belgian Linen Fabric', category: 'fabric', description: 'Natural Belgian linen for upholstery and drapery.', unitPrice: 45.00, unit: 'yard', supplier: 'Textile House', inStock: true, color: '#E8DED2' },
    { name: 'Full-Grain Leather', category: 'leather', description: 'Italian full-grain leather for premium upholstery.', unitPrice: 85.00, unit: 'sq ft', supplier: 'LeatherWorks', inStock: false, color: '#8B4513' },
    { name: 'Polished Concrete Mix', category: 'concrete', description: 'High-performance concrete mix for floors and countertops.', unitPrice: 8.00, unit: 'sq ft', supplier: 'BuildRight', inStock: true, color: '#A9A9A9' },
    { name: 'Moso Bamboo Plank', category: 'bamboo', description: 'Sustainable strand-woven bamboo for flooring.', unitPrice: 6.50, unit: 'sq ft', supplier: 'GreenBuild', inStock: true, color: '#D4B896' },
  ];

  for (const m of materialsData) {
    await prisma.material.create({ data: m });
  }
  console.log('  Created 10 materials');

  // ============================================================
  // 12. Contractors (5)
  // ============================================================
  console.log('Seeding contractors...');
  const contractorsData = [
    { name: 'Carlos Rivera', company: 'Rivera Renovations', specialty: 'Kitchen & Bath Remodeling', email: 'carlos@riverareno.com', phone: '(555) 234-5678', rating: 4.8, hourlyRate: 85.00, availability: 'available', location: 'Los Angeles, CA', verified: true },
    { name: 'Sarah Chen', company: 'Chen Design Build', specialty: 'Interior Design & Build', email: 'sarah@chendb.com', phone: '(555) 345-6789', rating: 4.9, hourlyRate: 95.00, availability: 'busy', location: 'San Francisco, CA', verified: true },
    { name: 'Marcus Johnson', company: 'MJ Electrical', specialty: 'Electrical & Smart Home', email: 'marcus@mjelectric.com', phone: '(555) 456-7890', rating: 4.6, hourlyRate: 75.00, availability: 'available', location: 'Austin, TX', verified: true },
    { name: 'Emily Watson', company: 'Watson Woodworks', specialty: 'Custom Carpentry & Millwork', email: 'emily@watsonwood.com', phone: '(555) 567-8901', rating: 4.7, hourlyRate: 90.00, availability: 'available', location: 'Portland, OR', verified: false },
    { name: 'James Park', company: 'Park Plumbing Co.', specialty: 'Plumbing & Fixture Installation', email: 'james@parkplumbing.com', phone: '(555) 678-9012', rating: 4.5, hourlyRate: 70.00, availability: 'busy', location: 'Seattle, WA', verified: true },
  ];

  for (const c of contractorsData) {
    await prisma.contractor.create({ data: c });
  }
  console.log('  Created 5 contractors');

  // ============================================================
  // 13. Design Templates (5)
  // ============================================================
  console.log('Seeding design templates...');
  const templatesData = [
    { name: 'Modern Open Living', style: 'modern', roomType: 'living_room', features: ['sectional-sofa', 'media-wall', 'accent-lighting', 'area-rug'], colorPalette: { primary: '#2C3E50', secondary: '#ECF0F1', accent: '#E74C3C' }, popularity: 120 },
    { name: 'Cozy Reading Nook', style: 'scandinavian', roomType: 'bedroom', features: ['window-seat', 'bookshelf-wall', 'pendant-light', 'throw-blankets'], colorPalette: { primary: '#F5E6CC', secondary: '#A3B18A', accent: '#344E41' }, popularity: 85 },
    { name: 'Productive Home Office', style: 'industrial', roomType: 'office', features: ['standing-desk', 'pegboard-wall', 'task-lighting', 'cable-management'], colorPalette: { primary: '#333333', secondary: '#B85C38', accent: '#FFFFFF' }, popularity: 98 },
    { name: 'Chef Kitchen Layout', style: 'modern', roomType: 'kitchen', features: ['island-counter', 'pot-rack', 'open-shelving', 'under-cabinet-lights'], colorPalette: { primary: '#FFFFFF', secondary: '#2D2D2D', accent: '#D4A373' }, popularity: 145 },
    { name: 'Spa-Inspired Bathroom', style: 'minimalist', roomType: 'bathroom', features: ['rain-shower', 'floating-vanity', 'heated-floors', 'towel-warmer'], colorPalette: { primary: '#F0EDE8', secondary: '#A3B18A', accent: '#588157' }, popularity: 110 },
  ];

  for (const t of templatesData) {
    await prisma.designTemplate.create({ data: t });
  }
  console.log('  Created 5 design templates');

  // ============================================================
  // 14. Inspirations (5)
  // ============================================================
  console.log('Seeding inspirations...');
  const inspirationsData = [
    { title: 'Japanese Zen Living Room', description: 'A serene space featuring tatami-inspired elements, low furniture, and natural materials.', style: 'minimalist', roomType: 'living_room', tags: ['zen', 'japanese', 'natural', 'calm'], likes: 342, source: 'ArchDigest' },
    { title: 'Brooklyn Loft Conversion', description: 'Former factory space transformed into a stunning industrial-chic residence.', style: 'industrial', roomType: 'studio', tags: ['loft', 'industrial', 'urban', 'exposed-brick'], likes: 528, source: 'Dwell' },
    { title: 'Amalfi Coast Kitchen', description: 'Mediterranean-inspired kitchen with hand-painted tiles and rustic wood beams.', style: 'mediterranean', roomType: 'kitchen', tags: ['mediterranean', 'colorful', 'tiles', 'rustic'], likes: 415, source: 'Elle Decor' },
    { title: 'Nordic Forest Bedroom', description: 'Bedroom retreat inspired by Scandinavian forests with green and natural wood tones.', style: 'scandinavian', roomType: 'bedroom', tags: ['forest', 'green', 'wood', 'cozy'], likes: 287, source: 'Scandinavian Living' },
    { title: 'Marrakech-Inspired Lounge', description: 'Rich jewel tones, ornate patterns, and brass fixtures create an exotic retreat.', style: 'bohemian', roomType: 'living_room', tags: ['moroccan', 'jewel-tones', 'patterns', 'exotic'], likes: 396, source: 'Lonny Magazine' },
  ];

  for (const i of inspirationsData) {
    await prisma.inspiration.create({ data: i });
  }
  console.log('  Created 5 inspirations');

  // ============================================================
  // 15. Subscriptions (3) - one per user
  // ============================================================
  console.log('Seeding subscriptions...');
  const subscriptionsData = [
    { userId: adminUser.id, plan: 'enterprise', status: 'active', creditsUsed: 25, creditsLimit: 1000, startDate: new Date('2025-01-01') },
    { userId: editorUser.id, plan: 'pro', status: 'active', creditsUsed: 12, creditsLimit: 100, startDate: new Date('2025-06-01') },
    { userId: demoUser.id, plan: 'free', status: 'active', creditsUsed: 3, creditsLimit: 5, startDate: new Date('2026-01-15') },
  ];

  for (const s of subscriptionsData) {
    await prisma.subscription.create({ data: s });
  }
  console.log('  Created 3 subscriptions');

  // ============================================================
  console.log('\nSeeding complete!');
  console.log('---');
  console.log('Demo account: demo@example.com / Demo123!@#');
  console.log('Admin account: admin@example.com / Admin123!@#');
  console.log('Editor account: editor@example.com / Editor123!@#');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
