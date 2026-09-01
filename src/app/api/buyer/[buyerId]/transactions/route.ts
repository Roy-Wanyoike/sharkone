import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { TransactionType } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ buyerId: string }> }
) {
  try {
    const { buyerId } = await params;

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: buyerId,
        type: { in: [TransactionType.PURCHASE, TransactionType.REFUND] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      status: t.status,
      description: t.description,
      orderId: t.orderId,
      createdAt: t.createdAt,
    }));

    return NextResponse.json({ transactions: mapped });
  } catch (error) {
    console.error('Error fetching buyer transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
