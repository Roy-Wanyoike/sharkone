import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

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
      prisma.user.count(),
      prisma.seller.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      prisma.delivery.count({
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
