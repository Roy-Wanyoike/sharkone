import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { StockTransferStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};

    if (status && status !== 'ALL' && Object.values(StockTransferStatus).includes(status as StockTransferStatus)) {
      where.status = status;
    }

    const transfers = await db.stockTransfer.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, slug: true, image: true },
        },
        fromWarehouse: {
          select: { id: true, name: true, code: true, city: true },
        },
        toWarehouse: {
          select: { id: true, name: true, code: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ transfers, total: transfers.length });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, fromWarehouseId, toWarehouseId, quantity, requestedBy, notes } = body;

    if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, fromWarehouseId, toWarehouseId, quantity' },
        { status: 400 }
      );
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be a positive integer' },
        { status: 400 }
      );
    }

    if (fromWarehouseId === toWarehouseId) {
      return NextResponse.json(
        { error: 'Source and destination warehouses cannot be the same' },
        { status: 400 }
      );
    }

    // Validate warehouses exist
    const [fromWarehouse, toWarehouse, product] = await Promise.all([
      db.warehouse.findUnique({ where: { id: fromWarehouseId } }),
      db.warehouse.findUnique({ where: { id: toWarehouseId } }),
      db.product.findUnique({ where: { id: productId } }),
    ]);

    if (!fromWarehouse) {
      return NextResponse.json({ error: 'Source warehouse not found' }, { status: 404 });
    }
    if (!toWarehouse) {
      return NextResponse.json({ error: 'Destination warehouse not found' }, { status: 404 });
    }
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check source inventory has enough available stock
    const sourceInventory = await db.inventoryItem.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId: fromWarehouseId,
        },
      },
    });

    if (!sourceInventory) {
      return NextResponse.json(
        { error: 'No inventory record for this product in the source warehouse' },
        { status: 404 }
      );
    }

    const availableQty = sourceInventory.quantity - sourceInventory.reservedQuantity;
    if (availableQty < parsedQty) {
      return NextResponse.json(
        { error: `Insufficient available stock in source warehouse. Available: ${availableQty}, Requested: ${parsedQty}` },
        { status: 400 }
      );
    }

    // Generate transfer number: STF-001, STF-002, etc.
    const lastTransfer = await db.stockTransfer.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { transferNumber: true },
    });

    let nextNum = 1;
    if (lastTransfer && lastTransfer.transferNumber) {
      const match = lastTransfer.transferNumber.match(/STF-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const transferNumber = `STF-${String(nextNum).padStart(3, '0')}`;

    const transfer = await db.stockTransfer.create({
      data: {
        transferNumber,
        productId,
        fromWarehouseId,
        toWarehouseId,
        quantity: parsedQty,
        status: 'PENDING',
        requestedBy: requestedBy || null,
        notes: notes || null,
      },
      include: {
        product: { select: { id: true, name: true, slug: true, image: true } },
        fromWarehouse: { select: { id: true, name: true, code: true, city: true } },
        toWarehouse: { select: { id: true, name: true, code: true, city: true } },
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json(
      { error: 'Failed to create transfer' },
      { status: 500 }
    );
  }
}
