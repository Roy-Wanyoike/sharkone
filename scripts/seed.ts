import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'headphones' },
      update: {},
      create: {
        name: 'Headphones',
        slug: 'headphones',
        description: 'Premium wireless and wired headphones',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'laptops' },
      update: {},
      create: {
        name: 'Laptops',
        slug: 'laptops',
        description: 'High-performance laptops for work and play',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'cameras' },
      update: {},
      create: {
        name: 'Cameras',
        slug: 'cameras',
        description: 'Professional cameras and action cameras',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'smartwatches' },
      update: {},
      create: {
        name: 'Smartwatches',
        slug: 'smartwatches',
        description: 'Next-gen wearable technology',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'appliances' },
      update: {},
      create: {
        name: 'Appliances',
        slug: 'appliances',
        description: 'Home appliances for modern living',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'gaming' },
      update: {},
      create: {
        name: 'Gaming',
        slug: 'gaming',
        description: 'Gaming consoles and accessories',
      },
    }),
  ]);

  const products = [
    {
      name: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      description: 'Premium wireless headphones with industry-leading noise cancellation, crystal-clear audio quality, and up to 30 hours of battery life. Perfect for music lovers and professionals.',
      price: 349.99,
      originalPrice: 399.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      rating: 4.8,
      reviewCount: 2456,
      categoryId: categories[0].id,
      featured: true,
    },
    {
      name: 'AirPods Max',
      slug: 'airpods-max',
      description: 'Apple AirPods Max deliver high-fidelity audio with active noise cancellation, spatial audio, and a premium over-ear design crafted with stainless steel and breathable mesh.',
      price: 549.00,
      originalPrice: 599.00,
      image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80',
      rating: 4.6,
      reviewCount: 1832,
      categoryId: categories[0].id,
      featured: true,
    },
    {
      name: 'Bose QC Ultra',
      slug: 'bose-qc-ultra',
      description: 'Experience crystal-clear audio with deep, punchy bass and world-class noise-canceling technology. Immersive sound for music, calls, and entertainment.',
      price: 429.00,
      originalPrice: 479.00,
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80',
      rating: 4.7,
      reviewCount: 987,
      categoryId: categories[0].id,
      featured: false,
    },
    {
      name: 'JBL Tune 770NC',
      slug: 'jbl-tune-770nc',
      description: 'JBL Tune 770NC delivers powerful JBL Pure Bass sound with adaptive noise cancellation. Lightweight and comfortable for all-day listening.',
      price: 99.99,
      originalPrice: 149.99,
      image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
      rating: 4.3,
      reviewCount: 567,
      categoryId: categories[0].id,
      featured: false,
    },
    {
      name: 'MacBook Pro 16"',
      slug: 'macbook-pro-16',
      description: 'Apple MacBook Pro 16-inch with M3 Max chip, 36GB unified memory, and a stunning Liquid Retina XDR display. The ultimate laptop for creative professionals.',
      price: 2499.00,
      originalPrice: 2799.00,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      rating: 4.9,
      reviewCount: 3421,
      categoryId: categories[1].id,
      featured: true,
    },
    {
      name: 'Dell XPS 15',
      slug: 'dell-xps-15',
      description: 'Dell XPS 15 with Intel Core i7, 16GB RAM, and a brilliant 15.6-inch OLED display. Sleek design meets powerful performance for work and creativity.',
      price: 1499.99,
      originalPrice: 1799.99,
      image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80',
      rating: 4.5,
      reviewCount: 1234,
      categoryId: categories[1].id,
      featured: false,
    },
    {
      name: 'ThinkPad X1 Carbon',
      slug: 'thinkpad-x1-carbon',
      description: 'Lenovo ThinkPad X1 Carbon Gen 11 — ultra-light business laptop with 14-inch 2.8K OLED, Intel vPro, and military-grade durability.',
      price: 1649.00,
      originalPrice: 1899.00,
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
      rating: 4.6,
      reviewCount: 876,
      categoryId: categories[1].id,
      featured: false,
    },
    {
      name: 'Canon EOS R6 II',
      slug: 'canon-eos-r6-ii',
      description: 'Capture breathtaking 4K videos and high-resolution photos with advanced autofocus and image stabilization. Full-frame mirrorless camera for professionals.',
      price: 2499.00,
      originalPrice: 2799.00,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
      rating: 4.8,
      reviewCount: 1567,
      categoryId: categories[2].id,
      featured: true,
    },
    {
      name: 'Sony A7 IV',
      slug: 'sony-a7-iv',
      description: 'Sony Alpha 7 IV full-frame mirrorless camera with 33MP sensor, 4K 60p video recording, and advanced AI-based autofocus system.',
      price: 2198.00,
      originalPrice: 2498.00,
      image: 'https://images.unsplash.com/photo-1606986628253-e3df5ee9ca5d?w=800&q=80',
      rating: 4.7,
      reviewCount: 2103,
      categoryId: categories[2].id,
      featured: false,
    },
    {
      name: 'GoPro Hero 12',
      slug: 'gopro-hero-12',
      description: 'Action camera that films stunning 5.3K video with HyperSmooth 6.0 stabilization. Waterproof, rugged, and ready for any adventure.',
      price: 399.99,
      originalPrice: 449.99,
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
      rating: 4.4,
      reviewCount: 3456,
      categoryId: categories[2].id,
      featured: false,
    },
    {
      name: 'Apple Watch Ultra 2',
      slug: 'apple-watch-ultra-2',
      description: 'Experience next-gen wearable tech with real-time heart rate tracking, blood oxygen monitoring, GPS, and a rugged titanium design for extreme adventures.',
      price: 799.00,
      originalPrice: 899.00,
      image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=80',
      rating: 4.7,
      reviewCount: 2890,
      categoryId: categories[3].id,
      featured: true,
    },
    {
      name: 'Samsung Galaxy Watch 6',
      slug: 'samsung-galaxy-watch-6',
      description: 'The ultimate fusion of style and technology — premium smartwatch with advanced fitness tracking, sleep monitoring, and seamless smartphone integration.',
      price: 329.99,
      originalPrice: 399.99,
      image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=800&q=80',
      rating: 4.4,
      reviewCount: 1567,
      categoryId: categories[3].id,
      featured: false,
    },
    {
      name: 'Garmin Fenix 7X',
      slug: 'garmin-fenix-7x',
      description: 'Premium multisport GPS watch with solar charging, advanced health monitoring, and military-grade toughness for outdoor enthusiasts and athletes.',
      price: 899.99,
      originalPrice: 999.99,
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80',
      rating: 4.8,
      reviewCount: 789,
      categoryId: categories[3].id,
      featured: false,
    },
    {
      name: 'Dyson Purifier Cool',
      slug: 'dyson-purifier-cool',
      description: 'Premium air purifier and fan with advanced HEPA filtration, air quality monitoring, and efficient whole-room cooling for ultimate home comfort.',
      price: 649.99,
      originalPrice: 749.99,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
      rating: 4.5,
      reviewCount: 1234,
      categoryId: categories[4].id,
      featured: false,
    },
    {
      name: 'Samsung Washing Machine',
      slug: 'samsung-washing-machine',
      description: 'Front-load washing machine with AI-powered fabric care, steam cleaning, and energy-efficient operation. Handles all fabric types with gentle care.',
      price: 899.00,
      originalPrice: 1099.00,
      image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80',
      rating: 4.3,
      reviewCount: 567,
      categoryId: categories[4].id,
      featured: false,
    },
    {
      name: 'LG Refrigerator',
      slug: 'lg-refrigerator',
      description: 'Smart French-door refrigerator with InstaView technology, Door-in-Door design, and smart ThinQ connectivity. Keeps food fresher for longer.',
      price: 2199.00,
      originalPrice: 2599.00,
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=80',
      rating: 4.6,
      reviewCount: 890,
      categoryId: categories[4].id,
      featured: false,
    },
    {
      name: 'PlayStation 5 Pro',
      slug: 'playstation-5-pro',
      description: 'Next-level gaming with enhanced GPU, 2TB SSD, ray tracing, and 8K gaming support. The most powerful PlayStation ever made for immersive experiences.',
      price: 699.99,
      originalPrice: 799.99,
      image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1600&q=80',
      rating: 4.9,
      reviewCount: 5678,
      categoryId: categories[5].id,
      featured: true,
    },
    {
      name: 'Nintendo Switch OLED',
      slug: 'nintendo-switch-oled',
      description: 'Play at home on the TV or on-the-go with a vibrant 7-inch OLED screen. Includes enhanced audio, 64GB storage, and a wide adjustable stand.',
      price: 349.99,
      originalPrice: 399.99,
      image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80',
      rating: 4.7,
      reviewCount: 4532,
      categoryId: categories[5].id,
      featured: false,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  const heroSlides = [
    {
      id: 'slide-0',
      title: 'Experience Pure Sound',
      subtitle: 'Your Perfect Headphones Await!',
      ctaText: 'Buy Now',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80',
      order: 0,
    },
    {
      id: 'slide-1',
      title: 'Next-Level Gaming Starts Here',
      subtitle: 'Discover PlayStation 5 Today!',
      ctaText: 'Shop Now',
      image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1600&q=80',
      order: 1,
    },
    {
      id: 'slide-2',
      title: 'Power Meets Elegance',
      subtitle: 'Apple MacBook Pro is Here for You!',
      ctaText: 'Order Now',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&q=80',
      order: 2,
    },
  ];

  for (const slide of heroSlides) {
    await prisma.heroSlide.upsert({
      where: { id: slide.id },
      update: {},
      create: slide,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
