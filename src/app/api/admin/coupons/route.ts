import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { CouponType } from '@prisma/client';
import { requireAuth } from '@/lib/auth-guard';

const VALID_TYPES: CouponType[] = ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'];

function generateCouponCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(req: NextRequest) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const url = req.nextUrl;
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const search = url.searchParams.get('search')?.trim() || '';

    const where: Record<string, unknown> = search
      ? { OR: [{ code: { contains: search } }, { description: { contains: search } }] }
      : {};

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: {
          _count: {
            select: { usedCoupons: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    // Enrich with computed usage stats
    const enriched = coupons.map((c) => ({
      ...c,
      remainingUses: c.usageLimit !== null ? c.usageLimit - c.usageCount : null,
      uniqueUsersUsed: c._count.usedCoupons,
      usagePercentage: c.usageLimit !== null
        ? Math.round((c.usageCount / c.usageLimit) * 100)
        : null,
    }));

    return NextResponse.json({ coupons: enriched, total, page, limit });
  } catch (error) {
    console.error('List coupons error:', error);
    return NextResponse.json({ error: 'Failed to list coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { code, type, value, minOrderValue, maxDiscount, usageLimit, perUserLimit, validFrom, validUntil, applicableCategories, description, generateCode } = body;

    const couponCode = generateCode
      ? generateCouponCode(8)
      : code;

    if (!couponCode || !couponCode.trim()) {
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

    const finalCode = couponCode.trim().toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code: finalCode } });
    if (existing) {
      // If auto-generating, retry with a longer code
      if (generateCode) {
        const retryCode = generateCouponCode(12);
        const retryExists = await prisma.coupon.findUnique({ where: { code: retryCode } });
        if (!retryExists) {
          const coupon = await prisma.coupon.create({
            data: {
              code: retryCode,
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
        }
      }
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: finalCode,
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
