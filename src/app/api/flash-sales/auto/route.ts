import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    // Active flash sales (currently running)
    const activeSales = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            images: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { discountPercentage: 'desc' },
    });

    // Starting soon (within 15 minutes, not yet started)
    const startingSoon = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        startTime: { gt: now, lte: fifteenMinutesFromNow },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            images: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Check if any flash sale just started (within last 2 minutes)
    const newlyStarted = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        startTime: { gte: twoMinutesAgo, lte: now },
        endTime: { gte: now },
      },
      select: { id: true },
    });

    const newSaleStarted = newlyStarted.length > 0;

    return NextResponse.json({
      activeSales,
      startingSoon,
      newSaleStarted,
    });
  } catch (error) {
    console.error('Auto flash sales error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flash sales' },
      { status: 500 }
    );
  }
}
