import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

/**
 * GET /api/flash-sales/cron
 * Auto-scheduler endpoint — callable by an external cron service (e.g. cron-job.org)
 * or manually via GET request.
 *
 * Logic:
 * 1. Count active/upcoming (within next 2 h) flash sales.
 * 2. If >= 2, skip — we already have enough queued.
 * 3. Otherwise randomly pick 1-2 products that do NOT already have an active flash sale,
 *    create flash sales with random discount (15-50 %), start time (1-3 h from now),
 *    duration (30-90 min).
 * 4. Create in-app notifications for every BUYER user.
 */
export async function GET() {
  try {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // ---------- 1. Count active / upcoming sales ----------
    const upcomingOrActive = await prisma.flashSale.count({
      where: {
        isActive: true,
        endTime: { gte: now },
        startTime: { lte: twoHoursFromNow },
      },
    });

    if (upcomingOrActive >= 2) {
      return NextResponse.json({
        status: 'skipped',
        message: `${upcomingOrActive} active/upcoming flash sales already exist (threshold: 2).`,
        scheduled: [],
      });
    }

    // ---------- 2. Find eligible products ----------
    // Products that are ACTIVE and do NOT already have an active flash sale
    const productsWithActiveFlash = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        endTime: { gte: now },
      },
      select: { productId: true },
    });

    const excludedProductIds = new Set(
      productsWithActiveFlash.map((fs) => fs.productId)
    );

    const eligibleProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        id: { notIn: Array.from(excludedProductIds) },
        stock: { gt: 0 },
      },
      select: { id: true, name: true, price: true, stock: true },
    });

    if (eligibleProducts.length === 0) {
      return NextResponse.json({
        status: 'skipped',
        message: 'No eligible products available for flash sale.',
        scheduled: [],
      });
    }

    // ---------- 3. Pick 1-2 random products ----------
    const neededCount = 2 - upcomingOrActive; // 1 or 2
    const shuffle = [...eligibleProducts].sort(() => Math.random() - 0.5);
    const selectedProducts = shuffle.slice(0, neededCount);

    // ---------- 4. Create flash sales ----------
    const scheduled: Array<{
      id: string;
      name: string;
      discountPercentage: number;
      startTime: string;
      endTime: string;
      salePrice: number;
    }> = [];

    for (const product of selectedProducts) {
      const discountPercentage = Math.floor(Math.random() * 36) + 15; // 15-50%
      const startOffsetMs = (Math.floor(Math.random() * 120) + 60) * 60 * 1000; // 1-3 h
      const durationMinutes = Math.floor(Math.random() * 61) + 30; // 30-90 min

      const startTime = new Date(now.getTime() + startOffsetMs);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      const salePrice =
        Math.round((product.price * (1 - discountPercentage / 100)) * 100) / 100;

      const flashSale = await prisma.flashSale.create({
        data: {
          name: `Flash: ${product.name} -${discountPercentage}%`,
          productId: product.id,
          discountPercentage,
          originalPrice: product.price,
          salePrice,
          startTime,
          endTime,
          totalStock: product.stock,
          soldCount: 0,
          isActive: true,
        },
      });

      scheduled.push({
        id: flashSale.id,
        name: flashSale.name,
        discountPercentage,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        salePrice,
      });
    }

    // ---------- 5. Create notifications for BUYER users ----------
    const buyers = await prisma.user.findMany({
      where: { role: 'BUYER' },
      select: { id: true },
    });

    if (buyers.length > 0 && scheduled.length > 0) {
      const notificationsData: Array<{
        userId: string;
        title: string;
        message: string;
        type: 'SYSTEM';
      }> = [];

      for (const sale of scheduled) {
        const startStr = new Date(sale.startTime).toLocaleString();
        for (const buyer of buyers) {
          notificationsData.push({
            userId: buyer.id,
            title: '🔥 Upcoming Flash Sale!',
            message: `${sale.name} — starts at ${startStr}. Don\'t miss it!`,
            type: 'SYSTEM',
          });
        }
      }

      await prisma.notification.createMany({ data: notificationsData });
    }

    return NextResponse.json({
      status: 'scheduled',
      message: `Auto-scheduled ${scheduled.length} flash sale(s).`,
      scheduled,
      notificationsCreated: buyers.length * scheduled.length,
    });
  } catch (error) {
    console.error('Flash sale cron scheduler error:', error);
    return NextResponse.json(
      { error: 'Failed to run flash sale auto-scheduler' },
      { status: 500 }
    );
  }
}
