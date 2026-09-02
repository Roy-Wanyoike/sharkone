import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const deliveries = await prisma.delivery.findMany({
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
