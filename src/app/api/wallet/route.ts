import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/wallet — return wallet + last 20 transactions
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('sharkone-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Ensure wallet exists (idempotent upsert)
    const wallet = await prisma.buyerWallet.upsert({
      where: { userId: token },
      create: { userId: token, balance: 0, isActive: true },
      update: {},
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    return NextResponse.json({ wallet });
  } catch (error) {
    console.error('Wallet GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/wallet — top up
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('sharkone-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, method } = body;
    const topUpAmount = Number(amount);

    if (!topUpAmount || topUpAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    if (topUpAmount > 1_000_000) {
      return NextResponse.json({ error: 'Maximum top-up is KSh 1,000,000' }, { status: 400 });
    }

    const paymentMethod = method === 'MANUAL' ? 'MANUAL' : 'MPESA';

    // Atomic operation: create transaction + update balance
    const result = await prisma.$transaction(async (tx) => {
      // Ensure wallet exists
      const wallet = await tx.buyerWallet.upsert({
        where: { userId: token },
        create: { userId: token, balance: 0, isActive: true },
        update: {},
      });

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + topUpAmount;

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'TOP_UP',
          amount: topUpAmount,
          description: `Top-up via ${paymentMethod}`,
          balanceBefore,
          balanceAfter,
        },
      });

      // Update wallet balance
      const updated = await tx.buyerWallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      return { wallet: updated, transaction };
    });

    return NextResponse.json({ wallet: result.wallet, transaction: result.transaction });
  } catch (error) {
    console.error('Wallet POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
