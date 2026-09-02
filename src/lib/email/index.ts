import prisma from '@/lib/db';
import { EmailMessage, EmailTemplate, EmailProvider } from './types';

const providers = new Map<string, EmailProvider>();
const templates = new Map<string, EmailTemplate>();

let defaultProviderName: string | null = null;

export function registerProvider(name: string, provider: EmailProvider, isDefault = false) {
  providers.set(name, provider);
  if (isDefault || !defaultProviderName) {
    defaultProviderName = name;
  }
}

export function registerTemplate(template: EmailTemplate) {
  templates.set(template.name, template);
}

function getProvider(): EmailProvider {
  if (!defaultProviderName || !providers.has(defaultProviderName)) {
    throw new Error('No email provider registered. Call registerEmailProviders() first.');
  }
  return providers.get(defaultProviderName)!;
}

export async function sendEmail(email: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = getProvider();

  // Create log entry
  const log = await prisma.emailLog.create({
    data: {
      to: email.to,
      subject: email.subject,
      template: 'DIRECT',
      data: JSON.stringify({}),
      status: 'PENDING',
    },
  });

  try {
    const result = await provider.send(email);

    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        error: result.error ?? null,
        sentAt: result.success ? new Date() : null,
      },
    });

    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';

    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        error: errorMsg,
      },
    });

    return { success: false, error: errorMsg };
  }
}

export async function sendTemplatedEmail(
  templateName: string,
  to: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = templates.get(templateName);
  if (!template) {
    throw new Error(`Email template '${templateName}' not registered`);
  }

  // Interpolate subject placeholders like {{orderNumber}}
  let subject = template.subject;
  for (const [key, value] of Object.entries(data)) {
    subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
  }

  const html = template.generateHtml(data);

  // Log with template info
  const log = await prisma.emailLog.create({
    data: {
      to,
      subject,
      template: templateName,
      data: JSON.stringify(data),
      status: 'PENDING',
    },
  });

  try {
    const provider = getProvider();
    const result = await provider.send({ to, subject, html });

    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        error: result.error ?? null,
        sentAt: result.success ? new Date() : null,
      },
    });

    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';

    await prisma.emailLog.update({
      where: { id: log.id },
      data: {
        status: 'FAILED',
        error: errorMsg,
      },
    });

    return { success: false, error: errorMsg };
  }
}

export { type EmailMessage, type EmailTemplate, type EmailProvider };
