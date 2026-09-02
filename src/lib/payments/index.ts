import { PaymentProvider, PaymentRequest, PaymentResult } from './types';

const providers = new Map<string, PaymentProvider>();

export function registerProvider(name: string, provider: PaymentProvider) {
  providers.set(name, provider);
}

export function getProvider(name: string): PaymentProvider | undefined {
  return providers.get(name);
}

export async function processPayment(request: PaymentRequest & { provider: string }): Promise<PaymentResult> {
  const provider = getProvider(request.provider);
  if (!provider) throw new Error(`Payment provider '${request.provider}' not registered`);
  return provider.processPayment(request);
}

export { type PaymentProvider, type PaymentRequest, type PaymentResult, type RefundRequest, type RefundResult };
