import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await params;
    const body = await request.json();
    const { amount } = body;

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }

    const withdrawAmount = parseFloat(amount);

    // Get seller with wallet
    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      include: { wallet: true },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    if (!seller.wallet || seller.wallet.balance < withdrawAmount) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        userId: seller.userId,
        type: 'WITHDRAWAL',
        amount: withdrawAmount,
        status: 'PENDING',
        description: `Withdrawal of ${withdrawAmount.toFixed(2)} to bank account`,
      },
    });

    // Update wallet
    const updatedWallet = await db.wallet.update({
      where: { sellerId },
      data: {
        balance: { decrement: withdrawAmount },
        totalWithdrawn: { increment: withdrawAmount },
      },
    });

    return NextResponse.json({
      transaction,
      wallet: updatedWallet,
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }
}
