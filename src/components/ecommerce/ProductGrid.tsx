'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import type { Product, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProductGrid({
  categories,
}: {
  categories: Category[];
}) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const { data, isLoading } = useQuery({
    queryKey: ['products', activeCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      params.set('limit', '50');
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.products as Product[];
    },
  });

  const products = data || [];
  const visibleProducts = products.slice(0, visibleCount);

  return (
    <section id="products" className="px-6 md:px-16 lg:px-32 py-10">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          className={`rounded-full text-xs ${
            activeCategory === 'all'
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => {
            setActiveCategory('all');
            setVisibleCount(12);
          }}
        >
          All Products
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.slug ? 'default' : 'outline'}
            size="sm"
            className={`rounded-full text-xs ${
              activeCategory === cat.slug
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => {
              setActiveCategory(cat.slug);
              setVisibleCount(12);
            }}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      )}

      {/* Product Grid */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setSelectedProduct}
              />
            ))}
          </div>

          {visibleCount < products.length && (
            <div className="flex justify-center mt-10">
              <Button
                variant="outline"
                className="rounded-full px-8 border-gray-800 text-gray-900 hover:bg-stone-100"
                onClick={() => setVisibleCount((c) => c + 12)}
              >
                See more
              </Button>
            </div>
          )}
        </>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
}
