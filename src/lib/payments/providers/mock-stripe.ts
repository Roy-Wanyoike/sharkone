// TODO: Replace with real Stripe SDK integration when API keys are available

import { PaymentProvider, PaymentRequest, PaymentResult, RefundRequest, RefundResult } from '../types';

type StoredTx = {
  providerTxId: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  createdAt: number;
};

const store = new Map<string, StoredTx>();

export class MockStripeProvider implements PaymentProvider {
  name = 'MOCK_STRIPE';
  private config: Record<string, string> = {};

  initialize(config: Record<string, string>): void {
    this.config = config;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const providerTxId = `STRIPE-MOCK-${crypto.randomUUID()}`;

    store.set(providerTxId, {
      providerTxId,
      orderId: request.orderId,
      amount: request.amount,
      status: 'PROCESSING',
      createdAt: Date.now(),
    });

    return {
      success: true,
      transactionId: providerTxId,
      providerTxId,
      status: 'PROCESSING',
      message: 'Redirect to complete payment',
      checkoutUrl: `/checkout/mock-payment?tx=${providerTxId}`,
    };
  }

  async verifyPayment(providerTxId: string): Promise<PaymentResult> {
    const tx = store.get(providerTxId);
    if (!tx) {
      return {
        success: false,
        transactionId: providerTxId,
        status: 'FAILED',
        message: 'Transaction not found',
      };
    }

    // Mock: auto-complete after 2 seconds
    const elapsed = Date.now() - tx.createdAt;
    if (elapsed >= 2000 && tx.status === 'PROCESSING') {
      tx.status = 'SUCCESS';
    }

    return {
      success: tx.status === 'SUCCESS',
      transactionId: providerTxId,
      providerTxId,
      status: tx.status === 'SUCCESS' ? 'SUCCESS' : 'PROCESSING',
      message: tx.status === 'SUCCESS'
        ? 'Payment completed successfully'
        : 'Payment is still processing. Please wait and try again.',
    };
  }

  async processRefund(request: RefundRequest): Promise<RefundResult> {
    const refundTxId = `STRIPE-REFUND-MOCK-${crypto.randomUUID()}`;
    return {
      success: true,
      refundTxId,
      amount: request.amount ?? 0,
      message: 'Refund processed successfully',
    };
  }

  async webhookHandler(payload: unknown, _signature: string): Promise<PaymentResult> {
    const data = payload as Record<string, string>;
    const providerTxId = data?.providerTxId;

    if (!providerTxId) {
      return {
        success: false,
        transactionId: '',
        status: 'FAILED',
        message: 'Invalid webhook payload',
      };
    }

    const tx = store.get(providerTxId);
    if (tx) {
      tx.status = 'SUCCESS';
    }

    return {
      success: true,
      transactionId: providerTxId,
      providerTxId,
      status: 'SUCCESS',
      message: 'Payment confirmed via webhook',
    };
  }
}
