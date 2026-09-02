import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

// POST /api/wallet/deduct — deduct from wallet (for purchases)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { amount, description, referenceId } = body;
    const deductAmount = Number(amount);

    if (!deductAmount || deductAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Ensure wallet exists
      const wallet = await tx.buyerWallet.upsert({
        where: { userId: user.id },
        create: { userId: user.id, balance: 0, isActive: true },
        update: {},
      });

      if (wallet.balance < deductAmount) {
        throw new Error('Insufficient wallet balance');
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore - deductAmount;

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'PURCHASE',
          amount: deductAmount,
          description: description || 'Purchase',
          referenceId: referenceId || null,
          balanceBefore,
          balanceAfter,
        },
      });

      const updated = await tx.buyerWallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      return { wallet: updated, transaction };
    });

    return NextResponse.json({ wallet: result.wallet, transaction: result.transaction });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Insufficient wallet balance') {
      return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
    }
    console.error('Wallet deduct error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
