import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const sellers = await prisma.seller.findMany({
      include: {
        user: { select: { email: true, name: true } },
        _count: { select: { products: true } },
        wallet: { select: { balance: true } },
      },
      orderBy: { totalSales: 'desc' },
    });

    return NextResponse.json(sellers);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sellers' },
      { status: 500 }
    );
  }
}
