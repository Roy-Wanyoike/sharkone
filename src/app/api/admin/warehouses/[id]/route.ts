import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const warehouse = await db.warehouse.findUnique({
      where: { id },
      include: {
        inventoryItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
                seller: {
                  select: {
                    storeName: true,
                    user: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    const inventoryStats = await db.inventoryItem.aggregate({
      where: { warehouseId: id },
      _sum: { quantity: true, reservedQuantity: true },
      _count: true,
    });

    return NextResponse.json({
      ...warehouse,
      totalItems: inventoryStats._sum.quantity || 0,
      totalReserved: inventoryStats._sum.reservedQuantity || 0,
      inventoryCount: inventoryStats._count,
      capacityPercentage: warehouse.capacity > 0
        ? Math.round(((inventoryStats._sum.quantity || 0) / warehouse.capacity) * 100)
        : 0,
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.warehouse.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Check code uniqueness if changed
    if (body.code && body.code !== existing.code) {
      const codeExists = await db.warehouse.findUnique({ where: { code: body.code } });
      if (codeExists) {
        return NextResponse.json(
          { error: 'Warehouse code already exists' },
          { status: 409 }
        );
      }
    }

    const warehouse = await db.warehouse.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.code !== undefined && { code: body.code }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.county !== undefined && { county: body.county }),
        ...(body.latitude !== undefined && {
          latitude: body.latitude !== null ? parseFloat(body.latitude) : null,
        }),
        ...(body.longitude !== undefined && {
          longitude: body.longitude !== null ? parseFloat(body.longitude) : null,
        }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.capacity !== undefined && { capacity: parseInt(body.capacity) }),
        ...(body.managerName !== undefined && { managerName: body.managerName || null }),
        ...(body.managerPhone !== undefined && { managerPhone: body.managerPhone || null }),
      },
    });

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to update warehouse' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.warehouse.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Soft-delete by setting status to INACTIVE
    const warehouse = await db.warehouse.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error('Error deactivating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate warehouse' },
      { status: 500 }
    );
  }
}
