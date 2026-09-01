import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();

    const flashSales = await prisma.flashSale.findMany({
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
            categoryId: true,
            category: {
              select: { name: true, slug: true },
            },
          },
        },
      },
      orderBy: { discountPercentage: 'desc' },
    });

    return NextResponse.json({ flashSales });
  } catch (error) {
    console.error('Public flash sales error:', error);
    return NextResponse.json({ error: 'Failed to fetch flash sales' }, { status: 500 });
  }
}
