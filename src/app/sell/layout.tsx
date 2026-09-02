import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell on SHARKONE',
  description:
    'Start selling on SHARKONE and reach thousands of buyers across Kenya. Low 10% commission, built-in logistics, and real-time analytics.',
  keywords: 'sell online Kenya, become a seller, SHARKONE marketplace, e-commerce, start selling, commission free, logistics',
  openGraph: {
    title: 'Sell on SHARKONE',
    description:
      'Start selling on SHARKONE and reach thousands of buyers across Kenya. Low 10% commission, built-in logistics, and real-time analytics.',
  },
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}
