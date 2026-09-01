'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, StarHalf } from 'lucide-react';
import { useRecentlyViewedStore } from '@/store/recently-viewed-store';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@/types';

function MiniStarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars) return <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />;
        if (i === fullStars && hasHalf) return <StarHalf key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />;
        return <Star key={i} className="h-3 w-3 text-gray-300" />;
      })}
    </div>
  );
}

function MiniProductCard({ productId }: { productId: string }) {
  const currencyCode = useCurrencyStore(s => s.code);
  const { data, isLoading } = useQuery({
    queryKey: ['product-mini', productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.product as Product;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) {
    return (
      <div className="shrink-0 w-44 md:w-52">
        <Skeleton className="w-full aspect-square rounded-lg" />
        <Skeleton className="h-4 w-3/4 mt-2" />
        <Skeleton className="h-4 w-1/2 mt-1" />
      </div>
    );
  }

  const discount = data.originalPrice
    ? Math.round(((data.originalPrice - data.price) / data.originalPrice) * 100)
    : 0;

  return (
    <Link href={`/product/${data.id}`} className="shrink-0 w-44 md:w-52 group">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="flex flex-col"
      >
        <div className="relative bg-white border border-gray-200 rounded-lg w-full aspect-square flex items-center justify-center overflow-hidden">
          <img
            src={data.image}
            alt={data.name}
            className="group-hover:scale-105 transition-transform duration-500 object-cover w-[90%] h-[90%] rounded-lg"
            loading="lazy"
            decoding="async"
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
        </div>
        <h4 className="text-sm font-medium text-gray-900 mt-2 truncate">{data.name}</h4>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-gray-600">{data.rating}</span>
          <MiniStarRating rating={data.rating} />
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-sm font-semibold text-[#0F172A]">{formatCurrency(data.price, currencyCode)}</span>
          {data.originalPrice && (
            <span className="text-xs text-gray-400 line-through">{formatCurrency(data.originalPrice, currencyCode)}</span>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export function RecentlyViewed() {
  const productIds = useRecentlyViewedStore((s) => s.productIds);
  const displayIds = productIds.slice(0, 6);

  if (displayIds.length === 0) return null;

  return (
    <section className="w-full px-6 md:px-16 lg:px-32 py-8">
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-bold text-[#0F172A]">Recently Viewed</h2>
        <p className="text-sm text-gray-500 mt-1">Products you&apos;ve been checking out</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {displayIds.map((id) => (
          <MiniProductCard key={id} productId={id} />
        ))}
      </div>
    </section>
  );
}
