import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [
      revenueOverTime,
      orderStatusBreakdown,
      topProducts,
      categoryDistribution,
      sellerPerformance,
      recentActivity,
    ] = await Promise.all([
      // 1. Revenue over time - last 30 days
      db.$queryRaw<
        { date: string; revenue: number; orders: number }[]
      >`
        SELECT DATE(createdAt) as date, SUM(totalAmount) as revenue, COUNT(*) as orders
        FROM [Order]
        WHERE createdAt >= DATE('now', '-30 days')
        GROUP BY DATE(createdAt)
        ORDER BY date ASC
      `,

      // 2. Order status breakdown
      db.$queryRaw<{ status: string; count: number }[]>`
        SELECT status, COUNT(*) as count
        FROM [Order]
        GROUP BY status
        ORDER BY count DESC
      `,

      // 3. Top 5 products by total sales
      db.$queryRaw<
        { productName: string; productId: string; image: string; totalSales: number; unitsSold: number }[]
      >`
        SELECT p.name as productName, p.id as productId, p.image, SUM(oi.quantity * oi.price) as totalSales, SUM(oi.quantity) as unitsSold
        FROM OrderItem oi
        JOIN Product p ON oi.productId = p.id
        GROUP BY oi.productId
        ORDER BY totalSales DESC
        LIMIT 5
      `,

      // 4. Category distribution
      db.$queryRaw<
        { categoryName: string; count: number }[]
      >`
        SELECT c.name as categoryName, COUNT(p.id) as count
        FROM Category c
        LEFT JOIN Product p ON p.categoryId = c.id
        GROUP BY c.id
        ORDER BY count DESC
      `,

      // 5. Seller performance
      db.$queryRaw<
        {
          sellerId: string;
          storeName: string;
          totalRevenue: number;
          totalOrders: number;
          rating: number;
          productCount: number;
        }[]
      >`
        SELECT 
          s.id as sellerId,
          s.storeName,
          COALESCE(SUM(oi.quantity * oi.price), 0) as totalRevenue,
          COUNT(DISTINCT o.id) as totalOrders,
          s.rating,
          COUNT(DISTINCT p.id) as productCount
        FROM Seller s
        LEFT JOIN OrderItem oi ON oi.sellerId = s.id
        LEFT JOIN [Order] o ON o.id = oi.orderId
        LEFT JOIN Product p ON p.sellerId = s.id
        GROUP BY s.id
        ORDER BY totalRevenue DESC
      `,

      // 6. Recent activity - last 10 orders
      db.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          buyer: {
            select: { name: true },
          },
        },
      }),
    ]);

    // Format recent activity
    const formattedRecentActivity = recentActivity.map((order) => ({
      buyerName: order.buyer.name,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      status: order.status,
      date: order.createdAt.toISOString(),
    }));

    return NextResponse.json({
      revenueOverTime: revenueOverTime.map((r) => ({
        date: r.date,
        revenue: Number(r.revenue) || 0,
        orders: Number(r.orders) || 0,
      })),
      orderStatusBreakdown: orderStatusBreakdown.map((s) => ({
        status: s.status,
        count: Number(s.count) || 0,
      })),
      topProducts: topProducts.map((p) => ({
        productName: p.productName,
        productId: p.productId,
        image: p.image,
        totalSales: Number(p.totalSales) || 0,
        unitsSold: Number(p.unitsSold) || 0,
      })),
      categoryDistribution: categoryDistribution.map((c) => ({
        categoryName: c.categoryName,
        count: Number(c.count) || 0,
      })),
      sellerPerformance: sellerPerformance.map((s) => ({
        sellerId: s.sellerId,
        storeName: s.storeName,
        totalRevenue: Number(s.totalRevenue) || 0,
        totalOrders: Number(s.totalOrders) || 0,
        rating: Number(s.rating) || 0,
        productCount: Number(s.productCount) || 0,
      })),
      recentActivity: formattedRecentActivity,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
