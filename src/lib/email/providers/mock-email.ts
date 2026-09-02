// TODO: Replace with real SendGrid/Postmark integration when API keys are available

import { EmailProvider, EmailMessage } from '../types';

interface SentEmail {
  message: EmailMessage;
  messageId: string;
  sentAt: Date;
}

const sentEmails: SentEmail[] = [];

export function getMockSentEmails(): SentEmail[] {
  return sentEmails;
}

export function clearMockSentEmails(): void {
  sentEmails.length = 0;
}

export class MockEmailProvider implements EmailProvider {
  name = 'MOCK_EMAIL';
  private config: Record<string, string> = {};

  initialize(config: Record<string, string>): void {
    this.config = config;
  }

  async send(email: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const messageId = `mock-${crypto.randomUUID()}`;

    sentEmails.push({
      message: email,
      messageId,
      sentAt: new Date(),
    });

    // Log to console in development for easy debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n📧 [MockEmail] Sent email to: ${email.to}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Message-ID: ${messageId}`);
      console.log(`   From: ${email.from ?? 'default'} | Reply-To: ${email.replyTo ?? 'none'}`);
      console.log('---');
    }

    // TODO: Replace with SendGrid/Postmark SDK
    // if (process.env.SENDGRID_API_KEY) {
    //   return sendgridSend(email);
    // }

    return { success: true, messageId };
  }
}
