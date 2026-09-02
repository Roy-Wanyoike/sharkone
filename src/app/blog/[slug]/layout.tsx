import type { Metadata } from 'next';
import prisma from '@/lib/db';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let post;
  try {
    post = await prisma.blogPost.findUnique({ where: { slug } });
  } catch {
    // DB unavailable during build – return fallback
  }

  if (!post) {
    return {
      title: 'Post Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${post.title} | SHARKONE Blog`;
  const description =
    post.excerpt ??
    post.content.replace(/<[^>]*>/g, '').slice(0, 160) ??
    `Read "${post.title}" on the SHARKONE blog.`;

  const tags: string[] = post.tags
    ? (typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags)
    : [];

  return {
    title,
    description,
    keywords: ['SHARKONE blog', ...tags, 'e-commerce Kenya'].join(', '),
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author],
      tags,
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
