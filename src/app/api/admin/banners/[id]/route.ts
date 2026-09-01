import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { BannerPosition } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, image, link, position, order, active } = body;

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (image !== undefined) updateData.image = image;
    if (link !== undefined) updateData.link = link || null;
    if (position !== undefined && Object.values(BannerPosition).includes(position as BannerPosition)) {
      updateData.position = position;
    }
    if (order !== undefined) updateData.order = order;
    if (active !== undefined) updateData.active = active;

    const banner = await prisma.banner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    await prisma.banner.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
