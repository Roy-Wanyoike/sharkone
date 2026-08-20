'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, ShoppingBag, Star, StarHalf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import type { Product } from '@/types';

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars)
          return <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />;
        if (i === fullStars && hasHalf)
          return <StarHalf key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />;
        return <Star key={i} className="h-3 w-3 text-gray-300" />;
      })}
    </div>
  );
}

export function TrendingProducts({
  onViewProduct,
}: {
  onViewProduct: (p: Product) => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const currencyCode = useCurrencyStore(s => s.code);

  const { data: products = [] } = useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const res = await fetch('/api/products?featured=true&limit=4');
      const json = await res.json();
      return json.products as Product[];
    },
  });

  if (products.length === 0) return null;

  return (
    <section className="px-6 md:px-16 lg:px-32 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Trending Now</h2>
          <p className="text-gray-500 text-sm mt-0.5">Our most popular picks this week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product, i) => {
          const discount = product.originalPrice
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/product/${product.id}`} className="group relative bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300 block"
              >
              {discount > 0 && (
                <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                  -{discount}%
                </span>
              )}
              <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-[85%] h-[85%] object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                {product.category && (
                  <span className="text-[10px] uppercase tracking-wider text-amber-700 font-medium">
                    {product.category.name}
                  </span>
                )}
                <h3 className="text-sm font-semibold text-gray-900 mt-1 truncate">{product.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={product.rating} />
                  <span className="text-xs text-gray-500">({product.reviewCount.toLocaleString()})</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price, currencyCode)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatCurrency(product.originalPrice, currencyCode)}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="h-8 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      addItem(product);
                      toast.success(`${product.name} added to cart`, {
                        icon: <ShoppingBag className="h-4 w-4" />,
                        description: formatCurrency(product.price, currencyCode),
                        action: { label: 'View Cart', onClick: openCart },
                      });
                    }}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}