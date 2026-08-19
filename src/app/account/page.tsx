'use client';

import { useState, useMemo, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  ShoppingCart,
  Package,
  DollarSign,
  Clock,
  Truck,
  Settings,
  Heart,
  Trash2,
  Plus,
  Eye,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '@/components/ecommerce/Footer';
import { useCartStore } from '@/store/cart-store';

const queryClient = new QueryClient();

const formatKES = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BuyerStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  activeDeliveries: number;
}

interface OrderItemData {
  id: string;
  quantity: number;
  price: number;
  productName: string;
  productImage: string;
  productSlug: string;
  sellerName: string;
}

interface BuyerOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  platformFee: number;
  shippingAddress: string;
  paymentStatus: string;
  createdAt: string;
  itemCount: number;
  orderItems: OrderItemData[];
  deliveryStatus: string | null;
}

interface BuyerTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  orderId: string | null;
  createdAt: string;
}

interface BuyerUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Status Colors                                                     */
/* ------------------------------------------------------------------ */

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-indigo-100 text-indigo-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

/* ------------------------------------------------------------------ */
/*  Skeletons                                                          */
/* ------------------------------------------------------------------ */

function StatCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <Skeleton className="h-8 w-8 rounded-lg mb-3" />
      <Skeleton className="h-7 w-20 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-6 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

function AccountPageContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');

  // Fetch buyer user
  const usersQuery = useQuery<{ users: BuyerUser[] }>({
    queryKey: ['buyer-users'],
    queryFn: () => fetch('/api/admin/users?role=BUYER').then((r) => r.json()),
  });

  const buyerId = useMemo(() => {
    if (idParam) return idParam;
    if (usersQuery.data && usersQuery.data.users.length > 0) return usersQuery.data.users[0].id;
    return null;
  }, [idParam, usersQuery.data]);

  const buyer = useMemo(() => {
    if (!buyerId || !usersQuery.data) return null;
    return usersQuery.data.users.find((u) => u.id === buyerId) ?? null;
  }, [buyerId, usersQuery.data]);

  const [settingsName, setSettingsName] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');

  // Pre-fill settings when buyer loads
  if (buyer && !settingsName && !settingsEmail) {
    setSettingsName(buyer.name);
    setSettingsEmail(buyer.email);
    setSettingsPhone(buyer.phone || '');
  }

  // Stats
  const statsQuery = useQuery<BuyerStats>({
    queryKey: ['buyer-stats', buyerId],
    queryFn: () => fetch(`/api/buyer/${buyerId}/stats`).then((r) => r.json()),
    enabled: !!buyerId,
  });

  // Orders
  const ordersQuery = useQuery<{ orders: BuyerOrder[] }>({
    queryKey: ['buyer-orders', buyerId],
    queryFn: () => fetch(`/api/buyer/${buyerId}/orders`).then((r) => r.json()),
    enabled: !!buyerId,
  });

  // Transactions
  const transactionsQuery = useQuery<{ transactions: BuyerTransaction[] }>({
    queryKey: ['buyer-transactions', buyerId],
    queryFn: () => fetch(`/api/buyer/${buyerId}/transactions`).then((r) => r.json()),
    enabled: !!buyerId,
  });

  // Wishlist from cart store
  const { wishlist, toggleWishlist, addItem, isInWishlist } = useCartStore();

  const orders = ordersQuery.data?.orders || [];
  const transactions = transactionsQuery.data?.transactions || [];
  const stats = statsQuery.data;

  const initials = buyer?.name
    ? buyer.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const statCards = [
    { label: 'Total Orders', value: stats?.totalOrders?.toString() ?? '—', icon: <Package className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
    { label: 'Total Spent', value: stats ? formatKES(stats.totalSpent) : '—', icon: <DollarSign className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Pending Orders', value: stats?.pendingOrders?.toString() ?? '—', icon: <Clock className="h-5 w-5" />, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Active Deliveries', value: stats?.activeDeliveries?.toString() ?? '—', icon: <Truck className="h-5 w-5" />, color: 'bg-gray-100 text-gray-700' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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
            <span className="text-sm text-gray-300 hidden sm:inline">My Account</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/10 rounded-lg transition" aria-label="Notifications">
              <Bell className="h-5 w-5 text-gray-300" />
            </button>
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition relative" aria-label="Cart">
              <ShoppingCart className="h-5 w-5 text-gray-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="px-4 md:px-16 lg:px-32 py-8">
          {/* Profile Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#0F172A] flex items-center justify-center text-lg font-bold text-amber-400 shrink-0">
                {usersQuery.isLoading ? <Skeleton className="h-6 w-6 rounded-full" /> : initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">
                  {usersQuery.isLoading ? <Skeleton className="h-6 w-40" /> : buyer?.name ?? 'Buyer'}
                </h2>
                <p className="text-sm text-gray-500 truncate">
                  {usersQuery.isLoading ? <Skeleton className="h-4 w-56 mt-1" /> : buyer?.email ?? ''}
                </p>
                {buyer?.createdAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Member since {format(new Date(buyer.createdAt), 'MMM yyyy')}
                  </p>
                )}
              </div>
              <Button variant="outline" className="border-gray-200 hover:bg-gray-50 rounded-lg gap-2">
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statsQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
              : statCards.map((stat, i) => (
                  <div
                    key={stat.label}
                    className="bg-white border border-gray-200 rounded-xl p-5"
                  >
                    <div className={`p-2 rounded-lg w-fit ${stat.color} mb-3`}>{stat.icon}</div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="bg-white border border-gray-200 rounded-xl p-1 mb-6 h-auto">
              <TabsTrigger value="orders" className="rounded-lg gap-2 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white text-gray-600 px-4 py-2 text-sm">
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="transactions" className="rounded-lg gap-2 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white text-gray-600 px-4 py-2 text-sm">
                <DollarSign className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="rounded-lg gap-2 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white text-gray-600 px-4 py-2 text-sm">
                <Heart className="h-4 w-4" />
                Wishlist
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg gap-2 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white text-gray-600 px-4 py-2 text-sm">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              {ordersQuery.isLoading ? (
                <TableSkeleton />
              ) : orders.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No orders yet</p>
                  <Link href="/">
                    <Button className="mt-4 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                          <th className="px-6 py-3">Order #</th>
                          <th className="px-6 py-3">Items</th>
                          <th className="px-6 py-3">Total</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Payment</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-3 font-medium text-gray-900">{order.orderNumber}</td>
                            <td className="px-6 py-3 text-gray-600">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</td>
                            <td className="px-6 py-3 font-semibold text-gray-900">{formatKES(order.totalAmount)}</td>
                            <td className="px-6 py-3">
                              <Badge variant="secondary" className={`text-[10px] font-semibold ${ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                                {order.status.replace(/_/g, ' ')}
                              </Badge>
                            </td>
                            <td className="px-6 py-3">
                              <Badge variant="secondary" className={`text-[10px] font-semibold ${PAYMENT_STATUS_COLORS[order.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                                {order.paymentStatus}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 text-gray-500">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</td>
                            <td className="px-6 py-3">
                              <Link href={`/track`}>
                                <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1">
                                  <Eye className="h-4 w-4" />
                                  View
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              {transactionsQuery.isLoading ? (
                <TableSkeleton />
              ) : transactions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Description</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-3 text-gray-500">{format(new Date(tx.createdAt), 'MMM dd, yyyy')}</td>
                            <td className="px-6 py-3 text-gray-700">{tx.description || '—'}</td>
                            <td className="px-6 py-3">
                              <Badge variant="secondary" className={`text-[10px] font-semibold ${tx.type === 'REFUND' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {tx.type === 'REFUND' ? 'Refund' : 'Purchase'}
                              </Badge>
                            </td>
                            <td className={`px-6 py-3 font-semibold ${tx.type === 'REFUND' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {tx.type === 'REFUND' ? '+' : '-'}{formatKES(tx.amount)}
                            </td>
                            <td className="px-6 py-3">
                              <Badge variant="secondary" className={`text-[10px] font-semibold ${tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {tx.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
              {wishlist.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Your wishlist is empty</p>
                  <Link href="/">
                    <Button className="mt-4 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg">
                      Browse Products
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {wishlist.map((productId) => (
                    <WishlistCard
                      key={productId}
                      productId={productId}
                      onRemove={() => toggleWishlist(productId)}
                      onAddToCart={(product) => addItem(product)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-xl">
                <h3 className="font-semibold text-gray-900 mb-6">Account Settings</h3>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="settings-name">Full Name</Label>
                    <Input
                      id="settings-name"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="settings-email">Email Address</Label>
                    <Input
                      id="settings-email"
                      type="email"
                      value={settingsEmail}
                      onChange={(e) => setSettingsEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="settings-phone">Phone Number</Label>
                    <Input
                      id="settings-phone"
                      type="tel"
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                    />
                  </div>
                  <Button
                    className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg mt-2"
                    onClick={() => toast.success('Settings saved successfully!')}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wishlist Card                                                     */
/* ------------------------------------------------------------------ */

function WishlistCard({ productId, onRemove, onAddToCart }: { productId: string; onRemove: () => void; onAddToCart: (product: import('@/types').Product) => void }) {
  const { data: productData } = useQuery<import('@/types').Product>({
    queryKey: ['product', productId],
    queryFn: () => fetch(`/api/products/${productId}`).then((r) => r.json()).then((d) => d.product),
    enabled: !!productId,
  });

  const inCart = useCartStore((s) => s.items.some((i) => i.product.id === productId));

  if (!productData) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <Skeleton className="h-40 w-full rounded-lg mb-3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <Link href={`/product/${productId}`}>
        <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100">
          <img src={productData.image} alt={productData.name} className="w-full h-full object-cover" />
        </div>
      </Link>
      <Link href={`/product/${productId}`} className="block">
        <p className="text-sm font-medium text-gray-900 truncate">{productData.name}</p>
        <p className="text-sm font-bold text-gray-900 mt-1">{formatKES(productData.price)}</p>
      </Link>
      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs gap-1"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </Button>
        <Button
          size="sm"
          className="flex-1 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg text-xs gap-1"
          onClick={() => onAddToCart(productData)}
          disabled={inCart}
        >
          <Plus className="h-3 w-3" />
          {inCart ? 'In Cart' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Export                                                        */
/* ------------------------------------------------------------------ */

export default function AccountPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
        </div>
      }>
        <AccountPageContent />
      </Suspense>
    </QueryClientProvider>
  );
}
