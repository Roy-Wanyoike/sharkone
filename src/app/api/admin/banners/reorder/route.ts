import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function PUT(request: Request) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { bannerOrders } = body as { bannerOrders: { id: string; order: number }[] };

    if (!Array.isArray(bannerOrders)) {
      return NextResponse.json(
        { error: 'bannerOrders must be an array' },
        { status: 400 }
      );
    }

    await Promise.all(
      bannerOrders.map((item) =>
        prisma.banner.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering banners:', error);
    return NextResponse.json(
      { error: 'Failed to reorder banners' },
      { status: 500 }
    );
  }
}
