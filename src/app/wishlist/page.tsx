'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
  Star,
  StarHalf,
  ShoppingBag,
  X,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCartStore } from '@/store/cart-store';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';
import { Footer } from '@/components/ecommerce/Footer';
import type { Product } from '@/types';

/* ------------------------------------------------------------------ */
/*  Simple Navbar                                                      */
/* ------------------------------------------------------------------ */
function SimpleNavbar() {
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
      <div className="hidden md:flex items-center gap-6">
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
      <Link href="/">
        <Button
          size="sm"
          className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold text-sm"
        >
          Continue Shopping
        </Button>
      </Link>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Star Rating                                                        */
/* ------------------------------------------------------------------ */
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars) return <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />;
        if (i === fullStars && hasHalf) return <StarHalf key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />;
        return <Star key={i} className="h-3.5 w-3.5 text-gray-300" />;
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wishlist Card                                                      */
/* ------------------------------------------------------------------ */
function WishlistCard({ productId, index }: { productId: string; index: number }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const currencyCode = useCurrencyStore((s) => s.code);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.product as Product;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleMoveToCart = () => {
    if (!data) return;
    addItem(data);
    toggleWishlist(productId);
    toast.success(`${data.name} moved to cart`, {
      icon: <ShoppingBag className="h-4 w-4" />,
      description: formatCurrency(data.price, currencyCode),
      action: { label: 'View Cart', onClick: () => useCartStore.getState().openCart() },
    });
  };

  const handleRemove = () => {
    toggleWishlist(productId);
    if (data) {
      toast.success(`${data.name} removed from wishlist`);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col"
      >
        <Skeleton className="w-full aspect-square rounded-lg" />
        <Skeleton className="h-5 w-3/4 mt-3" />
        <Skeleton className="h-4 w-1/2 mt-2" />
        <Skeleton className="h-4 w-1/3 mt-2" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
      </motion.div>
    );
  }

  if (isError || !data) return null;

  const discount = data.originalPrice
    ? Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100)
    : 0;

  const inStock = data.stock > 0;
  const lowStock = data.stock > 0 && data.stock <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="rounded-xl border border-gray-200 bg-white overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-300"
    >
      {/* Image */}
      <Link href={`/product/${data.id}`} className="relative block">
        <div className="bg-gray-50 w-full aspect-square flex items-center justify-center overflow-hidden">
          <img
            src={data.image}
            alt={data.name}
            className="group-hover:scale-105 transition-transform duration-500 object-cover w-[90%] h-[90%] rounded-lg"
            loading="lazy"
            decoding="async"
          />
        </div>
        {discount > 0 && (
          <Badge className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-0">
            -{discount}%
          </Badge>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-1.5">
        <Link href={`/product/${data.id}`}>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-amber-600 transition-colors">
            {data.name}
          </h3>
        </Link>

        {data.sellerName && (
          <p className="text-xs text-gray-400 truncate">{data.sellerName}</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <StarRating rating={data.rating} />
          <span className="text-xs text-gray-500">({data.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-base font-bold text-[#0F172A]">{formatCurrency(data.price, currencyCode)}</span>
          {data.originalPrice && (
            <span className="text-sm text-gray-400 line-through">{formatCurrency(data.originalPrice, currencyCode)}</span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {inStock ? (
            lowStock ? (
              <>
                <Package className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">Only {data.stock} left</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs text-green-600 font-medium">In Stock</span>
              </>
            )
          ) : (
            <>
              <X className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs text-red-500 font-medium">Out of Stock</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-3">
          <Button
            size="sm"
            className="flex-1 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold text-sm h-10"
            onClick={handleMoveToCart}
            disabled={!inStock}
          >
            <ShoppingBag className="h-4 w-4 mr-1.5" />
            Move to Cart
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 w-10 p-0 border-gray-300 hover:border-red-300 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            onClick={handleRemove}
            aria-label="Remove from wishlist"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */
function EmptyWishlist() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <Heart className="h-10 w-10 text-gray-300" />
      </div>
      <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Your wishlist is empty</h2>
      <p className="text-gray-500 max-w-md mb-8">
        Save items you love to your wishlist. Review them anytime and easily move them to your cart.
      </p>
      <Link href="/">
        <Button className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold px-8">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Start Shopping
        </Button>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wishlist Page                                                      */
/* ------------------------------------------------------------------ */
export default function WishlistPage() {
  const wishlist = useCartStore((s) => s.wishlist);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />

      <main className="flex-1 px-6 md:px-16 lg:px-32 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <Heart className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">My Wishlist</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {wishlist.length > 0 ? `${wishlist.length} saved item${wishlist.length !== 1 ? 's' : ''}` : 'No saved items'}
            </p>
          </div>
          {wishlist.length > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-semibold text-sm ml-2">
              {wishlist.length}
            </Badge>
          )}
        </motion.div>

        {/* Content */}
        {wishlist.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlist.map((id, index) => (
              <WishlistCard key={id} productId={id} index={index} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}