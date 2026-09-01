import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Join SHARKONE as a buyer, seller, or delivery partner. Create your free account and start exploring East Africa\'s premier marketplace.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
