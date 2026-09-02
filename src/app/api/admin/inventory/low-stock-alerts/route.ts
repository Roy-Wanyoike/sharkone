import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';
import { sendTemplatedEmail } from '@/lib/email';
import { registerEmailProviders } from '@/lib/email/register';
import { createNotification } from '@/lib/notification-templates';

export async function GET(request: Request) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Parse optional threshold from query string
    const { searchParams } = new URL(request.url);
    const threshold = Math.max(1, parseInt(searchParams.get('threshold') || '10', 10));

    // Find products with stock below the threshold
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lt: threshold } },
      select: { id: true, name: true, stock: true, sku: true },
      orderBy: { stock: 'asc' },
    });

    if (lowStockProducts.length === 0) {
      return NextResponse.json({ alerted: 0, products: [] });
    }

    // Find the admin user's email (use the authenticated admin or fallback to first ADMIN)
    const adminEmail = user.email;

    // Register email providers and templates
    registerEmailProviders();

    // Send email and create in-app notification for each low-stock product
    for (const product of lowStockProducts) {
      try {
        await sendTemplatedEmail(
          'LOW_STOCK_ALERT',
          adminEmail,
          {
            productName: product.name,
            currentStock: product.stock,
            threshold,
            sku: product.sku || null,
            adminUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin`,
          },
        );
      } catch (err) {
        console.error(`Failed to send low-stock email for ${product.name}:`, err);
      }

      try {
        await createNotification(
          user.id,
          'LOW_STOCK',
          {
            productName: product.name,
            stockCount: String(product.stock),
          },
          { productId: product.id, currentStock: product.stock, threshold },
        );
      } catch (err) {
        console.error(`Failed to create notification for ${product.name}:`, err);
      }
    }

    return NextResponse.json({
      alerted: lowStockProducts.length,
      products: lowStockProducts.map((p) => ({
        name: p.name,
        stock: p.stock,
      })),
    });
  } catch (error) {
    console.error('Error checking low stock alerts:', error);
    return NextResponse.json(
      { error: 'Failed to check low stock alerts' },
      { status: 500 },
    );
  }
}
