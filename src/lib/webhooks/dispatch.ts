import prisma from '@/lib/db';

export async function dispatchWebhook(event: string, data: unknown) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { isActive: true },
    });

    const matching = webhooks.filter((w) => {
      try {
        const events: string[] = JSON.parse(w.events);
        return events.includes(event);
      } catch {
        return false;
      }
    });

    for (const webhook of matching) {
      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };

      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: JSON.stringify(payload),
          status: 'PENDING',
        },
      });

      // Fire-and-forget: don't await the fetch
      (async () => {
        try {
          const res = await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Secret': webhook.secret,
              'X-Webhook-Event': event,
            },
            body: JSON.stringify(payload),
          });

          const status = res.ok ? 'SUCCESS' : 'FAILED';
          const responseText = await res.text().catch(() => null);

          await prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status,
              statusCode: res.status,
              response: responseText,
              attempts: { increment: 1 },
            },
          });
        } catch {
          await prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'FAILED',
              attempts: { increment: 1 },
            },
          });
        }
      })();
    }
  } catch (error) {
    console.error('Error dispatching webhook:', error);
  }
}
