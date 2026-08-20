import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CouponType } from '@prisma/client';

const VALID_TYPES: CouponType[] = ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'];

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const search = url.searchParams.get('search')?.trim() || '';

    const where = search
      ? { OR: [{ code: { contains: search } }, { description: { contains: search } }] }
      : {};

    const [coupons, total] = await Promise.all([
      db.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.coupon.count({ where }),
    ]);

    return NextResponse.json({ coupons, total, page, limit });
  } catch (error) {
    console.error('List coupons error:', error);
    return NextResponse.json({ error: 'Failed to list coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, type, value, minOrderValue, maxDiscount, usageLimit, perUserLimit, validFrom, validUntil, applicableCategories, description } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid coupon type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (type !== 'FREE_SHIPPING' && (value === undefined || value === null || value <= 0)) {
      return NextResponse.json({ error: 'Coupon value must be greater than 0' }, { status: 400 });
    }

    const existing = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }

    const coupon = await db.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value: type === 'FREE_SHIPPING' ? 0 : Number(value),
        minOrderValue: minOrderValue !== undefined ? Number(minOrderValue) : null,
        maxDiscount: maxDiscount !== undefined ? Number(maxDiscount) : null,
        usageLimit: usageLimit !== undefined ? Number(usageLimit) : null,
        perUserLimit: perUserLimit !== undefined ? Number(perUserLimit) : 1,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        applicableCategories: applicableCategories || null,
        description: description || null,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
