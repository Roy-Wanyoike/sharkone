import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');

    // Auto-detect buyer if not provided
    if (!userId) {
      const buyer = await db.user.findFirst({ where: { role: 'BUYER' } });
      userId = buyer?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json({ addresses: [] });
    }

    const addresses = await db.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, label, fullName, phone, county, city, addressLine, isDefault } = body;

    if (!userId || !label || !fullName || !phone || !county || !addressLine) {
      return NextResponse.json(
        { error: 'userId, label, fullName, phone, county, and addressLine are required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await db.address.create({
      data: { userId, label, fullName, phone, county, city, addressLine, isDefault: isDefault ?? false },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}
