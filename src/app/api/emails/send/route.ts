import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { sendEmail, sendTemplatedEmail } from '@/lib/email/index';
import { registerEmailProviders } from '@/lib/email/register';

// Ensure providers and templates are registered
registerEmailProviders();

export async function POST(request: Request) {
  const user = await requireAuth('ADMIN');
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();

    // Templated email path
    if (body.templateName) {
      const { templateName, to, data } = body;

      if (!templateName || !to) {
        return NextResponse.json(
          { error: 'Missing required fields: templateName, to' },
          { status: 400 }
        );
      }

      const result = await sendTemplatedEmail(templateName, to, data || {});

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, messageId: result.messageId });
    }

    // Direct email path
    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const result = await sendEmail({ to, subject, html });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    console.error('Email send error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
