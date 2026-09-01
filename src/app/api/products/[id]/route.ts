import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'ACTIVE',
      },
      include: {
        category: true,
        seller: {
          include: { user: { select: { name: true } } },
        },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
    });

    const mapProduct = (p: typeof product) => ({
      ...p,
      sellerName: p.seller?.storeName ?? null,
    });

    return NextResponse.json({
      product: mapProduct(product),
      relatedProducts: relatedProducts.map(mapProduct),
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
