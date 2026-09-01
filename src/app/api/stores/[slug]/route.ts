import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const store = await prisma.seller.findUnique({
      where: { storeSlug: slug },
      include: {
        user: {
          select: { email: true, name: true },
        },
        wallet: true,
        _count: {
          select: { products: true },
        },
        products: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const { products, ...storeInfo } = store;

    return NextResponse.json({
      store: storeInfo,
      products,
    });
  } catch (error) {
    console.error('Store fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}