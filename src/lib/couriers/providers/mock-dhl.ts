// TODO: Replace with real DHL API integration when API keys are available

import { CourierProvider, CourierQuote, ShipmentRequest, ShipmentResult, TrackingResult } from '../types';

const RATES: Record<string, { price: number; days: number }> = {
  STANDARD: { price: 500, days: 4 },
  EXPRESS: { price: 900, days: 2 },
};

export class MockDHLProvider implements CourierProvider {
  code = 'MOCK_DHL';
  name = 'DHL Express';

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
    const trackingNumber = `DHL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
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
      status: 'PROCESSING',
      currentLocation: 'DHL Nairobi Facility',
      estimatedDelivery: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      events: [
        {
          timestamp: new Date(now.getTime() - 96 * 60 * 60 * 1000),
          status: 'PICKED_UP',
          description: 'Shipment picked up',
          location: 'Pickup Location',
        },
        {
          timestamp: new Date(now.getTime() - 72 * 60 * 60 * 1000),
          status: 'PROCESSING',
          description: 'Shipment processed at origin facility',
          location: 'DHL Nairobi Facility',
        },
        {
          timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000),
          status: 'IN_TRANSIT',
          description: 'Shipment in transit',
          location: 'Nairobi',
        },
      ],
    };
  }
}
