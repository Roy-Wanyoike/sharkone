import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DeliveryStatus, OrderStatus, TransactionStatus, TransactionType } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliveryId } = await params;
    const body = await request.json();
    const { otp } = body;

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    const delivery = await db.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            orderItems: true,
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    if (delivery.deliveryOtp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    if (delivery.status === DeliveryStatus.DELIVERED) {
      return NextResponse.json(
        { error: 'Delivery is already completed' },
        { status: 400 }
      );
    }

    // Update delivery status and set deliveredAt
    await db.delivery.update({
      where: { id: deliveryId },
      data: {
        status: DeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });

    // Update order status
    await db.order.update({
      where: { id: delivery.orderId },
      data: { status: OrderStatus.DELIVERED },
    });

    // Create EARNING transaction for each seller involved
    const sellerEarningsMap = new Map<string, number>();
    for (const item of delivery.order.orderItems) {
      const current = sellerEarningsMap.get(item.sellerId) || 0;
      sellerEarningsMap.set(item.sellerId, current + item.sellerEarnings);
    }

    for (const [sellerId, amount] of sellerEarningsMap) {
      const seller = await db.seller.findUnique({ where: { id: sellerId } });
      if (seller) {
        await db.transaction.create({
          data: {
            userId: seller.userId,
            type: TransactionType.EARNING,
            amount,
            status: TransactionStatus.COMPLETED,
            orderId: delivery.orderId,
            description: `Earnings from order ${delivery.order.orderNumber}`,
          },
        });

        // Update wallet
        await db.wallet.upsert({
          where: { sellerId },
          create: {
            sellerId,
            balance: amount,
            totalEarnings: amount,
            pendingClearance: 0,
          },
          update: {
            balance: { increment: amount },
            totalEarnings: { increment: amount },
          },
        });
      }
    }

    return NextResponse.json({ success: true, deliveryId });
  } catch (error) {
    console.error('Error confirming delivery:', error);
    return NextResponse.json(
      { error: 'Failed to confirm delivery' },
      { status: 500 }
    );
  }
}
