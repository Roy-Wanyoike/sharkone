import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const url = new URL(_request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    // Calculate average rating from all reviews of this product
    const allReviews = await db.review.findMany({
      where: { productId: id },
      select: { rating: true },
    });

    const total = allReviews.length;
    const averageRating =
      total > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

    const reviews = await db.review.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({ reviews, total, averageRating: Math.round(averageRating * 10) / 10 });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, title, comment, userName } = body;

    // Validate
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }
    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }
    if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check product exists
    const product = await db.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Find or use a buyer user
    let buyerUser = await db.user.findFirst({ where: { role: 'BUYER' } });
    if (!buyerUser) {
      buyerUser = await db.user.create({
        data: {
          email: `${Date.now()}-reviewer@sharkone.com`,
          name: userName.trim(),
          role: 'BUYER',
        },
      });
    }

    const review = await db.review.create({
      data: {
        productId: id,
        userId: buyerUser.id,
        userName: userName.trim(),
        rating: Math.round(rating),
        title: title?.trim() || null,
        comment: comment.trim(),
        isVerified: false,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
