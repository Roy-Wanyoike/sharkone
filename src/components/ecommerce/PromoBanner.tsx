'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Store } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function PromoBanner({ onRoleChange }: { onRoleChange?: (role: 'seller' | 'delivery') => void }) {
  return (
    <section className="px-6 md:px-16 lg:px-32 py-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/95 to-[#1E293B]" />
        {/* Decorative amber accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 20C90 20 70 50 60 80C50 110 50 150 60 170C70 180 90 180 100 180C110 180 130 180 140 170C150 150 150 110 140 80C130 50 110 20 100 20Z" fill="#F59E0B" />
          </svg>
        </div>
        <div className="relative z-10 px-8 md:px-16 py-12 md:py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-12 h-12 bg-amber-500/20 rounded-xl items-center justify-center shrink-0 mt-1">
              <Store className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">Start Selling Today</p>
              <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
                Become a Seller on SHARKONE
              </h2>
              <p className="text-gray-400 mt-2 text-sm md:text-base max-w-lg">
                Reach millions of buyers, manage your store with powerful tools,
                and grow your business with our low-commission marketplace.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-full px-8 shrink-0"
          >
            <Link href="/sell">
              Open Your Store
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
