import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.flashSale.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Flash sale not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, discountPercentage, startTime, endTime, isActive, totalStock } = body;

    // Build update data
    const data: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'Flash sale name cannot be empty' }, { status: 400 });
      }
      data.name = name.trim();
    }

    if (discountPercentage !== undefined) {
      if (discountPercentage <= 0 || discountPercentage > 100) {
        return NextResponse.json({ error: 'Discount percentage must be between 1 and 100' }, { status: 400 });
      }
      data.discountPercentage = Number(discountPercentage);
      // Recalculate sale price
      data.salePrice = parseFloat((existing.originalPrice * (1 - Number(discountPercentage) / 100)).toFixed(2));
    }

    if (startTime !== undefined) data.startTime = new Date(startTime);
    if (endTime !== undefined) {
      const end = new Date(endTime);
      const start = data.startTime ? new Date(data.startTime as string) : existing.startTime;
      if (end <= start) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
      }
      data.endTime = end;
    }

    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (totalStock !== undefined) data.totalStock = Math.max(1, Number(totalStock));

    const flashSale = await db.flashSale.update({
      where: { id },
      data,
      include: {
        product: { select: { id: true, name: true, image: true, slug: true } },
      },
    });

    return NextResponse.json({ flashSale });
  } catch (error) {
    console.error('Update flash sale error:', error);
    return NextResponse.json({ error: 'Failed to update flash sale' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.flashSale.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Flash sale not found' }, { status: 404 });
    }

    await db.flashSale.delete({ where: { id } });

    return NextResponse.json({ message: 'Flash sale deleted' });
  } catch (error) {
    console.error('Delete flash sale error:', error);
    return NextResponse.json({ error: 'Failed to delete flash sale' }, { status: 500 });
  }
}
