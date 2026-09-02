import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getProvider } from '@/lib/payments';
import { registerPaymentProviders } from '@/lib/payments/register';

// Ensure providers are registered
registerPaymentProviders();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: providerName } = await params;

    const paymentProvider = getProvider(providerName);
    if (!paymentProvider) {
      return NextResponse.json(
        { error: `Unknown provider: ${providerName}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const signature = request.headers.get('x-webhook-signature') ?? '';

    // SECURITY WARNING: No webhook signature verification is performed here.
    // This is intentional for mock/development mode — the handler accepts any POST
    // payload without validating the signature. For production deployment, this MUST
    // be replaced with proper signature verification (e.g., HMAC-SHA256) using the
    // provider's signing secret to prevent forged webhook payloads.
    // TODO: Implement real signature verification for production

    if (!paymentProvider.webhookHandler) {
      return NextResponse.json(
        { error: 'Provider does not support webhooks' },
        { status: 400 }
      );
    }

    const result = await paymentProvider.webhookHandler(body, signature);

    if (result.success) {
      // Update the PaymentTransaction record
      const paymentTx = await prisma.paymentTransaction.findFirst({
        where: { providerTxId: result.providerTxId },
      });

      if (paymentTx) {
        await prisma.paymentTransaction.update({
          where: { id: paymentTx.id },
          data: {
            status: result.status,
            metadata: JSON.stringify(body),
          },
        });

        // If successful, update the order's paymentStatus
        if (result.status === 'SUCCESS' && paymentTx.orderId) {
          await prisma.order.update({
            where: { id: paymentTx.orderId },
            data: { paymentStatus: 'PAID' },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
