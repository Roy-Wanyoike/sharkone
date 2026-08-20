import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding flash sales...');

  // Get random active products
  const products = await db.product.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, price: true },
  });

  if (products.length < 4) {
    console.error('Not enough active products to create flash sales.');
    return;
  }

  // Shuffle and pick 4 products
  const shuffled = products.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 4);

  const discounts = [15, 25, 30, 40];
  const stockAmounts = [80, 50, 35, 20];

  const now = new Date();
  const startTime = new Date(now);
  startTime.setDate(startTime.getDate() - 1); // Yesterday

  const endTime = new Date(now);
  endTime.setDate(endTime.getDate() + 3); // 3 days from now

  for (let i = 0; i < 4; i++) {
    const product = selected[i];
    const discountPercentage = discounts[i];
    const salePrice = parseFloat((product.price * (1 - discountPercentage / 100)).toFixed(2));

    // Check if flash sale already exists for this product
    const existing = await db.flashSale.findFirst({
      where: { productId: product.id },
    });

    if (existing) {
      console.log(`⏭️  Flash sale already exists for "${product.name}", skipping.`);
      continue;
    }

    const flashSale = await db.flashSale.create({
      data: {
        name: `${discountPercentage}% Off - ${product.name}`,
        productId: product.id,
        discountPercentage,
        originalPrice: product.price,
        salePrice,
        startTime,
        endTime,
        isActive: true,
        totalStock: stockAmounts[i],
        soldCount: Math.floor(Math.random() * Math.floor(stockAmounts[i] * 0.6)),
      },
    });

    console.log(
      `✅ Created flash sale: "${flashSale.name}" - ${discountPercentage}% off ($${product.price} → $${salePrice})`
    );
  }

  const total = await db.flashSale.count();
  console.log(`\n🎯 Total flash sales in DB: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
