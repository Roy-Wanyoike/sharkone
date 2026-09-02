import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.courier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Courier not found' }, { status: 404 });
    }

    const updatable: Record<string, unknown> = {};
    const allowedFields = ['name', 'code', 'apiKey', 'apiUrl', 'isActive'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'isActive') {
          updatable[field] = Boolean(body[field]);
        } else {
          updatable[field] = body[field];
        }
      }
    }

    const courier = await prisma.courier.update({
      where: { id },
      data: updatable,
    });

    return NextResponse.json({ courier });
  } catch (error) {
    console.error('Update courier error:', error);
    return NextResponse.json({ error: 'Failed to update courier' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const existing = await prisma.courier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Courier not found' }, { status: 404 });
    }

    const courier = await prisma.courier.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ courier, success: true });
  } catch (error) {
    console.error('Deactivate courier error:', error);
    return NextResponse.json({ error: 'Failed to deactivate courier' }, { status: 500 });
  }
}
