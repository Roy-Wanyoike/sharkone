'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Banner {
  id: string;
  title: string;
  image: string;
  link: string | null;
  position: string;
  order: number;
  active: boolean;
  clicksCount: number;
}

export function MarketingBanners() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ['marketing-banners', 'HERO'],
    queryFn: () => fetch('/api/banners?position=HERO').then((r) => r.json()),
  });

  const totalSlides = banners.length;

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || totalSlides <= 1) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((index + totalSlides) % totalSlides);
        setIsTransitioning(false);
      }, 200);
    },
    [isTransitioning, totalSlides]
  );

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      goTo(currentIndex + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex, goTo, totalSlides]);

  const handleClick = async (banner: Banner) => {
    // Track click
    fetch(`/api/banners?click=true&id=${banner.id}`).catch(() => {});
    if (banner.link) {
      window.open(banner.link, '_blank', 'noopener,noreferrer');
    }
  };

  if (totalSlides === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="relative rounded-2xl overflow-hidden bg-slate-900">
        {/* Slides Container */}
        <div className="relative h-48 sm:h-64 md:h-80 lg:h-96">
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                idx === currentIndex
                  ? 'opacity-100 z-10'
                  : 'opacity-0 z-0'
              }`}
            >
              <button
                onClick={() => handleClick(banner)}
                className="w-full h-full block focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-2xl"
                aria-label={banner.title}
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                  <h3 className="text-white text-lg sm:text-xl md:text-2xl font-bold drop-shadow-lg">
                    {banner.title}
                  </h3>
                </div>
              </button>
            </div>
          ))}

          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm"
                onClick={() => goTo(currentIndex - 1)}
                aria-label="Previous banner"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm"
                onClick={() => goTo(currentIndex + 1)}
                aria-label="Next banner"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Dots Indicator */}
        {totalSlides > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-6 bg-amber-400'
                    : 'w-2 bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
