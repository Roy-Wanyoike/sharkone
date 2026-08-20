'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowRight, Calendar, User, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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
interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  author: string;
  tags: string | null;
  publishedAt: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Placeholder gradient for posts without cover image                 */
/* ------------------------------------------------------------------ */
const gradients = [
  'from-amber-400 via-orange-500 to-red-500',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-violet-500 via-purple-600 to-indigo-600',
  'from-rose-400 via-pink-500 to-fuchsia-600',
  'from-sky-400 via-blue-500 to-indigo-500',
  'from-lime-400 via-green-500 to-emerald-600',
];

function getGradient(index: number) {
  return gradients[index % gradients.length];
}

/* ------------------------------------------------------------------ */
/*  Post Card                                                          */
/* ------------------------------------------------------------------ */
function PostCard({ post, index }: { post: BlogPostSummary; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-shadow"
    >
      {/* Cover */}
      <Link href={`/blog/${post.slug}`} className="relative block h-48 overflow-hidden">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${getGradient(index)} flex items-center justify-center`}
          >
            <span className="text-white/80 text-5xl font-bold select-none">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 gap-3">
        {/* Tags */}
        {post.tags && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.split(',').slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] uppercase tracking-wider bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
              >
                {tag.trim()}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <Link href={`/blog/${post.slug}`} className="group-hover:text-amber-600 transition-colors">
          <h3 className="text-lg font-bold leading-snug text-[#0F172A] line-clamp-2">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {post.author}
            </span>
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(post.publishedAt), 'MMM d, yyyy')}
              </span>
            )}
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="flex items-center gap-1 text-amber-600 font-medium hover:text-amber-700 transition-colors"
          >
            Read
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */
function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <Skeleton className="h-48 w-full" />
      <div className="flex flex-col p-5 gap-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-auto pt-3 flex justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function BlogPage() {
  const [page, setPage] = useState(1);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const limit = 6;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['blog-posts', page, activeTag, limit],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (activeTag) params.set('tag', activeTag);
      return fetch(`/api/blog?${params}`).then((r) => r.json());
    },
  });

  // Collect all unique tags from posts
  const allTags = useMemo(() => {
    const posts = data?.posts;
    if (!posts) return [];
    const tagSet = new Set<string>();
    for (const post of posts as BlogPostSummary[]) {
      if (post.tags) {
        for (const t of post.tags.split(',')) {
          const trimmed = t.trim();
          if (trimmed) tagSet.add(trimmed);
        }
      }
    }
    return Array.from(tagSet).sort();
  }, [data?.posts]);

  const posts: BlogPostSummary[] = data?.posts ?? [];
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />

      <main className="flex-1 px-6 md:px-16 lg:px-32">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-12 pb-8 text-center"
        >
          <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-3">
            SHARKONE Blog
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F172A]">
            Insights & Updates
          </h1>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-sm md:text-base">
            Tips, trends, and stories from the SHARKONE team to help you succeed in e-commerce
          </p>
        </motion.section>

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-10"
          >
            <button
              onClick={() => { setActiveTag(null); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${!activeTag
                  ? 'bg-[#0F172A] text-white border-[#0F172A]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600'
                }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => { setActiveTag(tag); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeTag === tag
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600'
                  }`}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        )}

        {/* Posts Grid */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-20">
            <p className="text-gray-500">Failed to load blog posts. Please try again later.</p>
          </div>
        )}

        {!isLoading && !isError && posts.length === 0 && (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No posts found{activeTag ? ` for "${activeTag}"` : ''}.</p>
          </div>
        )}

        {!isLoading && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pb-16">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${page === i + 1
                      ? 'bg-[#0F172A] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="gap-1 text-xs"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
