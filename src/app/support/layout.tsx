import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Center',
  description:
    'Get help with your orders, deliveries, and account on SHARKONE. Browse FAQs, create support tickets, and track issue resolution.',
  openGraph: {
    title: 'Support Center - SHARKONE',
    description:
      'Get help with your orders, deliveries, and account on SHARKONE. Browse FAQs, create support tickets, and track issue resolution.',
  },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
