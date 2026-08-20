import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DeliveryStatus, OrderStatus } from '@prisma/client';

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

    const delivery = await db.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
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

    await db.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    // Update order status if mapped
    const newOrderStatus = ORDER_STATUS_MAP[status as DeliveryStatus];
    if (newOrderStatus) {
      await db.order.update({
        where: { id: delivery.orderId },
        data: { status: newOrderStatus },
      });
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
