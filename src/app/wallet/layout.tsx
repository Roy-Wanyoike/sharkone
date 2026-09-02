import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Wallet - SHARKONE',
  description: 'Manage your SHARKONE HoneyCoin wallet. Top up, view transactions, and pay seamlessly.',
};

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
