import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { processPayment } from '@/lib/payments';
import { registerPaymentProviders } from '@/lib/payments/register';

// Ensure providers are registered
registerPaymentProviders();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, provider, method, phoneNumber } = body;

    if (!orderId || !provider || !method) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, provider, method' },
        { status: 400 }
      );
    }

    // Fetch order to get amount and userId
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const result = await processPayment({
      orderId: order.id,
      userId: order.buyerId,
      amount: order.totalAmount,
      currency: 'KSH',
      method,
      provider,
      phoneNumber,
    });

    // Create PaymentTransaction record
    const paymentTx = await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        userId: order.buyerId,
        method,
        provider,
        providerTxId: result.providerTxId,
        amount: order.totalAmount,
        currency: 'KSH',
        status: result.status,
        metadata: JSON.stringify({ message: result.message }),
      },
    });

    return NextResponse.json({
      ...result,
      id: paymentTx.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Payment checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment processing failed' },
      { status: 500 }
    );
  }
}
