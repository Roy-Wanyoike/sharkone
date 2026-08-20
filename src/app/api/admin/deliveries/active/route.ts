import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const deliveries = await db.delivery.findMany({
      where: {
        status: { in: ['IN_TRANSIT', 'NEAR_LOCATION'] },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
          },
        },
        deliveryPerson: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        waypoints: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const activeDeliveries = deliveries.map((d) => ({
      id: d.id,
      status: d.status,
      orderNumber: d.order.orderNumber,
      deliveryPerson: d.deliveryPerson
        ? {
            id: d.deliveryPerson.id,
            name: d.deliveryPerson.name,
            phone: d.deliveryPerson.phone,
          }
        : null,
      latestWaypoint: d.waypoints[0]
        ? {
            latitude: d.waypoints[0].latitude,
            longitude: d.waypoints[0].longitude,
            speed: d.waypoints[0].speed,
            heading: d.waypoints[0].heading,
            timestamp: d.waypoints[0].timestamp,
          }
        : null,
      updatedAt: d.updatedAt,
    }));

    return NextResponse.json({ deliveries: activeDeliveries });
  } catch (error) {
    console.error('Get active deliveries error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
