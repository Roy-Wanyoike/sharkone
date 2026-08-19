'use client';

import { motion } from 'framer-motion';
import { Headphones, Laptop, Camera, Watch, Wind, Gamepad2, ChevronRight } from 'lucide-react';
import type { Category } from '@/types';

const categoryIcons: Record<string, React.ReactNode> = {
  headphones: <Headphones className="h-8 w-8" />,
  laptops: <Laptop className="h-8 w-8" />,
  cameras: <Camera className="h-8 w-8" />,
  smartwatches: <Watch className="h-8 w-8" />,
  appliances: <Wind className="h-8 w-8" />,
  gaming: <Gamepad2 className="h-8 w-8" />,
};

const categoryColors: Record<string, string> = {
  headphones: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
  laptops: 'bg-sky-50 text-sky-700 hover:bg-sky-100',
  cameras: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
  smartwatches: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  appliances: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  gaming: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
};

export function FeaturedCategories({
  categories,
  onCategorySelect,
}: {
  categories: Category[];
  onCategorySelect: (slug: string) => void;
}) {
  return (
    <section className="px-6 md:px-16 lg:px-32 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Shop by Category</h2>
          <p className="text-gray-500 text-sm mt-1">Find what you are looking for</p>
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onCategorySelect(cat.slug)}
            className={`flex flex-col items-center gap-3 p-4 md:p-6 rounded-xl transition-all cursor-pointer ${
              categoryColors[cat.slug] || 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="shrink-0">{categoryIcons[cat.slug] || <Camera className="h-8 w-8" />}</div>
            <span className="text-xs md:text-sm font-medium text-center">{cat.name}</span>
            {cat.description && (
              <span className="hidden md:block text-[10px] opacity-60 text-center line-clamp-2">
                {cat.description}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </section>
  );
}
