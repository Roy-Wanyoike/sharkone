import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const totalWarehouses = await prisma.warehouse.count();
    const activeWarehouses = await prisma.warehouse.count({ where: { status: 'ACTIVE' } });

    // Total capacity across all warehouses
    const capacityData = await prisma.warehouse.aggregate({
      _sum: { capacity: true },
    });
    const totalCapacity = capacityData._sum.capacity || 0;

    // Total items in stock
    const inventoryStats = await prisma.inventoryItem.aggregate({
      _sum: { quantity: true, reservedQuantity: true },
      _count: true,
    });
    const totalItemsInStock = inventoryStats._sum.quantity || 0;
    const totalReserved = inventoryStats._sum.reservedQuantity || 0;

    // Capacity used across all warehouses
    const capacityPercentage = totalCapacity > 0
      ? Math.round((totalItemsInStock / totalCapacity) * 100)
      : 0;

    // Low stock alerts: items where quantity <= reorderLevel
    const lowStockAlerts = await prisma.inventoryItem.count({
      where: {
        quantity: { lte: 10 }, // Using a simple threshold for the count
      },
    });

    // More precise low stock: quantity <= reorderLevel
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        quantity: { lte: 1000 }, // Fetch all to evaluate
      },
      select: { id: true, quantity: true, reorderLevel: true },
    });
    const preciseLowStockCount = lowStockItems.filter(
      (item) => item.quantity <= item.reorderLevel
    ).length;

    // Inventory value (sum of quantity * price for each inventory item)
    const inventoryWithProducts = await prisma.inventoryItem.findMany({
      select: {
        quantity: true,
        product: { select: { price: true } },
      },
    });
    const inventoryValue = inventoryWithProducts.reduce(
      (sum, item) => sum + item.quantity * item.product.price,
      0
    );

    // Warehouses in maintenance
    const maintenanceCount = await prisma.warehouse.count({ where: { status: 'MAINTENANCE' } });

    return NextResponse.json({
      totalWarehouses,
      activeWarehouses,
      maintenanceCount,
      totalCapacity,
      totalItemsInStock,
      totalReserved,
      capacityPercentage,
      lowStockAlerts: preciseLowStockCount,
      inventoryValue,
      inventoryItemCount: inventoryStats._count,
    });
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse stats' },
      { status: 500 }
    );
  }
}
