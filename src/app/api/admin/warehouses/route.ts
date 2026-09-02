import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { WarehouseStatus } from '@prisma/client';
import { requireAuth } from '@/lib/auth-guard';

export async function GET(request: Request) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const where: Record<string, unknown> = {};

    if (status && status !== 'ALL' && Object.values(WarehouseStatus).includes(status as WarehouseStatus)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        _count: { select: { inventoryItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get inventory summary per warehouse
    const warehouseSummaries = await Promise.all(
      warehouses.map(async (wh) => {
        const inventoryStats = await prisma.inventoryItem.aggregate({
          where: { warehouseId: wh.id },
          _sum: { quantity: true, reservedQuantity: true },
          _count: true,
        });

        // Get low stock items count (quantity <= reorderLevel)
        const lowStockCount = await prisma.inventoryItem.count({
          where: {
            warehouseId: wh.id,
            quantity: { lte: 10 },
          },
        });

        return {
          ...wh,
          totalItems: inventoryStats._sum.quantity || 0,
          totalReserved: inventoryStats._sum.reservedQuantity || 0,
          inventoryCount: inventoryStats._count,
          lowStockCount,
          capacityUsed: inventoryStats._sum.quantity || 0,
          capacityPercentage: wh.capacity > 0
            ? Math.round(((inventoryStats._sum.quantity || 0) / wh.capacity) * 100)
            : 0,
        };
      })
    );

    return NextResponse.json({ warehouses: warehouseSummaries });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const {
      name,
      code,
      address,
      city,
      county,
      latitude,
      longitude,
      status,
      capacity,
      managerName,
      managerPhone,
    } = body;

    if (!name || !code || !address || !city || !county) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code, address, city, county' },
        { status: 400 }
      );
    }

    // Check unique code
    const existing = await prisma.warehouse.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: 'Warehouse code already exists' },
        { status: 409 }
      );
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        address,
        city,
        county,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: status || 'ACTIVE',
        capacity: capacity ? parseInt(capacity) : 1000,
        managerName: managerName || null,
        managerPhone: managerPhone || null,
      },
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}
