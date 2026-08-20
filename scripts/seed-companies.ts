import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding B2B companies...');

  // Find existing sellers for order items
  const seller = await prisma.seller.findFirst();
  if (!seller) {
    console.log('No seller found. Run main seed first.');
    return;
  }

  const product = await prisma.product.findFirst({ where: { sellerId: seller.id } });
  if (!product) {
    console.log('No product found. Run main seed first.');
    return;
  }

  // Company 1
  const user1 = await prisma.user.create({
    data: {
      name: 'Peter Kamau',
      email: 'peter@nairobitech.co.ke',
      phone: '+254722111222',
      role: 'BUYER',
    },
  });

  await prisma.company.create({
    data: {
      id: user1.id,
      name: 'NairobiTech Solutions Ltd',
      registrationNo: 'BRN-2023-456789',
      email: 'accounts@nairobitech.co.ke',
      phone: '+254722111000',
      county: 'Nairobi',
      city: 'Westlands',
      address: '12th Floor, Westlands Business Park, Waiyaki Way',
      creditLimit: 500000,
      creditUsed: 0,
      paymentTerms: 'NET_30',
      isVerified: true,
    },
  });
  await prisma.user.update({ where: { id: user1.id }, data: { companyId: user1.id } });

  // Company 2
  const user2 = await prisma.user.create({
    data: {
      name: 'Grace Akinyi',
      email: 'grace@mombasaports.co.ke',
      phone: '+254733222333',
      role: 'BUYER',
    },
  });

  await prisma.company.create({
    data: {
      id: user2.id,
      name: 'MombasaPorts Logistics',
      registrationNo: 'BRN-2022-789012',
      email: 'procurement@mombasaports.co.ke',
      phone: '+254733222000',
      county: 'Mombasa',
      city: 'Mvita',
      address: '45 Digo Road, Mombasa',
      creditLimit: 1000000,
      creditUsed: 0,
      paymentTerms: 'NET_60',
      isVerified: true,
    },
  });
  await prisma.user.update({ where: { id: user2.id }, data: { companyId: user2.id } });

  // Company 3
  const user3 = await prisma.user.create({
    data: {
      name: 'David Ochieng',
      email: 'david@kilimanjarofoods.co.tz',
      phone: '+254744333444',
      role: 'BUYER',
    },
  });

  await prisma.company.create({
    data: {
      id: user3.id,
      name: 'Kilimanjaro Foods East Africa',
      registrationNo: 'BRN-2024-345678',
      email: 'orders@kilimanjarofoods.co.tz',
      phone: '+254744333000',
      county: 'Nakuru',
      city: 'Nakuru Central',
      address: '88 Kenyatta Avenue, Nakuru',
      creditLimit: 250000,
      creditUsed: 0,
      paymentTerms: 'NET_15',
      isVerified: false,
    },
  });
  await prisma.user.update({ where: { id: user3.id }, data: { companyId: user3.id } });

  // B2B Order 1 - NairobiTech
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'B2B-2024-001',
      buyerId: user1.id,
      companyId: user1.id,
      poNumber: 'PO-NTS-2024-001',
      totalAmount: 87000,
      deliveryFee: 0,
      platformFee: 870,
      sellerEarnings: 78300,
      shippingAddress: '12th Floor, Westlands Business Park, Waiyaki Way, Nairobi',
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order1.id,
      productId: product.id,
      sellerId: seller.id,
      quantity: 10,
      price: 8700,
      sellerEarnings: 7830,
      status: 'CONFIRMED',
    },
  });

  await prisma.company.update({
    where: { id: user1.id },
    data: { creditUsed: 87000 },
  });

  // B2B Order 2 - MombasaPorts
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'B2B-2024-002',
      buyerId: user2.id,
      companyId: user2.id,
      poNumber: 'PO-MPL-2024-045',
      totalAmount: 215000,
      deliveryFee: 5000,
      platformFee: 2150,
      sellerEarnings: 193500,
      shippingAddress: '45 Digo Road, Mombasa',
      status: 'PROCESSING',
      paymentStatus: 'PENDING',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      productId: product.id,
      sellerId: seller.id,
      quantity: 25,
      price: 8400,
      sellerEarnings: 7560,
      status: 'PROCESSING',
    },
  });

  await prisma.company.update({
    where: { id: user2.id },
    data: { creditUsed: 215000 },
  });

  console.log('B2B seed complete: 3 companies, 2 orders created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
