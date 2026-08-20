import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ReturnStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const where: Record<string, unknown> = {};

    if (status && status !== 'ALL') {
      where.status = status as ReturnStatus;
    }

    const total = await db.returnRequest.count({ where });

    const returns = await db.returnRequest.findMany({
      where,
      include: {
        order: {
          select: { orderNumber: true, status: true },
        },
        orderItem: {
          include: {
            product: {
              select: { name: true, image: true },
            },
          },
        },
        buyer: {
          select: { name: true, email: true },
        },
        seller: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const mapped = returns.map((r) => ({
      id: r.id,
      returnNumber: r.returnNumber,
      orderId: r.orderId,
      orderNumber: r.order.orderNumber,
      orderStatus: r.order.status,
      orderItemId: r.orderItemId,
      productName: r.orderItem.product.name,
      productImage: r.orderItem.product.image,
      buyerId: r.buyerId,
      buyerName: r.buyer.name,
      buyerEmail: r.buyer.email,
      sellerId: r.sellerId,
      sellerName: r.seller.name,
      reason: r.reason,
      description: r.description,
      status: r.status,
      refundAmount: r.refundAmount,
      refundStatus: r.refundStatus,
      resolvedAt: r.resolvedAt,
      adminNotes: r.adminNotes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json({
      returns: mapped,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching admin returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}
