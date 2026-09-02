import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  let product;
  try {
    product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, seller: true },
    });
  } catch {
    // DB unavailable during build – return fallback
  }

  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    };
  }

  const priceStr = `KES ${product.price.toLocaleString()}`;
  const title = `${product.name} - ${priceStr} | SHARKONE`;
  const description = product.description
    ? product.description.slice(0, 160)
    : `Shop ${product.name} on SHARKONE. ${product.category?.name ?? ''} product by ${product.seller?.storeName ?? 'SHARKONE seller'}. Fast delivery across Kenya.`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.category?.name ?? '',
      'buy online Kenya',
      'SHARKONE',
      product.seller?.storeName ?? '',
    ].filter(Boolean).join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      images: product.image
        ? [{ url: product.image, width: 1200, height: 630, alt: product.name }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.image ? [product.image] : [],
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
