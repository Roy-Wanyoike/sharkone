import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/auth-guard';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const webhook = await prisma.webhook.findUnique({
      where: { id },
      include: {
        _count: { select: { deliveries: true } },
        deliveries: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: webhook.id,
      url: webhook.url,
      events: JSON.parse(webhook.events),
      secret: webhook.secret,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      deliveryCount: webhook._count.deliveries,
      recentDeliveries: webhook.deliveries,
    });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { url, events, isActive } = body;

    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (url !== undefined) updateData.url = url;
    if (events !== undefined) {
      if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json(
          { error: 'events must be a non-empty array' },
          { status: 400 }
        );
      }
      updateData.events = JSON.stringify(events);
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const webhook = await prisma.webhook.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: webhook.id,
      url: webhook.url,
      events: JSON.parse(webhook.events),
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const existing = await prisma.webhook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    await prisma.webhook.delete({ where: { id } });

    return NextResponse.json({ message: 'Webhook deleted' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const webhook = await prisma.webhook.findUnique({ where: { id } });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const testPayload = {
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from SHARKONE',
        webhookId: webhook.id,
      },
    };

    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhook.secret,
        'X-Webhook-Event': 'test.ping',
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await res.text().catch(() => null);

    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: 'test.ping',
        payload: JSON.stringify(testPayload),
        status: res.ok ? 'SUCCESS' : 'FAILED',
        statusCode: res.status,
        response: responseText,
        attempts: 1,
      },
    });

    return NextResponse.json({
      success: res.ok,
      statusCode: res.status,
      response: responseText,
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook',
        details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
