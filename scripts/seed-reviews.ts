import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const kenyanNames = [
  'Alice Mwangi',
  'Brian Odhiambo',
  'Cynthia Wanjiku',
  'David Kamau',
  'Esther Njeri',
  'Francis Mutua',
  'Grace Achieng',
  'Hassan Abdi',
  'Irene Chebet',
  'James Kipchoge',
  'Lucy Wambui',
  'Michael Omondi',
  'Nancy Muthoni',
  'Oscar Waweru',
  'Priscilla Akinyi',
  'Quincy Njoroge',
  'Rosemary Wairimu',
  'Samuel Wekesa',
  'Tabitha Nyambura',
  'Uriah Otieno',
];

const reviewComments: Record<number, string[]> = {
  5: [
    'Absolutely love this product! The quality exceeded my expectations. Fast delivery and well-packaged. Will definitely order again from SHARKONE.',
    'This is exactly what I was looking for. Premium quality, great packaging, and it arrived earlier than expected. Highly recommended!',
    'Best purchase I have made this year. The product is even better in person than in the photos. SHARKONE never disappoints!',
    'Outstanding quality and value. I was skeptical at first but this product proved me wrong. Five stars all the way!',
    'Perfect in every way. The seller was very responsive and the product matched the description exactly. Will buy again.',
  'I am impressed with the build quality and performance. This is a genuine product at a fair price. Thank you SHARKONE!',
  'Received the product in excellent condition. It works flawlessly and looks even better than the pictures. Very satisfied customer here.',
  ],
  4: [
    'Great value for money. The product matches the description perfectly. Minor shipping delay but overall very satisfied with the purchase.',
    'Good product, works as described. The packaging could be better but the product itself is solid. Fair price for what you get.',
    'Really happy with this purchase. Delivery was quick and the product quality is good. Would have given 5 stars if the color was more accurate.',
    'Solid product overall. Performs well and feels durable. Shipping to Nairobi was faster than expected. Recommended seller.',
    'Very good quality for the price point. Everything works as advertised. Just wish there were more color options available.',
  ],
  3: [
    'Decent product for the price. Works fine but nothing extraordinary. The delivery took a bit longer than expected.',
    'Average quality. It does the job but I expected a bit more based on the reviews. Still, it is an okay purchase.',
  ],
};

const reviewTitles: Record<number, string[]> = {
  5: [
    'Excellent product!',
    'Exceeded my expectations',
    'Highly recommended!',
    'Best purchase ever',
    'Perfect quality',
    'Outstanding value',
  ],
  4: [
    'Great value for money',
    'Good product overall',
    'Very satisfied',
    'Solid purchase',
    'Would buy again',
  ],
  3: [
    'Decent for the price',
    'Average experience',
    ],
};

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getRandomRating(): number {
  const r = Math.random();
  if (r < 0.55) return 5; // 55% chance of 5 stars
  if (r < 0.88) return 4; // 33% chance of 4 stars
  return 3; // 12% chance of 3 stars
}

function randomDate(daysAgo: number): Date {
  const now = new Date();
  return new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
}

async function main() {
  const products = await prisma.product.findMany();
  const buyerUsers = await prisma.user.findMany({ where: { role: 'BUYER' } });

  if (products.length === 0) {
    console.log('No products found. Please run the main seed script first.');
    return;
  }

  if (buyerUsers.length === 0) {
    console.log('No buyer users found. Please run the main seed script first.');
    return;
  }

  const usedNames = new Set<string>();
  let totalReviews = 0;

  for (const product of products) {
    const numReviews = 2 + Math.floor(Math.random() * 3); // 2-4 reviews per product
    const names = getRandomItems(kenyanNames, numReviews);

    for (const name of names) {
      const rating = getRandomRating();
      const comments = reviewComments[rating];
      const titles = reviewTitles[rating];
      const comment = comments[Math.floor(Math.random() * comments.length)];
      const hasTitle = Math.random() > 0.4;
      const title = hasTitle ? titles[Math.floor(Math.random() * titles.length)] : null;

      // Use a random buyer user ID
      const buyer = buyerUsers[Math.floor(Math.random() * buyerUsers.length)];

      const uniqueName = usedNames.has(name) ? `${name} ${Math.floor(Math.random() * 99) + 1}` : name;
      usedNames.add(uniqueName);

      await prisma.review.create({
        data: {
          productId: product.id,
          userId: buyer.id,
          userName: uniqueName,
          rating,
          title,
          comment,
          isVerified: Math.random() > 0.3,
          createdAt: randomDate(90),
        },
      });
      totalReviews++;
    }
  }

  console.log(`Seeded ${totalReviews} reviews across ${products.length} products successfully!`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
