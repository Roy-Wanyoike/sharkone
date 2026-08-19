import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      revenueResult,
      activeDeliveries,
    ] = await Promise.all([
      db.user.count(),
      db.seller.count(),
      db.product.count({ where: { status: 'ACTIVE' } }),
      db.order.count(),
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      db.delivery.count({
        where: {
          status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_LOCATION'] },
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueResult._sum.totalAmount ?? 0,
      activeDeliveries,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
