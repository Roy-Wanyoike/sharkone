'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Clock } from 'lucide-react';
import {
  requestBrowserNotificationPermission,
  isNotificationGranted,
  showNotification,
} from '@/lib/push-notifications';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyStore } from '@/store/currency-store';

interface FlashSaleItem {
  id: string;
  name: string;
  discountPercentage: number;
  originalPrice: number;
  salePrice: number;
  startTime: string;
  endTime: string;
  totalStock: number;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
  };
}

interface AutoFlashResponse {
  activeSales: FlashSaleItem[];
  startingSoon: FlashSaleItem[];
  newSaleStarted: boolean;
}

export function FlashSaleNotifier() {
  const [banner, setBanner] = useState<{
    visible: boolean;
    sale: FlashSaleItem | null;
  }>({ visible: false, sale: null });

  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenSalesRef = useRef<Set<string>>(new Set());
  const currencyCode = useCurrencyStore((s) => s.code);

  // Request notification permission on mount
  useEffect(() => {
    requestBrowserNotificationPermission();
  }, []);

  const dismissBanner = useCallback(() => {
    setBanner({ visible: false, sale: null });
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const showBannerForSale = useCallback(
    (sale: FlashSaleItem) => {
      setBanner({ visible: true, sale });

      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
      dismissTimerRef.current = setTimeout(dismissBanner, 10_000);
    },
    [dismissBanner]
  );

  // Poll for flash sales
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch('/api/flash-sales/auto');
        if (!res.ok) return;
        const data: AutoFlashResponse = await res.json();

        if (cancelled) return;

        // If a new sale just started, notify
        if (data.newSaleStarted) {
          // Request browser notification permission (idempotent)
          await requestBrowserNotificationPermission();

          // Find newly started sales we haven't seen yet
          for (const sale of data.activeSales) {
            if (!seenSalesRef.current.has(sale.id)) {
              seenSalesRef.current.add(sale.id);

              // Sonner in-app toast notification
              toast.success(
                `⚡ ${sale.discountPercentage}% Flash Sale is LIVE!`,
                {
                  description: `${sale.product.name} — ${formatCurrency(sale.salePrice, currencyCode)} (was ${formatCurrency(sale.originalPrice, currencyCode)}). Grab it before it's gone!`,
                  duration: 8_000,
                }
              );

              // Browser push notification (if permission granted)
              if (isNotificationGranted()) {
                showNotification(
                  `⚡ ${sale.discountPercentage}% Flash Sale is LIVE!`,
                  `${sale.product.name} is now ${formatCurrency(sale.salePrice, currencyCode)} (was ${formatCurrency(sale.originalPrice, currencyCode)}). Grab it before it's gone!`,
                  sale.product.image
                );
              }

              // Show in-app banner
              showBannerForSale(sale);
            }
          }
        }

        // Also notify about starting-soon sales we haven't seen
        for (const sale of data.startingSoon) {
          if (!seenSalesRef.current.has(`soon-${sale.id}`)) {
            seenSalesRef.current.add(`soon-${sale.id}`);

            const startsIn = Math.max(
              0,
              Math.ceil(
                (new Date(sale.startTime).getTime() - Date.now()) / 60_000
              )
            );

            if (startsIn <= 5) {
              // Only show for very imminent sales
              // Sonner toast
              toast.info(
                `⏰ Flash Sale starting in ${startsIn} min!`,
                {
                  description: `${sale.product.name} at ${sale.discountPercentage}% off — get ready!`,
                  duration: 6_000,
                }
              );

              // Browser push notification
              if (isNotificationGranted()) {
                showNotification(
                  `⏰ Flash Sale starting in ${startsIn} min!`,
                  `${sale.product.name} at ${sale.discountPercentage}% off — get ready!`,
                  sale.product.image
                );
              }
            }
          }
        }
      } catch {
        // Silent fail for polling
      }
    };

    // Initial fetch
    poll();

    // Poll every 60 seconds
    const interval = setInterval(poll, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [currencyCode, showBannerForSale]);

  return (
    <AnimatePresence>
      {banner.visible && banner.sale && (
        <motion.div
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100]"
        >
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
              {/* Flash icon */}
              <div className="flex-shrink-0 bg-white/20 rounded-full p-1.5">
                <Zap className="h-5 w-5" />
              </div>

              {/* Product image */}
              <img
                src={banner.sale.product.image}
                alt={banner.sale.product.name}
                className="hidden sm:block w-10 h-10 rounded-lg object-cover border-2 border-white/30"
                loading="lazy"
                decoding="async"
              />

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold uppercase tracking-wide">
                    Flash Sale LIVE!
                  </span>
                  <span className="bg-white text-amber-600 text-xs font-extrabold px-2 py-0.5 rounded-full">
                    -{Math.round(banner.sale.discountPercentage)}%
                  </span>
                </div>
                <p className="text-sm font-medium truncate mt-0.5">
                  {banner.sale.product.name} —{' '}
                  <span className="line-through opacity-70">
                    {formatCurrency(banner.sale.originalPrice, currencyCode)}
                  </span>{' '}
                  <span className="font-bold">
                    {formatCurrency(banner.sale.salePrice, currencyCode)}
                  </span>
                </p>
              </div>

              {/* Time remaining hint */}
              <div className="hidden md:flex items-center gap-1.5 text-xs opacity-90">
                <Clock className="h-3.5 w-3.5" />
                <span>Ending soon</span>
              </div>

              {/* Dismiss */}
              <button
                onClick={dismissBanner}
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
