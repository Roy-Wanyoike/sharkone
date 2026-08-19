import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TransactionType } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';

    // Get the seller's userId
    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      select: { userId: true },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const where: Record<string, unknown> = { userId: seller.userId };

    if (type && Object.values(TransactionType).includes(type as TransactionType)) {
      where.type = type;
    }

    const transactions = await db.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching seller transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
