import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About SHARKONE',
  description:
    'Learn about SHARKONE — East Africa\'s fastest-growing multi-vendor e-commerce platform connecting buyers, sellers, and delivery partners across the continent.',
  openGraph: {
    title: 'About SHARKONE',
    description:
      'Learn about SHARKONE — East Africa\'s fastest-growing multi-vendor e-commerce platform connecting buyers, sellers, and delivery partners across the continent.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
