import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { deliveryPersonId } = body;

    if (!deliveryPersonId) {
      return NextResponse.json({ success: false, error: 'deliveryPersonId is required' }, { status: 400 });
    }

    // Find the delivery
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!delivery) {
      return NextResponse.json({ success: false, error: 'Delivery not found' }, { status: 404 });
    }

    // Verify the new driver exists and is a DELIVERY user
    const newDriver = await prisma.user.findUnique({
      where: { id: deliveryPersonId },
    });

    if (!newDriver || newDriver.role !== 'DELIVERY') {
      return NextResponse.json({ success: false, error: 'Invalid delivery person' }, { status: 400 });
    }

    // Check new driver doesn't have too many active deliveries
    const activeCount = await prisma.delivery.count({
      where: {
        deliveryPersonId,
        status: { notIn: ['DELIVERED', 'FAILED'] },
        id: { not: id }, // Exclude current delivery being reassigned
      },
    });

    // Generate new OTPs
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Update delivery record
    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        deliveryPersonId,
        status: 'ASSIGNED',
        pickupOtp,
        deliveryOtp,
      },
      include: {
        order: {
          include: {
            buyer: { select: { name: true } },
          },
        },
        deliveryPerson: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      delivery: {
        id: updated.id,
        orderId: updated.orderId,
        status: updated.status,
        pickupOtp: updated.pickupOtp,
        deliveryOtp: updated.deliveryOtp,
        createdAt: updated.createdAt,
        order: {
          orderNumber: updated.order.orderNumber,
          buyerName: updated.order.buyer?.name || 'Unknown',
          shippingAddress: updated.order.shippingAddress,
          totalAmount: updated.order.totalAmount,
        },
        deliveryPerson: updated.deliveryPerson
          ? { name: updated.deliveryPerson.name }
          : null,
      },
    });
  } catch (error) {
    console.error('Reassign delivery error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
