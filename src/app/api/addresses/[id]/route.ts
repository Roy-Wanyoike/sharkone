import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const address = await prisma.address.findUnique({ where: { id } });

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json({ error: 'Failed to fetch address' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { label, fullName, phone, county, city, addressLine, isDefault } = body;

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // If setting as default, unset other defaults for this user
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: existing.userId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(county !== undefined && { county }),
        ...(city !== undefined && { city }),
        ...(addressLine !== undefined && { addressLine }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.address.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
