import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sharkone.com' },
    update: {},
    create: { email: 'admin@sharkone.com', name: 'Admin', role: 'ADMIN' },
  });

  const buyer1 = await prisma.user.upsert({
    where: { email: 'roy@sharkone.com' },
    update: {},
    create: { email: 'roy@sharkone.com', name: 'Roy Wanyoike', phone: '+254712345678', role: 'BUYER' },
  });

  const buyer2 = await prisma.user.upsert({
    where: { email: 'jane@sharkone.com' },
    update: {},
    create: { email: 'jane@sharkone.com', name: 'Jane Muthoni', role: 'BUYER' },
  });

  // Create sellers
  const sellerUser1 = await prisma.user.upsert({
    where: { email: 'techstore@sharkone.com' },
    update: {},
    create: { email: 'techstore@sharkone.com', name: 'TechHub Store', role: 'SELLER' },
  });
  const seller1 = await prisma.seller.upsert({
    where: { userId: sellerUser1.id },
    update: {},
    create: {
      userId: sellerUser1.id, storeName: 'TechHub Electronics', storeSlug: 'techhub',
      storeDescription: 'Premium electronics and gadgets at the best prices.',
      rating: 4.7, totalSales: 1250, isVerified: true,
    },
  });

  const sellerUser2 = await prisma.user.upsert({
    where: { email: 'fashion@sharkone.com' },
    update: {},
    create: { email: 'fashion@sharkone.com', name: 'StyleZone', role: 'SELLER' },
  });
  const seller2 = await prisma.seller.upsert({
    where: { userId: sellerUser2.id },
    update: {},
    create: {
      userId: sellerUser2.id, storeName: 'StyleZone Fashion', storeSlug: 'stylezone',
      storeDescription: 'Trending fashion and accessories for the modern you.',
      rating: 4.5, totalSales: 890, isVerified: true,
    },
  });

  const sellerUser3 = await prisma.user.upsert({
    where: { email: 'home@sharkone.com' },
    update: {},
    create: { email: 'home@sharkone.com', name: 'HomeEssentials', role: 'SELLER' },
  });
  const seller3 = await prisma.seller.upsert({
    where: { userId: sellerUser3.id },
    update: {},
    create: {
      userId: sellerUser3.id, storeName: 'HomeEssentials KE', storeSlug: 'homeessentials',
      storeDescription: 'Quality home appliances and essentials.',
      rating: 4.3, totalSales: 560, isVerified: true,
    },
  });

  // Delivery users
  const dev1 = await prisma.user.upsert({
    where: { email: 'rider1@sharkone.com' },
    update: {},
    create: { email: 'rider1@sharkone.com', name: 'James Otieno', phone: '+254723456789', role: 'DELIVERY' },
  });
  const dev2 = await prisma.user.upsert({
    where: { email: 'rider2@sharkone.com' },
    update: {},
    create: { email: 'rider2@sharkone.com', name: 'Grace Akinyi', phone: '+254734567890', role: 'DELIVERY' },
  });

  // Create wallets
  for (const s of [seller1, seller2, seller3]) {
    await prisma.wallet.upsert({
      where: { sellerId: s.id },
      update: {},
      create: { sellerId: s.id, balance: Math.random() * 5000 + 1000, totalEarnings: Math.random() * 20000 + 5000 },
    });
  }

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'headphones' }, update: {}, create: { name: 'Headphones', slug: 'headphones', description: 'Premium wireless and wired headphones' } }),
    prisma.category.upsert({ where: { slug: 'laptops' }, update: {}, create: { name: 'Laptops', slug: 'laptops', description: 'High-performance laptops' } }),
    prisma.category.upsert({ where: { slug: 'cameras' }, update: {}, create: { name: 'Cameras', slug: 'cameras', description: 'Professional cameras' } }),
    prisma.category.upsert({ where: { slug: 'smartwatches' }, update: {}, create: { name: 'Smartwatches', slug: 'smartwatches', description: 'Wearable technology' } }),
    prisma.category.upsert({ where: { slug: 'appliances' }, update: {}, create: { name: 'Appliances', slug: 'appliances', description: 'Home appliances' } }),
    prisma.category.upsert({ where: { slug: 'gaming' }, update: {}, create: { name: 'Gaming', slug: 'gaming', description: 'Gaming consoles and accessories' } }),
  ]);

  // Products
  const products = [
    { name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5', description: 'Premium wireless headphones with industry-leading noise cancellation.', price: 349.99, originalPrice: 399.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', rating: 4.8, reviewCount: 2456, sellerId: seller1.id, categoryId: categories[0].id, featured: true },
    { name: 'AirPods Max', slug: 'airpods-max', description: 'Apple AirPods Max deliver high-fidelity audio with active noise cancellation.', price: 549.00, originalPrice: 599.00, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80', rating: 4.6, reviewCount: 1832, sellerId: seller1.id, categoryId: categories[0].id, featured: true },
    { name: 'Bose QC Ultra', slug: 'bose-qc-ultra', description: 'World-class noise-canceling technology for immersive sound.', price: 429.00, originalPrice: 479.00, image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80', rating: 4.7, reviewCount: 987, sellerId: seller1.id, categoryId: categories[0].id },
    { name: 'MacBook Pro 16"', slug: 'macbook-pro-16', description: 'Apple MacBook Pro 16-inch with M3 Max chip for creative professionals.', price: 2499.00, originalPrice: 2799.00, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', rating: 4.9, reviewCount: 3421, sellerId: seller1.id, categoryId: categories[1].id, featured: true },
    { name: 'Dell XPS 15', slug: 'dell-xps-15', description: 'Dell XPS 15 with Intel Core i7 and brilliant 15.6-inch OLED display.', price: 1499.99, originalPrice: 1799.99, image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80', rating: 4.5, reviewCount: 1234, sellerId: seller1.id, categoryId: categories[1].id },
    { name: 'Canon EOS R6 II', slug: 'canon-eos-r6-ii', description: 'Full-frame mirrorless camera for professional photographers.', price: 2499.00, originalPrice: 2799.00, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', rating: 4.8, reviewCount: 1567, sellerId: seller1.id, categoryId: categories[2].id, featured: true },
    { name: 'GoPro Hero 12', slug: 'gopro-hero-12', description: 'Action camera with 5.3K video and HyperSmooth 6.0 stabilization.', price: 399.99, originalPrice: 449.99, image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80', rating: 4.4, reviewCount: 3456, sellerId: seller1.id, categoryId: categories[2].id },
    { name: 'Apple Watch Ultra 2', slug: 'apple-watch-ultra-2', description: 'Next-gen wearable tech with heart rate tracking and GPS.', price: 799.00, originalPrice: 899.00, image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=80', rating: 4.7, reviewCount: 2890, sellerId: seller2.id, categoryId: categories[3].id, featured: true },
    { name: 'Samsung Galaxy Watch 6', slug: 'samsung-galaxy-watch-6', description: 'Premium smartwatch with advanced fitness tracking.', price: 329.99, originalPrice: 399.99, image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=800&q=80', rating: 4.4, reviewCount: 1567, sellerId: seller2.id, categoryId: categories[3].id },
    { name: 'Dyson Purifier Cool', slug: 'dyson-purifier-cool', description: 'Premium air purifier with advanced HEPA filtration.', price: 649.99, originalPrice: 749.99, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80', rating: 4.5, reviewCount: 1234, sellerId: seller3.id, categoryId: categories[4].id },
    { name: 'LG Refrigerator', slug: 'lg-refrigerator', description: 'Smart French-door refrigerator with InstaView technology.', price: 2199.00, originalPrice: 2599.00, image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=80', rating: 4.6, reviewCount: 890, sellerId: seller3.id, categoryId: categories[4].id },
    { name: 'PlayStation 5 Pro', slug: 'playstation-5-pro', description: 'The most powerful PlayStation with 2TB SSD and 8K support.', price: 699.99, originalPrice: 799.99, image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1600&q=80', rating: 4.9, reviewCount: 5678, sellerId: seller1.id, categoryId: categories[5].id, featured: true },
    { name: 'Nintendo Switch OLED', slug: 'nintendo-switch-oled', description: '7-inch OLED screen gaming console for home and on-the-go.', price: 349.99, originalPrice: 399.99, image: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&q=80', rating: 4.7, reviewCount: 4532, sellerId: seller1.id, categoryId: categories[5].id },
    { name: 'Garmin Fenix 7X', slug: 'garmin-fenix-7x', description: 'Multisport GPS watch with solar charging.', price: 899.99, originalPrice: 999.99, image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80', rating: 4.8, reviewCount: 789, sellerId: seller2.id, categoryId: categories[3].id },
    { name: 'JBL Tune 770NC', slug: 'jbl-tune-770nc', description: 'Powerful JBL Pure Bass sound with adaptive noise cancellation.', price: 99.99, originalPrice: 149.99, image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80', rating: 4.3, reviewCount: 567, sellerId: seller1.id, categoryId: categories[0].id },
    { name: 'Samsung Washing Machine', slug: 'samsung-washing-machine', description: 'Front-load washer with AI-powered fabric care.', price: 899.00, originalPrice: 1099.00, image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80', rating: 4.3, reviewCount: 567, sellerId: seller3.id, categoryId: categories[4].id },
    { name: 'Sony A7 IV', slug: 'sony-a7-iv', description: 'Full-frame mirrorless with 33MP sensor and 4K 60p video.', price: 2198.00, originalPrice: 2498.00, image: 'https://images.unsplash.com/photo-1606986628253-e3df5ee9ca5d?w=800&q=80', rating: 4.7, reviewCount: 2103, sellerId: seller1.id, categoryId: categories[2].id },
    { name: 'ThinkPad X1 Carbon', slug: 'thinkpad-x1-carbon', description: 'Ultra-light business laptop with 14-inch 2.8K OLED.', price: 1649.00, originalPrice: 1899.00, image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80', rating: 4.6, reviewCount: 876, sellerId: seller1.id, categoryId: categories[1].id },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }

  // Sample orders
  const allProducts = await prisma.product.findMany();
  const orderProducts = allProducts.slice(0, 3);
  const total = orderProducts.reduce((s, p) => s + p.price, 0);

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'SHK-' + Date.now().toString().slice(-6),
      buyerId: buyer1.id,
      status: 'OUT_FOR_DELIVERY',
      totalAmount: total,
      platformFee: total * 0.05,
      sellerEarnings: total * 0.95,
      deliveryFee: 5.00,
      shippingAddress: '123 Kenyatta Ave, Nairobi, Kenya',
      paymentStatus: 'PAID',
      paidAt: new Date(),
      orderItems: { create: orderProducts.map((p) => ({ productId: p.id, quantity: 1, price: p.price, sellerId: p.sellerId, sellerEarnings: p.price * 0.95 })) },
      delivery: { create: { deliveryPersonId: dev1.id, status: 'IN_TRANSIT', pickupOtp: '1234', deliveryOtp: '5678', notes: 'Handle with care' } },
    },
  });

  await prisma.notification.createMany({
    data: [
      { userId: buyer1.id, title: 'Order Confirmed', message: `Your order ${order1.orderNumber} has been confirmed and is being prepared.`, type: 'ORDER' },
      { userId: buyer1.id, title: 'Out for Delivery', message: `Your order ${order1.orderNumber} is on its way! Delivery OTP: 5678`, type: 'DELIVERY' },
      { userId: dev1.id, title: 'New Delivery Assigned', message: `Pick up order ${order1.orderNumber} from TechHub warehouse.`, type: 'DELIVERY' },
    ],
  });

  // Hero slides
  await prisma.heroSlide.upsert({ where: { id: 'slide-0' }, update: {}, create: { id: 'slide-0', title: 'Shop. Ship. Smile.', subtitle: 'Welcome to SHARKONE — Your Multi-Vendor Marketplace', ctaText: 'Start Shopping', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80', order: 0 } });
  await prisma.heroSlide.upsert({ where: { id: 'slide-1' }, update: {}, create: { id: 'slide-1', title: 'Sell on SHARKONE', subtitle: 'Open your store and reach thousands of buyers across the region.', ctaText: 'Become a Seller', image: 'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=1600&q=80', order: 1 } });
  await prisma.heroSlide.upsert({ where: { id: 'slide-2' }, update: {}, create: { id: 'slide-2', title: 'Fast & Reliable Delivery', subtitle: 'Track your orders in real-time with our verified delivery network.', ctaText: 'Join as Rider', image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1600&q=80', order: 2 } });

  console.log('SHARKONE database seeded successfully!');
  console.log(`  - ${3} Sellers, ${3} Buyers, ${2} Delivery riders, ${18} Products, ${1} Order`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
