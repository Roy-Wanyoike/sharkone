'use client';

import { useMemo, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { SellerDashboard } from '@/components/ecommerce/SellerDashboard';
import { Footer } from '@/components/ecommerce/Footer';

const queryClient = new QueryClient();

interface SellerInfo {
  id: string;
  storeName: string;
  storeSlug: string;
  rating: number;
  isVerified: boolean;
  user: { id: string; name: string; email: string };
}

function SellerDashboardPage() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');

  const sellersQuery = useQuery<SellerInfo[]>({
    queryKey: ['sellers-list'],
    queryFn: () => fetch('/api/admin/sellers').then(r => r.json()),
  });

  const sellerId = useMemo(() => {
    if (idParam) return idParam;
    if (sellersQuery.data && sellersQuery.data.length > 0) return sellersQuery.data[0].id;
    return null;
  }, [idParam, sellersQuery.data]);

  const currentSeller = sellersQuery.data?.find(s => s.id === sellerId);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-[#0F172A] text-white sticky top-0 z-50">
        <div className="px-4 md:px-16 lg:px-32 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#F59E0B" />
              <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="white" />
            </svg>
            <Link href="/" className="text-xl font-bold tracking-tight">
              <span className="text-white">SHARK</span>
              <span className="text-amber-400">ONE</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/dashboard/seller" className="text-amber-400 font-medium">Dashboard</Link>
            <Link href="/sell" className="hover:text-white transition">Seller Hub</Link>
          </nav>
          <div className="flex items-center gap-3">
            {currentSeller && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{currentSeller.storeName}</p>
                <p className="text-xs text-gray-400">{currentSeller.isVerified ? '✓ Verified Seller' : 'Seller'}</p>
              </div>
            )}
            <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center text-sm font-bold text-[#0F172A]">
              {currentSeller ? currentSeller.storeName.charAt(0).toUpperCase() : <Skeleton className="h-5 w-5 rounded-full" />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {!sellerId || sellersQuery.isLoading ? (
          <div className="px-4 md:px-16 lg:px-32 py-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-8" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : sellersQuery.error || !sellerId ? (
          <div className="px-4 md:px-16 lg:px-32 py-20 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Could not load seller data</h2>
            <p className="text-gray-500 text-sm">Please make sure you have seller access. <Link href="/sell" className="text-amber-600 hover:underline">Become a seller</Link></p>
          </div>
        ) : (
          <SellerDashboard sellerId={sellerId} />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      }>
        <SellerDashboardPage />
      </Suspense>
    </QueryClientProvider>
  );
}
