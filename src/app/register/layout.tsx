import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Join SHARKONE as a buyer, seller, or delivery partner. Create your free account and start exploring East Africa\'s premier marketplace.',
  keywords: 'register, sign up, SHARKONE account, buyer, seller, delivery partner, Kenya',
  openGraph: {
    title: 'Create Account | SHARKONE',
    description:
      'Join SHARKONE as a buyer, seller, or delivery partner. Create your free account and start exploring East Africa\'s premier marketplace.',
  },
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
