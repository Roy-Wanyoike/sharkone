import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('sharkone-token')?.value ?? null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json([]);
    }

    const searches = await prisma.recentSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        query: true,
        createdAt: true,
      },
    });

    return NextResponse.json(searches);
  } catch (error) {
    console.error('Error fetching recent searches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent searches' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { query } = await request.json();
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim().slice(0, 200);

    // Upsert: if same query exists for this user, update createdAt to move to top
    const existing = await prisma.recentSearch.findFirst({
      where: { userId, query: trimmedQuery },
    });

    if (existing) {
      await prisma.recentSearch.update({
        where: { id: existing.id },
        data: { createdAt: new Date() },
      });
    } else {
      await prisma.recentSearch.create({
        data: { userId, query: trimmedQuery },
      });

      // Enforce limit of 20 per user – delete oldest extras
      const count = await prisma.recentSearch.count({
        where: { userId },
      });
      if (count > 20) {
        const excess = await prisma.recentSearch.findMany({
          where: { userId },
          orderBy: { createdAt: 'asc' },
          take: count - 20,
          select: { id: true },
        });
        if (excess.length > 0) {
          await prisma.recentSearch.deleteMany({
            where: { id: { in: excess.map((e) => e.id) } },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving recent search:', error);
    return NextResponse.json(
      { error: 'Failed to save recent search' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await prisma.recentSearch.deleteMany({ where: { userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing recent searches:', error);
    return NextResponse.json(
      { error: 'Failed to clear recent searches' },
      { status: 500 }
    );
  }
}
