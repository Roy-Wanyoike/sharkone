import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { StockTransferStatus } from '@prisma/client';
import { requireAuth } from '@/lib/auth-guard';

type TransferAction = 'approve' | 'complete' | 'cancel';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, approvedBy } = body;

    if (!action || !['approve', 'complete', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing or invalid action. Must be: approve, complete, or cancel' },
        { status: 400 }
      );
    }

    // Fetch transfer with related data
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        fromWarehouse: { select: { id: true, name: true, code: true } },
        toWarehouse: { select: { id: true, name: true, code: true } },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Validate state transitions
    if (action === 'approve') {
      if (transfer.status !== StockTransferStatus.PENDING) {
        return NextResponse.json(
          { error: `Cannot approve transfer in ${transfer.status} status. Must be PENDING.` },
          { status: 400 }
        );
      }

      // Re-check stock at approval time
      const sourceInventory = await prisma.inventoryItem.findUnique({
        where: {
          productId_warehouseId: {
            productId: transfer.productId,
            warehouseId: transfer.fromWarehouseId,
          },
        },
      });

      if (!sourceInventory) {
        return NextResponse.json(
          { error: 'Source inventory record not found' },
          { status: 404 }
        );
      }

      const availableQty = sourceInventory.quantity - sourceInventory.reservedQuantity;
      if (availableQty < transfer.quantity) {
        return NextResponse.json(
          { error: `Insufficient available stock to approve. Available: ${availableQty}, Required: ${transfer.quantity}` },
          { status: 400 }
        );
      }

      const updated = await prisma.stockTransfer.update({
        where: { id },
        data: {
          status: StockTransferStatus.APPROVED,
          approvedBy: approvedBy || null,
        },
        include: {
          product: { select: { id: true, name: true, slug: true, image: true } },
          fromWarehouse: { select: { id: true, name: true, code: true, city: true } },
          toWarehouse: { select: { id: true, name: true, code: true, city: true } },
        },
      });

      return NextResponse.json(updated);
    }

    if (action === 'complete') {
      if (
        transfer.status !== StockTransferStatus.APPROVED &&
        transfer.status !== StockTransferStatus.IN_TRANSIT
      ) {
        return NextResponse.json(
          { error: `Cannot complete transfer in ${transfer.status} status. Must be APPROVED or IN_TRANSIT.` },
          { status: 400 }
        );
      }

      // Use a transaction to atomically move stock
      await prisma.$transaction(async (tx) => {
        // Deduct from source warehouse
        const sourceInv = await tx.inventoryItem.findUnique({
          where: {
            productId_warehouseId: {
              productId: transfer.productId,
              warehouseId: transfer.fromWarehouseId,
            },
          },
        });

        if (!sourceInv || sourceInv.quantity < transfer.quantity) {
          throw new Error('Insufficient stock in source warehouse for completion');
        }

        await tx.inventoryItem.update({
          where: {
            productId_warehouseId: {
              productId: transfer.productId,
              warehouseId: transfer.fromWarehouseId,
            },
          },
          data: {
            quantity: { decrement: transfer.quantity },
          },
        });

        // Add to destination warehouse (upsert)
        await tx.inventoryItem.upsert({
          where: {
            productId_warehouseId: {
              productId: transfer.productId,
              warehouseId: transfer.toWarehouseId,
            },
          },
          create: {
            productId: transfer.productId,
            warehouseId: transfer.toWarehouseId,
            quantity: transfer.quantity,
            reservedQuantity: 0,
            reorderLevel: 10,
            lastRestocked: new Date(),
          },
          update: {
            quantity: { increment: transfer.quantity },
            lastRestocked: new Date(),
          },
        });

        // Update transfer status
        await tx.stockTransfer.update({
          where: { id },
          data: { status: StockTransferStatus.COMPLETED },
        });
      });

      const completed = await prisma.stockTransfer.findUnique({
        where: { id },
        include: {
          product: { select: { id: true, name: true, slug: true, image: true } },
          fromWarehouse: { select: { id: true, name: true, code: true, city: true } },
          toWarehouse: { select: { id: true, name: true, code: true, city: true } },
        },
      });

      return NextResponse.json(completed);
    }

    if (action === 'cancel') {
      if (
        transfer.status === StockTransferStatus.COMPLETED ||
        transfer.status === StockTransferStatus.CANCELLED
      ) {
        return NextResponse.json(
          { error: `Cannot cancel transfer in ${transfer.status} status.` },
          { status: 400 }
        );
      }

      const cancelled = await prisma.stockTransfer.update({
        where: { id },
        data: { status: StockTransferStatus.CANCELLED },
        include: {
          product: { select: { id: true, name: true, slug: true, image: true } },
          fromWarehouse: { select: { id: true, name: true, code: true, city: true } },
          toWarehouse: { select: { id: true, name: true, code: true, city: true } },
        },
      });

      return NextResponse.json(cancelled);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error updating transfer:', error);
    const message = error instanceof Error ? error.message : 'Failed to update transfer';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
