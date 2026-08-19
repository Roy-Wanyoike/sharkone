import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '18');

    const where: Record<string, unknown> = { status: 'ACTIVE' };

    if (category && category !== 'all') {
      where.category = { slug: category };
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

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          seller: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
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
