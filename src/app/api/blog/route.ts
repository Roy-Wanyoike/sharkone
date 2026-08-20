import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit')) || 9));
    const tag = searchParams.get('tag')?.trim();

    const where: Prisma.BlogPostWhereInput = {
      status: 'PUBLISHED',
      ...(tag
        ? {
            tags: { contains: tag },
          }
        : {}),
    };

    const [posts, total] = await Promise.all([
      db.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          author: true,
          tags: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      db.blogPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Blog GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
