import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { BannerPosition } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || '';
    const active = searchParams.get('active');

    const where: Record<string, unknown> = {};

    if (position && Object.values(BannerPosition).includes(position as BannerPosition)) {
      where.position = position;
    }

    if (active !== null && active !== '' && active !== undefined) {
      where.active = active === 'true';
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [{ position: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, image, link, position, order, active } = body;

    if (!title || !image) {
      return NextResponse.json(
        { error: 'Missing required fields: title, image' },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        image,
        link: link || null,
        position: position || 'HERO',
        order: order ?? 0,
        active: active ?? true,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    );
  }
}
