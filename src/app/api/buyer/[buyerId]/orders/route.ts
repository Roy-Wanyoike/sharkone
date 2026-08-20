import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ buyerId: string }> }
) {
  try {
    const { buyerId } = await params;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const where: Record<string, unknown> = { buyerId };

    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter as OrderStatus;
    }

    const orders = await db.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: { name: true, image: true, slug: true },
            },
            seller: {
              select: { storeName: true },
            },
          },
        },
        delivery: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: o.totalAmount,
      deliveryFee: o.deliveryFee,
      platformFee: o.platformFee,
      shippingAddress: o.shippingAddress,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      itemCount: o.orderItems.length,
      orderItems: o.orderItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        productName: item.product.name,
        productImage: item.product.image,
        productSlug: item.product.slug,
        sellerName: item.seller.storeName,
      })),
      deliveryStatus: o.delivery?.status ?? null,
    }));

    return NextResponse.json({ orders: mapped });
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
