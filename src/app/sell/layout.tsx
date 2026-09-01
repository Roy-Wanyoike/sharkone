import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell on SHARKONE',
  description:
    'Start selling on SHARKONE and reach thousands of buyers across Kenya. Low 10% commission, built-in logistics, and real-time analytics.',
  openGraph: {
    title: 'Sell on SHARKONE',
    description:
      'Start selling on SHARKONE and reach thousands of buyers across Kenya. Low 10% commission, built-in logistics, and real-time analytics.',
  },
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}
