'use client';

import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-6">
      <div className="max-w-md w-full text-center">
        {/* Amber glow decoration */}
        <div className="relative">
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

          {/* 404 number */}
          <div className="relative">
            <h1 className="text-[120px] md:text-[160px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-600/40 select-none">
              404
            </h1>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-3 -mt-4">
          Page not found
        </h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Try searching for what you need.
        </p>

        {/* Search suggestion */}
        <form
          action="/search"
          className="flex items-center gap-2 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              name="q"
              placeholder="Search for products..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500 rounded-xl h-11"
            />
          </div>
          <Button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-[#0F172A] font-semibold rounded-xl px-6 h-11"
          >
            Search
          </Button>
        </form>

        {/* Home link */}
        <Link href="/">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 rounded-xl px-6 h-11"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
}
