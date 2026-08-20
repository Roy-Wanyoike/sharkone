import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the first buyer user
  const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
  if (!buyer) {
    console.error('No buyer user found. Run seed.ts first.');
    process.exit(1);
  }

  console.log(`Seeding notifications for buyer: ${buyer.name} (${buyer.id})`);

  // Delete existing notifications for this buyer to avoid duplicates on re-run
  await prisma.notification.deleteMany({ where: { userId: buyer.id } });

  const now = new Date();
  const notifications = [
    {
      userId: buyer.id,
      title: 'Order Confirmed',
      message: 'Your order SHK-847291 has been confirmed and is being prepared by the seller. You will receive a tracking update soon.',
      type: 'ORDER' as NotificationType,
      isRead: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
    },
    {
      userId: buyer.id,
      title: 'Out for Delivery',
      message: 'Your order SHK-847291 is on its way! Expected delivery today between 2 PM - 5 PM. Delivery OTP: 5678',
      type: 'DELIVERY' as NotificationType,
      isRead: false,
      createdAt: new Date(now.getTime() - 15 * 60 * 1000), // 15 min ago
    },
    {
      userId: buyer.id,
      title: 'Payment Received',
      message: 'We received your payment of $349.99 for order SHK-847291 via M-Pesa. Transaction ID: SHK-PAY-99123.',
      type: 'PAYMENT' as NotificationType,
      isRead: false,
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      userId: buyer.id,
      title: 'Flash Sale Starting Soon!',
      message: 'A 30% flash sale on electronics starts in 2 hours. Don\'t miss out on deals from TechHub Electronics and more.',
      type: 'SYSTEM' as NotificationType,
      isRead: false,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
    {
      userId: buyer.id,
      title: 'Order Delivered',
      message: 'Your order SHK-846503 has been delivered successfully. Rate your experience and earn SHARKONE rewards points!',
      type: 'DELIVERY' as NotificationType,
      isRead: true,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      userId: buyer.id,
      title: 'Refund Processed',
      message: 'Your refund of $29.99 for the returned item has been processed and will reflect in your account within 24 hours.',
      type: 'PAYMENT' as NotificationType,
      isRead: true,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  ];

  const result = await prisma.notification.createMany({ data: notifications });
  console.log(`Created ${result.count} notifications for ${buyer.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
