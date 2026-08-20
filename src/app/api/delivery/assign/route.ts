import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    // 1. Find the order by ID, verify it exists and status is PROCESSING or SHIPPED
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PROCESSING' && order.status !== 'SHIPPED') {
      return NextResponse.json(
        { success: false, error: `Order status must be PROCESSING or SHIPPED to assign delivery. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    // Check if delivery already exists for this order
    if (order.delivery) {
      return NextResponse.json({ success: false, error: 'Delivery already assigned for this order' }, { status: 400 });
    }

    // 2. Find all DELIVERY role users
    const drivers = await db.user.findMany({
      where: { role: 'DELIVERY' },
    });

    if (drivers.length === 0) {
      return NextResponse.json({ success: false, error: 'No available drivers' }, { status: 400 });
    }

    // 3. Check which ones already have active deliveries
    const activeDeliveries = await db.delivery.findMany({
      where: {
        status: { notIn: ['DELIVERED', 'FAILED'] },
        deliveryPersonId: { in: drivers.map(d => d.id) },
      },
      select: {
        deliveryPersonId: true,
      },
    });

    const activeDeliveryCountMap = new Map<string, number>();
    for (const ad of activeDeliveries) {
      activeDeliveryCountMap.set(ad.deliveryPersonId, (activeDeliveryCountMap.get(ad.deliveryPersonId) || 0) + 1);
    }

    // Check for failed deliveries per driver
    const failedDeliveries = await db.delivery.findMany({
      where: {
        status: 'FAILED',
        deliveryPersonId: { in: drivers.map(d => d.id) },
      },
      select: {
        deliveryPersonId: true,
      },
    });

    const failedCountMap = new Map<string, number>();
    for (const fd of failedDeliveries) {
      failedCountMap.set(fd.deliveryPersonId, (failedCountMap.get(fd.deliveryPersonId) || 0) + 1);
    }

    // 4. Score each available driver
    const scoredDrivers = drivers.map(driver => {
      const activeCount = activeDeliveryCountMap.get(driver.id) || 0;
      const failedCount = failedCountMap.get(driver.id) || 0;

      // Higher score = better candidate
      // Fewer active deliveries = higher score (subtract active count)
      // No failed deliveries bonus
      let score = 100;
      score -= activeCount * 10;
      if (failedCount > 0) {
        score -= failedCount * 5;
      }

      return { driver, score, activeCount };
    });

    // 5. Pick the best scoring driver
    scoredDrivers.sort((a, b) => b.score - a.score);
    const bestDriver = scoredDrivers[0];

    if (!bestDriver) {
      return NextResponse.json({ success: false, error: 'No available drivers' }, { status: 400 });
    }

    // 7. Generate 4-digit OTPs
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // 6. Create a Delivery record with status=ASSIGNED
    // 8. Update order status to OUT_FOR_DELIVERY
    const [delivery] = await db.$transaction([
      db.delivery.create({
        data: {
          orderId: order.id,
          deliveryPersonId: bestDriver.driver.id,
          status: 'ASSIGNED',
          pickupOtp,
          deliveryOtp,
        },
        include: {
          order: true,
          deliveryPerson: true,
        },
      }),
      db.order.update({
        where: { id: order.id },
        data: { status: 'OUT_FOR_DELIVERY' },
      }),
    ]);

    // 9. Return result
    return NextResponse.json({
      success: true,
      delivery: {
        id: delivery.id,
        orderId: delivery.orderId,
        status: delivery.status,
        pickupOtp: delivery.pickupOtp,
        deliveryOtp: delivery.deliveryOtp,
        createdAt: delivery.createdAt,
      },
      driver: {
        id: bestDriver.driver.id,
        name: bestDriver.driver.name,
        email: bestDriver.driver.email,
        phone: bestDriver.driver.phone,
      },
    });
  } catch (error) {
    console.error('Auto-assign delivery error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
