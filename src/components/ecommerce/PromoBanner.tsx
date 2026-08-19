'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PromoBanner() {
  return (
    <section className="px-6 md:px-16 lg:px-32 py-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-2xl overflow-hidden bg-gray-900"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-700/80 to-gray-900/90" />
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1200&q=80"
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 px-8 md:px-16 py-12 md:py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Level Up Your Gaming Experience
            </h2>
            <p className="text-white/70 mt-2 text-sm md:text-base max-w-lg">
              Discover the latest gaming consoles, accessories, and titles.
              Elevate your play with cutting-edge technology.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-8 shrink-0"
            onClick={() => {
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Buy now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
