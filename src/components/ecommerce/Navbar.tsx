'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart-store';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 backdrop-blur-md border-b border-gray-200 bg-white/80 shadow-sm">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
          <ShoppingBag className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          Bazaar
        </span>
      </Link>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/"
          className="text-gray-700 hover:text-amber-700 transition-colors text-sm font-medium"
        >
          Home
        </Link>
        <a
          href="#products"
          className="text-gray-700 hover:text-amber-700 transition-colors text-sm font-medium"
        >
          Shop
        </a>
        <a
          href="#footer"
          className="text-gray-700 hover:text-amber-700 transition-colors text-sm font-medium"
        >
          About Us
        </a>
        <a
          href="#footer"
          className="text-gray-700 hover:text-amber-700 transition-colors text-sm font-medium"
        >
          Contact
        </a>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={onSearchOpen}
          aria-label="Open search"
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <User className="h-4 w-4" />
          <span className="text-sm">Account</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={openCart}
          aria-label="Shopping Cart"
        >
          <ShoppingBag className="h-5 w-5" />
          {totalItems() > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {totalItems()}
            </motion.span>
          )}
        </Button>

        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gray-600 hover:text-gray-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden"
          >
            <div className="flex flex-col p-4 gap-3">
              <Link
                href="/"
                className="text-gray-700 hover:text-amber-700 py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <a
                href="#products"
                className="text-gray-700 hover:text-amber-700 py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </a>
              <a
                href="#footer"
                className="text-gray-700 hover:text-amber-700 py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </a>
              <a
                href="#footer"
                className="text-gray-700 hover:text-amber-700 py-2 text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
