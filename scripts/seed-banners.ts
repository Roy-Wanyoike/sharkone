import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function seedBanners() {
  console.log('Seeding banners...');

  const banners = [
    {
      title: 'SHARKONE Mega Sale - Up to 50% Off',
      image: 'https://placehold.co/1200x400/0F172A/F59E0B?text=SHARKONE+Mega+Sale+-+50%25+Off',
      link: '/?category=electronics',
      position: 'HERO',
      order: 0,
      active: true,
    },
    {
      title: 'New Arrivals - Fresh Styles Weekly',
      image: 'https://placehold.co/1200x400/1E293B/38BDF8?text=New+Arrivals+-+Fresh+Styles',
      link: '/?category=fashion',
      position: 'HERO',
      order: 1,
      active: true,
    },
    {
      title: 'Shop Top Electronics Deals',
      image: 'https://placehold.co/400x600/0F172A/F59E0B?text=Top+Electronics',
      link: '/?category=electronics',
      position: 'SIDEBAR',
      order: 0,
      active: true,
    },
    {
      title: 'Free Delivery on Orders Over KES 5,000',
      image: 'https://placehold.co/1200x200/0F172A/4ADE80?text=Free+Delivery+Over+KES+5000',
      link: '/',
      position: 'FOOTER',
      order: 0,
      active: true,
    },
  ];

  for (const banner of banners) {
    await db.banner.create({ data: banner });
    console.log(`  Created banner: ${banner.title}`);
  }

  console.log('Done! 4 banners created.');
}

seedBanners()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
