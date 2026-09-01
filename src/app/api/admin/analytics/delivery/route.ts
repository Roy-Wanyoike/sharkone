import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

    const [
      totalDeliveries,
      deliveredCount,
      avgDeliveryTimeRaw,
      statusDistRaw,
      topDeliveryPersons,
      dailyDeliveriesRaw,
    ] = await Promise.all([
      // Total deliveries
      prisma.delivery.count(),

      // Delivered count
      prisma.delivery.count({ where: { status: 'DELIVERED' } }),

      // Average delivery time (from createdAt to deliveredAt for delivered orders)
      prisma.$queryRaw<{ avgHours: number }[]>`
        SELECT AVG((julianday(deliveredAt) - julianday(createdAt)) * 24) as avgHours
        FROM Delivery
        WHERE status = 'DELIVERED' AND deliveredAt IS NOT NULL
      `,

      // Delivery status distribution
      prisma.$queryRaw<{ status: string; count: number }[]>`
        SELECT status, COUNT(*) as count
        FROM Delivery
        GROUP BY status
        ORDER BY count DESC
      `,

      // Top 5 delivery persons by completed deliveries
      prisma.$queryRaw<
        { userId: string; name: string; completedDeliveries: number; phone: string | null }[]
      >`
        SELECT u.id as userId, u.name, u.phone, COUNT(d.id) as completedDeliveries
        FROM Delivery d
        JOIN User u ON d.deliveryPersonId = u.id
        WHERE d.status = 'DELIVERED'
        GROUP BY d.deliveryPersonId
        ORDER BY completedDeliveries DESC
        LIMIT 5
      `,

      // Daily deliveries for last 30 days
      prisma.$queryRaw<{ date: string; deliveries: number; delivered: number }[]>`
        SELECT DATE(createdAt) as date, COUNT(*) as deliveries, SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered
        FROM Delivery
        WHERE createdAt >= DATE('now', '-30 days')
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,
    ]);

    const successRate =
      totalDeliveries > 0
        ? Math.round((deliveredCount / totalDeliveries) * 1000) / 10
        : 0;

    const avgDeliveryHours =
      avgDeliveryTimeRaw.length > 0
        ? Math.round((Number(avgDeliveryTimeRaw[0].avgHours) || 0) * 10) / 10
        : 0;

    // Build daily deliveries array filling in missing dates
    const dailyDeliveries: { date: string; deliveries: number; delivered: number }[] = [];
    const deliveryMap = new Map(
      dailyDeliveriesRaw.map((d) => [
        d.date,
        { deliveries: Number(d.deliveries) || 0, delivered: Number(d.delivered) || 0 },
      ])
    );
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = deliveryMap.get(dateStr);
      dailyDeliveries.push({
        date: dateStr,
        deliveries: dayData?.deliveries ?? 0,
        delivered: dayData?.delivered ?? 0,
      });
    }

    return NextResponse.json({
      totalDeliveries,
      deliveredCount,
      successRate,
      averageDeliveryHours: avgDeliveryHours,
      statusDistribution: statusDistRaw.map((s) => ({
        status: s.status,
        count: Number(s.count) || 0,
      })),
      topDeliveryPersons: topDeliveryPersons.map((dp) => ({
        userId: dp.userId,
        name: dp.name,
        phone: dp.phone,
        completedDeliveries: Number(dp.completedDeliveries) || 0,
      })),
      dailyDeliveries,
    });
  } catch (error) {
    console.error('Error fetching delivery analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery analytics' },
      { status: 500 }
    );
  }
}
