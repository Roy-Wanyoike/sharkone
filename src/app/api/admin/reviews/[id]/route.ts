import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: {
          select: { name: true, image: true, sellerId: true },
        },
        user: { select: { name: true, email: true, role: true } },
        response: { include: { seller: { select: { name: true } } } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Fetch seller name
    let sellerName = null;
    if (review.product.sellerId) {
      const seller = await prisma.seller.findUnique({
        where: { id: review.product.sellerId },
        select: { storeName: true },
      });
      sellerName = seller?.storeName ?? null;
    }

    return NextResponse.json({
      ...review,
      reviewerName: review.userName,
      productName: review.product.name,
      sellerName,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isVerified, isFeatured, status } = body;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;
    if (typeof isFeatured === 'boolean') updateData.isFeatured = isFeatured;
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      updateData.status = status;
    }

    const updated = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
