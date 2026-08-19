'use client';

import { motion } from 'framer-motion';
import { Heart, Star, StarHalf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
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

export function ProductCard({ product, onQuickView }: { product: Product; onQuickView: (p: Product) => void }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const isInWishlist = useCartStore((s) => s.isInWishlist);
  const wishlisted = isInWishlist(product.id);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 }}
      className="group flex flex-col cursor-pointer"
      onClick={() => onQuickView(product)}
    >
      {/* Image */}
      <div className="relative bg-white border border-gray-200 rounded-lg w-full aspect-square flex items-center justify-center overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="group-hover:scale-105 transition-transform duration-500 object-cover w-[90%] h-[90%] rounded-lg"
          loading="lazy"
        />
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:scale-110 transition-transform"
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="pt-2 flex flex-col flex-1">
        <h3 className="text-sm md:text-base font-medium text-gray-900 truncate">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 max-sm:hidden line-clamp-2 mt-1">
          {product.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs font-medium text-gray-700">{product.rating}</span>
          <StarRating rating={product.rating} />
        </div>
        <div className="flex items-end justify-between w-full mt-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="max-sm:hidden h-8 text-xs border-gray-800 rounded-md hover:bg-stone-100 transition"
            onClick={(e) => {
              e.stopPropagation();
              addItem(product);
            }}
          >
            Buy now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
