import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sellerId: string; reviewId: string }> }
) {
  try {
    const user = await requireAuth('SELLER');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sellerId, reviewId } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Verify the authenticated user is the seller
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      select: { userId: true },
    });
    if (!seller || seller.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the review and verify the seller owns the product being reviewed
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: { select: { sellerId: true } } },
    });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (review.product.sellerId !== sellerId) {
      return NextResponse.json({ error: 'You can only respond to reviews of your own products' }, { status: 403 });
    }

    // Check if a response already exists
    const existing = await prisma.reviewResponse.findUnique({
      where: { reviewId },
    });
    if (existing) {
      return NextResponse.json({ error: 'A response already exists for this review' }, { status: 409 });
    }

    const response = await prisma.reviewResponse.create({
      data: {
        reviewId,
        sellerId: user.id,
        message: message.trim(),
      },
    });

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    console.error('Error creating review response:', error);
    return NextResponse.json({ error: 'Failed to create response' }, { status: 500 });
  }
}
