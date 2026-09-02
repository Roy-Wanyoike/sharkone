export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  generateHtml: (data: Record<string, unknown>) => string;
}

export interface EmailProvider {
  name: string;
  initialize(config: Record<string, string>): void;
  send(email: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
