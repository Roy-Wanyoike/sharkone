import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DeliveryStatus } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliveryPersonId } = await params;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const where: Record<string, unknown> = { deliveryPersonId };

    if (statusFilter) {
      where.status = statusFilter as DeliveryStatus;
    }

    const deliveries = await db.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            buyer: {
              select: { name: true, phone: true, email: true },
            },
            orderItems: {
              include: {
                product: {
                  select: { name: true, image: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = deliveries.map((d) => ({
      id: d.id,
      orderId: d.orderId,
      status: d.status,
      pickupOtp: d.pickupOtp,
      deliveryOtp: d.deliveryOtp,
      deliveredAt: d.deliveredAt,
      notes: d.notes,
      createdAt: d.createdAt,
      order: {
        id: d.order.id,
        orderNumber: d.order.orderNumber,
        totalAmount: d.order.totalAmount,
        deliveryFee: d.order.deliveryFee,
        shippingAddress: d.order.shippingAddress,
        paymentStatus: d.order.paymentStatus,
        buyer: d.order.buyer,
        orderItems: d.order.orderItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          productName: item.product.name,
          productImage: item.product.image,
        })),
      },
    }));

    return NextResponse.json({ deliveries: mapped });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}
