import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { usedCoupons: { take: 10, orderBy: { usedAt: 'desc' } } },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Get coupon error:', error);
    return NextResponse.json({ error: 'Failed to get coupon' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const updatable: Record<string, unknown> = {};
    const allowedFields = [
      'code', 'type', 'value', 'minOrderValue', 'maxDiscount',
      'usageLimit', 'perUserLimit', 'validFrom', 'validUntil',
      'applicableCategories', 'description', 'isActive',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'code') {
          updatable[field] = String(body[field]).trim().toUpperCase();
        } else if (field === 'value' || field === 'minOrderValue' || field === 'maxDiscount' || field === 'usageLimit' || field === 'perUserLimit') {
          updatable[field] = body[field] === null ? null : Number(body[field]);
        } else if (field === 'isActive') {
          updatable[field] = Boolean(body[field]);
        } else if (field === 'validFrom' || field === 'validUntil') {
          updatable[field] = body[field] ? new Date(body[field]) : null;
        } else {
          updatable[field] = body[field];
        }
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updatable,
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error('Update coupon error:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ coupon, success: true });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Failed to deactivate coupon' }, { status: 500 });
  }
}
