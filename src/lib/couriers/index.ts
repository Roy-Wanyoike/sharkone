import { CourierProvider, CourierQuote, ShipmentRequest } from './types';

const providers = new Map<string, CourierProvider>();

export function registerCourier(provider: CourierProvider) {
  providers.set(provider.code, provider);
}

export function getCourier(code: string): CourierProvider | undefined {
  return providers.get(code);
}

export function getAllCouriers(): CourierProvider[] {
  return Array.from(providers.values());
}

export async function compareRates(request: ShipmentRequest): Promise<CourierQuote[]> {
  const quotes: CourierQuote[] = [];

  const entries = Array.from(providers.values());
  const results = await Promise.allSettled(
    entries.map((provider) => provider.getQuote(request))
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      quotes.push(result.value);
    }
  }

  quotes.sort((a, b) => a.price - b.price);
  return quotes;
}

export { type CourierProvider, type CourierQuote, type ShipmentRequest, type ShipmentResult, type TrackingResult, type TrackingEvent };
