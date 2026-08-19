'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/ecommerce/Navbar';
import { HeroCarousel } from '@/components/ecommerce/HeroCarousel';
import { FeaturedCategories } from '@/components/ecommerce/FeaturedCategories';
import { TrendingProducts } from '@/components/ecommerce/TrendingProducts';
import { ProductGrid } from '@/components/ecommerce/ProductGrid';
import { CartSidebar } from '@/components/ecommerce/CartSidebar';
import { SearchDialog } from '@/components/ecommerce/SearchDialog';
import { Footer } from '@/components/ecommerce/Footer';
import { PromoBanner } from '@/components/ecommerce/PromoBanner';
import { TrustBadges } from '@/components/ecommerce/TrustBadges';
import { ScrollToTop } from '@/components/ecommerce/ScrollToTop';
import { ProductDetailModal } from '@/components/ecommerce/ProductDetailModal';
import { useCartStore } from '@/store/cart-store';
import type { Category, HeroSlide, Product } from '@/types';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKey, setSearchKey] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, heroRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/hero'),
        ]);
        const catData = await catRes.json();
        const heroData = await heroRes.json();
        setCategories(catData);
        setHeroSlides(heroData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCategorySelect = useCallback((slug: string) => {
    setSelectedCategory(slug);
    setTimeout(() => {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar onSearchOpen={() => { setSearchKey((k) => k + 1); setSearchOpen(true); }} />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
        </div>
      ) : (
        <main className="flex-1">
          <HeroCarousel slides={heroSlides} />
          <FeaturedCategories categories={categories} onCategorySelect={handleCategorySelect} />
          <TrendingProducts onViewProduct={setDetailProduct} />
          <ProductGrid key={selectedCategory} categories={categories} initialCategory={selectedCategory} />
          <PromoBanner />
          <TrustBadges />
        </main>
      )}

      <Footer />

      {/* Floating Cart Button (mobile) */}
      <AnimatePresence>
        {totalItems() > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={openCart}
            className="md:hidden fixed bottom-6 right-6 z-50 p-4 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-white text-amber-600 text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalItems()}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <ScrollToTop />
      <CartSidebar />
      <SearchDialog key={searchKey} open={searchOpen} onClose={() => setSearchOpen(false)} />

      {detailProduct && (
        <ProductDetailModal product={detailProduct} open={!!detailProduct} onClose={() => setDetailProduct(null)} />
      )}
    </div>
  );
}
