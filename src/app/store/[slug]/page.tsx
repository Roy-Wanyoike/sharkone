'use client';

import { useState, use, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  StarHalf,
  PackageOpen,
  ShieldCheck,
  ShoppingBag,
  ArrowDownUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProductCard } from '@/components/ecommerce/ProductCard';
import { Footer } from '@/components/ecommerce/Footer';
import type { Product, Seller } from '@/types';

/* ------------------------------------------------------------------ */
/*  Simple Navbar                                                      */
/* ------------------------------------------------------------------ */
function SimpleNavbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/#' },
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

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        )}
      </button>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden"
        >
          <div className="flex flex-col p-4 gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-gray-700 hover:text-amber-600 py-2"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Star Rating Display                                                */
/* ------------------------------------------------------------------ */
function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars)
          return <Star key={i} size={size} className="fill-amber-400 text-amber-400" />;
        if (i === fullStars && hasHalf)
          return <StarHalf key={i} size={size} className="fill-amber-400 text-amber-400" />;
        return <Star key={i} size={size} className="text-gray-300" />;
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sort Options                                                       */
/* ------------------------------------------------------------------ */
type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating';

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */
function StoreSkeleton() {
  return (
    <>
      {/* Header skeleton */}
      <div className="bg-gradient-to-b from-gray-50 to-white px-6 md:px-16 lg:px-32 py-12 md:py-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </div>
      </div>
      {/* Filter bar skeleton */}
      <div className="px-6 md:px-16 lg:px-32 py-6 border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="px-6 md:px-16 lg:px-32 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  404 Not Found                                                       */
/* ------------------------------------------------------------------ */
function StoreNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <PackageOpen className="h-10 w-10 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-[#0F172A]">Store Not Found</h1>
      <p className="text-gray-500 mt-2 max-w-md">
        The store you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Button asChild className="mt-6 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A]">
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Store Page                                                         */
/* ------------------------------------------------------------------ */
export default function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [sort, setSort] = useState<SortOption>('newest');

  const { data, isLoading, isError } = useQuery<{
    store: Seller;
    products: Product[];
  }>({
    queryKey: ['store', slug],
    queryFn: () => fetch(`/api/stores/${slug}`).then((r) => {
      if (!r.ok) throw new Error('Not found');
      return r.json();
    }),
    retry: false,
  });

  const store = data?.store;
  const allProducts = data?.products ?? [];

  const sortedProducts = useMemo(() => {
    const sorted = [...allProducts];
    switch (sort) {
      case 'newest':
        // already sorted by createdAt desc from API, but re-sort to be safe
        return sorted;
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      default:
        return sorted;
    }
  }, [allProducts, sort]);

  const handleQuickView = (product: Product) => {
    alert(`Quick view: ${product.name}`);
  };

  /* Loading state */
  if (isLoading) return <StoreSkeleton />;

  /* Error / 404 state */
  if (isError || !store) return (
    <>
      <SimpleNavbar />
      <StoreNotFound />
    </>
  );

  const initials = store.storeName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />

      <main className="flex-1">
        {/* ---------------------------------------------------------------- */
        /*  Store Header                                                     */
        /* ---------------------------------------------------------------- */}
        <section className="bg-gradient-to-b from-gray-50 to-white px-6 md:px-16 lg:px-32 py-12 md:py-16 border-b border-gray-200">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-start md:items-center gap-6"
            >
              {/* Avatar / Logo */}
              <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-white shadow-lg shrink-0">
                <AvatarImage src={store.storeLogo ?? undefined} alt={store.storeName} />
                <AvatarFallback className="bg-[#0F172A] text-white text-2xl md:text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F172A] tracking-tight">
                    {store.storeName}
                  </h1>
                  {store.isVerified && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified
                    </Badge>
                  )}
                </div>

                {store.storeDescription && (
                  <p className="text-gray-600 mt-2 text-sm md:text-base max-w-2xl leading-relaxed">
                    {store.storeDescription}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 text-sm text-gray-600">
                  {/* Rating */}
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={store.rating} size={16} />
                    <span className="font-semibold text-[#0F172A]">{store.rating.toFixed(1)}</span>
                  </div>

                  {/* Separator */}
                  <span className="hidden sm:inline h-4 w-px bg-gray-300" />

                  {/* Total Sales */}
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-gray-400" />
                    <span>
                      <span className="font-semibold text-[#0F172A]">{store.totalSales.toLocaleString()}</span> sales
                    </span>
                  </div>

                  {/* Separator */}
                  <span className="hidden sm:inline h-4 w-px bg-gray-300" />

                  {/* Product Count */}
                  <div className="flex items-center gap-1.5">
                    <PackageOpen className="h-4 w-4 text-gray-400" />
                    <span>
                      <span className="font-semibold text-[#0F172A]">{store._count?.products ?? allProducts.length}</span> products
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */
        /*  Sort / Filter Bar                                                 */
        /* ---------------------------------------------------------------- */}
        <section className="px-6 md:px-16 lg:px-32 py-5 border-b border-gray-100 bg-white sticky top-[57px] z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-[#0F172A]">{allProducts.length}</span>{' '}
              {allProducts.length === 1 ? 'product' : 'products'}
            </p>

            <div className="flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4 text-gray-400" />
              <Select
                value={sort}
                onValueChange={(v) => setSort(v as SortOption)}
              >
                <SelectTrigger size="sm" className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */
        /*  Product Grid                                                     */
        /* ---------------------------------------------------------------- */}
        <section className="px-6 md:px-16 lg:px-32 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            {sortedProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <PackageOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-[#0F172A]">
                  No products yet
                </h2>
                <p className="text-gray-500 mt-1 text-sm max-w-sm">
                  This store hasn&apos;t listed any products yet. Check back soon!
                </p>
                <Button asChild className="mt-6 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A]">
                  <Link href="/">Browse All Stores</Link>
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
                {sortedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      duration: 0.4,
                      delay: Math.min(index * 0.05, 0.3),
                    }}
                  >
                    <ProductCard product={product} onQuickView={handleQuickView} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
