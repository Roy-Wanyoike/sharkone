import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get first 5 products
  const products = await prisma.product.findMany({ take: 5 });
  if (products.length === 0) {
    console.log('⚠️  No products found. Please seed products first.');
    return;
  }

  console.log(`📦 Found ${products.length} products for inventory seeding.`);

  // Create 3 warehouses in Nairobi area
  const warehouses = [
    await prisma.warehouse.upsert({
      where: { code: 'WH-NBO-C' },
      update: {},
      create: {
        name: 'Warehouse A - Nairobi Central',
        code: 'WH-NBO-C',
        address: 'Moi Avenue, Kenyatta Avenue Junction',
        city: 'Nairobi',
        county: 'Nairobi',
        latitude: -1.2864,
        longitude: 36.8172,
        status: 'ACTIVE',
        capacity: 5000,
        managerName: 'James Mwangi',
        managerPhone: '+254722100100',
      },
    }),
    await prisma.warehouse.upsert({
      where: { code: 'WH-NBO-MR' },
      update: {},
      create: {
        name: 'Warehouse B - Mombasa Road',
        code: 'WH-NBO-MR',
        address: 'Mombasa Road, Industrial Area',
        city: 'Nairobi',
        county: 'Nairobi',
        latitude: -1.3192,
        longitude: 36.8628,
        status: 'ACTIVE',
        capacity: 8000,
        managerName: 'Grace Wanjiku',
        managerPhone: '+254733200200',
      },
    }),
    await prisma.warehouse.upsert({
      where: { code: 'WH-NBO-W' },
      update: {},
      create: {
        name: 'Warehouse C - Westlands',
        code: 'WH-NBO-W',
        address: 'Waiyaki Way, Westlands',
        city: 'Nairobi',
        county: 'Nairobi',
        latitude: -1.2633,
        longitude: 36.8063,
        status: 'ACTIVE',
        capacity: 3000,
        managerName: 'Peter Ochieng',
        managerPhone: '+254711300300',
      },
    }),
  ];

  console.log(`✅ Seeded ${warehouses.length} warehouses:`);
  warehouses.forEach((w) => {
    console.log(`   ${w.code} — ${w.name} — capacity: ${w.capacity}`);
  });

  // Realistic quantities for inventory items
  const inventoryData: { productId: string; warehouseId: string; quantity: number; reservedQuantity: number; reorderLevel: number; binLocation: string }[] = [];

  // Warehouse A - Nairobi Central (main hub, higher quantities)
  const binLocationsA = ['A-01-01', 'A-01-02', 'A-02-01', 'A-02-02', 'A-03-01'];
  const quantitiesA = [250, 180, 120, 75, 200];
  const reservedA = [30, 15, 20, 5, 25];

  // Warehouse B - Mombasa Road (larger, varied quantities)
  const binLocationsB = ['B-01-01', 'B-01-03', 'B-02-01', 'B-03-01', 'B-03-02'];
  const quantitiesB = [150, 300, 80, 5, 180];
  const reservedB = [20, 45, 10, 3, 30];

  // Warehouse C - Westlands (smaller, focused inventory)
  const binLocationsC = ['C-01-01', 'C-01-02', 'C-02-01', 'C-02-02', 'C-02-03'];
  const quantitiesC = [100, 90, 60, 8, 120];
  const reservedC = [15, 10, 5, 6, 20];

  products.forEach((product, i) => {
    inventoryData.push(
      {
        productId: product.id,
        warehouseId: warehouses[0].id,
        quantity: quantitiesA[i],
        reservedQuantity: reservedA[i],
        reorderLevel: 20,
        binLocation: binLocationsA[i],
      },
      {
        productId: product.id,
        warehouseId: warehouses[1].id,
        quantity: quantitiesB[i],
        reservedQuantity: reservedB[i],
        reorderLevel: 15,
        binLocation: binLocationsB[i],
      },
      {
        productId: product.id,
        warehouseId: warehouses[2].id,
        quantity: quantitiesC[i],
        reservedQuantity: reservedC[i],
        reorderLevel: 10,
        binLocation: binLocationsC[i],
      }
    );
  });

  // Use upsert to avoid duplicates
  for (const item of inventoryData) {
    await prisma.inventoryItem.upsert({
      where: {
        productId_warehouseId: {
          productId: item.productId,
          warehouseId: item.warehouseId,
        },
      },
      update: {
        quantity: item.quantity,
        reservedQuantity: item.reservedQuantity,
        reorderLevel: item.reorderLevel,
        binLocation: item.binLocation,
      },
      create: item,
    });
  }

  console.log(`✅ Seeded ${inventoryData.length} inventory items across ${warehouses.length} warehouses.`);

  // Summary
  const totalInventory = inventoryData.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = inventoryData.filter((item) => item.quantity <= item.reorderLevel);
  console.log(`📊 Total stock across all warehouses: ${totalInventory}`);
  console.log(`⚠️  Low stock alerts: ${lowStockItems.length} items at or below reorder level`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
