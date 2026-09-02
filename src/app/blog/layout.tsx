import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SHARKONE Blog',
  description:
    'Tips, trends, and stories from the SHARKONE team. Stay updated on e-commerce insights, seller success stories, and platform news.',
  keywords: 'SHARKONE blog, e-commerce tips, Kenya marketplace, seller stories, online shopping news',
  openGraph: {
    title: 'SHARKONE Blog',
    description:
      'Tips, trends, and stories from the SHARKONE team. Stay updated on e-commerce insights, seller success stories, and platform news.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
