import { PrismaClient, Role, UserStatus, RecordType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ------------------------------------------------------------------
  // 1. Clean existing seed data (idempotent — safe to re-run)
  // ------------------------------------------------------------------
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  // ------------------------------------------------------------------
  // 2. Create 3 users — one per role
  // ------------------------------------------------------------------
  const hashedAdmin    = await bcrypt.hash('Admin@123', 10);
  const hashedAnalyst  = await bcrypt.hash('Analyst@123', 10);
  const hashedViewer   = await bcrypt.hash('Viewer@123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedAdmin,
      name: 'Admin User',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@test.com',
      password: hashedAnalyst,
      name: 'Analyst User',
      role: Role.ANALYST,
      status: UserStatus.ACTIVE,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@test.com',
      password: hashedViewer,
      name: 'Viewer User',
      role: Role.VIEWER,
      status: UserStatus.ACTIVE,
    },
  });

  console.log(`Created users: ${admin.email}, ${analyst.email}, ${viewer.email}`);

  // ------------------------------------------------------------------
  // 3. Create 24 financial records (varied types, categories, dates)
  // ------------------------------------------------------------------
  const records = [
    // INCOME records
    { amount: 85000.00, type: RecordType.INCOME, category: 'Salary',      date: new Date('2025-10-01'), description: 'Monthly salary - October',     userId: admin.id },
    { amount: 85000.00, type: RecordType.INCOME, category: 'Salary',      date: new Date('2025-11-01'), description: 'Monthly salary - November',    userId: admin.id },
    { amount: 85000.00, type: RecordType.INCOME, category: 'Salary',      date: new Date('2025-12-01'), description: 'Monthly salary - December',    userId: admin.id },
    { amount: 85000.00, type: RecordType.INCOME, category: 'Salary',      date: new Date('2026-01-01'), description: 'Monthly salary - January',     userId: admin.id },
    { amount: 85000.00, type: RecordType.INCOME, category: 'Salary',      date: new Date('2026-02-01'), description: 'Monthly salary - February',    userId: admin.id },
    { amount: 85000.00, type: RecordType.INCOME, category: 'Salary',      date: new Date('2026-03-01'), description: 'Monthly salary - March',       userId: admin.id },
    { amount: 12500.00, type: RecordType.INCOME, category: 'Freelance',   date: new Date('2025-10-15'), description: 'Web dev project payment',      userId: analyst.id },
    { amount: 8000.00,  type: RecordType.INCOME, category: 'Freelance',   date: new Date('2025-12-20'), description: 'Consulting fee Q4',            userId: analyst.id },
    { amount: 5000.00,  type: RecordType.INCOME, category: 'Investment',  date: new Date('2025-11-30'), description: 'Dividend payout',              userId: admin.id },
    { amount: 3200.00,  type: RecordType.INCOME, category: 'Investment',  date: new Date('2026-01-15'), description: 'Mutual fund returns',          userId: admin.id },
    { amount: 2500.00,  type: RecordType.INCOME, category: 'Rental',      date: new Date('2025-10-05'), description: 'Property rental income',       userId: viewer.id },
    { amount: 2500.00,  type: RecordType.INCOME, category: 'Rental',      date: new Date('2025-11-05'), description: 'Property rental income',       userId: viewer.id },
    // EXPENSE records
    { amount: 22000.00, type: RecordType.EXPENSE, category: 'Rent',        date: new Date('2025-10-01'), description: 'Monthly office rent',          userId: admin.id },
    { amount: 22000.00, type: RecordType.EXPENSE, category: 'Rent',        date: new Date('2025-11-01'), description: 'Monthly office rent',          userId: admin.id },
    { amount: 22000.00, type: RecordType.EXPENSE, category: 'Rent',        date: new Date('2025-12-01'), description: 'Monthly office rent',          userId: admin.id },
    { amount: 4500.00,  type: RecordType.EXPENSE, category: 'Utilities',   date: new Date('2025-10-10'), description: 'Electricity + internet bill',  userId: admin.id },
    { amount: 4200.00,  type: RecordType.EXPENSE, category: 'Utilities',   date: new Date('2025-11-10'), description: 'Electricity + internet bill',  userId: admin.id },
    { amount: 15000.00, type: RecordType.EXPENSE, category: 'Salaries',    date: new Date('2025-10-25'), description: 'Staff payroll - October',      userId: admin.id },
    { amount: 15000.00, type: RecordType.EXPENSE, category: 'Salaries',    date: new Date('2025-11-25'), description: 'Staff payroll - November',     userId: admin.id },
    { amount: 8500.00,  type: RecordType.EXPENSE, category: 'Marketing',   date: new Date('2025-10-20'), description: 'Digital ad campaign Q4',       userId: analyst.id },
    { amount: 3200.00,  type: RecordType.EXPENSE, category: 'Software',    date: new Date('2025-11-15'), description: 'Annual SaaS subscriptions',    userId: analyst.id },
    { amount: 1800.00,  type: RecordType.EXPENSE, category: 'Travel',      date: new Date('2025-12-10'), description: 'Business travel expenses',     userId: analyst.id },
    { amount: 6000.00,  type: RecordType.EXPENSE, category: 'Equipment',   date: new Date('2026-01-20'), description: 'Laptop purchase for team',     userId: admin.id },
    { amount: 900.00,   type: RecordType.EXPENSE, category: 'Miscellaneous', date: new Date('2026-02-14'), description: 'Office supplies',            userId: viewer.id },
  ];

  await prisma.financialRecord.createMany({ data: records });

  console.log(`Created ${records.length} financial records`);
  console.log('\nSeed complete. Test credentials:');
  console.log('  Admin:   admin@test.com   / Admin@123');
  console.log('  Analyst: analyst@test.com / Analyst@123');
  console.log('  Viewer:  viewer@test.com  / Viewer@123');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
