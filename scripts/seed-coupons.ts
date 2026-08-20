import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Get a category for SELLER10
  const categories = await prisma.category.findMany({ take: 1 });
  const categoryId = categories.length > 0 ? categories[0].id : null;

  const coupons = [
    await prisma.coupon.upsert({
      where: { code: 'WELCOME15' },
      update: {},
      create: {
        code: 'WELCOME15',
        type: 'PERCENTAGE',
        value: 15,
        minOrderValue: 500,
        usageLimit: 100,
        perUserLimit: 1,
        validFrom: now,
        validUntil: thirtyDays,
        isActive: true,
        description: 'Welcome offer: 15% off your first order',
      },
    }),

    await prisma.coupon.upsert({
      where: { code: 'SHARK1000' },
      update: {},
      create: {
        code: 'SHARK1000',
        type: 'FIXED_AMOUNT',
        value: 1000,
        minOrderValue: 5000,
        usageLimit: 50,
        perUserLimit: 1,
        validFrom: now,
        validUntil: thirtyDays,
        isActive: true,
        description: 'KES 1,000 off orders above KES 5,000',
      },
    }),

    await prisma.coupon.upsert({
      where: { code: 'FREESHIP' },
      update: {},
      create: {
        code: 'FREESHIP',
        type: 'FREE_SHIPPING',
        value: 0,
        usageLimit: null,
        perUserLimit: 3,
        validFrom: now,
        validUntil: thirtyDays,
        isActive: true,
        description: 'Free shipping on any order',
      },
    }),

    await prisma.coupon.upsert({
      where: { code: 'FLASH20' },
      update: {},
      create: {
        code: 'FLASH20',
        type: 'PERCENTAGE',
        value: 20,
        minOrderValue: 1000,
        maxDiscount: 2000,
        usageLimit: 30,
        perUserLimit: 1,
        validFrom: now,
        validUntil: thirtyDays,
        isActive: true,
        description: 'Flash sale: 20% off, max discount KES 2,000',
      },
    }),

    await prisma.coupon.upsert({
      where: { code: 'SELLER10' },
      update: {},
      create: {
        code: 'SELLER10',
        type: 'PERCENTAGE',
        value: 10,
        minOrderValue: null,
        maxDiscount: null,
        usageLimit: 200,
        perUserLimit: 2,
        validFrom: now,
        validUntil: thirtyDays,
        isActive: true,
        applicableCategories: categoryId || undefined,
        description: categoryId
          ? `10% off products in ${categories[0]?.name || 'selected'} category`
          : '10% off selected categories',
      },
    }),
  ];

  console.log(`✅ Seeded ${coupons.length} coupons:`);
  coupons.forEach((c) => {
    console.log(`   ${c.code} — ${c.type} — value: ${c.value}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
