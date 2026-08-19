import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await params;

    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      include: { wallet: true },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const [revenueResult, orderCountResult, productCount] = await Promise.all([
      db.orderItem.aggregate({
        where: { sellerId },
        _sum: { sellerEarnings: true },
      }),
      db.orderItem.groupBy({
        by: ['orderId'],
        where: { sellerId },
      }),
      db.product.count({
        where: { sellerId, status: 'ACTIVE' },
      }),
    ]);

    const totalRevenue = revenueResult._sum.sellerEarnings || 0;
    const totalOrders = orderCountResult.length;

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalProducts: productCount,
      rating: seller.rating,
      pendingClearance: seller.wallet?.pendingClearance || 0,
      balance: seller.wallet?.balance || 0,
      totalEarnings: seller.wallet?.totalEarnings || 0,
      totalWithdrawn: seller.wallet?.totalWithdrawn || 0,
    });
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
