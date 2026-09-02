// TODO: Replace with real Daraja API calls when credentials are available

import { PaymentProvider, PaymentRequest, PaymentResult, RefundRequest, RefundResult } from '../types';

type StoredTx = {
  providerTxId: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: number;
};

const store = new Map<string, StoredTx>();

export class MockMpesaProvider implements PaymentProvider {
  name = 'MOCK_MPESA';
  private config: Record<string, string> = {};

  initialize(config: Record<string, string>): void {
    this.config = config;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const providerTxId = `MPESA-MOCK-${crypto.randomUUID()}`;

    store.set(providerTxId, {
      providerTxId,
      orderId: request.orderId,
      amount: request.amount,
      status: 'PENDING',
      createdAt: Date.now(),
    });

    // Simulate STK Push — M-Pesa always returns PENDING initially
    return {
      success: true,
      transactionId: providerTxId,
      providerTxId,
      status: 'PENDING',
      message: 'STK Push sent. Please complete payment on your phone.',
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

    // Simulate async callback — after 2 seconds the payment is considered successful
    const elapsed = Date.now() - tx.createdAt;
    if (elapsed >= 2000) {
      tx.status = 'SUCCESS';
    }

    return {
      success: tx.status === 'SUCCESS',
      transactionId: providerTxId,
      providerTxId,
      status: tx.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
      message: tx.status === 'SUCCESS'
        ? 'Payment completed successfully'
        : 'Payment is still pending. Please wait and try again.',
    };
  }

  async processRefund(request: RefundRequest): Promise<RefundResult> {
    const refundTxId = `MPESA-REFUND-MOCK-${crypto.randomUUID()}`;
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
