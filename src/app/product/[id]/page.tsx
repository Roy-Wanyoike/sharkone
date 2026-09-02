'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Star,
  Minus,
  Plus,
  Heart,
  Truck,
  ShieldCheck,
  RotateCcw,
  PackageCheck,
  ChevronRight,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCartStore } from '@/store/cart-store';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';
import { Footer } from '@/components/ecommerce/Footer';
import type { Product } from '@/types';

/* ------------------------------------------------------------------ */
/*  Simple Navbar                                                      */
/* ------------------------------------------------------------------ */
function SimpleNavbar() {
  const [open, setOpen] = useState(false);
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
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200'
          }
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Review Form Component                                              */
/* ------------------------------------------------------------------ */
function ReviewForm({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');

  const mutation = useMutation({
    mutationFn: async (data: { rating: number; title?: string; comment: string; userName: string }) => {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to submit review');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Review submitted!');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      setRating(0);
      setTitle('');
      setComment('');
      setUserName('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim() || !userName.trim()) return;
    mutation.mutate({ rating, title: title.trim() || undefined, comment: comment.trim(), userName: userName.trim() });
  };

  return (
    <Card className="border-gray-100 mb-6">
      <CardContent className="p-5">
        <h3 className="font-bold text-base text-[#0F172A] mb-4">Write a Review</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star selector */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-700 mr-2">Rating:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>
          {/* Name */}
          <div>
            <input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Review title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
          {/* Comment */}
          <div>
            <textarea
              placeholder="Share your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
            />
          </div>
          <Button
            type="submit"
            disabled={mutation.isPending || rating === 0 || !comment.trim() || !userName.trim()}
            className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock Specs                                                         */
/* ------------------------------------------------------------------ */
const MOCK_SPECS = [
  { label: 'Weight', value: '0.5 kg' },
  { label: 'Dimensions', value: '25 × 15 × 10 cm' },
  { label: 'Material', value: 'Premium Quality' },
  { label: 'Color', value: 'As shown' },
  { label: 'Warranty', value: '6 Months' },
  { label: 'Country of Origin', value: 'Kenya' },
];

/* ------------------------------------------------------------------ */
/*  Trust Badges                                                       */
/* ------------------------------------------------------------------ */
const TRUST_BADGES = [
  { icon: Truck, label: 'Free Shipping', desc: 'On orders over 5,000 KSh' },
  { icon: ShieldCheck, label: 'Secure Payment', desc: '100% protected' },
  { icon: RotateCcw, label: 'Easy Returns', desc: '30-day return policy' },
];

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */
function ProductSkeleton() {
  return (
    <div className="px-6 md:px-16 lg:px-32 py-8">
      <Skeleton className="h-4 w-48 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Image skeleton */}
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-lg" />
            ))}
          </div>
        </div>
        {/* Info skeleton */}
        <div className="lg:col-span-2 space-y-5">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error State                                                        */
/* ------------------------------------------------------------------ */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
      <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Something went wrong</h2>
      <p className="text-gray-500 mb-6 max-w-md">{message}</p>
      <Link href="/">
        <Button className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold">
          Back to Home
        </Button>
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Image Gallery                                              */
/* ------------------------------------------------------------------ */
function ProductImageGallery({ product }: { product: Product }) {
  let imageList: string[] = [product.image];

  try {
    if (product.images) {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        imageList = parsed;
      }
    }
  } catch {
    // keep default single image
  }

  const [selectedIdx, setSelectedIdx] = useState(0);

  return (
    <div className="space-y-4">
      {/* Main image with zoom */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50 group">
        <motion.img
          key={imageList[selectedIdx]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          src={imageList[selectedIdx]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {product.originalPrice && product.originalPrice > product.price && (
          <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2.5 py-1">
            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </Badge>
        )}
      </div>

      {/* Thumbnails */}
      {imageList.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {imageList.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                idx === selectedIdx
                  ? 'border-amber-500 ring-2 ring-amber-200'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img
                src={img}
                alt={`${product.name} ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reviews Section                                                    */
/* ------------------------------------------------------------------ */
function ReviewSection({ productId }: { productId: string }) {
  const [sort, setSort] = useState('recent');

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId, sort],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/reviews?limit=50&sort=${sort}`);
      if (!res.ok) throw new Error('Failed to load reviews');
      return res.json() as Promise<{ reviews: { id: string; userName: string; rating: number; title?: string | null; comment: string; isVerified: boolean; createdAt: string }[]; total: number; averageRating: number }>;
    },
  });

  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const averageRating = data?.averageRating ?? 0;

  return (
    <div>
      <ReviewForm productId={productId} />

      {/* Summary */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span className="text-lg font-bold text-[#0F172A]">
              {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            Based on {total} review{total !== 1 ? 's' : ''}
          </span>
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gray-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mt-3" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No reviews yet. Be the first to share your experience!</p>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {reviews.map((review) => (
            <Card key={review.id} className="border-gray-100">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-[#0F172A]">
                      <AvatarFallback className="text-white text-sm font-semibold">
                        {review.userName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-[#0F172A]">
                          {review.userName}
                        </p>
                        {review.isVerified && (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 py-0">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size={14} />
                </div>
                {review.title && (
                  <p className="mt-2 text-sm font-semibold text-[#0F172A]">
                    {review.title}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {review.comment}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Related Product Card                                               */
/* ------------------------------------------------------------------ */
function RelatedProductCard({ product }: { product: Product }) {
  const currencyCode = useCurrencyStore((s) => s.code);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group h-full flex flex-col">
        <Link href={`/product/${product.id}`} className="block">
          <div className="aspect-square overflow-hidden bg-gray-50">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </div>
        </Link>
        <CardContent className="p-4 flex flex-col flex-1">
          <Link href={`/product/${product.id}`}>
            <h3 className="font-semibold text-sm text-[#0F172A] line-clamp-2 hover:text-amber-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 mt-2">
            <StarRating rating={product.rating} size={14} />
            <span className="text-xs text-gray-500">({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-[#0F172A]">
              {formatCurrency(product.price, currencyCode)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(product.originalPrice, currencyCode)}
              </span>
            )}
          </div>
          <Link href={`/product/${product.id}`} className="mt-auto pt-3">
            <Button
              variant="outline"
              className="w-full text-sm border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-colors"
            >
              View
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */
export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const isInWishlist = useCartStore((s) => s.isInWishlist);
  const currencyCode = useCurrencyStore((s) => s.code);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load product');
      }
      return res.json() as Promise<{ product: Product; relatedProducts: Product[] }>;
    },
  });

  const product = data?.product;
  const relatedProducts = data?.relatedProducts ?? [];
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addProduct);

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product.id);
    }
  }, [product, addRecentlyViewed]);

  if (isLoading) {
    return (
      <>
        <SimpleNavbar />
        <main className="min-h-screen">
          <ProductSkeleton />
        </main>
      </>
    );
  }

  if (isError || !product) {
    return (
      <>
        <SimpleNavbar />
        <main className="min-h-screen">
          <ErrorState message={error?.message || 'Product not found'} />
        </main>
        <Footer />
      </>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <>
      <SimpleNavbar />

      <main className="min-h-screen flex-1">
        {/* Breadcrumb */}
        <div className="px-6 md:px-16 lg:px-32 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Shop</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {product.category && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/">{product.category.name}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium truncate max-w-[200px]">
                  {product.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Product Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-6 md:px-16 lg:px-32 pb-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left: Image Gallery (3/5 = 60%) */}
            <div className="lg:col-span-3">
              <ProductImageGallery product={product} />
            </div>

            {/* Right: Product Info (2/5 = 40%) */}
            <div className="lg:col-span-2 space-y-5">
              {/* Category Badge */}
              {product.category && (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-medium">
                  {product.category.name}
                </Badge>
              )}

              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-bold text-[#0F172A] leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <StarRating rating={product.rating} />
                <span className="text-sm text-gray-600">
                  {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-[#0F172A]">
                  {formatCurrency(product.price, currencyCode)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      {formatCurrency(product.originalPrice, currencyCode)}
                    </span>
                    <Badge variant="destructive" className="text-xs font-semibold">
                      {discountPercent}% OFF
                    </Badge>
                  </>
                )}
              </div>

              {/* Stock Indicator */}
              <div>
                {product.stock > 10 ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                    <PackageCheck className="h-4 w-4" /> In Stock
                  </span>
                ) : product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600">
                    <PackageCheck className="h-4 w-4" /> Low Stock — Only {product.stock} left
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
                    <PackageCheck className="h-4 w-4" /> Out of Stock
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description}
              </p>

              <Separator />

              {/* Quantity Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#0F172A]">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors rounded-l-lg"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 text-sm font-semibold text-[#0F172A] min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors rounded-r-lg"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <Button
                disabled={product.stock === 0}
                onClick={() => {
                  for (let i = 0; i < quantity; i++) {
                    addItem(product);
                  }
                  toast.success('Added to cart!', {
                    description: `${quantity}× ${product.name}`,
                  });
                }}
                className="w-full bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold text-base py-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>

              {/* Add to Wishlist */}
              <Button
                variant="outline"
                onClick={() => {
                  toggleWishlist(product.id);
                  toast.success(
                    inWishlist ? 'Removed from wishlist' : 'Added to wishlist'
                  );
                }}
                className={`w-full py-6 rounded-lg text-base font-semibold transition-colors ${
                  inWishlist
                    ? 'border-red-300 text-red-600 hover:bg-red-50'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Heart
                  className={`h-5 w-5 mr-2 ${
                    inWishlist ? 'fill-red-500 text-red-500' : ''
                  }`}
                />
                {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Button>

              {/* Seller Info Card */}
              {product.sellerName && (
                <Card className="border-gray-100">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                      Sold by
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 bg-[#0F172A]">
                          <AvatarFallback className="text-white text-xs font-semibold">
                            {product.sellerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm text-[#0F172A]">
                          {product.sellerName}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-green-300 text-green-600 text-xs"
                      >
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified Seller
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3">
                {TRUST_BADGES.map((badge) => (
                  <div
                    key={badge.label}
                    className="flex flex-col items-center text-center p-3 rounded-lg bg-gray-50"
                  >
                    <badge.icon className="h-5 w-5 text-amber-500 mb-1.5" />
                    <span className="text-xs font-semibold text-[#0F172A]">
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {badge.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Product Details Tabs */}
        <section className="px-6 md:px-16 lg:px-32 pb-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start bg-gray-100 rounded-lg p-1 h-auto overflow-x-auto flex-nowrap">
              <TabsTrigger
                value="description"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 sm:px-6 py-2.5 text-sm font-medium shrink-0"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="specifications"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 sm:px-6 py-2.5 text-sm font-medium shrink-0"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 sm:px-6 py-2.5 text-sm font-medium shrink-0"
              >
                Reviews ({product.reviewCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                <p>{product.description}</p>
                <p className="mt-4">
                  This product is sourced from verified sellers on the SHARKONE platform
                  and comes with our quality guarantee. Every item undergoes thorough
                  quality checks before being listed, ensuring you receive only the best.
                </p>
                <p className="mt-4">
                  SHARKONE connects you directly with trusted sellers across the region,
                  offering a seamless shopping experience with secure payments, reliable
                  delivery, and easy returns.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {MOCK_SPECS.map((spec) => (
                      <div
                        key={spec.label}
                        className="flex items-center px-5 py-3.5"
                      >
                        <span className="w-1/3 text-sm text-gray-500 font-medium">
                          {spec.label}
                        </span>
                        <span className="w-2/3 text-sm text-[#0F172A]">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ReviewSection productId={id} />
            </TabsContent>
          </Tabs>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="px-6 md:px-16 lg:px-32 pb-16">
            <Separator className="mb-10" />
            <h2 className="text-2xl font-bold text-[#0F172A] mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((rp) => (
                <RelatedProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
