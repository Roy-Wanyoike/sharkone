import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

export async function GET() {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const couriers = await prisma.courier.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ couriers });
  } catch (error) {
    console.error('List couriers error:', error);
    return NextResponse.json({ error: 'Failed to list couriers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { name, code, apiKey, apiUrl } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const courier = await prisma.courier.create({
      data: {
        name,
        code: code.toUpperCase(),
        apiKey: apiKey || null,
        apiUrl: apiUrl || null,
        isActive: true,
      },
    });

    return NextResponse.json({ courier }, { status: 201 });
  } catch (error) {
    console.error('Create courier error:', error);
    return NextResponse.json({ error: 'Failed to create courier' }, { status: 500 });
  }
}
