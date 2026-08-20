import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));

    const where: Record<string, unknown> = {};
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [flashSales, total] = await Promise.all([
      db.flashSale.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, image: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.flashSale.count({ where }),
    ]);

    return NextResponse.json({ flashSales, total, page, limit });
  } catch (error) {
    console.error('List flash sales error:', error);
    return NextResponse.json({ error: 'Failed to list flash sales' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, productId, discountPercentage, startTime, endTime, isActive, totalStock } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Flash sale name is required' }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (discountPercentage === undefined || discountPercentage <= 0 || discountPercentage > 100) {
      return NextResponse.json({ error: 'Discount percentage must be between 1 and 100' }, { status: 400 });
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Start and end times are required' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Validate product exists
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, price: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const salePrice = parseFloat((product.price * (1 - discountPercentage / 100)).toFixed(2));

    const flashSale = await db.flashSale.create({
      data: {
        name: name.trim(),
        productId,
        discountPercentage: Number(discountPercentage),
        originalPrice: product.price,
        salePrice,
        startTime: start,
        endTime: end,
        isActive: isActive !== false,
        totalStock: Math.max(1, Number(totalStock) || 100),
      },
      include: {
        product: { select: { id: true, name: true, image: true, slug: true } },
      },
    });

    return NextResponse.json({ flashSale }, { status: 201 });
  } catch (error) {
    console.error('Create flash sale error:', error);
    return NextResponse.json({ error: 'Failed to create flash sale' }, { status: 500 });
  }
}
