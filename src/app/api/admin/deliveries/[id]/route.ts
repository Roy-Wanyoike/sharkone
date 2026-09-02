import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            buyer: {
              select: { id: true, name: true, email: true, phone: true },
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
        deliveryPerson: {
          select: { id: true, name: true, email: true, phone: true, avatar: true },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    return NextResponse.json({ delivery });
  } catch (error) {
    console.error('Get delivery detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const delivery = await prisma.delivery.findUnique({ where: { id } });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // If status is being set to DELIVERED, set deliveredAt
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          include: {
            buyer: {
              select: { name: true },
            },
          },
        },
        deliveryPerson: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    // If setting to DELIVERED, update order status too
    if (status === 'DELIVERED') {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' },
      });
    }

    // If setting to FAILED, update order status too
    if (status === 'FAILED') {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'PROCESSING' },
      });
    }

    return NextResponse.json({ delivery: updated });
  } catch (error) {
    console.error('Update delivery error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
