'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, StarHalf, Heart, Minus, Plus, ShoppingBag } from 'lucide-react';
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
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < fullStars) return <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />;
        if (i === fullStars && hasHalf) return <StarHalf key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />;
        return <Star key={i} className="h-4 w-4 text-gray-300" />;
      })}
    </div>
  );
}

export function ProductDetailModal({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const isInWishlist = useCartStore((s) => s.isInWishlist);
  const wishlisted = isInWishlist(product.id);
  const currencyCode = useCurrencyStore(s => s.code);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    toast.success(`${quantity}x ${product.name} added to cart`, {
      icon: <ShoppingBag className="h-4 w-4" />,
      description: `Total: ${formatCurrency(product.price * quantity, currencyCode)}`,
      action: { label: 'View Cart', onClick: () => useCartStore.getState().openCart() },
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-3xl bg-white rounded-2xl shadow-2xl z-[61] max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            <div className="grid md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="relative bg-gray-50 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none aspect-square flex items-center justify-center p-8">
                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    -{discount}% OFF
                  </span>
                )}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  decoding="async"
                />
              </div>

              {/* Details */}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                {product.category && (
                  <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">
                    {product.category.name}
                  </span>
                )}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
                  {product.name}
                </h2>

                <div className="flex items-center gap-3 mt-3">
                  <StarRating rating={product.rating} />
                  <span className="text-sm text-gray-500">
                    {product.rating} ({product.reviewCount.toLocaleString()} reviews)
                  </span>
                </div>

                <p className="text-gray-600 mt-4 text-sm leading-relaxed">
                  {product.description}
                </p>

                <div className="flex items-baseline gap-3 mt-6">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(product.price, currencyCode)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-gray-400 line-through">
                      {formatCurrency(product.originalPrice, currencyCode)}
                    </span>
                  )}
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-4 mt-6">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-gray-50 transition rounded-l-lg"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 text-sm font-medium min-w-[40px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-gray-50 transition rounded-r-lg"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <Button
                    size="lg"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                    onClick={handleAddToCart}
                  >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Add to Cart
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-lg border-gray-300 hover:bg-gray-50"
                    onClick={() => toggleWishlist(product.id)}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
                      }`}
                    />
                  </Button>
                </div>

                {/* Stock info */}
                <div className="mt-4 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${product.stock > 10 ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span className="text-xs text-gray-500">
                    {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
