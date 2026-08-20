import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const MAX_ACTIVE_DELIVERIES = 5;

/**
 * Compute a rating (1-5) from success rate.
 * successRate in [0, 1] → rating in [1, 5]
 */
function successRateToRating(successRate: number): number {
  return Math.round((1 + successRate * 4) * 100) / 100;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // 'available' | 'busy'

    // 1. Fetch all DELIVERY role users
    const drivers = await db.user.findMany({
      where: { role: 'DELIVERY' },
      orderBy: { name: 'asc' },
    });

    if (drivers.length === 0) {
      return NextResponse.json({ success: true, drivers: [] });
    }

    const driverIds = drivers.map(d => d.id);

    // 2. Batch-fetch all deliveries for these drivers
    const allDeliveries = await db.delivery.findMany({
      where: {
        deliveryPersonId: { in: driverIds },
      },
      select: {
        deliveryPersonId: true,
        status: true,
        createdAt: true,
        deliveredAt: true,
      },
    });

    // 3. Compute per-driver stats
    interface DriverPerformance {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      avatar: string | null;
      totalDeliveries: number;
      completedCount: number;
      failedCount: number;
      successRate: number;
      avgDeliveryTimeHours: number;
      currentActiveDeliveries: number;
      rating: number;
    }

    const performanceMap = new Map<string, DriverPerformance>();

    // Initialize
    for (const driver of drivers) {
      performanceMap.set(driver.id, {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        avatar: driver.avatar,
        totalDeliveries: 0,
        completedCount: 0,
        failedCount: 0,
        successRate: 0,
        avgDeliveryTimeHours: 0,
        currentActiveDeliveries: 0,
        rating: 3.0,
      });
    }

    // Aggregate
    for (const del of allDeliveries) {
      const pid = del.deliveryPersonId!;
      const perf = performanceMap.get(pid);
      if (!perf) continue;

      perf.totalDeliveries++;

      if (del.status === 'DELIVERED') {
        perf.completedCount++;
        if (del.deliveredAt) {
          const hours = (del.deliveredAt.getTime() - del.createdAt.getTime()) / (1000 * 60 * 60);
          // Running average
          const prevTotal = perf.completedCount - 1;
          perf.avgDeliveryTimeHours = prevTotal === 0
            ? hours
            : (perf.avgDeliveryTimeHours * prevTotal + hours) / perf.completedCount;
        }
      } else if (del.status === 'FAILED') {
        perf.failedCount++;
      } else {
        // Active: ASSIGNED, PICKED_UP, IN_TRANSIT, NEAR_LOCATION
        perf.currentActiveDeliveries++;
      }
    }

    // 4. Compute success rate and rating for each driver
    let results: DriverPerformance[] = [];

    for (const perf of performanceMap.values()) {
      const completed = perf.completedCount;
      const failed = perf.failedCount;
      const total = completed + failed;

      perf.successRate = total === 0 ? 0 : Math.round((completed / total) * 10000) / 100;
      perf.rating = successRateToRating(total === 0 ? 0 : completed / total);
      perf.avgDeliveryTimeHours = Math.round(perf.avgDeliveryTimeHours * 100) / 100;

      results.push(perf);
    }

    // 5. Apply status filter
    if (statusFilter === 'available') {
      results = results.filter(d => d.currentActiveDeliveries < MAX_ACTIVE_DELIVERIES);
    } else if (statusFilter === 'busy') {
      results = results.filter(d => d.currentActiveDeliveries >= MAX_ACTIVE_DELIVERIES);
    }

    // 6. Sort by success rate descending, then by rating descending
    results.sort((a, b) => {
      if (b.successRate !== a.successRate) {
        return b.successRate - a.successRate;
      }
      return b.rating - a.rating;
    });

    return NextResponse.json({
      success: true,
      drivers: results,
      total: results.length,
      filters: {
        status: statusFilter || 'all',
        maxActiveThreshold: MAX_ACTIVE_DELIVERIES,
      },
    });
  } catch (error) {
    console.error('Driver performance error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
