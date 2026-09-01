import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

    const [
      revenueResult,
      totalOrders,
      totalCustomers,
      totalProducts,
      totalSellers,
      thisMonthRevenueRaw,
      lastMonthRevenueRaw,
      thisMonthOrders,
      lastMonthOrders,
      topProducts,
      orderStatusDist,
      paymentStatusDist,
      dailyRevenueRaw,
    ] = await Promise.all([
      // Total revenue (paid orders)
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),

      // Total orders
      prisma.order.count(),

      // Total customers (BUYER role)
      prisma.user.count({ where: { role: 'BUYER' } }),

      // Total products (ACTIVE)
      prisma.product.count({ where: { status: 'ACTIVE' } }),

      // Total sellers
      prisma.seller.count(),

      // This month revenue
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: thisMonthStart },
        },
      }),

      // Last month revenue
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),

      // This month orders
      prisma.order.count({ where: { createdAt: { gte: thisMonthStart } } }),

      // Last month orders
      prisma.order.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),

      // Top 5 selling products by orderItem quantity sum
      prisma.$queryRaw<
        { productId: string; name: string; image: string; totalSold: number; revenue: number }[]
      >`
        SELECT p.id as productId, p.name, p.image, SUM(oi.quantity) as totalSold, SUM(oi.quantity * oi.price) as revenue
        FROM OrderItem oi
        JOIN Product p ON oi.productId = p.id
        GROUP BY oi.productId
        ORDER BY totalSold DESC
        LIMIT 5
      `,

      // Order status distribution
      prisma.$queryRaw<{ status: string; count: number }[]>`
        SELECT status, COUNT(*) as count
        FROM [Order]
        GROUP BY status
        ORDER BY count DESC
      `,

      // Payment status distribution
      prisma.$queryRaw<{ status: string; count: number }[]>`
        SELECT paymentStatus as status, COUNT(*) as count
        FROM [Order]
        GROUP BY paymentStatus
        ORDER BY count DESC
      `,

      // Daily revenue for last 30 days
      prisma.$queryRaw<{ date: string; revenue: number; orders: number }[]>`
        SELECT DATE(createdAt) as date, COALESCE(SUM(CASE WHEN paymentStatus = 'PAID' THEN totalAmount ELSE 0 END), 0) as revenue, COUNT(*) as orders
        FROM [Order]
        WHERE createdAt >= DATE('now', '-30 days')
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,
    ]);

    const totalRevenue = revenueResult._sum.totalAmount ?? 0;
    const thisMonthRevenue = thisMonthRevenueRaw._sum.totalAmount ?? 0;
    const lastMonthRevenue = lastMonthRevenueRaw._sum.totalAmount ?? 0;

    const revenueChangePercent =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : thisMonthRevenue > 0
          ? 100
          : 0;

    const ordersChangePercent =
      lastMonthOrders > 0
        ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
        : thisMonthOrders > 0
          ? 100
          : 0;

    // Build daily revenue array filling in missing dates
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    const revenueMap = new Map(
      dailyRevenueRaw.map((d) => [d.date, { revenue: Number(d.revenue) || 0, orders: Number(d.orders) || 0 }])
    );
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = revenueMap.get(dateStr);
      dailyRevenue.push({
        date: dateStr,
        revenue: dayData?.revenue ?? 0,
        orders: dayData?.orders ?? 0,
      });
    }

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      totalCustomers,
      totalProducts,
      totalSellers,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueChangePercent: Math.round(revenueChangePercent * 10) / 10,
      thisMonthOrders,
      lastMonthOrders,
      ordersChangePercent: Math.round(ordersChangePercent * 10) / 10,
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        name: p.name,
        image: p.image,
        totalSold: Number(p.totalSold) || 0,
        revenue: Number(p.revenue) || 0,
      })),
      orderStatusDistribution: orderStatusDist.map((s) => ({
        status: s.status,
        count: Number(s.count) || 0,
      })),
      paymentStatusDistribution: paymentStatusDist.map((s) => ({
        status: s.status,
        count: Number(s.count) || 0,
      })),
      dailyRevenue,
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}
