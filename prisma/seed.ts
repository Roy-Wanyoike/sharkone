/**
 * SHARKONE Database Seed Script
 * 
 * Creates demo users, categories, products, sellers, and other seed data.
 * All passwords are hashed using SHA-256 + random salt (hex format).
 * 
 * Usage: npx prisma db seed
 * Reset:  prisma db push --force-reset && npx prisma db seed
 */

import { PrismaClient, UserRole, ProductStatus, PostStatus, ReviewStatus, CouponType, OrderStatus, PaymentStatus, NotificationType, BannerPosition } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Helpers
// ============================================================

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSalt(length = 16) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

async function hashPassword(password) {
  const salt = generateSalt();
  const saltHex = toHex(salt);
  const data = new TextEncoder().encode(saltHex + ':' + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return `${saltHex}:${toHex(hash)}`;
}

async function createUser(email, name, password, role, phone) {
  return prisma.user.upsert({
    where: { email },
    update: { password: await hashPassword(password) },
    create: { email, name, password: await hashPassword(password), role, phone: phone || null },
  });
}

// ============================================================
// Seed Data
// ============================================================

const DEMO_PASSWORD = 'password123';

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', image: '/placeholder-category.jpg', description: 'Phones, laptops, gadgets and more' },
  { name: 'Fashion', slug: 'fashion', image: '/placeholder-category.jpg', description: 'Clothing, shoes, accessories' },
  { name: 'Home & Living', slug: 'home-living', image: '/placeholder-category.jpg', description: 'Furniture, decor, kitchen essentials' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', image: '/placeholder-category.jpg', description: 'Fitness gear, outdoor equipment' },
  { name: 'Beauty & Health', slug: 'beauty-health', image: '/placeholder-category.jpg', description: 'Skincare, makeup, wellness' },
  { name: 'Books & Stationery', slug: 'books-stationery', image: '/placeholder-category.jpg', description: 'Books, notebooks, office supplies' },
];

const PRODUCTS = [
  { name: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra', description: 'The ultimate Galaxy experience with AI features', price: 145000, categoryId: 'electronics', image: '/placeholder-product.jpg', stock: 25 },
  { name: 'iPhone 15 Pro Max', slug: 'iphone-15-pro-max', description: 'Titanium design with A17 Pro chip', price: 185000, categoryId: 'electronics', image: '/placeholder-product.jpg', stock: 15 },
  { name: 'MacBook Air M3', slug: 'macbook-air-m3', description: 'Supercharged by M3 chip', price: 175000, categoryId: 'electronics', image: '/placeholder-product.jpg', stock: 10 },
  { name: 'Wireless Earbuds Pro', slug: 'wireless-earbuds-pro', description: 'Active noise cancellation with 30hr battery', price: 8500, categoryId: 'electronics', image: '/placeholder-product.jpg', stock: 100 },
  { name: 'Dell XPS 15 Laptop', slug: 'dell-xps-15', description: '15.6" OLED display, Intel i7, 16GB RAM', price: 165000, categoryId: 'electronics', image: '/placeholder-product.jpg', stock: 8 },
  { name: 'Smart Watch Ultra', slug: 'smart-watch-ultra', description: 'GPS, health tracking, 5-day battery', price: 32000, categoryId: 'electronics', image: '/placeholder-product.jpg', stock: 30 },
  { name: 'Denim Jacket - Classic Fit', slug: 'denim-jacket-classic', description: 'Timeless denim jacket for all seasons', price: 4500, categoryId: 'fashion', image: '/placeholder-product.jpg', stock: 50 },
  { name: 'Running Shoes Pro', slug: 'running-shoes-pro', description: 'Lightweight cushioning for marathon running', price: 12000, categoryId: 'sports-outdoors', image: '/placeholder-product.jpg', stock: 40 },
  { name: 'Yoga Mat Premium', slug: 'yoga-mat-premium', description: 'Eco-friendly non-slip yoga mat, 6mm', price: 3500, categoryId: 'sports-outdoors', image: '/placeholder-product.jpg', stock: 60 },
  { name: 'Coffee Maker Deluxe', slug: 'coffee-maker-deluxe', description: '12-cup programmable coffee maker', price: 9800, categoryId: 'home-living', image: '/placeholder-product.jpg', stock: 20 },
  { name: 'Skincare Set - Glow Pack', slug: 'skincare-glow-pack', description: 'Complete skincare routine with cleanser, serum, moisturizer', price: 5500, categoryId: 'beauty-health', image: '/placeholder-product.jpg', stock: 35 },
  { name: 'Wireless Charging Pad', slug: 'wireless-charging-pad', description: '15W fast wireless charger', price: 2500, categoryId: 'electronics', image: '/placeholder-product.jpg', stock: 80 },
  { name: 'Office Desk Chair', slug: 'office-desk-chair', description: 'Ergonomic mesh chair with lumbar support', price: 28000, categoryId: 'home-living', image: '/placeholder-product.jpg', stock: 12 },
  { name: 'Leather Wallet - Bi-fold', slug: 'leather-wallet-bifold', description: 'Genuine leather bi-fold wallet with RFID protection', price: 3200, categoryId: 'fashion', image: '/placeholder-product.jpg', stock: 45 },
  { name: 'Bluetooth Speaker Portable', slug: 'bluetooth-speaker-portable', description: 'Waterproof IPX7, 20hr playtime', price: 6500, categoryId: 'electronics', image: '/placeholder-product.jpg', stock: 55 },
  { name: 'Novel Collection Box Set', slug: 'novel-collection-box', description: 'Curated box set of 5 bestselling novels', price: 4200, categoryId: 'books-stationery', image: '/placeholder-product.jpg', stock: 25 },
  { name: 'TWS Neckband Earphones', slug: 'tws-neckband-earphones', description: 'Magnetic earbuds with 24hr battery', price: 3800, categoryId: 'electronics', image: '/placeholder-product.jpg', stock: 70 },
  { name: 'Fitness Dumbbell Set', slug: 'fitness-dumbbell-set', description: 'Adjustable 5-25kg dumbbell pair', price: 15000, categoryId: 'sports-outdoors', image: '/placeholder-product.jpg', stock: 18 },
];

// ============================================================
// Main Seed Function
// ============================================================

async function main() {
  console.log('Seeding SHARKONE database...');

  // --- 1. Users ---
  console.log('  Creating users...');
  const admin = await createUser('admin@sharkone.com', 'Admin', DEMO_PASSWORD, 'ADMIN');
  const roy = await createUser('roy@sharkone.com', 'Roy Wanyoike', DEMO_PASSWORD, 'BUYER', '+254712345678');
  const jane = await createUser('jane@sharkone.com', 'Jane Muthoni', DEMO_PASSWORD, 'BUYER', '+254723456789');
  const techSeller = await createUser('techstore@sharkone.com', 'TechHub Store', DEMO_PASSWORD, 'SELLER', '+254734567890');
  const fashionSeller = await createUser('fashion@sharkone.com', 'StyleZone', DEMO_PASSWORD, 'SELLER', '+254745678901');
  const homeSeller = await createUser('home@sharkone.com', 'HomeEssentials', DEMO_PASSWORD, 'SELLER', '+254756789012');
  const rider1 = await createUser('rider1@sharkone.com', 'James Otieno', DEMO_PASSWORD, 'DELIVERY', '+254767890123');
  const rider2 = await createUser('rider2@sharkone.com', 'Grace Akinyi', DEMO_PASSWORD, 'DELIVERY', '+254778901234');
  const peter = await createUser('peter@nairobitech.co.ke', 'Peter Kamau', DEMO_PASSWORD, 'BUYER', '+254789012345');
  const grace = await createUser('grace@mombasaports.co.ke', 'Grace Akinyi', DEMO_PASSWORD, 'BUYER', '+254790123456');
  console.log('    Created 10 users');

  // --- 2. Sellers ---
  console.log('  Creating sellers...');
  const seller1 = await prisma.seller.upsert({
    where: { userId: techSeller.id }, update: {},
    create: { userId: techSeller.id, storeName: 'TechHub Electronics', storeSlug: 'techhub-electronics', isVerified: true, rating: 4.8, totalSales: 1250 },
  });
  const seller2 = await prisma.seller.upsert({
    where: { userId: fashionSeller.id }, update: {},
    create: { userId: fashionSeller.id, storeName: 'StyleZone Fashion', storeSlug: 'stylezone-fashion', isVerified: true, rating: 4.5, totalSales: 890 },
  });
  const seller3 = await prisma.seller.upsert({
    where: { userId: homeSeller.id }, update: {},
    create: { userId: homeSeller.id, storeName: 'HomeEssentials KE', storeSlug: 'homeessentials-ke', isVerified: false, rating: 4.2, totalSales: 450 },
  });
  console.log('    Created 3 sellers');

  // --- 3. Categories ---
  console.log('  Creating categories...');
  const categoryMap = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: { name: cat.name, slug: cat.slug, image: cat.image, description: cat.description },
    });
    categoryMap[cat.slug] = created.id;
  }
  console.log(`    Created ${CATEGORIES.length} categories`);

  // --- 4. Products ---
  console.log('  Creating products...');
  for (const p of PRODUCTS) {
    const catId = categoryMap[p.categoryId];
    if (!catId) continue;
    const sellerId = p.categoryId === 'fashion' ? seller2.id : p.categoryId === 'home-living' ? seller3.id : seller1.id;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { name: p.name, description: p.description, price: p.price, stock: p.stock, image: p.image },
      create: { name: p.name, slug: p.slug, description: p.description, price: p.price, stock: p.stock, image: p.image, status: ProductStatus.ACTIVE, categoryId: catId, sellerId },
    });
  }
  console.log(`    Created ${PRODUCTS.length} products`);

  // --- 5. Hero Slides ---
  console.log('  Creating hero slides...');
  const heroSlides = [
    { title: 'New Arrivals', subtitle: 'Check out the latest electronics and gadgets', ctaText: 'Shop Now', ctaLink: '/search?q=electronics', image: '/placeholder-hero.jpg', order: 0, active: true },
    { title: 'Flash Sales', subtitle: 'Up to 50% off on selected items', ctaText: 'View Deals', ctaLink: '/search?sale=true', image: '/placeholder-hero.jpg', order: 1, active: true },
    { title: 'Free Delivery', subtitle: 'On orders above KSh 5,000 across Kenya', ctaText: 'Learn More', ctaLink: '/about', image: '/placeholder-hero.jpg', order: 2, active: true },
  ];
  for (const slide of heroSlides) {
    await prisma.heroSlide.upsert({
      where: { id: `hero-${slide.order}` },
      update: { title: slide.title, subtitle: slide.subtitle, ctaText: slide.ctaText, ctaLink: slide.ctaLink, image: slide.image },
      create: { id: `hero-${slide.order}`, ...slide },
    });
  }
  console.log(`    Created ${heroSlides.length} hero slides`);

  // --- 6. Coupons ---
  console.log('  Creating coupons...');
  const coupons = [
    { code: 'WELCOME10', type: CouponType.PERCENTAGE, value: 10, minOrderValue: 1000, usageLimit: 100, isActive: true, description: '10% off for new users' },
    { code: 'FREEDELIVERY', type: CouponType.FREE_SHIPPING, value: 0, minOrderValue: 5000, usageLimit: 50, isActive: true, description: 'Free delivery on orders above KSh 5,000' },
    { code: 'SAVE500', type: CouponType.FIXED_AMOUNT, value: 500, minOrderValue: 3000, usageLimit: 200, isActive: true, description: 'KSh 500 off on orders above KSh 3,000' },
    { code: 'FLASH25', type: CouponType.PERCENTAGE, value: 25, minOrderValue: 2000, usageLimit: 30, isActive: true, description: '25% off flash sale coupon' },
    { code: 'LOYALTY15', type: CouponType.PERCENTAGE, value: 15, minOrderValue: 1500, usageLimit: 75, isActive: true, description: '15% loyalty discount' },
  ];
  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: { type: coupon.type, value: coupon.value, minOrderValue: coupon.minOrderValue, usageLimit: coupon.usageLimit, isActive: coupon.isActive, description: coupon.description },
      create: { ...coupon, usageCount: 0, validFrom: new Date(), validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
    });
  }
  console.log(`    Created ${coupons.length} coupons`);

  // --- 7. Sample Reviews ---
  console.log('  Creating sample reviews...');
  const products = await prisma.product.findMany({ take: 5 });
  const buyers = [roy, jane, peter, grace];
  const reviewTexts = ['Great product! Fast delivery.', 'Excellent quality, would buy again.', 'Good value for money.', 'Shipping was quick and packaging was secure.', 'Exactly as described. Very satisfied!'];
  let reviewCount = 0;
  for (const product of products) {
    for (const buyer of buyers.slice(0, 3)) {
      const rating = Math.floor(Math.random() * 2) + 4;
      const text = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
      await prisma.review.upsert({
        where: { id: `review-${product.id}-${buyer.id}` }, update: {},
        create: { id: `review-${product.id}-${buyer.id}`, productId: product.id, userId: buyer.id, userName: buyer.name, rating, title: 'Good purchase', comment: text, status: ReviewStatus.APPROVED },
      });
      reviewCount++;
    }
  }
  console.log(`    Created ${reviewCount} reviews`);

  // --- 8. Blog Posts ---
  console.log('  Creating blog posts...');
  const blogPosts = [
    { slug: 'getting-started-online-shopping-kenya', title: 'Getting Started with Online Shopping in Kenya', content: 'Online shopping in Kenya has grown rapidly. Here is your complete guide to getting started with SHARKONE.', status: PostStatus.PUBLISHED, author: 'SHARKONE Team' },
    { slug: 'top-electronics-2025', title: 'Top 10 Electronics to Buy in 2025', content: 'From smartphones to laptops, these are the must-have electronics this year.', status: PostStatus.PUBLISHED, author: 'SHARKONE Team' },
    { slug: 'seller-guide-sharkone', title: 'How to Start Selling on SHARKONE', content: 'A step-by-step guide for new sellers to set up their store and start earning.', status: PostStatus.PUBLISHED, author: 'SHARKONE Team' },
    { slug: 'delivery-tracking-explained', title: 'Understanding SHARKONE Delivery Tracking', content: 'Learn how to track your orders in real-time with our advanced tracking system.', status: PostStatus.PUBLISHED, author: 'SHARKONE Team' },
    { slug: 'secure-payments-mpesa', title: 'How M-Pesa Payments Work on SHARKONE', content: 'A detailed look at how we integrate M-Pesa for seamless and secure payments.', status: PostStatus.DRAFT, author: 'SHARKONE Team' },
    { slug: 'customer-returns-policy', title: 'SHARKONE Returns and Refund Policy', content: 'Everything you need to know about our hassle-free returns process.', status: PostStatus.PUBLISHED, author: 'SHARKONE Team' },
  ];
  for (const post of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: { title: post.title, content: post.content, status: post.status },
      create: { slug: post.slug, title: post.title, content: post.content, status: post.status, author: post.author, excerpt: post.content.slice(0, 120) + '...', coverImage: '/placeholder-blog.jpg' },
    });
  }
  console.log(`    Created ${blogPosts.length} blog posts`);

  // --- 9. Warehouses ---
  console.log('  Creating warehouses...');
  await prisma.warehouse.upsert({
    where: { id: 'wh-nairobi' }, update: {},
    create: { id: 'wh-nairobi', name: 'Nairobi Main Warehouse', code: 'WH-NBO', address: 'Mombasa Road, Industrial Area', city: 'Nairobi', county: 'Nairobi', latitude: -1.2921, longitude: 36.8219 },
  });
  await prisma.warehouse.upsert({
    where: { id: 'wh-mombasa' }, update: {},
    create: { id: 'wh-mombasa', name: 'Mombasa Distribution Center', code: 'WH-MSA', address: 'Digo Road, Mombasa', city: 'Mombasa', county: 'Mombasa', latitude: -4.0435, longitude: 39.6682 },
  });
  console.log('    Created 2 warehouses');

  // --- 10. Banners ---
  console.log('  Creating banners...');
  const bannerData = [
    { id: 'banner-1', title: 'Super Sale Weekend', image: '/placeholder-banner.jpg', link: '/search?sale=true', position: BannerPosition.HERO, active: true },
    { id: 'banner-2', title: 'New Seller? Start Free', image: '/placeholder-banner.jpg', link: '/sell', position: BannerPosition.HERO, active: true },
    { id: 'banner-3', title: 'Free Delivery Week', image: '/placeholder-banner.jpg', link: '/about', position: BannerPosition.FOOTER, active: true },
    { id: 'banner-4', title: 'Download Our App', image: '/placeholder-banner.jpg', link: '#', position: BannerPosition.SIDEBAR, active: false },
  ];
  for (const b of bannerData) {
    await prisma.banner.upsert({
      where: { id: b.id },
      update: { title: b.title, link: b.link, position: b.position, active: b.active },
      create: b,
    });
  }
  console.log(`    Created ${bannerData.length} banners`);

  // --- 11. Sample Orders ---
  console.log('  Creating sample orders...');
  const firstProduct = products[0];
  if (firstProduct) {
    for (const buyer of [roy, jane]) {
      const orderId = `order-seed-${buyer.id}`;
      const orderNumber = `SHK-${Date.now().toString(36).toUpperCase()}`;
      await prisma.order.upsert({
        where: { id: orderId }, update: {},
        create: {
          id: orderId, orderNumber, buyerId: buyer.id,
          status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID,
          totalAmount: firstProduct.price, shippingAddress: 'Nairobi, Kenya',
          orderItems: { create: { productId: firstProduct.id, quantity: 1, price: firstProduct.price, sellerId: seller1.id } },
        },
      });
    }
  }
  console.log('    Created sample orders');

  // --- 12. Notifications ---
  console.log('  Creating sample notifications...');
  const notifs = [
    { type: NotificationType.ORDER as string, title: 'Order Delivered', message: 'Your order has been delivered successfully!' },
    { type: NotificationType.SYSTEM as string, title: 'Welcome to SHARKONE', message: 'Explore thousands of products at great prices.' },
    { type: NotificationType.PAYMENT as string, title: 'Payment Confirmed', message: 'Your payment of KSh 145,000 has been confirmed.' },
  ];
  for (const n of notifs) {
    await prisma.notification.upsert({
      where: { id: `notif-${roy.id}-${n.type}` }, update: {},
      create: { id: `notif-${roy.id}-${n.type}`, userId: roy.id, type: n.type, title: n.title, message: n.message, isRead: false },
    });
  }
  console.log(`    Created ${notifs.length} notifications`);

  console.log('\nSeed complete! Demo accounts:');
  console.log('  roy@sharkone.com        / password123  (BUYER + multi-role)');
  console.log('  admin@sharkone.com       / password123  (ADMIN)');
  console.log('  techstore@sharkone.com   / password123  (SELLER)');
  console.log('  fashion@sharkone.com    / password123  (SELLER)');
  console.log('  home@sharkone.com       / password123  (SELLER)');
  console.log('  rider1@sharkone.com     / password123  (DELIVERY)');
  console.log('  rider2@sharkone.com     / password123  (DELIVERY)');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
