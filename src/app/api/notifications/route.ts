import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    // If no userId provided, fall back to the first buyer user
    if (!userId) {
      const buyer = await prisma.user.findFirst({ where: { role: UserRole.BUYER } });
      if (!buyer) {
        return NextResponse.json({ notifications: [], unreadCount: 0 });
      }
      userId = buyer.id;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    const mapped = notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      data: n.data,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({ notifications: mapped, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body: { notificationIds: string[] } = await request.json();
    const { notificationIds } = body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'notificationIds must be a non-empty array' },
        { status: 400 }
      );
    }

    await prisma.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
