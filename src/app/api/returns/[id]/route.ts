import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ReturnStatus } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          select: { orderNumber: true, totalAmount: true, status: true, shippingAddress: true },
        },
        orderItem: {
          include: {
            product: {
              select: { name: true, image: true, price: true },
            },
          },
        },
        buyer: {
          select: { name: true, email: true, phone: true },
        },
        seller: {
          select: { name: true, email: true },
        },
      },
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: returnRequest.id,
      returnNumber: returnRequest.returnNumber,
      orderId: returnRequest.orderId,
      orderNumber: returnRequest.order.orderNumber,
      orderItemId: returnRequest.orderItemId,
      productName: returnRequest.orderItem.product.name,
      productImage: returnRequest.orderItem.product.image,
      productPrice: returnRequest.orderItem.product.price,
      buyerId: returnRequest.buyerId,
      buyerName: returnRequest.buyer.name,
      buyerEmail: returnRequest.buyer.email,
      buyerPhone: returnRequest.buyer.phone,
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
      order: {
        orderNumber: returnRequest.order.orderNumber,
        totalAmount: returnRequest.order.totalAmount,
        status: returnRequest.order.status,
        shippingAddress: returnRequest.order.shippingAddress,
      },
    });
  } catch (error) {
    console.error('Error fetching return request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch return request' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const validTransitions: Partial<Record<string, ReturnStatus>> = {
      PENDING: 'APPROVED',
      APPROVED: 'REJECTED',
    };

    const existing = await prisma.returnRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Return request not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      status: status as ReturnStatus,
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    // When APPROVED, create a REFUND transaction
    if (status === 'APPROVED') {
      await prisma.transaction.create({
        data: {
          userId: existing.buyerId,
          type: 'REFUND',
          amount: existing.refundAmount,
          status: 'PENDING',
          orderId: existing.orderId,
          description: `Refund for return ${existing.returnNumber}`,
        },
      });
      updateData.refundStatus = 'PROCESSING';
    }

    // When REJECTED, keep refund as pending (no refund)
    if (status === 'REJECTED') {
      updateData.refundStatus = 'FAILED';
      updateData.resolvedAt = new Date();
    }

    // When COMPLETED, mark refund as completed
    if (status === 'COMPLETED') {
      updateData.refundStatus = 'COMPLETED';
      updateData.resolvedAt = new Date();

      // Update the related transaction to COMPLETED
      const transaction = await prisma.transaction.findFirst({
        where: {
          orderId: existing.orderId,
          type: 'REFUND',
          userId: existing.buyerId,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (transaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'COMPLETED' },
        });
      }
    }

    // When CANCELLED
    if (status === 'CANCELLED') {
      updateData.refundStatus = 'FAILED';
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.returnRequest.update({
      where: { id },
      data: updateData,
      include: {
        order: { select: { orderNumber: true } },
        orderItem: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      id: updated.id,
      returnNumber: updated.returnNumber,
      orderId: updated.orderId,
      orderNumber: updated.order.orderNumber,
      orderItemId: updated.orderItemId,
      productName: updated.orderItem.product.name,
      productImage: updated.orderItem.product.image,
      buyerId: updated.buyerId,
      buyerName: updated.buyer.name,
      sellerId: updated.sellerId,
      sellerName: updated.seller.name,
      reason: updated.reason,
      description: updated.description,
      status: updated.status,
      refundAmount: updated.refundAmount,
      refundStatus: updated.refundStatus,
      resolvedAt: updated.resolvedAt,
      adminNotes: updated.adminNotes,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Error updating return request:', error);
    return NextResponse.json(
      { error: 'Failed to update return request' },
      { status: 500 }
    );
  }
}
