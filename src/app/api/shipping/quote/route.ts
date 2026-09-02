import { NextRequest, NextResponse } from 'next/server';
import { compareRates, ShipmentRequest } from '@/lib/couriers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, pickupAddress, deliveryAddress, packageWeight, packageDimensions, serviceType } = body;

    if (!orderId || !pickupAddress || !deliveryAddress || !packageWeight) {
      return NextResponse.json(
        { error: 'orderId, pickupAddress, deliveryAddress, and packageWeight are required' },
        { status: 400 }
      );
    }

    const request: ShipmentRequest = {
      orderId,
      pickupAddress,
      deliveryAddress,
      packageWeight: Number(packageWeight),
      packageDimensions: packageDimensions
        ? {
            length: Number(packageDimensions.length),
            width: Number(packageDimensions.width),
            height: Number(packageDimensions.height),
          }
        : undefined,
      serviceType,
    };

    const quotes = await compareRates(request);
    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('Shipping quote error:', error);
    return NextResponse.json({ error: 'Failed to get shipping quotes' }, { status: 500 });
  }
}
