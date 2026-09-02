'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, ArrowRight, Clock, Trash2, Tag } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface SuggestionProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  category: { name: string };
}

interface SuggestionCategory {
  name: string;
  slug: string;
  productCount: number;
}

interface RecentSearch {
  id: string;
  query: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionProduct[]>([]);
  const [categories, setCategories] = useState<SuggestionCategory[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currencyCode = useCurrencyStore((s) => s.code);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Fetch recent searches when dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingRecent(true);
    fetch('/api/search/recent')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRecentSearches(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setRecentSearches([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRecent(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Debounced search suggestions
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setCategories([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!controller.signal.aborted) {
          setSuggestions(json.products || []);
          setCategories(json.categories || []);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setCategories([]);
        }
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

  // Save a search to recent (fire-and-forget)
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    fetch('/api/search/recent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery.trim() }),
    }).catch(() => {});
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(async () => {
    try {
      await fetch('/api/search/recent', { method: 'DELETE' });
      setRecentSearches([]);
    } catch {}
  }, []);

  // Navigate to search page and close dialog
  const navigateToSearch = useCallback(
    (searchQuery: string) => {
      saveRecentSearch(searchQuery);
      onClose();
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    },
    [onClose, router, saveRecentSearch]
  );

  // Navigate to product page and close dialog
  const navigateToProduct = useCallback(
    (productId: string) => {
      onClose();
      router.push(`/product/${productId}`);
    },
    [onClose, router]
  );

  // Navigate to category page and close dialog
  const navigateToCategory = useCallback(
    (categorySlug: string) => {
      onClose();
      router.push(`/category/${categorySlug}`);
    },
    [onClose, router]
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && query.trim()) {
        navigateToSearch(query);
      }
    },
    [query, navigateToSearch]
  );

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const hasQuery = query.trim().length > 0;
  const hasSuggestions = suggestions.length > 0 || categories.length > 0;

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
                onKeyDown={handleKeyDown}
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

            {/* Dropdown Content */}
            <div className="max-h-96 overflow-y-auto">
              {/* Recent Searches – shown when no query */}
              {!hasQuery && !loading && (
                <>
                  {loadingRecent ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
                    </div>
                  ) : recentSearches.length > 0 ? (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Recent Searches
                        </h3>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition"
                        >
                          <Trash2 className="h-3 w-3" />
                          Clear recent
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => navigateToSearch(item.query)}
                            className="group"
                          >
                            <Badge
                              variant="secondary"
                              className="cursor-pointer hover:bg-gray-200 transition text-xs px-3 py-1 rounded-full"
                            >
                              {item.query}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No recent searches
                    </div>
                  )}
                </>
              )}

              {/* Suggestions when query is present */}
              {hasQuery && !loading && !hasSuggestions && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No suggestions found for &quot;{query}&quot;
                </div>
              )}

              {/* Category suggestions */}
              {hasQuery && categories.length > 0 && (
                <div className="px-4 pt-3 pb-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    Categories
                  </h3>
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => navigateToCategory(cat.slug)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      <span className="text-sm text-gray-700">{cat.name}</span>
                      <span className="text-xs text-gray-400">{cat.productCount} products</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Product suggestions */}
              {hasQuery && suggestions.length > 0 && (
                <div className="px-4 pt-2 pb-1">
                  {categories.length > 0 && (
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Products
                    </h3>
                  )}
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => navigateToProduct(product.id)}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 transition w-full text-left rounded-lg"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg shrink-0"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {product.category.name}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-amber-700 shrink-0">
                        {formatCurrency(product.price, currencyCode)}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* See all results link */}
              {hasQuery && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => navigateToSearch(query)}
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
