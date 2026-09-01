import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const MAX_ACTIVE_DELIVERIES = 5;

/**
 * Parse county from a shipping address string.
 * Tries common patterns: "County", ", CountyName", etc.
 * Falls back to the last meaningful token.
 */
function parseCountyFromAddress(address: string): string {
  const lower = address.toLowerCase();

  // Try "county" keyword patterns
  const countyPatterns = [
    /([a-zA-Z\s]+?)\s+county/i,
    /,\s*([a-zA-Z\s]+?)\s*$/,  // last comma-separated segment
  ];

  for (const pattern of countyPatterns) {
    const match = address.match(pattern);
    if (match && match[1].trim().length > 1) {
      return match[1].trim().toLowerCase();
    }
  }

  // Fallback: take last meaningful word token
  const tokens = address.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  if (tokens.length > 0) {
    return tokens[tokens.length - 1].toLowerCase();
  }

  return '';
}

/**
 * Compute a driver's success rate (1-5 rating) based on completed vs failed deliveries.
 */
function computeDriverRating(completedCount: number, failedCount: number): number {
  const total = completedCount + failedCount;
  if (total === 0) return 3.0; // Neutral rating for new drivers
  const successRate = completedCount / total;
  // Map success rate [0,1] to rating [1,5]
  return Math.round((1 + successRate * 4) * 100) / 100;
}

/**
 * Compute a driver's failure rate.
 */
