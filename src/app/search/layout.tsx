import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Products',
  description:
    'Search thousands of products on SHARKONE. Find electronics, fashion, home goods, and more with fast delivery across Kenya.',
  keywords:
    'search, find products, SHARKONE, online shopping Kenya, electronics, fashion, home goods',
  openGraph: {
    title: 'Search Products | SHARKONE',
    description:
      'Search thousands of products on SHARKONE. Find electronics, fashion, home goods, and more with fast delivery across Kenya.',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
