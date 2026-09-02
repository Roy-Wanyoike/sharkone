import * as Sentry from '@sentry/nextjs';

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

export function captureMessage(message: string, level?: Sentry.SeverityLevel) {
  Sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email?: string; [key: string]: unknown } | null) {
  Sentry.setUser(user);
}

export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

export default Sentry;
