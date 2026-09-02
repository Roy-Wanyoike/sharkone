import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getProvider } from '@/lib/payments';
import { registerPaymentProviders } from '@/lib/payments/register';

// Ensure providers are registered
registerPaymentProviders();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, providerTxId } = body;

    if (!provider || !providerTxId) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, providerTxId' },
        { status: 400 }
      );
    }

    const paymentProvider = getProvider(provider);
    if (!paymentProvider) {
      return NextResponse.json(
        { error: `Payment provider '${provider}' not registered` },
        { status: 400 }
      );
    }

    const result = await paymentProvider.verifyPayment(providerTxId);

    // Update the PaymentTransaction record
    const updatedTx = await prisma.paymentTransaction.updateMany({
      where: { providerTxId },
      data: { status: result.status },
    });

    // If payment is successful, update the order's paymentStatus
    if (result.success) {
      const paymentTx = await prisma.paymentTransaction.findFirst({
        where: { providerTxId },
      });

      if (paymentTx?.orderId) {
        await prisma.order.update({
          where: { id: paymentTx.orderId },
          data: { paymentStatus: 'PAID' },
        });
      }
    }

    return NextResponse.json({
      ...result,
      updated: updatedTx.count > 0,
    });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment verification failed' },
      { status: 500 }
    );
  }
}
