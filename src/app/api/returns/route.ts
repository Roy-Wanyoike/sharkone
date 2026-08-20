import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ReturnStatus, RefundStatus } from '@prisma/client';
import { audit } from '@/lib/audit';

function generateReturnNumber(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return `RET-${digits}`;
}

const VALID_STATUSES = Object.values(ReturnStatus);
const VALID_REFUND_STATUSES = Object.values(RefundStatus);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('buyerId');
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const where: Record<string, unknown> = {};

    if (buyerId) where.buyerId = buyerId;
    if (sellerId) where.sellerId = sellerId;
    if (status && VALID_STATUSES.includes(status as ReturnStatus)) {
      where.status = status as ReturnStatus;
    }

    const total = await db.returnRequest.count({ where });

    const returns = await db.returnRequest.findMany({
      where,
      include: {
        order: {
          select: { orderNumber: true },
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
      orderItemId: r.orderItemId,
      productName: r.orderItem.product.name,
      productImage: r.orderItem.product.image,
      buyerId: r.buyerId,
      buyerName: r.buyer.name,
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
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, orderItemId, reason, description, buyerId, sellerId } = body;

    if (!orderId || !orderItemId || !reason || !buyerId || !sellerId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, orderItemId, reason, buyerId, sellerId' },
        { status: 400 }
      );
    }

    // Check if an existing return request exists for this order item
    const existingReturn = await db.returnRequest.findUnique({
      where: { orderItemId },
    });
    if (existingReturn) {
      return NextResponse.json(
        { error: 'A return request already exists for this item' },
        { status: 409 }
      );
    }

    // Fetch the order item to calculate refund amount
    const orderItem = await db.orderItem.findUnique({
      where: { id: orderItemId },
    });

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Order item not found' },
        { status: 404 }
      );
    }

    const refundAmount = orderItem.price * orderItem.quantity;

    const returnRequest = await db.returnRequest.create({
      data: {
        returnNumber: generateReturnNumber(),
        orderId,
        orderItemId,
        buyerId,
        sellerId,
        reason,
        description: description || null,
        refundAmount,
        status: 'PENDING',
        refundStatus: 'PENDING',
      },
      include: {
        order: { select: { orderNumber: true } },
        orderItem: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
        buyer: { select: { name: true } },
        seller: { select: { name: true } },
      },
    });

    audit({ userId: buyerId, action: 'CREATE_RETURN', resource: 'return', resourceId: returnRequest.id, details: `Return ${returnRequest.returnNumber}, amount: ${refundAmount}`, req: request });

    return NextResponse.json({
      id: returnRequest.id,
      returnNumber: returnRequest.returnNumber,
      orderId: returnRequest.orderId,
      orderNumber: returnRequest.order.orderNumber,
      orderItemId: returnRequest.orderItemId,
      productName: returnRequest.orderItem.product.name,
      productImage: returnRequest.orderItem.product.image,
      buyerId: returnRequest.buyerId,
      buyerName: returnRequest.buyer.name,
      sellerId: returnRequest.sellerId,
      sellerName: returnRequest.seller.name,
      reason: returnRequest.reason,
      description: returnRequest.description,
      status: returnRequest.status,
      refundAmount: returnRequest.refundAmount,
      refundStatus: returnRequest.refundStatus,
      resolvedAt: returnRequest.resolvedAt,
      adminNotes: returnRequest.adminNotes,
      createdAt: returnRequest.createdAt,
      updatedAt: returnRequest.updatedAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating return request:', error);
    return NextResponse.json(
      { error: 'Failed to create return request' },
      { status: 500 }
    );
  }
}
