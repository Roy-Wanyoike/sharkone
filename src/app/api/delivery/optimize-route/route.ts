import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * Parse county/area from a shipping address string.
 * Tries common patterns, falls back to last meaningful token.
 */
function parseAreaFromAddress(address: string): string {
  const lower = address.toLowerCase();

  // Try "county" keyword pattern
  const countyMatch = address.match(/([a-zA-Z\s]+?)\s+county/i);
  if (countyMatch && countyMatch[1].trim().length > 1) {
    return countyMatch[1].trim().toLowerCase();
  }

  // Try last comma-separated segment (often the area/county)
  const parts = address.split(',');
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].trim().toLowerCase();
    if (lastPart.length > 1) {
      return lastPart;
    }
  }

  // Fallback: take last meaningful word
  const tokens = address.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  if (tokens.length > 0) {
    return tokens[tokens.length - 1].toLowerCase();
  }

  return 'unknown';
}

/**
 * Generate a realistic km estimate for a route.
 * Base distance per delivery + inter-area bonus.
 */
function estimateRouteDistance(groups: { area: string; count: number }[]): number {
  let totalKm = 0;
  for (const group of groups) {
    // Intra-area distance: ~3-8 km per delivery within same area
    const intraKm = group.count * (3 + Math.random() * 5);
    totalKm += intraKm;
  }
  // Inter-area travel: ~5-15 km between groups
  if (groups.length > 1) {
    totalKm += (groups.length - 1) * (5 + Math.random() * 10);
  }
  return Math.round(totalKm * 10) / 10;
}

/**
 * Estimate delivery time based on total distance and number of stops.
 * Assumes average speed of 30 km/h in urban areas, 5 min per stop.
 */
function estimateDeliveryTime(totalKm: number, totalDeliveries: number): string {
  const drivingMinutes = (totalKm / 30) * 60;
  const stopMinutes = totalDeliveries * 5;
  const totalMinutes = drivingMinutes + stopMinutes;

  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);

  if (hours === 0) {
    return `~${mins} min`;
  }
  if (mins === 0) {
    return `~${hours}h`;
  }
  return `~${hours}h ${mins}min`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deliveryIds } = body;

    if (!deliveryIds || !Array.isArray(deliveryIds) || deliveryIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'deliveryIds is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // 1. Fetch all specified deliveries with their orders
    const deliveries = await prisma.delivery.findMany({
      where: {
        id: { in: deliveryIds },
      },
      include: {
        order: {
          select: {
            shippingAddress: true,
            orderNumber: true,
          },
        },
        deliveryPerson: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (deliveries.length === 0) {
      return NextResponse.json({ success: false, error: 'No deliveries found for the given IDs' }, { status: 404 });
    }

    // 2. Parse area/county for each delivery and group
    interface DeliveryWithArea {
      id: string;
      orderId: string;
      status: string;
      createdAt: Date;
      order: { shippingAddress: string; orderNumber: string } | null;
      deliveryPerson: { id: string; name: string } | null;
      area: string;
    }

    const deliveriesWithArea: DeliveryWithArea[] = deliveries.map(d => ({
      id: d.id,
      orderId: d.orderId,
      status: d.status,
      createdAt: d.createdAt,
      order: d.order
        ? { shippingAddress: d.order.shippingAddress, orderNumber: d.order.orderNumber }
        : null,
      deliveryPerson: d.deliveryPerson ? { id: d.deliveryPerson.id, name: d.deliveryPerson.name } : null,
      area: d.order ? parseAreaFromAddress(d.order.shippingAddress) : 'unknown',
    }));

    // 3. Group by area
    const areaGroups = new Map<string, DeliveryWithArea[]>();
    for (const d of deliveriesWithArea) {
      const list = areaGroups.get(d.area) || [];
      list.push(d);
      areaGroups.set(d.area, list);
    }

    // 4. Sort groups by count (descending) for priority, then alphabetically within same count
    const sortedGroups = Array.from(areaGroups.entries())
      .sort(([aArea, aDeliveries], [bArea, bDeliveries]) => {
        const countDiff = bDeliveries.length - aDeliveries.length;
        if (countDiff !== 0) return countDiff;
        return aArea.localeCompare(bArea);
      });

    // 5. Build the optimized route: deliveries grouped by area
    // Within each group, sort by creation time (FIFO)
    const route: DeliveryWithArea[] = [];
    const groups: { area: string; count: number }[] = [];

    for (const [area, areaDeliveries] of sortedGroups) {
      // Sort within group by creation time (oldest first for fairness)
      areaDeliveries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      route.push(...areaDeliveries);
      groups.push({ area, count: areaDeliveries.length });
    }

    // 6. Estimate distance and time
    const totalDistance = estimateRouteDistance(groups);
    const estimatedTime = estimateDeliveryTime(totalDistance, deliveriesWithArea.length);

    // 7. Return the optimized route
    return NextResponse.json({
      success: true,
      route: route.map(d => ({
        id: d.id,
        orderId: d.orderId,
        orderNumber: d.order?.orderNumber,
        status: d.status,
        area: d.area,
        shippingAddress: d.order?.shippingAddress,
        driver: d.deliveryPerson ? { id: d.deliveryPerson.id, name: d.deliveryPerson.name } : null,
        createdAt: d.createdAt,
      })),
      groups,
      totalDistance,
      estimatedTime,
      totalDeliveries: deliveriesWithArea.length,
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
