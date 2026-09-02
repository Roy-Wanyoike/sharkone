import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, price: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['CANCELLED', 'REFUNDED'].includes(status)) {
      return NextResponse.json(
        { error: 'Only CANCELLED or REFUNDED status updates are supported' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: status as 'CANCELLED' | 'REFUNDED',
        paymentStatus: 'REFUNDED',
      },
    });

    // Decrement B2B credit used for cancelled/refunded orders
    if (order.companyId) {
      await prisma.company.update({
        where: { id: order.companyId },
        data: { creditUsed: { decrement: order.totalAmount } },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
