import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'B2B Commerce - SHARKONE',
  description:
    'Register your business for bulk ordering, credit terms, and invoicing on SHARKONE. Streamline your company procurement with NET 15-90 day payment terms.',
  openGraph: {
    title: 'B2B Commerce - SHARKONE',
    description:
      'Register your business for bulk ordering, credit terms, and invoicing on SHARKONE. Streamline your company procurement with NET 15-90 day payment terms.',
  },
};

export default function B2BLayout({ children }: { children: React.ReactNode }) {
  return children;
}
