export interface PaymentRequest {
  orderId: string;
  userId: string;
  amount: number;
  currency?: string;
  method: 'MPESA' | 'CARD' | 'WALLET' | 'BANK_TRANSFER';
  phoneNumber?: string; // For M-Pesa
  cardToken?: string; // For saved cards
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  providerTxId?: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  message: string;
  checkoutUrl?: string; // For redirect-based flows
}

export interface RefundRequest {
  transactionId: string;
  amount?: number; // Partial refund, defaults to full
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundTxId: string;
  amount: number;
  message: string;
}

export interface PaymentProvider {
  name: string;
  initialize(config: Record<string, string>): void;
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  verifyPayment(providerTxId: string): Promise<PaymentResult>;
  processRefund(request: RefundRequest): Promise<RefundResult>;
  webhookHandler?(payload: unknown, signature: string): Promise<PaymentResult>;
}
