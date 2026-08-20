import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const delivery = await db.delivery.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    const waypoints = await db.deliveryWaypoint.findMany({
      where: { deliveryId: id },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json({ waypoints });
  } catch (error) {
    console.error('Get waypoints error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { latitude, longitude, speed, heading } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'latitude and longitude are required' },
        { status: 400 }
      );
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'latitude and longitude must be numbers' },
        { status: 400 }
      );
    }

    const delivery = await db.delivery.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
    }

    const waypoint = await db.deliveryWaypoint.create({
      data: {
        deliveryId: id,
        latitude,
        longitude,
        speed: speed ?? null,
        heading: heading ?? null,
      },
    });

    return NextResponse.json({ waypoint }, { status: 201 });
  } catch (error) {
    console.error('Create waypoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
