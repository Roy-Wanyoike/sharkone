import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const now = new Date();

  // Pick 2 products for flash sales
  const products = await db.product.findMany({
    where: { status: 'ACTIVE' },
    take: 2,
    orderBy: { createdAt: 'asc' },
  });

  if (products.length < 2) {
    console.error('Need at least 2 active products to seed flash sales');
    process.exit(1);
  }

  // Flash Sale 1: starts 1 hour from now, 60 min duration, 30% off
  const startTime1 = new Date(now.getTime() + 60 * 60 * 1000);
  const endTime1 = new Date(startTime1.getTime() + 60 * 60 * 1000);
  const salePrice1 = Math.round(products[0].price * 0.7 * 100) / 100;

  const flash1 = await db.flashSale.create({
    data: {
      name: `Flash: ${products[0].name} -30%`,
      productId: products[0].id,
      discountPercentage: 30,
      originalPrice: products[0].price,
      salePrice: salePrice1,
      startTime: startTime1,
      endTime: endTime1,
      totalStock: products[0].stock,
      soldCount: 0,
      isActive: true,
    },
  });

  console.log(`✅ Flash Sale 1 created: ${flash1.name}`);
  console.log(`   Start: ${startTime1.toISOString()}`);
  console.log(`   End:   ${endTime1.toISOString()}`);
  console.log(`   Price: $${products[0].price} → $${salePrice1}`);

  // Flash Sale 2: starts 6 hours from now, 90 min duration, 45% off
  const startTime2 = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const endTime2 = new Date(startTime2.getTime() + 90 * 60 * 1000);
  const salePrice2 = Math.round(products[1].price * 0.55 * 100) / 100;

  const flash2 = await db.flashSale.create({
    data: {
      name: `Flash: ${products[1].name} -45%`,
      productId: products[1].id,
      discountPercentage: 45,
      originalPrice: products[1].price,
      salePrice: salePrice2,
      startTime: startTime2,
      endTime: endTime2,
      totalStock: products[1].stock,
      soldCount: 0,
      isActive: true,
    },
  });

  console.log(`✅ Flash Sale 2 created: ${flash2.name}`);
  console.log(`   Start: ${startTime2.toISOString()}`);
  console.log(`   End:   ${endTime2.toISOString()}`);
  console.log(`   Price: $${products[1].price} → $${salePrice2}`);

  // Create notifications for BUYER users
  const buyers = await db.user.findMany({
    where: { role: 'BUYER' },
    select: { id: true },
  });

  if (buyers.length > 0) {
    const startStr1 = startTime1.toLocaleString();
    const startStr2 = startTime2.toLocaleString();

    const notificationsData = [
      ...buyers.map((b) => ({
        userId: b.id,
        title: '🔥 Upcoming Flash Sale!',
        message: `${products[0].name} at 30% off — starts at ${startStr1}. Don't miss it!`,
        type: 'SYSTEM' as const,
      })),
      ...buyers.map((b) => ({
        userId: b.id,
        title: '🔥 Upcoming Flash Sale!',
        message: `${products[1].name} at 45% off — starts at ${startStr2}. Don't miss it!`,
        type: 'SYSTEM' as const,
      })),
    ];

    await db.notification.createMany({ data: notificationsData });
    console.log(`✅ Created ${notificationsData.length} notifications for ${buyers.length} buyer(s)`);
  } else {
    console.log('ℹ️  No BUYER users found — skipping notification creation');
  }

  console.log('\n🎉 Flash sale seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
