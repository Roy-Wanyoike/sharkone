import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createNotification } from '@/lib/notification-templates';
import { requireAuth } from '@/lib/auth-guard';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body: { action: 'approve' | 'reject'; notes?: string } = await request.json();
    const { action, notes } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Find seller with user info
    const seller = await prisma.seller.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Approve seller
      await prisma.seller.update({
        where: { id },
        data: { isVerified: true },
      });

      // Send welcome notification to seller
      await createNotification(seller.userId, 'SELLER_VERIFIED', {
        sellerName: seller.storeName,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          role: 'ADMIN',
          action: 'SELLER_APPROVE',
          resource: 'Seller',
          resourceId: seller.id,
          details: JSON.stringify({
            storeName: seller.storeName,
            notes: notes ?? null,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Seller "${seller.storeName}" has been approved and verified.`,
      });
    }

    // Reject seller
    await prisma.seller.update({
      where: { id },
      data: { isVerified: false },
    });

    // Send rejection notification
    await createNotification(seller.userId, 'RETURN_REJECTED', {
      orderNumber: 'N/A',
      reason: notes ?? 'Your seller verification was not approved at this time. You may reapply later.',
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        role: 'ADMIN',
        action: 'SELLER_REJECT',
        resource: 'Seller',
        resourceId: seller.id,
        details: JSON.stringify({
          storeName: seller.storeName,
          notes: notes ?? null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Seller "${seller.storeName}" has been rejected.`,
    });
  } catch (error) {
    console.error('Error verifying seller:', error);
    return NextResponse.json(
      { error: 'Failed to process verification' },
      { status: 500 }
    );
  }
}
