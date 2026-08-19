'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { DeliveryDashboard } from '@/components/ecommerce/DeliveryDashboard';
import { Footer } from '@/components/ecommerce/Footer';

const queryClient = new QueryClient();

interface DeliveryUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

function DeliveryDashboardPage() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');

  const usersQuery = useQuery<{ users: DeliveryUser[] }>({
    queryKey: ['delivery-users'],
    queryFn: () => fetch('/api/admin/users?role=DELIVERY').then((r) => r.json()),
  });

  const deliveryPersonId = useMemo(() => {
    if (idParam) return idParam;
    if (usersQuery.data && usersQuery.data.users.length > 0) return usersQuery.data.users[0].id;
    return null;
  }, [idParam, usersQuery.data]);

  const currentPerson = usersQuery.data?.users.find((u) => u.id === deliveryPersonId);

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
            <span className="text-gray-400 mx-3 hidden sm:inline">|</span>
            <span className="text-sm text-gray-300 hidden sm:inline">Delivery Dashboard</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/dashboard/delivery" className="text-amber-400 font-medium">Dashboard</Link>
          </nav>
          <div className="flex items-center gap-3">
            {currentPerson && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{currentPerson.name}</p>
                <p className="text-xs text-gray-400">Delivery Rider</p>
              </div>
            )}
            <div className="h-9 w-9 rounded-full bg-amber-500 flex items-center justify-center text-sm font-bold text-[#0F172A]">
              {currentPerson ? currentPerson.name.charAt(0).toUpperCase() : <Skeleton className="h-5 w-5 rounded-full" />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {!deliveryPersonId || usersQuery.isLoading ? (
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
        ) : usersQuery.error || !deliveryPersonId ? (
          <div className="px-4 md:px-16 lg:px-32 py-20 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Could not load delivery data</h2>
            <p className="text-gray-500 text-sm">Please make sure you have delivery access.</p>
          </div>
        ) : (
          <DeliveryDashboard deliveryPersonId={deliveryPersonId} />
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
      <DeliveryDashboardPage />
    </QueryClientProvider>
  );
}
