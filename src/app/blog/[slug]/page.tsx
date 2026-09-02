'use client';

import { use, Suspense } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  ArrowRight,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/ecommerce/Footer';

/* ------------------------------------------------------------------ */
/*  Simple Navbar                                                      */
/* ------------------------------------------------------------------ */
function SimpleNavbar() {
  const links = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 backdrop-blur-md border-b border-gray-200 bg-white/90 shadow-sm">
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#0F172A" />
          <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="#F59E0B" />
        </svg>
        <span className="text-xl font-bold tracking-tight">
          <span className="text-[#0F172A]">SHARK</span>
          <span className="text-[#F59E0B]">ONE</span>
        </span>
      </Link>
      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium transition-colors ${l.href === '/blog' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  author: string;
  tags: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  author: string;
  tags: string | null;
  publishedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Reading time estimate                                              */
/* ------------------------------------------------------------------ */
function estimateReadingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/* ------------------------------------------------------------------ */
/*  Placeholder gradient                                              */
/* ------------------------------------------------------------------ */
const gradients = [
  'from-amber-400 via-orange-500 to-red-500',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-violet-500 via-purple-600 to-indigo-600',
  'from-rose-400 via-pink-500 to-fuchsia-600',
  'from-sky-400 via-blue-500 to-indigo-500',
  'from-lime-400 via-green-500 to-emerald-600',
];

/* ------------------------------------------------------------------ */
/*  Inner page (uses params)                                           */
/* ------------------------------------------------------------------ */
function BlogPostContent({ slug }: { slug: string }) {
  const { data: post, isLoading, isError } = useQuery<BlogPost>({
    queryKey: ['blog-post', slug],
    queryFn: () => fetch(`/api/blog/${slug}`).then((r) => {
      if (!r.ok) throw new Error('Not found');
      return r.json();
    }),
    retry: false,
  });

  const { data: relatedData } = useQuery<{ posts: RelatedPost[] }>({
    queryKey: ['blog-related', slug],
    queryFn: () =>
      fetch('/api/blog?limit=3').then((r) => r.json()),
    enabled: !!post,
  });

  const relatedPosts = (relatedData?.posts ?? []).filter(
    (p) => p.slug !== slug,
  );

  /* Loading state */
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SimpleNavbar />
        <main className="flex-1 px-6 md:px-16 lg:px-32">
          <div className="max-w-3xl mx-auto pt-12">
            <Skeleton className="h-6 w-24 mb-6" />
            <Skeleton className="h-56 w-full rounded-2xl mb-8" />
            <Skeleton className="h-10 w-3/4 mb-4" />
            <div className="flex gap-4 mb-8">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* Error / 404 */
  if (isError || !post) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SimpleNavbar />
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
          <p className="text-gray-500 mb-8">This blog post could not be found.</p>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />

      <main className="flex-1 px-6 md:px-16 lg:px-32">
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto pt-10 pb-16"
        >
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-600 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          {/* Cover image / placeholder */}
          <div className="relative w-full h-56 md:h-72 lg:h-80 rounded-2xl overflow-hidden mb-8">
            {post.coverImage ? (
              <img
                src={post.coverImage}
                alt={post.title}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div
                className={`h-full w-full bg-gradient-to-br ${gradients[post.title.length % gradients.length]} flex items-center justify-center`}
              >
                <span className="text-white/80 text-7xl font-bold select-none">
                  {post.title.charAt(0)}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          {/* Tags */}
          {post.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.split(',').map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-[10px] uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-200"
                >
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold leading-tight text-[#0F172A] mb-5">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-10 pb-8 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4 text-amber-500" />
              {post.author}
            </span>
            {post.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-amber-500" />
                {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" />
              {estimateReadingTime(post.content)}
            </span>
          </div>

          {/* Content - Markdown rendered */}
          <div className="prose prose-lg prose-gray max-w-none
            prose-headings:text-[#0F172A] prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-5
            prose-strong:text-[#0F172A]
            prose-li:text-gray-700 prose-li:mb-1
            prose-ul:my-4 prose-ul:pl-6
            prose-ol:my-4 prose-ol:pl-6
            prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-2
          ">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Divider */}
          <div className="my-12 border-t border-gray-100" />

          {/* Back to blog CTA */}
          <div className="text-center">
            <Button
              asChild
              variant="outline"
              className="border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            >
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl font-bold text-[#0F172A] mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedPosts.slice(0, 3).map((rp) => (
                  <motion.div
                    key={rp.id}
                    whileHover={{ y: -4 }}
                    className="group rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    <Link href={`/blog/${rp.slug}`} className="block">
                      {rp.tags && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {rp.tags.split(',').slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[9px] uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-200"
                            >
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <h3 className="text-sm font-semibold text-[#0F172A] leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
                        {rp.title}
                      </h3>
                      {rp.excerpt && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
                          {rp.excerpt}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium mt-3 group-hover:gap-2 transition-all">
                        Read
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </motion.article>
      </main>

      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported page wrapped in Suspense (Next.js 15+ params pattern)     */
/* ------------------------------------------------------------------ */
export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-white">
          <SimpleNavbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
          </main>
        </div>
      }
    >
      <BlogPostContent slug={slug} />
    </Suspense>
  );
}
