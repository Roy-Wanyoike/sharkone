import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function POST(request: Request) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const { inventoryItemId, quantity, reason } = body;

    if (!inventoryItemId || quantity === undefined || quantity === null) {
      return NextResponse.json(
        { error: 'Missing required fields: inventoryItemId, quantity' },
        { status: 400 }
      );
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty === 0) {
      return NextResponse.json(
        { error: 'Quantity must be a non-zero integer' },
        { status: 400 }
      );
    }

    // Find the inventory item
    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      include: {
        product: { select: { name: true } },
        warehouse: { select: { name: true } },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // For removal, check sufficient stock
    if (parsedQty < 0) {
      const availableQty = item.quantity - item.reservedQuantity;
      if (availableQty + parsedQty < 0) {
        return NextResponse.json(
          { error: `Insufficient available stock. Available: ${availableQty}, attempting to remove: ${Math.abs(parsedQty)}` },
          { status: 400 }
        );
      }
    }

    const newQuantity = item.quantity + parsedQty;
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: 'Resulting quantity cannot be negative' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      quantity: newQuantity,
    };

    // Set lastRestocked when adding stock
    if (parsedQty > 0) {
      updateData.lastRestocked = new Date();
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: updateData,
      include: {
        product: { select: { id: true, name: true, slug: true, image: true } },
        warehouse: { select: { id: true, name: true, code: true, city: true } },
      },
    });

    return NextResponse.json({
      inventoryItem: updated,
      adjustment: {
        type: parsedQty > 0 ? 'ADD' : 'REMOVE',
        amount: Math.abs(parsedQty),
        reason: reason || null,
        previousQuantity: item.quantity,
        newQuantity: newQuantity,
      },
    });
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    return NextResponse.json(
      { error: 'Failed to adjust inventory' },
      { status: 500 }
    );
  }
}
