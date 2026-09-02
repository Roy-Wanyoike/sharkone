'use client';

import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0F172A] text-white antialiased">
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            {/* Amber glow decoration */}
            <div className="relative">
              <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
              <div className="relative mx-auto mb-8 w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-amber-400" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              A critical error occurred. Our team has been notified. Please try
              again or return to the homepage.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={reset}
                className="bg-amber-500 hover:bg-amber-600 text-[#0F172A] font-semibold rounded-xl px-6 h-11"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
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

            <p className="mt-12 text-xs text-gray-600">
              If the problem persists, please{' '}
              <Link
                href="/contact"
                className="text-amber-500 hover:text-amber-400 transition-colors"
              >
                contact support
              </Link>
              .
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
