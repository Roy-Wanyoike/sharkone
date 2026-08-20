'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  StarHalf,
  X,
  ShoppingBag,
  ArrowRight,
  GitCompareArrows,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompareStore } from '@/store/compare-store';
import { useCartStore } from '@/store/cart-store';
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
/* currency formatting handled by formatCurrency from @/lib/currency */

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />;
        if (i === full && half) return <StarHalf key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />;
        return <Star key={i} className="h-3.5 w-3.5 text-gray-300" />;
      })}
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Out of Stock</span>;
  if (stock <= 5)
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full"><span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />Low Stock ({stock})</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />In Stock</span>;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */
export default function ComparePage() {
  const productIds = useCompareStore((s) => s.productIds);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const clearComparison = useCompareStore((s) => s.clearComparison);
  const addItem = useCartStore((s) => s.addItem);
  const currencyCode = useCurrencyStore((s) => s.code);

  /* Fetch all products in the comparison list */
  const queries = useQuery({
    queryKey: ['compare-products', productIds],
    queryFn: async () => {
      const results = await Promise.all(
        productIds.map((id) =>
          fetch(`/api/products/${id}`)
            .then((r) => r.json())
            .then((data) => data.product as Product)
            .catch(() => null)
        )
      );
      return results.filter(Boolean) as Product[];
    },
    enabled: productIds.length > 0,
  });

  const products = queries.data ?? [];
  const lowestPrice = products.length > 1 ? Math.min(...products.map((p) => p.price)) : -1;

  const attributeRows = [
    { label: 'Price', key: 'price' },
    { label: 'Rating', key: 'rating' },
    { label: 'Stock', key: 'stock' },
    { label: 'Category', key: 'category' },
    { label: 'Seller', key: 'seller' },
    { label: 'Description', key: 'description' },
  ];

  /* ---- Empty state ---- */
  if (productIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SimpleNavbar />
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
              <GitCompareArrows className="h-9 w-9 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A]">No Products to Compare</h1>
            <p className="text-gray-500 max-w-md">
              Start by adding products to your comparison list. Browse products and click the compare icon to get started.
            </p>
            <Button asChild className="mt-2 bg-amber-500 hover:bg-amber-600 text-white">
              <Link href="/">
                Browse Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ---- Loading state ---- */
  if (queries.isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SimpleNavbar />
        <main className="flex-1 px-6 md:px-16 lg:px-32 py-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: productIds.length }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton className="h-40 w-40 rounded-lg" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
          <div className="mt-8 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ---- Main comparison view ---- */
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />

      <main className="flex-1 px-6 md:px-16 lg:px-32 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Product Comparison</h1>
            <p className="text-sm text-gray-500 mt-1">
              Comparing {products.length} product{products.length !== 1 ? 's' : ''}
              {products.length < 2 && ' — add at least one more to compare'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearComparison();
              toast.info('Comparison cleared');
            }}
            className="text-xs border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear All
          </Button>
        </motion.div>

        {/* Prompt to add more if < 2 */}
        {products.length < 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6"
          >
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">
              Add at least <strong>2 products</strong> to start comparing.{' '}
              <Link href="/" className="font-medium underline underline-offset-2 hover:text-amber-900">
                Browse Products
              </Link>
            </p>
          </motion.div>
        )}

        {/* Comparison table – horizontally scrollable on mobile */}
        <div className="overflow-x-auto -mx-6 md:-mx-16 lg:-mx-32 px-6 md:px-16 lg:px-32">
          <motion.table
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full min-w-[600px] border-collapse"
          >
            {/* ---- Product headers ---- */}
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 w-[140px] text-sm font-semibold text-gray-400 uppercase tracking-wider align-top">
                  Products
                </th>
                {products.map((p) => (
                  <th key={p.id} className="p-4 align-top">
                    <div className="flex flex-col items-center text-center gap-3">
                      <button
                        onClick={() => {
                          removeProduct(p.id);
                          toast.info(`Removed ${p.name} from comparison`);
                        }}
                        className="self-end p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label={`Remove ${p.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <Link href={`/product/${p.id}`} className="block">
                        <div className="w-28 h-28 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden mx-auto">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                      <Link
                        href={`/product/${p.id}`}
                        className="text-sm font-semibold text-[#0F172A] hover:text-amber-600 transition-colors line-clamp-2 max-w-[160px]"
                      >
                        {p.name}
                      </Link>
                    </div>
                  </th>
                ))}
                {/* Empty column slots to fill up to 4 */}
                {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
                  <th key={`empty-${i}`} className="p-4 align-top">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-28 h-28 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                        <Plus className="h-6 w-6 text-gray-300" />
                      </div>
                      <Link
                        href="/"
                        className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                      >
                        + Add product
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* ---- Attribute rows ---- */}
              {attributeRows.map((row, rowIdx) => (
                <tr
                  key={row.key}
                  className={`${rowIdx < attributeRows.length - 1 ? 'border-b border-gray-100' : ''} ${
                    rowIdx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'
                  }`}
                >
                  <td className="p-4 text-sm font-medium text-gray-600 align-middle whitespace-nowrap">
                    {row.label}
                  </td>

                  {/* Values for each product */}
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-middle">
                      <div className="text-center text-sm">
                        {row.key === 'price' && (
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`text-base font-bold ${
                                p.price === lowestPrice && products.length > 1
                                  ? 'text-green-600'
                                  : 'text-[#0F172A]'
                              }`}
                            >
                              {formatCurrency(p.price, currencyCode)}
                              {p.price === lowestPrice && products.length > 1 && (
                                <span className="ml-1.5 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                                  Lowest
                                </span>
                              )}
                            </span>
                            {p.originalPrice && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatCurrency(p.originalPrice, currencyCode)}
                              </span>
                            )}
                          </div>
                        )}

                        {row.key === 'rating' && (
                          <div className="flex flex-col items-center gap-1">
                            <StarRating rating={p.rating} />
                            <span className="text-xs text-gray-500">{p.rating} ({p.reviewCount} reviews)</span>
                          </div>
                        )}

                        {row.key === 'stock' && (
                          <div className="flex justify-center">
                            <StockBadge stock={p.stock} />
                          </div>
                        )}

                        {row.key === 'category' && (
                          <span className="text-sm text-gray-700">{p.category?.name ?? '—'}</span>
                        )}

                        {row.key === 'seller' && (
                          p.sellerName ? (
                            <Link
                              href={`/store/${p.sellerId ?? ''}`}
                              className="text-sm text-amber-600 hover:text-amber-700 font-medium hover:underline underline-offset-2"
                            >
                              {p.sellerName}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )
                        )}

                        {row.key === 'description' && (
                          <p className="text-xs text-gray-500 line-clamp-3 max-w-[180px] mx-auto leading-relaxed">
                            {p.description || 'No description available'}
                          </p>
                        )}
                      </div>
                    </td>
                  ))}

                  {/* Empty cells for unfilled slots */}
                  {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
                    <td key={`empty-cell-${row.key}-${i}`} className="p-4">
                      <span className="text-gray-200 text-sm">—</span>
                    </td>
                  ))}
                </tr>
              ))}

              {/* ---- Add to Cart row ---- */}
              <tr className="border-t border-gray-200 bg-white">
                <td className="p-4 text-sm font-medium text-gray-600 align-middle whitespace-nowrap">
                  Action
                </td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 align-middle">
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        disabled={p.stock === 0}
                        onClick={() => {
                          addItem(p);
                          toast.success(`${p.name} added to cart`, {
                            icon: <ShoppingBag className="h-4 w-4" />,
                            description: formatCurrency(p.price, currencyCode),
                            action: { label: 'View Cart', onClick: () => useCartStore.getState().openCart() },
                          });
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </td>
                ))}
                {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
                  <td key={`cart-empty-${i}`} className="p-4" />
                ))}
              </tr>
            </tbody>
          </motion.table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
