'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/types';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currencyCode = useCurrencyStore(s => s.code);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=8`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!controller.signal.aborted) {
          setResults(json.products);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setResults([]);
      }
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const displayResults = query.trim() ? results : [];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white rounded-2xl shadow-2xl z-[61] overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Search className="h-5 w-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={handleSearch}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-400"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-full transition"
                aria-label="Close search"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {displayResults.length === 0 && query.trim() && !loading && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No products found for &quot;{query}&quot;
                </div>
              )}
              {displayResults.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={handleClose}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-14 h-14 object-cover rounded-lg shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm font-semibold text-amber-700 mt-0.5">
                      {formatCurrency(product.price, currencyCode)}
                    </p>
                  </div>
                </Link>
              ))}

              {/* See all results link */}
              {displayResults.length > 0 && query.trim() && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={handleClose}
                  className="flex items-center justify-center gap-2 p-4 border-t text-sm font-medium text-amber-700 hover:bg-amber-50 transition"
                >
                  See all results for &quot;{query}&quot;
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