function computeFailureRate(completedCount: number, failedCount: number): number {
  const total = completedCount + failedCount;
  if (total === 0) return 0;
  return failedCount / total;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    // 1. Find the order by ID, verify it exists and status is PROCESSING or SHIPPED
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PROCESSING' && order.status !== 'SHIPPED') {
      return NextResponse.json(
        { success: false, error: `Order status must be PROCESSING or SHIPPED to assign delivery. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    // Check if delivery already exists for this order
    if (order.delivery) {
      return NextResponse.json({ success: false, error: 'Delivery already assigned for this order' }, { status: 400 });
    }

    // 2. Parse the shipping address county for zone matching
    const orderCounty = parseCountyFromAddress(order.shippingAddress);

    // 3. Find all DELIVERY role users
    const drivers = await prisma.user.findMany({
      where: { role: 'DELIVERY' },
    });

    if (drivers.length === 0) {
      return NextResponse.json({ success: false, error: 'No available drivers' }, { status: 400 });
    }

    const driverIds = drivers.map(d => d.id);

    // 4. Fetch all delivery stats for these drivers in batch
    const allDeliveries = await prisma.delivery.findMany({
      where: {
        deliveryPersonId: { in: driverIds },
      },
      select: {
        deliveryPersonId: true,
        status: true,
        createdAt: true,
        deliveredAt: true,
        order: {
          select: {
            shippingAddress: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build per-driver stats
    const driverStats = new Map<string, {
      activeCount: number;
      completedCount: number;
      failedCount: number;
      failureRate: number;
      rating: number;
      recentCounties: string[];
      totalDeliveryTime: number; // hours
      deliveredWithTime: number;
    }>();

    for (const driver of drivers) {
      driverStats.set(driver.id, {
        activeCount: 0,
        completedCount: 0,
        failedCount: 0,
        failureRate: 0,
        rating: 3.0,
        recentCounties: [],
        totalDeliveryTime: 0,
        deliveredWithTime: 0,
      });
    }

    for (const del of allDeliveries) {
      const pid = del.deliveryPersonId!;
      const stats = driverStats.get(pid);
      if (!stats) continue;

      if (del.status === 'DELIVERED') {
        stats.completedCount++;
        if (del.deliveredAt) {
          const hours = (del.deliveredAt.getTime() - del.createdAt.getTime()) / (1000 * 60 * 60);
          stats.totalDeliveryTime += hours;
          stats.deliveredWithTime++;
        }
      } else if (del.status === 'FAILED') {
        stats.failedCount++;
      } else {
        // Active deliveries (ASSIGNED, PICKED_UP, IN_TRANSIT, NEAR_LOCATION)
        stats.activeCount++;
      }
    }

    // Compute ratings and failure rates, and collect recent counties
    for (const driver of drivers) {
      const stats = driverStats.get(driver.id)!;
      stats.rating = computeDriverRating(stats.completedCount, stats.failedCount);
      stats.failureRate = computeFailureRate(stats.completedCount, stats.failedCount);

      // Get the last 5 deliveries for this driver to check zone familiarity
      const driverDeliveries = allDeliveries.filter(d => d.deliveryPersonId === driver.id);
      const recentDeliveries = driverDeliveries.slice(0, 5);
      const counties: string[] = [];
      for (const rd of recentDeliveries) {
        const county = parseCountyFromAddress(rd.order.shippingAddress);
        if (county) counties.push(county);
      }
      stats.recentCounties = counties;
    }

    // 5. Score each driver with weighted multi-factor scoring
    // Weights: availability 40%, zone match 30%, low failure rate 20%, fewer active deliveries 10%
    const WEIGHT_AVAILABILITY = 0.40;
    const WEIGHT_ZONE_MATCH = 0.30;
    const WEIGHT_LOW_FAILURE = 0.20;
    const WEIGHT_FEWER_ACTIVE = 0.10;

    const scoredDrivers = drivers
      .filter(driver => {
        const stats = driverStats.get(driver.id)!;
        // Capacity check: skip drivers with >= 5 active deliveries
        return stats.activeCount < MAX_ACTIVE_DELIVERIES;
      })
      .map(driver => {
        const stats = driverStats.get(driver.id)!;

        // --- Availability Score (0-100) ---
        // Drivers with fewer active deliveries score higher
        const availabilityScore = Math.max(0, 100 - (stats.activeCount / MAX_ACTIVE_DELIVERIES) * 100);

        // --- Zone Match Score (0-100) ---
        // Check if any of the driver's last 5 deliveries were in the same county
        let zoneMatchScore = 0;
        if (orderCounty && stats.recentCounties.length > 0) {
          const matchCount = stats.recentCounties.filter(c => c === orderCounty).length;
          zoneMatchScore = (matchCount / stats.recentCounties.length) * 100;
        }

        // --- Low Failure Rate Score (0-100) ---
        // 0% failure = 100, 100% failure = 0
        const lowFailureScore = (1 - stats.failureRate) * 100;

        // --- Fewer Active Deliveries Score (0-100) ---
        // Normalized: 0 active = 100, 4 active = 20
        const fewerActiveScore = Math.max(0, 100 - (stats.activeCount / MAX_ACTIVE_DELIVERIES) * 100);

        // --- Weighted Total ---
        const totalScore =
          availabilityScore * WEIGHT_AVAILABILITY +
          zoneMatchScore * WEIGHT_ZONE_MATCH +
          lowFailureScore * WEIGHT_LOW_FAILURE +
          fewerActiveScore * WEIGHT_FEWER_ACTIVE;

        return {
          driver,
          score: Math.round(totalScore * 100) / 100,
          breakdown: {
            availability: Math.round(availabilityScore * 100) / 100,
            zoneMatch: Math.round(zoneMatchScore * 100) / 100,
            lowFailureRate: Math.round(lowFailureScore * 100) / 100,
            fewerActiveDeliveries: Math.round(fewerActiveScore * 100) / 100,
          },
          activeCount: stats.activeCount,
          rating: stats.rating,
          zoneMatchCount: orderCounty
            ? stats.recentCounties.filter(c => c === orderCounty).length
            : 0,
          totalDeliveries: stats.completedCount + stats.failedCount,
          completedDeliveries: stats.completedCount,
          failedDeliveries: stats.failedCount,
        };
      });

    // 6. Pick the best scoring driver
    scoredDrivers.sort((a, b) => b.score - a.score);
    const bestDriver = scoredDrivers[0];

    if (!bestDriver) {
      return NextResponse.json({ success: false, error: 'No available drivers (all at capacity)' }, { status: 400 });
    }

    // 7. Generate 4-digit OTPs
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // 8. Create Delivery record and update order status in a transaction
    const [delivery] = await prisma.$transaction([
      prisma.delivery.create({
        data: {
          orderId: order.id,
          deliveryPersonId: bestDriver.driver.id,
          status: 'ASSIGNED',
          pickupOtp,
          deliveryOtp,
        },
        include: {
          order: true,
          deliveryPerson: true,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'OUT_FOR_DELIVERY' },
      }),
    ]);

    // 9. Return result with scoring breakdown
    return NextResponse.json({
      success: true,
      delivery: {
        id: delivery.id,
        orderId: delivery.orderId,
        status: delivery.status,
        pickupOtp: delivery.pickupOtp,
        deliveryOtp: delivery.deliveryOtp,
        createdAt: delivery.createdAt,
      },
      driver: {
        id: bestDriver.driver.id,
        name: bestDriver.driver.name,
        email: bestDriver.driver.email,
        phone: bestDriver.driver.phone,
        rating: bestDriver.rating,
      },
      scoring: {
        totalScore: bestDriver.score,
        breakdown: bestDriver.breakdown,
        weights: {
          availability: WEIGHT_AVAILABILITY,
          zoneMatch: WEIGHT_ZONE_MATCH,
          lowFailureRate: WEIGHT_LOW_FAILURE,
          fewerActiveDeliveries: WEIGHT_FEWER_ACTIVE,
        },
        orderCounty,
        driverZoneMatches: bestDriver.zoneMatchCount,
        activeDeliveries: bestDriver.activeCount,
        totalDriversConsidered: drivers.length,
        driversSkippedCapacity: drivers.length - scoredDrivers.length,
      },
    });
  } catch (error) {
    console.error('Auto-assign delivery error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
