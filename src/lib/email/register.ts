import { registerProvider, registerTemplate } from './index';
import { MockEmailProvider } from './providers/mock-email';
import { emailTemplates } from './templates';

export function registerEmailProviders() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Mock provider for development
  if (!isProduction) {
    registerProvider('MOCK_EMAIL', new MockEmailProvider(), true);
  }

  // TODO: Register SendGrid in production
  // if (process.env.SENDGRID_API_KEY) {
  //   const { SendGridProvider } = await import('./providers/sendgrid');
  //   registerProvider('SENDGRID', new SendGridProvider(), true);
  // }

  // TODO: Register Postmark in production
  // if (process.env.POSTMARK_API_KEY) {
  //   const { PostmarkProvider } = await import('./providers/postmark');
  //   registerProvider('POSTMARK', new PostmarkProvider(), true);
  // }

  // Register all email templates
  for (const template of emailTemplates) {
    registerTemplate(template);
  }
}
