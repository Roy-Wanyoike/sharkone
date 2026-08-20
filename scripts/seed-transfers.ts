import { PrismaClient, StockTransferStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Seeding stock transfers...');

  // Get warehouses
  const warehouses = await prisma.warehouse.findMany({
    orderBy: { createdAt: 'asc' },
  });

  if (warehouses.length < 2) {
    console.log('⚠️  Need at least 2 warehouses. Please seed warehouses first.');
    return;
  }

  // Get products
  const products = await prisma.product.findMany({ take: 3 });

  if (products.length < 3) {
    console.log('⚠️  Need at least 3 products. Please seed products first.');
    return;
  }

  const whA = warehouses[0];
  const whB = warehouses[1];
  const whC = warehouses.length > 2 ? warehouses[2] : warehouses[1];

  // Generate transfer numbers sequentially
  const existingCount = await prisma.stockTransfer.count();
  const baseNum = existingCount + 1;

  const transfers = [
    {
      transferNumber: `STF-${String(baseNum).padStart(3, '0')}`,
      productId: products[0].id,
      fromWarehouseId: whA.id,
      toWarehouseId: whB.id,
      quantity: 30,
      status: StockTransferStatus.PENDING,
      requestedBy: 'James Mwangi',
      notes: 'Restocking for weekend demand surge',
    },
    {
      transferNumber: `STF-${String(baseNum + 1).padStart(3, '0')}`,
      productId: products[1].id,
      fromWarehouseId: whB.id,
      toWarehouseId: whC.id,
      quantity: 50,
      status: StockTransferStatus.APPROVED,
      requestedBy: 'Grace Wanjiku',
      approvedBy: 'Admin User',
      notes: 'Approved for redistribution to Westlands warehouse',
    },
    {
      transferNumber: `STF-${String(baseNum + 2).padStart(3, '0')}`,
      productId: products[2].id,
      fromWarehouseId: whA.id,
      toWarehouseId: whC.id,
      quantity: 20,
      status: StockTransferStatus.IN_TRANSIT,
      requestedBy: 'Peter Ochieng',
      approvedBy: 'Admin User',
      notes: 'Emergency restock — low stock at Westlands',
    },
  ];

  for (const t of transfers) {
    const created = await prisma.stockTransfer.create({ data: t });
    console.log(`   ✅ ${created.transferNumber} — ${created.status} — ${t.quantity} units`);
  }

  console.log(`\n✅ Seeded ${transfers.length} stock transfers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
