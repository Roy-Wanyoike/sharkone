'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';
import { Separator } from '@/components/ui/separator';

export function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart, totalPrice } =
    useCartStore();
  const currencyCode = useCurrencyStore(s => s.code);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            onClick={closeCart}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[71] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-gray-900" />
                <h2 className="text-lg font-bold text-gray-900">Shopping Cart</h2>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                aria-label="Close cart"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="h-16 w-16 text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium">Your cart is empty</p>
                  <p className="text-sm text-gray-400 mt-1">Add some products to get started</p>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 bg-gray-50 rounded-xl p-3"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg shrink-0"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {formatCurrency(item.product.price, currencyCode)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-300 rounded-md bg-white">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-gray-50 transition rounded-l-md"
                              aria-label="Decrease"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 text-xs font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-gray-50 transition rounded-r-md"
                              aria-label="Increase"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(totalPrice(), currencyCode)}
                  </span>
                </div>
                <Separator />
                <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg h-12 text-sm font-semibold">
                  <Link href="/checkout" onClick={closeCart}>
                    Checkout
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-gray-500 hover:text-gray-700 text-sm"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}