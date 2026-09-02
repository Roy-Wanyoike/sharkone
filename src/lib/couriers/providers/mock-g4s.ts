// TODO: Replace with real G4S API integration when API keys are available

import { CourierProvider, CourierQuote, ShipmentRequest, ShipmentResult, TrackingResult } from '../types';

const RATES: Record<string, { price: number; days: number }> = {
  STANDARD: { price: 350, days: 3 },
  EXPRESS: { price: 600, days: 1 },
  SAME_DAY: { price: 1200, days: 0 },
};

export class MockG4SProvider implements CourierProvider {
  code = 'MOCK_G4S';
  name = 'G4S Courier';

  async getQuote(request: ShipmentRequest): Promise<CourierQuote> {
    const serviceType = request.serviceType || 'STANDARD';
    const rate = RATES[serviceType] || RATES.STANDARD;
    return {
      courierCode: this.code,
      courierName: this.name,
      price: rate.price,
      estimatedDays: rate.days,
      serviceType,
    };
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    const serviceType = request.serviceType || 'STANDARD';
    const rate = RATES[serviceType] || RATES.STANDARD;
    const trackingNumber = `G4S-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + rate.days);

    return {
      success: true,
      trackingNumber,
      courierTrackingId: trackingNumber,
      estimatedDelivery,
      price: rate.price,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const now = new Date();
    return {
      status: 'IN_TRANSIT',
      currentLocation: 'Nairobi Hub',
      estimatedDelivery: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      events: [
        {
          timestamp: new Date(now.getTime() - 72 * 60 * 60 * 1000),
          status: 'PICKED_UP',
          description: 'Package picked up from sender',
          location: 'Sender Location',
        },
        {
          timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000),
          status: 'IN_TRANSIT',
          description: 'Package in transit to destination hub',
          location: 'Nairobi Sorting Center',
        },
        {
          timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
          status: 'IN_TRANSIT',
          description: 'Package arrived at destination hub',
          location: 'Nairobi Hub',
        },
      ],
    };
  }
}
