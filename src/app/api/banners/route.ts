import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { BannerPosition } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || '';
    const click = searchParams.get('click');
    const bannerId = searchParams.get('id');

    // Handle click tracking
    if (click === 'true' && bannerId) {
      await prisma.banner.update({
        where: { id: bannerId },
        data: { clicksCount: { increment: 1 } },
      });
      return NextResponse.json({ success: true });
    }

    // Return active banners
    const where: Record<string, unknown> = { active: true };

    if (position && Object.values(BannerPosition).includes(position as BannerPosition)) {
      where.position = position;
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching public banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}
