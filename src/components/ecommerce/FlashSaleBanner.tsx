'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface FlashSaleProduct {
  id: string;
  name: string;
  discountPercentage: number;
  originalPrice: number;
  salePrice: number;
  startTime: string;
  endTime: string;
  totalStock: number;
  soldCount: number;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
    category?: { name: string; slug: string } | null;
  };
}

function useCountdown(targetDate: string) {
  const calculateTimeLeft = useCallback(() => {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  return timeLeft;
}

function CountdownTimer({ endTime }: { endTime: string }) {
  const { hours, minutes, seconds } = useCountdown(endTime);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5">
      <Clock className="h-3.5 w-3.5 text-amber-500" />
      <div className="flex items-center gap-0.5 text-xs font-mono font-semibold text-[#0F172A]">
        <span className="bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">{pad(hours)}</span>
        <span className="text-amber-400">:</span>
        <span className="bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">{pad(minutes)}</span>
        <span className="text-amber-400">:</span>
        <span className="bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">{pad(seconds)}</span>
      </div>
    </div>
  );
}

function FlashSaleCard({ sale, index }: { sale: FlashSaleProduct; index: number }) {
  const remaining = sale.totalStock - sale.soldCount;
  const stockPercent = Math.round((sale.soldCount / sale.totalStock) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="min-w-[220px] sm:min-w-[240px] max-w-[260px] flex-shrink-0 group"
    >
      <div className="relative bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
        {/* Discount badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 bg-[#F59E0B] text-white text-xs font-bold rounded-full px-2.5 py-1 shadow-sm">
            -{Math.round(sale.discountPercentage)}%
          </span>
        </div>

        {/* Product image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={sale.product.image}
            alt={sale.product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Product name */}
          <h3 className="text-sm font-semibold text-[#0F172A] line-clamp-1 leading-tight">
            {sale.product.name}
          </h3>

          {/* Category */}
          {sale.product.category && (
            <p className="text-[11px] text-gray-400 uppercase tracking-wider">
              {sale.product.category.name}
            </p>
          )}

          {/* Prices */}
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#F59E0B]">
              ${sale.salePrice.toFixed(2)}
            </span>
            <span className="text-xs text-gray-400 line-through">
              ${sale.originalPrice.toFixed(2)}
            </span>
          </div>

          {/* Stock bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{remaining} left</span>
              <span>{stockPercent}% sold</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stockPercent}%` }}
                transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
              />
            </div>
          </div>

          {/* Countdown */}
          <CountdownTimer endTime={sale.endTime} />

          {/* Shop Now button */}
          <Button
            size="sm"
            className="w-full bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-medium mt-1"
            onClick={() => {
              const modalEvent = new CustomEvent('open-product-modal', {
                detail: { productId: sale.product.id },
              });
              window.dispatchEvent(modalEvent);
            }}
          >
            <Zap className="h-3.5 w-3.5 mr-1" />
            Shop Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function FlashSaleBanner() {
  const [flashSales, setFlashSales] = useState<FlashSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = scrollContainerRef;

  useEffect(() => {
    fetch('/api/flash-sales')
      .then((res) => res.json())
      .then((data) => {
        setFlashSales(data.flashSales || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [checkScroll, flashSales]);

  if (loading) {
    return (
      <section className="py-8 px-4 md:px-8 lg:px-16">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="min-w-[220px] h-[360px] rounded-xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!flashSales.length) return null;

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="py-8 px-4 md:px-8 lg:px-16 bg-gradient-to-b from-white to-amber-50/30">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0F172A] text-white rounded-lg px-4 py-2">
            <Zap className="h-5 w-5 text-[#F59E0B]" />
            <h2 className="text-lg font-bold tracking-tight">Flash Deals</h2>
          </div>
          <span className="text-sm text-gray-500">
            {flashSales.length} {flashSales.length === 1 ? 'deal' : 'deals'} live now
          </span>
        </div>

        {/* Scroll buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4 text-[#0F172A]" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4 text-[#0F172A]" />
          </button>
        </div>
      </motion.div>

      {/* Scrollable row */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {flashSales.map((sale, i) => (
          <FlashSaleCard key={sale.id} sale={sale} index={i} />
        ))}
      </div>
    </section>
  );
}
