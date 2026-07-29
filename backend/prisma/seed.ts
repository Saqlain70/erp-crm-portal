import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@erp.com' },
      update: {},
      create: { name: 'Admin User', email: 'admin@erp.com', passwordHash, role: 'ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'sales@erp.com' },
      update: {},
      create: { name: 'Sales User', email: 'sales@erp.com', passwordHash, role: 'SALES' },
    }),
    prisma.user.upsert({
      where: { email: 'warehouse@erp.com' },
      update: {},
      create: { name: 'Warehouse User', email: 'warehouse@erp.com', passwordHash, role: 'WAREHOUSE' },
    }),
    prisma.user.upsert({
      where: { email: 'accounts@erp.com' },
      update: {},
      create: { name: 'Accounts User', email: 'accounts@erp.com', passwordHash, role: 'ACCOUNTS' },
    }),
  ]);

  const adminUser = users[0];

  const customer1 = await prisma.customer.create({
    data: {
      name: 'Ramesh Traders',
      mobile: '9876543210',
      email: 'ramesh@tradersco.com',
      businessName: 'Ramesh Traders Pvt Ltd',
      gstNumber: '27ABCDE1234F1Z5',
      customerType: 'WHOLESALE',
      address: '12 MG Road, Kanpur, UP',
      status: 'ACTIVE',
      notes: 'Regular bulk buyer of hardware items.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Sunita Distributors',
      mobile: '9123456780',
      email: 'sunita@distributors.com',
      businessName: 'Sunita Distributors',
      customerType: 'DISTRIBUTOR',
      address: 'Sector 5, Noida, UP',
      status: 'LEAD',
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'Interested in electrical items, follow up next week.',
    },
  });

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'LED Bulb 9W', sku: 'LED-9W-001', category: 'Electrical',
        unitPrice: 85.0, currentStock: 500, minStockAlertQty: 50, location: 'Warehouse A - Rack 1',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Copper Wire 1.5mm (100m)', sku: 'WIRE-1.5-100', category: 'Electrical',
        unitPrice: 1450.0, currentStock: 40, minStockAlertQty: 10, location: 'Warehouse A - Rack 3',
      },
    }),
    prisma.product.create({
      data: {
        name: 'MCB Switch 32A', sku: 'MCB-32A', category: 'Electrical',
        unitPrice: 220.0, currentStock: 8, minStockAlertQty: 15, location: 'Warehouse A - Rack 2',
      },
    }),
    prisma.product.create({
      data: {
        name: 'PVC Pipe 1 inch (3m)', sku: 'PVC-1IN-3M', category: 'Plumbing',
        unitPrice: 180.0, currentStock: 200, minStockAlertQty: 30, location: 'Warehouse B - Rack 1',
      },
    }),
  ]);

  await Promise.all(
    products.map((p) =>
      prisma.stockMovement.create({
        data: {
          productId: p.id,
          quantity: p.currentStock,
          movementType: 'IN',
          reason: 'Opening stock (seed)',
          createdById: adminUser.id,
        },
      })
    )
  );

  console.log('Seed complete.');
  console.log('Test login credentials (password for all: Password@123):');
  console.log(' Admin:     admin@erp.com');
  console.log(' Sales:     sales@erp.com');
  console.log(' Warehouse: warehouse@erp.com');
  console.log(' Accounts:  accounts@erp.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
