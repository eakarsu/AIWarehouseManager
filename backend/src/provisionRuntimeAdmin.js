'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = (process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || '';
  if (!email || password.length < 12) throw new Error('Runtime admin email and a 12+ character password are required');
  await prisma.user.upsert({
    where: { email },
    update: { password: await bcrypt.hash(password, 12), name: process.env.PROVISION_ADMIN_NAME || 'Runtime Admin', role: 'admin', emailVerified: true },
    create: { email, password: await bcrypt.hash(password, 12), name: process.env.PROVISION_ADMIN_NAME || 'Runtime Admin', role: 'admin', emailVerified: true },
  });
  console.log('Runtime admin is ready.');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
