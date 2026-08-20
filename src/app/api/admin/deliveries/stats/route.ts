import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [total, active, inTransit, completedToday, failed] = await Promise.all([
      db.delivery.count(),
      db.delivery.count({
        where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_LOCATION'] } },
      }),
      db.delivery.count({
        where: { status: 'IN_TRANSIT' },
      }),
      db.delivery.count({
        where: {
          status: 'DELIVERED',
          deliveredAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      db.delivery.count({
        where: { status: 'FAILED' },
      }),
    ]);

    return NextResponse.json({
      total,
      active,
      inTransit,
      completedToday,
      failed,
    });
  } catch (error) {
    console.error('Delivery stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
