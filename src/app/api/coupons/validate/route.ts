import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, orderTotal, userId, categoryIds } = body as {
      code: string;
      orderTotal: number;
      userId?: string;
      categoryIds?: string[];
    };

    if (!code || !orderTotal) {
      return NextResponse.json(
        { valid: false, error: 'Coupon code and order total are required' },
        { status: 400 }
      );
    }

    const coupon = await db.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid coupon code',
      });
    }

    if (!coupon.isActive) {
      return NextResponse.json({
        valid: false,
        error: 'This coupon is no longer active',
      });
    }

    // Date validity
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return NextResponse.json({
        valid: false,
        error: 'This coupon is not yet valid',
      });
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return NextResponse.json({
        valid: false,
        error: 'This coupon has expired',
      });
    }

    // Global usage limit
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({
        valid: false,
        error: 'This coupon has reached its usage limit',
      });
    }

    // Per-user limit
    if (userId) {
      const usedCount = await db.usedCoupon.count({
        where: { couponId: coupon.id, userId },
      });
      if (usedCount >= coupon.perUserLimit) {
        return NextResponse.json({
          valid: false,
          error: `You have already used this coupon ${usedCount} time(s). Limit: ${coupon.perUserLimit}`,
        });
      }
    }

    // Minimum order value
    if (coupon.minOrderValue !== null && orderTotal < coupon.minOrderValue) {
      const fmt = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
      }).format(coupon.minOrderValue);
      return NextResponse.json({
        valid: false,
        error: `Minimum order value of ${fmt} required`,
      });
    }

    // Category restriction
    if (coupon.applicableCategories) {
      const allowedIds = coupon.applicableCategories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (allowedIds.length > 0 && categoryIds && categoryIds.length > 0) {
        const hasMatch = categoryIds.some((cid) => allowedIds.includes(cid));
        if (!hasMatch) {
          return NextResponse.json({
            valid: false,
            error: 'This coupon does not apply to the items in your cart',
          });
        }
      }
    }

    // Calculate discount
    let discount = 0;
    let isFreeShipping = false;

    switch (coupon.type) {
      case 'PERCENTAGE': {
        discount = (orderTotal * coupon.value) / 100;
        if (coupon.maxDiscount !== null) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
        break;
      }
      case 'FIXED_AMOUNT': {
        discount = Math.min(coupon.value, orderTotal);
        break;
      }
      case 'FREE_SHIPPING': {
        isFreeShipping = true;
        break;
      }
    }

    const newTotal = Math.max(0, orderTotal - discount);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        maxDiscount: coupon.maxDiscount,
      },
      discount,
      newTotal,
      isFreeShipping,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Something went wrong validating your coupon' },
      { status: 500 }
    );
  }
}
