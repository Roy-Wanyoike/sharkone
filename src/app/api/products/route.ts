import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categories = searchParams.getAll('category').filter((c) => c && c !== 'all');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '18');
    const minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice')!)
      : null;
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : null;
    const minRating = searchParams.get('minRating')
      ? parseFloat(searchParams.get('minRating')!)
      : null;
    const sort = searchParams.get('sort');

    const where: Record<string, unknown> = { status: 'ACTIVE' };

    if (categories.length === 1) {
      where.category = { slug: categories[0] };
    } else if (categories.length > 1) {
      where.category = { slug: { in: categories } };
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (minPrice !== null) {
      where.price = { ...(where.price as Prisma.FloatNullableFilter), gte: minPrice };
    }
    if (maxPrice !== null) {
      where.price = { ...(where.price as Prisma.FloatNullableFilter), lte: maxPrice };
    }
    if (minRating !== null) {
      where.rating = { gte: minRating };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'popular':
        orderBy = { reviewCount: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          seller: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const mappedProducts = products.map((p) => ({
      ...p,
      sellerName: p.seller?.storeName ?? null,
    }));

    return NextResponse.json({
      products: mappedProducts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
