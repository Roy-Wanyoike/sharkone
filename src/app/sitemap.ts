import { MetadataRoute } from 'next';
import prisma from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://sharkone.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    { url: `${BASE_URL}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${BASE_URL}/sell`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.7 },
    { url: `${BASE_URL}/b2b`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  try {
    // Dynamic product pages
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, updatedAt: true },
    });

    const productPages = products.map((p) => ({
      url: `${BASE_URL}/product/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Blog posts
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });

    const blogPages = posts.map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    // Categories
    const categories = await prisma.category.findMany({
      select: { slug: true },
    });

    const categoryPages = categories.map((c) => ({
      url: `${BASE_URL}/search?category=${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticPages, ...productPages, ...blogPages, ...categoryPages];
  } catch {
    return staticPages;
  }
}
