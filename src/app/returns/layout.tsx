import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Refunds',
  description:
    'Request returns and track refunds on SHARKONE. Our hassle-free return policy lets you return items within 7 days of delivery.',
  openGraph: {
    title: 'Returns & Refunds - SHARKONE',
    description:
      'Request returns and track refunds on SHARKONE. Our hassle-free return policy lets you return items within 7 days of delivery.',
  },
};

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
