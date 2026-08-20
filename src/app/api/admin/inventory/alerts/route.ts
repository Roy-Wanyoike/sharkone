import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Fetch all inventory items then filter in-memory for the
    // computed condition: quantity - reservedQuantity <= reorderLevel
    const items = await db.inventoryItem.findMany({
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

    const alerts = items.filter(
      (item) => item.quantity - item.reservedQuantity <= item.reorderLevel
    ).map((item) => ({
      id: item.id,
      productName: item.product.name,
      productSlug: item.product.slug,
      productImage: item.product.image,
      warehouseName: item.warehouse.name,
      warehouseCode: item.warehouse.code,
      warehouseCity: item.warehouse.city,
      currentQuantity: item.quantity,
      reservedQuantity: item.reservedQuantity,
      availableQuantity: item.quantity - item.reservedQuantity,
      reorderLevel: item.reorderLevel,
      binLocation: item.binLocation,
      deficit: item.reorderLevel - (item.quantity - item.reservedQuantity),
    }));

    return NextResponse.json({ alerts, total: alerts.length });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory alerts' },
      { status: 500 }
    );
  }
}
