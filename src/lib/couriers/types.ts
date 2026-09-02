export interface CourierQuote {
  courierCode: string;
  courierName: string;
  price: number; // in KSH
  estimatedDays: number;
  serviceType: string; // STANDARD, EXPRESS, SAME_DAY
}

export interface ShipmentRequest {
  orderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageWeight: number; // kg
  packageDimensions?: { length: number; width: number; height: number };
  serviceType?: string;
}

export interface ShipmentResult {
  success: boolean;
  trackingNumber?: string;
  courierTrackingId?: string;
  estimatedDelivery?: Date;
  price?: number;
  error?: string;
}

export interface TrackingResult {
  status: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: Date;
  status: string;
  description: string;
  location?: string;
}

export interface CourierProvider {
  code: string;
  name: string;
  getQuote(request: ShipmentRequest): Promise<CourierQuote>;
  createShipment(request: ShipmentRequest): Promise<ShipmentResult>;
  trackShipment(trackingNumber: string): Promise<TrackingResult>;
}
