import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');

    if (!orderNumber) {
      return NextResponse.json({ error: 'orderNumber query param is required' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const delivery = await db.delivery.findUnique({
      where: { orderId: order.id },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: { select: { name: true, image: true } },
              },
            },
          },
        },
        deliveryPerson: {
          select: { id: true, name: true, phone: true, avatar: true },
        },
        waypoints: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    let eta: string | null = null;
    let totalDistanceKm = 0;
    let currentSpeedKmh: number | null = null;

    if (delivery.waypoints.length >= 2) {
      for (let i = 1; i < delivery.waypoints.length; i++) {
        const prev = delivery.waypoints[i - 1];
        const curr = delivery.waypoints[i];
        totalDistanceKm += haversineKm(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
      }

      const latest = delivery.waypoints[delivery.waypoints.length - 1];
      if (latest.speed && latest.speed > 0) {
        currentSpeedKmh = latest.speed;
      } else if (delivery.waypoints.length >= 2) {
        const prev = delivery.waypoints[delivery.waypoints.length - 2];
        const timeDiffMs = new Date(latest.timestamp).getTime() - new Date(prev.timestamp).getTime();
        const dist = haversineKm(prev.latitude, prev.longitude, latest.latitude, latest.longitude);
        if (timeDiffMs > 0) {
          currentSpeedKmh = dist / (timeDiffMs / 3600000);
        }
      }

      if (currentSpeedKmh && currentSpeedKmh > 1) {
        const avgRemainingKm = Math.max(1, 15 - totalDistanceKm * 0.3);
        const minutesRemaining = (avgRemainingKm / currentSpeedKmh) * 60;
        const etaDate = new Date(Date.now() + minutesRemaining * 60000);
        eta = etaDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
    }

    return NextResponse.json({
      delivery: {
        id: delivery.id,
        status: delivery.status,
        pickupOtp: delivery.pickupOtp,
        deliveryOtp: delivery.deliveryOtp,
        deliveredAt: delivery.deliveredAt,
        notes: delivery.notes,
        createdAt: delivery.createdAt,
        order: {
          id: delivery.order.id,
          orderNumber: delivery.order.orderNumber,
          totalAmount: delivery.order.totalAmount,
          shippingAddress: delivery.order.shippingAddress,
          createdAt: delivery.order.createdAt,
          items: delivery.order.orderItems.map((item) => ({
            id: item.id,
            name: item.product.name,
            image: item.product.image,
            quantity: item.quantity,
            price: item.price,
          })),
        },
        deliveryPerson: delivery.deliveryPerson
          ? {
              id: delivery.deliveryPerson.id,
              name: delivery.deliveryPerson.name,
              phone: delivery.deliveryPerson.phone,
              avatar: delivery.deliveryPerson.avatar,
            }
          : null,
        waypoints: delivery.waypoints.map((wp) => ({
          id: wp.id,
          latitude: wp.latitude,
          longitude: wp.longitude,
          speed: wp.speed,
          heading: wp.heading,
          timestamp: wp.timestamp,
        })),
      },
      trackingInfo: {
        eta,
        totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
        currentSpeedKmh: currentSpeedKmh ? Math.round(currentSpeedKmh * 100) / 100 : null,
        waypointCount: delivery.waypoints.length,
      },
    });
  } catch (error) {
    console.error('Delivery lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
