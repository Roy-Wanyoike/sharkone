import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

function escapeCsv(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsv).join(',') + '\n';
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return toCsvRow(headers) + rows.map((r) => toCsvRow(r)).join('');
}

export async function GET(request: NextRequest) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'orders';

  try {
    const today = new Date().toISOString().split('T')[0];
    const filename = `analytics-${type}-${today}.csv`;

    let csv = '';

    if (type === 'orders') {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { name: true } },
          orderItems: { select: { id: true } },
        },
      });

      csv = toCsv(
        ['Order ID', 'Date', 'Customer', 'Status', 'Total', 'Items Count', 'Payment Status'],
        orders.map((o) => [
          o.orderNumber,
          o.createdAt.toISOString(),
          o.buyer.name,
          o.status,
          o.totalAmount,
          o.orderItems.length,
          o.paymentStatus,
        ])
      );
    } else if (type === 'products') {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          orderItems: { select: { quantity: true, price: true } },
        },
      });

      csv = toCsv(
        ['Product Name', 'Category', 'Price', 'Stock', 'Sold Count', 'Rating', 'Revenue'],
        products.map((p) => {
          const soldCount = p.orderItems.reduce((sum, oi) => sum + oi.quantity, 0);
          const revenue = p.orderItems.reduce((sum, oi) => sum + oi.quantity * oi.price, 0);
          return [
            p.name,
            p.category.name,
            p.price,
            p.stock,
            soldCount,
            p.rating,
            revenue,
          ];
        })
      );
    } else if (type === 'revenue') {
      const revenueData = await prisma.$queryRaw<
        { date: string; orderCount: number; revenue: number }[]
      >`
        SELECT DATE(createdAt) as date, COUNT(*) as orderCount, SUM(totalAmount) as revenue
        FROM [Order]
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
      `;

      csv = toCsv(
        ['Date', 'Order Count', 'Revenue'],
        revenueData.map((r) => [
          r.date,
          Number(r.orderCount) || 0,
          Number(r.revenue) || 0,
        ])
      );
    } else if (type === 'customers') {
      const customers = await prisma.user.findMany({
        where: { role: 'BUYER' },
        orderBy: { createdAt: 'desc' },
        include: {
          orders: {
            select: { totalAmount: true },
          },
        },
      });

      csv = toCsv(
        ['Customer Name', 'Email', 'Orders Count', 'Total Spent', 'Join Date'],
        customers.map((c) => [
          c.name,
          c.email,
          c.orders.length,
          c.orders.reduce((sum, o) => sum + o.totalAmount, 0),
          c.createdAt.toISOString(),
        ])
      );
    } else {
      return NextResponse.json(
        { error: `Invalid export type: ${type}. Use orders, products, revenue, or customers.` },
        { status: 400 }
      );
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    );
  }
}
