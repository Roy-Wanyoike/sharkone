import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const sellers = await db.seller.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        wallet: { select: { balance: true, totalEarnings: true, pendingClearance: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = sellers.map((s) => ({
      id: s.id,
      storeName: s.storeName,
      storeSlug: s.storeSlug,
      storeDescription: s.storeDescription,
      storeLogo: s.storeLogo,
      rating: s.rating,
      totalSales: s.totalSales,
      isVerified: s.isVerified,
      commissionRate: s.commissionRate,
      createdAt: s.createdAt,
      user: s.user,
      wallet: s.wallet,
      productCount: s._count.products,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching admin sellers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sellers' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { sellerId, isVerified, commissionRate } = body;

    if (!sellerId) {
      return NextResponse.json(
        { error: 'sellerId is required' },
        { status: 400 }
      );
    }

    const existing = await db.seller.findUnique({ where: { id: sellerId } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (isVerified !== undefined) data.isVerified = isVerified;
    if (commissionRate !== undefined) data.commissionRate = parseFloat(commissionRate);

    const seller = await db.seller.update({
      where: { id: sellerId },
      data,
      include: {
        user: { select: { name: true, email: true } },
        wallet: true,
      },
    });

    return NextResponse.json(seller);
  } catch (error) {
    console.error('Error updating seller:', error);
    return NextResponse.json(
      { error: 'Failed to update seller' },
      { status: 500 }
    );
  }
}
