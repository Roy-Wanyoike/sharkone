import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { UserRole } from '@prisma/client';

const DEFAULT_PREFS = {
  email: true,
  push: true,
  orderUpdates: true,
  promotions: false,
};

export async function GET() {
  try {
    const user = await prisma.user.findFirst({ where: { role: UserRole.BUYER } });
    if (!user) {
      return NextResponse.json({ preferences: DEFAULT_PREFS });
    }

    let prefs = DEFAULT_PREFS;
    if (user.notificationPrefs) {
      try {
        prefs = { ...DEFAULT_PREFS, ...JSON.parse(user.notificationPrefs) };
      } catch {
        prefs = DEFAULT_PREFS;
      }
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body: {
      email?: boolean;
      push?: boolean;
      orderUpdates?: boolean;
      promotions?: boolean;
    } = await request.json();

    const user = await prisma.user.findFirst({ where: { role: UserRole.BUYER } });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Merge existing prefs with updates
    let currentPrefs = DEFAULT_PREFS;
    if (user.notificationPrefs) {
      try {
        currentPrefs = { ...DEFAULT_PREFS, ...JSON.parse(user.notificationPrefs) };
      } catch {
        // keep defaults
      }
    }

    const updatedPrefs = {
      ...currentPrefs,
      ...(body.email !== undefined && { email: body.email }),
      ...(body.push !== undefined && { push: body.push }),
      ...(body.orderUpdates !== undefined && { orderUpdates: body.orderUpdates }),
      ...(body.promotions !== undefined && { promotions: body.promotions }),
    };

    await prisma.user.update({
      where: { id: user.id },
      data: { notificationPrefs: JSON.stringify(updatedPrefs) },
    });

    return NextResponse.json({ success: true, preferences: updatedPrefs });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
