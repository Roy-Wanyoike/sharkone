import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const user = await requireAuth('ADMIN');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;
    const status = url.searchParams.get('status');
    const productId = url.searchParams.get('productId');
    const rating = url.searchParams.get('rating');

    const where: Record<string, unknown> = {};
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }
    if (productId) {
      where.productId = productId;
    }
    if (rating) {
      const r = parseInt(rating, 10);
      if (r >= 1 && r <= 5) where.rating = r;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: { select: { name: true, sellerId: true } },
          user: { select: { name: true } },
          response: true,
        },
      }),
      prisma.review.count({ where }),
    ]);

    // Enrich with seller name via the product's seller
    const enriched = reviews.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      userId: r.userId,
      reviewerName: r.userName,
      sellerId: r.product.sellerId,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isVerified: r.isVerified,
      isFeatured: r.isFeatured,
      status: r.status,
      response: r.response,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json({
      reviews: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
