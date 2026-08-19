'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HeroSlide } from '@/types';

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  if (!slides.length) return null;

  return (
    <div className="relative z-0 w-full h-[50vh] md:h-[60vh] lg:h-[70vh] overflow-hidden bg-[#0F172A]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 z-0"
        >
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/50 to-[#0F172A]/20" />
          <div className="absolute inset-0 flex flex-col justify-end px-6 md:px-16 lg:px-32 pb-12 md:pb-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-1.5 w-fit mb-4"
            >
              <span className="text-amber-400 text-xs font-medium uppercase tracking-wider">SHARKONE</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white max-w-3xl leading-tight"
            >
              {slides[current].title}
              {slides[current].subtitle && (
                <span className="block text-lg md:text-2xl lg:text-3xl font-normal mt-2 text-white/80">
                  {slides[current].subtitle}
                </span>
              )}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-3 mt-6"
            >
              <Button
                size="lg"
                className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-full px-8"
                onClick={() => {
                  document
                    .getElementById('products')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {slides[current].ctaText}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 rounded-full px-8"
                onClick={next}
              >
                Explore Deals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition text-white"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition text-white"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current
                ? 'w-8 bg-[#F59E0B]'
                : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
