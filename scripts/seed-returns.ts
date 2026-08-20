import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateReturnNumber(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return `RET-${digits}`;
}

async function main() {
  // Find a buyer
  const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
  if (!buyer) {
    console.error('No buyer found. Run seed.ts first.');
    process.exit(1);
  }

  // Find orders with order items for this buyer
  const orders = await prisma.order.findMany({
    where: { buyerId: buyer.id },
    include: {
      orderItems: {
        include: {
          product: { select: { name: true } },
          seller: { select: { userId: true } },
        },
      },
    },
  });

  if (orders.length === 0) {
    console.error('No orders found. Run seed.ts first.');
    process.exit(1);
  }

  // Collect usable order items (no existing return requests)
  const allItems = orders.flatMap((o) =>
    o.orderItems.map((item) => ({ ...item, orderNumber: o.orderNumber, orderId: o.id }))
  );

  const existingReturns = await prisma.returnRequest.findMany({
    select: { orderItemId: true },
  });
  const usedItemIds = new Set(existingReturns.map((r) => r.orderItemId));
  const availableItems = allItems.filter((item) => !usedItemIds.has(item.id));

  if (availableItems.length < 2) {
    // Create some dummy orders/items if needed
    console.log('Not enough available order items. Creating additional orders...');

    const sellerUser = await prisma.user.findFirst({ where: { role: 'SELLER' } });
    if (!sellerUser) {
      console.error('No seller found.');
      process.exit(1);
    }

    const product = await prisma.product.findFirst();
    if (!product) {
      console.error('No products found.');
      process.exit(1);
    }

    const seller = await prisma.seller.findFirst({ where: { userId: sellerUser.id } });

    // Create a delivered order with multiple items
    const newOrder = await prisma.order.create({
      data: {
        orderNumber: 'SHK-' + Date.now().toString().slice(-6),
        buyerId: buyer.id,
        status: 'DELIVERED',
        totalAmount: product.price * 3,
        platformFee: product.price * 3 * 0.05,
        sellerEarnings: product.price * 3 * 0.95,
        deliveryFee: 5.0,
        shippingAddress: '456 Moi Avenue, Mombasa, Kenya',
        paymentStatus: 'PAID',
        paidAt: new Date(),
        orderItems: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              price: product.price,
              sellerId: seller?.id || sellerUser.id,
              sellerEarnings: product.price * 0.95,
            },
          ],
        },
      },
      include: { orderItems: true },
    });

    availableItems.push(
      ...newOrder.orderItems.map((item) => ({
        ...item,
        orderNumber: newOrder.orderNumber,
        orderId: newOrder.id,
        product: { name: product.name },
        seller: { userId: sellerUser.id },
      }))
    );
  }

  // Get a second buyer if available
  const buyer2 = await prisma.user.findFirst({
    where: { role: 'BUYER', id: { not: buyer.id } },
  });

  // Get seller user IDs from items
  const sellerIdMap = new Map<string, string>();
  for (const item of availableItems) {
    if (!sellerIdMap.has(item.sellerId)) {
      const seller = await prisma.seller.findUnique({
        where: { id: item.sellerId },
        select: { userId: true },
      });
      if (seller) sellerIdMap.set(item.sellerId, seller.userId);
    }
  }

  // Define return data in various states
  const returnData = [
    {
      reason: 'Defective',
      description: 'The left earpiece stopped working after 2 days of use.',
      status: 'PENDING' as const,
      refundStatus: 'PENDING' as const,
      resolvedAt: null,
      adminNotes: null,
    },
    {
      reason: 'Wrong Item',
      description: 'Received a different color than what was ordered.',
      status: 'APPROVED' as const,
      refundStatus: 'PROCESSING' as const,
      resolvedAt: null,
      adminNotes: 'Return approved. Awaiting pickup.',
    },
    {
      reason: 'Not as Described',
      description: 'Product specifications do not match the listing. Returning for full refund.',
      status: 'COMPLETED' as const,
      refundStatus: 'COMPLETED' as const,
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      adminNotes: 'Refund processed successfully.',
    },
    {
      reason: 'Changed Mind',
      description: 'No longer need this item.',
      status: 'REJECTED' as const,
      refundStatus: 'PENDING' as const,
      resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      adminNotes: 'Return rejected. Item does not qualify for return under changed mind policy after 7 days.',
    },
  ];

  const createdReturns = [];

  for (let i = 0; i < Math.min(returnData.length, availableItems.length); i++) {
    const item = availableItems[i];
    const data = returnData[i];
    const sellerUserId = sellerIdMap.get(item.sellerId) || buyer.id;
    const useBuyer = i < 3 ? buyer : (buyer2 || buyer);

    // Adjust orderId for buyer2's items if needed
    let targetItemId = item.id;
    let targetOrderId = item.orderId;

    const returnRequest = await prisma.returnRequest.create({
      data: {
        returnNumber: generateReturnNumber(),
        orderId: targetOrderId,
        orderItemId: targetItemId,
        buyerId: useBuyer.id,
        sellerId: sellerUserId,
        reason: data.reason,
        description: data.description,
        status: data.status,
        refundAmount: item.price * item.quantity,
        refundStatus: data.refundStatus,
        resolvedAt: data.resolvedAt,
        adminNotes: data.adminNotes,
      },
    });

    createdReturns.push(returnRequest);
    console.log(
      `  Created ${returnRequest.returnNumber}: ${data.status} | ${data.reason} | KES ${(item.price * item.quantity).toLocaleString()}`
    );
  }

  console.log(`\n✅ Seeded ${createdReturns.length} return requests successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
