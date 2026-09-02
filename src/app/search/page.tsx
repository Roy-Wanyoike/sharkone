'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  SlidersHorizontal,
  X,
  Star,
  Loader2,
  PackageX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/ecommerce/ProductCard';
import { ProductDetailModal } from '@/components/ecommerce/ProductDetailModal';
import { Footer } from '@/components/ecommerce/Footer';
import type { Product, Category } from '@/types';

/* ------------------------------------------------------------------ */
/*  Simple Navbar                                                      */
/* ------------------------------------------------------------------ */
function SimpleNavbar() {
  const [open, setOpen] = React.useState(false);
  const links = [
    { label: 'Home', href: '/' },
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
            className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </div>

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
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const PRICE_RANGES = [
  { label: 'Under 1K', min: 0, max: 999 },
  { label: '1K – 5K', min: 1000, max: 5000 },
  { label: '5K – 10K', min: 5000, max: 10000 },
  { label: '10K – 25K', min: 10000, max: 25000 },
  { label: '25K+', min: 25000, max: Infinity },
];

const RATING_OPTIONS = [
  { label: '4+ stars', value: 4 },
  { label: '3+ stars', value: 3 },
  { label: '2+ stars', value: 2 },
];

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
];

/* ------------------------------------------------------------------ */
/*  Filter Panel (shared between sidebar & sheet)                     */
/* ------------------------------------------------------------------ */
function FilterPanel({
  priceRange,
  setPriceRange,
  minRating,
  setMinRating,
  selectedCategories,
  toggleCategory,
  categories,
  onClearAll,
}: {
  priceRange: number | null;
  setPriceRange: (i: number | null) => void;
  minRating: number | null;
  setMinRating: (v: number | null) => void;
  selectedCategories: string[];
  toggleCategory: (slug: string) => void;
  categories: Category[];
  onClearAll: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Clear All */}
      {(priceRange !== null || minRating !== null || selectedCategories.length > 0) && (
        <button
          onClick={onClearAll}
          className="text-sm font-medium text-amber-700 hover:text-amber-800 transition"
        >
          Clear all filters
        </button>
      )}

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((range, i) => (
            <button
              key={i}
              onClick={() => setPriceRange(priceRange === i ? null : i)}
              className={`text-xs px-3 py-1.5 rounded-full border transition
                ${
                  priceRange === i
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 text-gray-600 hover:border-gray-500'
                }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Rating</h3>
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMinRating(minRating === opt.value ? null : opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition
                ${
                  minRating === opt.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 text-gray-600 hover:border-gray-500'
                }`}
            >
              <Star className={`h-3 w-3 ${minRating === opt.value ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2.5 max-h-60 overflow-y-auto">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <Checkbox
                checked={selectedCategories.includes(cat.slug)}
                onCheckedChange={() => toggleCategory(cat.slug)}
                className="data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Skeleton                                                   */
/* ------------------------------------------------------------------ */
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Search Content (inner component that uses useSearchParams)         */
/* ------------------------------------------------------------------ */
function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  // Local state for filters
  const [query, setQuery] = React.useState(initialQuery);
  const [priceRange, setPriceRange] = React.useState<number | null>(null);
  const [minRating, setMinRating] = React.useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [sort, setSort] = React.useState('newest');
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Save search query to recent searches on mount
  React.useEffect(() => {
    if (initialQuery.trim()) {
      fetch('/api/search/recent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: initialQuery.trim() }),
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<(Category & { _count?: { products: number } })[]>;
    },
  });

  // Build query string for products
  const queryString = React.useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (priceRange !== null) {
      const range = PRICE_RANGES[priceRange];
      if (range.min > 0) params.set('minPrice', String(range.min));
      if (range.max !== Infinity) params.set('maxPrice', String(range.max));
    }
    if (minRating !== null) params.set('minRating', String(minRating));
    selectedCategories.forEach((c) => params.append('category', c));
    params.set('sort', sort);
    params.set('limit', '50');
    return params.toString();
  }, [query, priceRange, minRating, selectedCategories, sort]);

  // Fetch products
  const { data, isLoading } = useQuery({
    queryKey: ['search-products', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/products?${queryString}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      return json as { products: Product[]; total: number };
    },
  });

  const products = data?.products || [];
  const total = data?.total || 0;

  const toggleCategory = React.useCallback((slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  }, []);

  const clearAll = React.useCallback(() => {
    setPriceRange(null);
    setMinRating(null);
    setSelectedCategories([]);
  }, []);

  const hasFilters = priceRange !== null || minRating !== null || selectedCategories.length > 0;

  // Build active filter badges
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];
  if (priceRange !== null) {
    activeFilters.push({
      key: 'price',
      label: PRICE_RANGES[priceRange].label,
      onRemove: () => setPriceRange(null),
    });
  }
  if (minRating !== null) {
    activeFilters.push({
      key: 'rating',
      label: `${minRating}+ stars`,
      onRemove: () => setMinRating(null),
    });
  }
  selectedCategories.forEach((slug) => {
    const cat = categories.find((c) => c.slug === slug);
    activeFilters.push({
      key: `cat-${slug}`,
      label: cat?.name || slug,
      onRemove: () => toggleCategory(slug),
    });
  });

  // Mobile filters content
  const filterContent = (
    <FilterPanel
      priceRange={priceRange}
      setPriceRange={setPriceRange}
      minRating={minRating}
      setMinRating={setMinRating}
      selectedCategories={selectedCategories}
      toggleCategory={toggleCategory}
      categories={categories}
      onClearAll={clearAll}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />

      <main className="flex-1">
        {/* Search Header */}
        <div className="px-6 md:px-16 lg:px-32 pt-8 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {query.trim()
                  ? <>Results for &lsquo;{query}&rsquo;</>
                  : 'All Products'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isLoading ? 'Searching...' : `${total} product${total !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {/* Search input inline */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setQuery(e.currentTarget.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
              />
            </div>
          </div>
        </div>

        {/* Active Filters + Sort Bar */}
        <div className="px-6 md:px-16 lg:px-32 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left: Mobile filter button + active filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mobile filter button */}
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden rounded-full gap-2 border-gray-300"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {hasFilters && (
                      <span className="bg-gray-900 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {activeFilters.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 px-1">
                    {filterContent}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Active filter badges */}
              <AnimatePresence>
                {activeFilters.map((f) => (
                  <motion.div
                    key={f.key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                  >
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-800 border-amber-200 gap-1.5 pl-2.5 pr-1 py-1 cursor-default"
                    >
                      {f.label}
                      <button
                        onClick={f.onRemove}
                        className="ml-0.5 p-0.5 rounded-full hover:bg-amber-200 transition"
                        aria-label={`Remove ${f.label} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger size="sm" className="w-[180px] rounded-lg border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main content: Sidebar + Grid */}
        <div className="px-6 md:px-16 lg:px-32 pb-16">
          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-60 shrink-0">
              <div className="sticky top-20">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </h2>
                {filterContent}
              </div>
            </aside>

            {/* Product Grid Area */}
            <div className="flex-1 min-w-0">
              {isLoading && <ProductGridSkeleton />}

              {!isLoading && products.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <PackageX className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    {hasFilters
                      ? 'Try adjusting your filters or broadening your search to find more products.'
                      : 'We couldn\'t find any products matching your search. Try a different keyword or browse our categories.'}
                  </p>
                  {hasFilters && (
                    <Button
                      variant="outline"
                      className="mt-4 rounded-full border-gray-800"
                      onClick={clearAll}
                    >
                      Clear all filters
                    </Button>
                  )}
                </motion.div>
              )}

              {!isLoading && products.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickView={setSelectedProduct}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 text-center mt-8">
                    Showing {products.length} of {total} products
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (wraps in Suspense)                                           */
/* ------------------------------------------------------------------ */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-white">
          <SimpleNavbar />
          <div className="px-6 md:px-16 lg:px-32 pt-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-40 mb-8" />
            <ProductGridSkeleton />
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
