import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { DeliveryStatus, OrderStatus } from '@prisma/client';
import { sendTemplatedEmail } from '@/lib/email';
import { registerEmailProviders } from '@/lib/email/register';

const VALID_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.ASSIGNED]: [DeliveryStatus.PICKED_UP],
  [DeliveryStatus.PICKED_UP]: [DeliveryStatus.IN_TRANSIT],
  [DeliveryStatus.IN_TRANSIT]: [DeliveryStatus.NEAR_LOCATION],
  [DeliveryStatus.NEAR_LOCATION]: [DeliveryStatus.DELIVERED],
  [DeliveryStatus.DELIVERED]: [],
  [DeliveryStatus.FAILED]: [],
};

const ORDER_STATUS_MAP: Partial<Record<DeliveryStatus, OrderStatus>> = {
  [DeliveryStatus.PICKED_UP]: OrderStatus.PROCESSING,
  [DeliveryStatus.IN_TRANSIT]: OrderStatus.SHIPPED,
  [DeliveryStatus.NEAR_LOCATION]: OrderStatus.OUT_FOR_DELIVERY,
  [DeliveryStatus.DELIVERED]: OrderStatus.DELIVERED,
};

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliveryId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(DeliveryStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Valid delivery status is required' },
        { status: 400 }
      );
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: { buyer: { select: { email: true, name: true } } },
        },
        courier: { select: { name: true } },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    const allowedTransitions = VALID_TRANSITIONS[delivery.status] || [];
    if (!allowedTransitions.includes(status as DeliveryStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from ${delivery.status} to ${status}` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: status as DeliveryStatus,
    };

    if (status === DeliveryStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }

    await prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    // Update order status if mapped
    const newOrderStatus = ORDER_STATUS_MAP[status as DeliveryStatus];
    if (newOrderStatus) {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: newOrderStatus },
      });
    }

    // Fire-and-forget: send notification emails on key status changes
    try {
      registerEmailProviders();
      const buyer = delivery.order.buyer;
      if (buyer?.email) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        if (status === DeliveryStatus.IN_TRANSIT) {
          sendTemplatedEmail('ORDER_SHIPPED', buyer.email, {
            orderNumber: delivery.order.orderNumber,
            customerName: buyer.name,
            trackingNumber: delivery.courierTrackingId || delivery.id,
            trackingUrl: `${baseUrl}/track?delivery=${delivery.id}`,
            carrier: delivery.courier?.name || null,
          }).catch((err) => console.error('Failed to send shipped email:', err));
        } else if (status === DeliveryStatus.DELIVERED) {
          sendTemplatedEmail('ORDER_DELIVERED', buyer.email, {
            orderNumber: delivery.order.orderNumber,
            customerName: buyer.name,
            reviewUrl: `${baseUrl}/product/${delivery.orderId}`,
          }).catch((err) => console.error('Failed to send delivered email:', err));
        }
      }
    } catch (err) {
      console.error('Failed to dispatch delivery notification email:', err);
    }

    return NextResponse.json({ success: true, deliveryId, status });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery status' },
      { status: 500 }
    );
  }
}
