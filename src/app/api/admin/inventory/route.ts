import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || '';
    const lowStock = searchParams.get('lowStock') || '';

    const where: Record<string, unknown> = {};

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (lowStock === 'true') {
      // Items where available quantity (quantity - reservedQuantity) <= reorderLevel
      const allItems = await db.inventoryItem.findMany({
        where: warehouseId ? { warehouseId } : {},
        include: {
          product: {
            select: { id: true, name: true, slug: true, image: true },
          },
          warehouse: {
            select: { id: true, name: true, code: true, city: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const filtered = allItems.filter(
        (item) => item.quantity - item.reservedQuantity <= item.reorderLevel
      );

      return NextResponse.json({ inventory: filtered, total: filtered.length });
    }

    const inventory = await db.inventoryItem.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, slug: true, image: true },
        },
        warehouse: {
          select: { id: true, name: true, code: true, city: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ inventory, total: inventory.length });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
