'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/ecommerce/Navbar';
import { HeroCarousel } from '@/components/ecommerce/HeroCarousel';
import { FeaturedCategories } from '@/components/ecommerce/FeaturedCategories';
import { TrendingProducts } from '@/components/ecommerce/TrendingProducts';
import { ProductGrid } from '@/components/ecommerce/ProductGrid';
import { CartSidebar } from '@/components/ecommerce/CartSidebar';
import { SearchDialog } from '@/components/ecommerce/SearchDialog';
import { Footer } from '@/components/ecommerce/Footer';
import { FlashSaleNotifier } from '@/components/ecommerce/FlashSaleNotifier';
import { PromoBanner } from '@/components/ecommerce/PromoBanner';
import { FlashSaleBanner } from '@/components/ecommerce/FlashSaleBanner';
import { MarketingBanners } from '@/components/ecommerce/MarketingBanners';
import { TrustBadges } from '@/components/ecommerce/TrustBadges';
import { RecentlyViewed } from '@/components/ecommerce/RecentlyViewed';
import { ScrollToTop } from '@/components/ecommerce/ScrollToTop';
import { ProductDetailModal } from '@/components/ecommerce/ProductDetailModal';
import { SellerDashboard } from '@/components/ecommerce/SellerDashboard';
import { DeliveryDashboard } from '@/components/ecommerce/DeliveryDashboard';
import { useCartStore } from '@/store/cart-store';
import type { Category, HeroSlide, Product, Role } from '@/types';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKey, setSearchKey] = useState(0);
  const [activeRole, setActiveRole] = useState<Role>('buyer');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);

  /* Fetch initial data via react-query */
  const { data: categories = [], isLoading: catLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      const json = await res.json();
      return json as Category[];
    },
  });

  const { data: heroSlides = [], isLoading: heroLoading } = useQuery<HeroSlide[]>({
    queryKey: ['hero-slides'],
    queryFn: async () => {
      const res = await fetch('/api/hero');
      const json = await res.json();
      return json as HeroSlide[];
    },
  });

  const loading = catLoading || heroLoading;

  const handleCategorySelect = useCallback((slug: string) => {
    setSelectedCategory(slug);
    setTimeout(() => {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleRoleChange = useCallback((role: Role) => {
    setActiveRole(role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <FlashSaleNotifier />
      <Navbar
        onSearchOpen={() => {
          setSearchKey((k) => k + 1);
          setSearchOpen(true);
        }}
        onRoleChange={handleRoleChange}
        activeRole={activeRole}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.main
            key={activeRole}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            {activeRole === 'buyer' && (
              <>
                <HeroCarousel slides={heroSlides} />
                <FlashSaleBanner />
                <MarketingBanners />
                <FeaturedCategories categories={categories} onCategorySelect={handleCategorySelect} />
                <TrendingProducts onViewProduct={setDetailProduct} />
                <ProductGrid key={selectedCategory} categories={categories} initialCategory={selectedCategory} />
                <PromoBanner onRoleChange={handleRoleChange} />
                <TrustBadges />
                <RecentlyViewed />
              </>
            )}
            {activeRole === 'seller' && <SellerDashboard />}
            {activeRole === 'delivery' && <DeliveryDashboard />}
          </motion.main>
        </AnimatePresence>
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
            className="md:hidden fixed bottom-6 right-6 z-50 p-4 bg-[#F59E0B] hover:bg-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
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
