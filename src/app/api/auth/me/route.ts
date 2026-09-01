import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('sharkone-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        phone: true,
        createdAt: true,
        seller: { select: { id: true, storeName: true, storeSlug: true, isVerified: true } },
      },
    });

    if (!user) {
      // Invalid token — clear cookie
      const res = NextResponse.json({ error: 'User not found' }, { status: 401 });
      res.cookies.set('sharkone-token', '', { maxAge: 0, path: '/' });
      return res;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
