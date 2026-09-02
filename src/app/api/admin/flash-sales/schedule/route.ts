import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { productId, discountPercentage, durationMinutes = 60 } = body;

    if (!productId || !discountPercentage) {
      return NextResponse.json(
        { error: 'productId and discountPercentage are required' },
        { status: 400 }
      );
    }

    if (discountPercentage <= 0 || discountPercentage > 100) {
      return NextResponse.json(
        { error: 'discountPercentage must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Look up the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Pick a random start time within the next 24 hours (minimum 30 min from now)
    const now = new Date();
    const minOffsetMs = 30 * 60 * 1000; // 30 minutes
    const maxOffsetMs = 24 * 60 * 60 * 1000; // 24 hours
    const randomOffsetMs = Math.floor(Math.random() * (maxOffsetMs - minOffsetMs)) + minOffsetMs;
    const startTime = new Date(now.getTime() + randomOffsetMs);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const salePrice = Math.round((product.price * (1 - discountPercentage / 100)) * 100) / 100;

    // Create the FlashSale record
    const flashSale = await prisma.flashSale.create({
      data: {
        name: `Flash: ${product.name} -${Math.round(discountPercentage)}%`,
        productId: product.id,
        discountPercentage,
        originalPrice: product.price,
        salePrice,
        startTime,
        endTime,
        totalStock: product.stock,
        soldCount: 0,
        isActive: true,
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true, image: true },
        },
      },
    });

    // Create Notification records for all BUYER users
    const buyers = await prisma.user.findMany({
      where: { role: 'BUYER' },
      select: { id: true },
    });

    if (buyers.length > 0) {
      const startStr = startTime.toLocaleString();
      const notificationsData = buyers.map((buyer) => ({
        userId: buyer.id,
        title: '🔥 Upcoming Flash Sale!',
        message: `${product.name} at ${Math.round(discountPercentage)}% off — starts at ${startStr}. Don't miss it!`,
        type: 'SYSTEM' as const,
      }));

      await prisma.notification.createMany({ data: notificationsData });
    }

    return NextResponse.json({ flashSale }, { status: 201 });
  } catch (error) {
    console.error('Flash sale schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule flash sale' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const now = new Date();

    const upcomingSales = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        startTime: { gt: now },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            category: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ flashSales: upcomingSales });
  } catch (error) {
    console.error('Fetch upcoming flash sales error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming flash sales' },
      { status: 500 }
    );
  }
}
