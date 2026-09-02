// SHARKONE's own delivery riders — no external API needed

import { CourierProvider, CourierQuote, ShipmentRequest, ShipmentResult, TrackingResult } from '../types';

export class InternalCourierProvider implements CourierProvider {
  code = 'INTERNAL';
  name = 'SHARKONE Delivery';

  async getQuote(_request: ShipmentRequest): Promise<CourierQuote> {
    return {
      courierCode: this.code,
      courierName: this.name,
      price: 200,
      estimatedDays: 2,
      serviceType: 'STANDARD',
    };
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    const trackingNumber = `INT-${request.orderId}-${Date.now()}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);

    return {
      success: true,
      trackingNumber,
      courierTrackingId: trackingNumber,
      estimatedDelivery,
      price: 200,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    const now = new Date();
    return {
      status: 'DISPATCHED',
      currentLocation: 'SHARKONE Warehouse',
      estimatedDelivery: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      events: [
        {
          timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          status: 'DISPATCHED',
          description: 'Package assigned to SHARKONE rider',
          location: 'SHARKONE Warehouse',
        },
      ],
    };
  }
}
