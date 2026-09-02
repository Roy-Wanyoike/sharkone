import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();

    if (!q) {
      return NextResponse.json({ products: [], categories: [] });
    }

    const [products, categories] = await Promise.all([
      // Search products by name (case-insensitive), only active products, top 8
      prisma.product.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          price: true,
          category: {
            select: { name: true },
          },
        },
        take: 8,
      }),

      // Search categories by name, top 3
      prisma.category.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
        },
        select: {
          name: true,
          slug: true,
          _count: {
            select: { products: true },
          },
        },
        take: 3,
      }),
    ]);

    const formattedCategories = categories.map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      productCount: cat._count.products,
    }));

    return NextResponse.json({ products, categories: formattedCategories });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
