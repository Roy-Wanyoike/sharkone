import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const store = await db.seller.findUnique({
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
}