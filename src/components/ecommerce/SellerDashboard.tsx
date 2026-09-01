'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Star,
  Plus,
  TrendingUp,
  Wallet,
  Clock,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  RotateCcw,
  BarChart3,
  Eye,
  Pencil,
  Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyStore } from '@/store/currency-store';

/* ------------------------------------------------------------------ */
/*  Hydration-safe mounted detection                                   */
/* ------------------------------------------------------------------ */
const mountedStore = {
  subscribe: () => () => {},
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};
function useMounted() {
  return useSyncExternalStore(
    mountedStore.subscribe,
    mountedStore.getSnapshot,
    mountedStore.getServerSnapshot,
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface SellerDashboardProps {
  sellerId?: string;
}

interface SellerStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  rating: number;
  pendingClearance: number;
  balance: number;
  totalEarnings: number;
  totalWithdrawn: number;
}

interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  status: string;
  image: string;
  category: { id: string; name: string; slug: string } | null;
  createdAt: string;
}

interface SellerOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

interface SellerTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  createdAt: string;
}

interface ReturnItem {
  id: string;
  returnNumber: string;
  orderNumber: string;
  productName: string;
  productImage: string;
  buyerName: string;
  reason: string;
  description: string | null;
  status: string;
  refundAmount: number;
  refundStatus: string;
  createdAt: string;
  resolvedAt: string | null;
}

interface ReturnsResponse {
  returns: ReturnItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/* currency formatting handled by formatCurrency from @/lib/currency */

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM dd, yyyy');
}

function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'MMM dd, yyyy HH:mm');
}

function statusBadgeColor(status: string) {
  switch (status) {
    case 'DELIVERED': return 'bg-emerald-100 text-emerald-700';
    case 'SHIPPED': return 'bg-sky-100 text-sky-700';
    case 'PROCESSING': return 'bg-amber-100 text-amber-700';
    case 'PENDING': return 'bg-gray-100 text-gray-700';
    case 'CANCELLED': return 'bg-red-100 text-red-700';
    case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
    case 'OUT_FOR_DELIVERY': return 'bg-violet-100 text-violet-700';
    case 'REFUNDED': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function returnStatusBadgeColor(status: string) {
  switch (status) {
    case 'PENDING': return 'bg-amber-100 text-amber-700';
    case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    case 'COMPLETED': return 'bg-sky-100 text-sky-700';
    case 'CANCELLED': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function productStatusBadgeColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
    case 'DRAFT': return 'bg-amber-100 text-amber-700';
    case 'ARCHIVED': return 'bg-gray-200 text-gray-600';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function stockLevelColor(stock: number) {
  if (stock > 20) return 'bg-emerald-500';
  if (stock >= 5) return 'bg-amber-500';
  return 'bg-red-500';
}

function stockLevelLabel(stock: number) {
  if (stock > 20) return 'In Stock';
  if (stock >= 5) return 'Low Stock';
  return 'Critical';
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

function txnTypeColor(type: string) {
  switch (type) {
    case 'EARNING': return 'text-emerald-600';
    case 'WITHDRAWAL': return 'text-orange-600';
    case 'REFUND': return 'text-red-600';
    case 'PURCHASE': return 'text-gray-600';
    default: return 'text-gray-600';
  }
}

function formatTxnType(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loaders                                                  */
/* ------------------------------------------------------------------ */

function StatCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-7 w-24 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-3 flex items-center gap-4 border-b border-gray-50">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BarSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-20 shrink-0" />
          <Skeleton className="h-6 flex-1 rounded" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function SellerDashboard({ sellerId: propSellerId }: SellerDashboardProps) {
  const mounted = useMounted();
  const queryClient = useQueryClient();
  const currencyCode = useCurrencyStore((s) => s.code);

  // Auto-detect seller if not provided
  const autoSellersQuery = useQuery<{ id: string }[]>({
    queryKey: ['sellers-auto-detect'],
    queryFn: () => fetch('/api/admin/sellers').then(r => r.json()),
    enabled: !propSellerId,
  });

  const sellerId = propSellerId || autoSellersQuery.data?.[0]?.id || '';
  const isLoading = !propSellerId ? autoSellersQuery.isLoading : false;
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category: '', stock: '' });

  // Products tab filters
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('ALL');

  /* ---- Queries ---- */

  const statsQuery = useQuery<SellerStats>({
    queryKey: ['seller-stats', sellerId],
    queryFn: () => fetch(`/api/seller/${sellerId}/stats`).then(r => r.json()),
    enabled: !!sellerId,
  });

  const productsQuery = useQuery<SellerProduct[]>({
    queryKey: ['seller-products', sellerId],
    queryFn: () => fetch(`/api/seller/${sellerId}/products`).then(r => r.json()),
    enabled: !!sellerId,
  });

  const ordersQuery = useQuery<SellerOrder[]>({
    queryKey: ['seller-orders', sellerId],
    queryFn: () => fetch(`/api/seller/${sellerId}/orders`).then(r => r.json()),
    enabled: !!sellerId,
  });

  const returnsQuery = useQuery<ReturnsResponse>({
    queryKey: ['seller-returns', sellerId],
    queryFn: () => fetch(`/api/returns?sellerId=${sellerId}&limit=50`).then(r => r.json()),
    enabled: !!sellerId,
  });

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()),
  });

  /* ---- Mutations ---- */

  const addProductMutation = useMutation({
    mutationFn: (data: { name: string; price: string; description: string; category: string; stock: string }) =>
      fetch(`/api/seller/${sellerId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['seller-stats', sellerId] });
      toast.success(`"${newProduct.name}" has been added as a draft`);
      setAddProductOpen(false);
      setNewProduct({ name: '', price: '', description: '', category: '', stock: '' });
    },
    onError: () => {
      toast.error('Failed to create product');
    },
  });

  const updateReturnMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fetch(`/api/returns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(r => {
        if (!r.ok) return r.json().then(d => { throw new Error(d.error || 'Update failed'); });
        return r.json();
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller-returns', sellerId] });
      toast.success(`Return ${variables.status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error('Please fill in product name and price');
      return;
    }
    addProductMutation.mutate(newProduct);
  };

  const categories = categoriesQuery.data || [];
  const stats = statsQuery.data;
  const products = productsQuery.data || [];
  const orders = ordersQuery.data || [];
  const returnsData = returnsQuery.data?.returns || [];

  /* ---- Computed: filtered products ---- */
  const filteredProducts = useMemo(() => {
    let result = products;
    if (productStatusFilter !== 'ALL') {
      result = result.filter(p => p.status === productStatusFilter);
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [products, productStatusFilter, productSearch]);

  /* ---- Computed: order status distribution ---- */
  const orderStatusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [orders]);

  /* ---- Computed: return status distribution ---- */
  const returnStatusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    returnsData.forEach(r => {
      map[r.status] = (map[r.status] || 0) + 1;
    });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  }, [returnsData]);

  /* ---- Computed: analytics from orders ---- */
  const earningsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const dateKey = o.createdAt.slice(0, 10);
      map[dateKey] = (map[dateKey] || 0) + o.total;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7);
  }, [orders]);

  const maxEarning = useMemo(() => Math.max(...earningsByDate.map(([, v]) => v), 1), [earningsByDate]);

  const topProducts = useMemo(() => {
    return products
      .slice(0, 5)
      .map(p => ({ name: p.name, revenue: p.price * Math.max(0, 20 - products.indexOf(p)) }));
  }, [products]);

  const maxProductRevenue = useMemo(() => Math.max(...topProducts.map(p => p.revenue), 1), [topProducts]);

  const statsCards = stats
    ? [
        { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue, currencyCode), change: '+12.5%', icon: <DollarSign className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
        { label: 'Total Orders', value: String(stats.totalOrders), change: '+8.2%', icon: <ShoppingBag className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-700' },
        { label: 'Products Listed', value: String(stats.totalProducts), change: `+${stats.totalProducts > 0 ? '1' : '0'}`, icon: <Package className="h-5 w-5" />, color: 'bg-gray-100 text-gray-700' },
        { label: 'Rating', value: stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A', change: stats.rating > 0 ? `+${(stats.rating * 0.02).toFixed(1)}` : '', icon: <Star className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
      ]
    : [];

  /* ---- Quick stats for overview ---- */
  const quickStats = stats
    ? [
        { label: 'Wallet Balance', value: formatCurrency(stats.balance, currencyCode), icon: <Wallet className="h-4 w-4" />, accent: true },
        { label: 'Pending Clearance', value: formatCurrency(stats.pendingClearance, currencyCode), icon: <Clock className="h-4 w-4" />, accent: false },
        { label: 'Total Earnings', value: formatCurrency(stats.totalEarnings, currencyCode), icon: <TrendingUp className="h-4 w-4" />, accent: false },
        { label: 'Total Withdrawn', value: formatCurrency(stats.totalWithdrawn, currencyCode), icon: <ArrowDownRight className="h-4 w-4" />, accent: false },
      ]
    : [];

  if (!mounted || isLoading) {
    return (
      <div className="px-4 md:px-16 lg:px-32 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-16 lg:px-32 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">Seller Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your store, products, and earnings</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-[#0F172A] data-[state=active]:text-white rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="data-[state=active]:bg-[#0F172A] data-[state=active]:text-white rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            Products
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-[#0F172A] data-[state=active]:text-white rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            Orders
          </TabsTrigger>
          <TabsTrigger
            value="returns"
            className="data-[state=active]:bg-[#0F172A] data-[state=active]:text-white rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            Returns
            {returnsData.filter(r => r.status === 'PENDING').length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-[#F59E0B] text-[10px] font-bold text-[#0F172A]">
                {returnsData.filter(r => r.status === 'PENDING').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-[#0F172A] data-[state=active]:text-white rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/*  TAB 1: OVERVIEW                                                 */}
        {/* ================================================================ */}
        <TabsContent value="overview">
          {/* Stats Cards */}
          {statsQuery.isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : statsQuery.error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700">Failed to load dashboard stats. Please try again.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {statsCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
                    {stat.change && (
                      <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3" />
                        {stat.change}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-[#0F172A]">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Quick Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {quickStats.map((qs, i) => (
                <motion.div
                  key={qs.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                  className={`${qs.accent ? 'bg-[#0F172A] text-white' : 'bg-white border border-gray-200'} rounded-xl p-4`}
                >
                  <div className={`flex items-center gap-2 mb-1.5 ${qs.accent ? 'text-amber-400' : 'text-gray-500'}`}>
                    {qs.icon}
                    <span className="text-xs font-medium">{qs.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${qs.accent ? 'text-white' : 'text-[#0F172A]'}`}>{qs.value}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Recent Orders Table */}
          {ordersQuery.isLoading ? (
            <TableSkeleton rows={5} />
          ) : orders.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No orders yet. Your orders will appear here.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-[#0F172A]">Recent Orders</h2>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[10px] font-semibold">
                  {orders.length} total
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Order #</th>
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3 font-medium text-[#0F172A]">{order.orderNumber}</td>
                        <td className="px-6 py-3 text-gray-600">{order.buyerName}</td>
                        <td className="px-6 py-3 font-medium text-[#0F172A]">{formatCurrency(order.total, currencyCode)}</td>
                        <td className="px-6 py-3">
                          <Badge variant="secondary" className={`text-[10px] font-semibold ${statusBadgeColor(order.status)}`}>
                            {formatStatusLabel(order.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/*  TAB 2: PRODUCTS                                                 */}
        {/* ================================================================ */}
        <TabsContent value="products">
          {/* Header with Add Product */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-semibold text-[#0F172A] text-lg">Your Products</h2>
            <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="prod-name">Product Name</Label>
                    <Input
                      id="prod-name"
                      placeholder="e.g. Wireless Headphones"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="prod-price">Price ({currencyCode})</Label>
                      <Input
                        id="prod-price"
                        type="number"
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="prod-stock">Stock</Label>
                      <Input
                        id="prod-stock"
                        type="number"
                        placeholder="0"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={newProduct.category} onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="prod-desc">Description</Label>
                    <Textarea
                      id="prod-desc"
                      placeholder="Describe your product..."
                      rows={3}
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={handleAddProduct}
                    disabled={addProductMutation.isPending}
                    className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold mt-2"
                  >
                    {addProductMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9 border-gray-200 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={productStatusFilter} onValueChange={setProductStatusFilter}>
                <SelectTrigger className="w-[140px] border-gray-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-[#0F172A]">{filteredProducts.length}</span> of {products.length} products
            </p>
          </div>

          {/* Products Grid / Table */}
          {productsQuery.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {products.length === 0
                  ? 'No products yet. Click "Add Product" to get started.'
                  : 'No products match your search or filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {/* Product Image */}
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Status Badge overlay */}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold ${productStatusBadgeColor(product.status)}`}
                      >
                        {product.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Name + Category */}
                    <h3 className="text-sm font-medium text-[#0F172A] line-clamp-1">{product.name}</h3>
                    {product.category && (
                      <p className="text-xs text-gray-400 mt-0.5">{product.category.name}</p>
                    )}

                    {/* Price + Stock */}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-[#0F172A]">{formatCurrency(product.price, currencyCode)}</span>
                      <div className="flex items-center gap-2">
                        {/* Stock Level Indicator */}
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${stockLevelColor(product.stock)}`} />
                          <span className="text-xs text-gray-500">
                            {product.stock > 0 ? product.stock : 'Out of stock'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Level Bar */}
                    <div className="mt-2">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${stockLevelColor(product.stock)}`}
                          style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
                        />
                      </div>
                      <p className={`text-[10px] mt-1 font-medium ${
                        product.stock > 20 ? 'text-emerald-600' : product.stock >= 5 ? 'text-amber-600' : 'text-red-600'
                      }`}>{
                        product.stock > 20 ? 'Good Stock' : product.stock >= 5 ? 'Low Stock' : product.stock > 0 ? 'Critical Stock' : 'Out of Stock'
                      }</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-gray-600 hover:text-[#0F172A] hover:bg-gray-100"
                        onClick={() => toast.info(`Viewing ${product.name}`)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-gray-600 hover:text-[#0F172A] hover:bg-gray-100"
                        onClick={() => toast.info(`Editing ${product.name}`)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/*  TAB 3: ORDERS                                                   */}
        {/* ================================================================ */}
        <TabsContent value="orders">
          {/* Status Distribution Summary */}
          {orders.length > 0 && !ordersQuery.isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-5 mb-6"
            >
              <h3 className="text-sm font-semibold text-[#0F172A] mb-3">Order Status Distribution</h3>
              <div className="flex flex-wrap gap-3">
                {orderStatusDistribution.map(({ status, count }) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <Badge variant="secondary" className={`text-[10px] font-semibold ${statusBadgeColor(status)}`}>
                      {formatStatusLabel(status)}
                    </Badge>
                    <span className="text-sm font-bold text-[#0F172A]">{count}</span>
                  </div>
                ))}
              </div>
              {/* Visual bar */}
              <div className="mt-3 flex h-2.5 rounded-full overflow-hidden bg-gray-100">
                {orderStatusDistribution.map(({ status, count }) => {
                  const pct = (count / orders.length) * 100;
                  const barColor = (() => {
                    switch (status) {
                      case 'DELIVERED': return 'bg-emerald-500';
                      case 'SHIPPED': return 'bg-sky-500';
                      case 'PROCESSING': return 'bg-amber-500';
                      case 'PENDING': return 'bg-gray-400';
                      case 'CANCELLED': return 'bg-red-500';
                      case 'CONFIRMED': return 'bg-blue-500';
                      case 'OUT_FOR_DELIVERY': return 'bg-violet-500';
                      default: return 'bg-gray-300';
                    }
                  })();
                  return (
                    <div
                      key={status}
                      className={`${barColor} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                      title={`${formatStatusLabel(status)}: ${count} (${pct.toFixed(0)}%)`}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Orders Table */}
          {ordersQuery.isLoading ? (
            <TableSkeleton rows={6} />
          ) : orders.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No orders yet. Orders containing your products will appear here.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-[#0F172A]">All Orders</h2>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[10px] font-semibold">
                  {orders.length} orders
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Order #</th>
                      <th className="px-6 py-3">Buyer</th>
                      <th className="px-6 py-3">Items</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3 font-medium text-[#0F172A]">{order.orderNumber}</td>
                        <td className="px-6 py-3 text-gray-600">{order.buyerName}</td>
                        <td className="px-6 py-3 text-gray-600">{order.itemCount} item{order.itemCount > 1 ? 's' : ''}</td>
                        <td className="px-6 py-3 font-medium text-[#0F172A]">{formatCurrency(order.total, currencyCode)}</td>
                        <td className="px-6 py-3">
                          <Badge variant="secondary" className={`text-[10px] font-semibold ${statusBadgeColor(order.status)}`}>
                            {formatStatusLabel(order.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/*  TAB 4: RETURNS                                                  */}
        {/* ================================================================ */}
        <TabsContent value="returns">
          {/* Return Status Summary */}
          {returnsData.length > 0 && !returnsQuery.isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
            >
              {['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'].map((st) => {
                const count = returnsData.filter(r => r.status === st).length;
                const colorMap: Record<string, string> = {
                  PENDING: 'border-amber-200 bg-amber-50',
                  APPROVED: 'border-emerald-200 bg-emerald-50',
                  REJECTED: 'border-red-200 bg-red-50',
                  COMPLETED: 'border-sky-200 bg-sky-50',
                };
                const iconColorMap: Record<string, string> = {
                  PENDING: 'text-amber-600',
                  APPROVED: 'text-emerald-600',
                  REJECTED: 'text-red-600',
                  COMPLETED: 'text-sky-600',
                };
                return (
                  <div key={st} className={`rounded-xl p-3 border ${colorMap[st] || 'border-gray-200 bg-gray-50'}`}>
                    <p className="text-xs text-gray-500 font-medium">{formatStatusLabel(st)}</p>
                    <p className={`text-xl font-bold mt-1 ${iconColorMap[st] || 'text-gray-900'}`}>{count}</p>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Returns Table */}
          {returnsQuery.isLoading ? (
            <TableSkeleton rows={5} />
          ) : returnsData.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <RotateCcw className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No return requests. Return requests from buyers will appear here.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-[#0F172A]">Return Requests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Return #</th>
                      <th className="px-6 py-3">Order #</th>
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3">Reason</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Refund</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {returnsData.map((ret) => (
                      <tr key={ret.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3 font-medium text-[#0F172A]">{ret.returnNumber}</td>
                        <td className="px-6 py-3 text-gray-600">{ret.orderNumber}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={ret.productImage || '/placeholder.png'}
                              alt={ret.productName}
                              className="h-8 w-8 rounded object-cover bg-gray-100"
                            />
                            <span className="text-gray-900 font-medium line-clamp-1 max-w-[140px]">{ret.productName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-600 max-w-[160px]">
                          <span className="line-clamp-1" title={ret.reason}>{ret.reason}</span>
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant="secondary" className={`text-[10px] font-semibold ${returnStatusBadgeColor(ret.status)}`}>
                            {formatStatusLabel(ret.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 font-medium text-[#0F172A]">{formatCurrency(ret.refundAmount, currencyCode)}</td>
                        <td className="px-6 py-3 text-gray-500">{formatDate(ret.createdAt)}</td>
                        <td className="px-6 py-3">
                          {ret.status === 'PENDING' ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                                disabled={updateReturnMutation.isPending}
                                onClick={() => updateReturnMutation.mutate({ id: ret.id, status: 'APPROVED' })}
                              >
                                {updateReturnMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2.5 text-[11px] font-semibold text-red-700 hover:text-red-800 hover:bg-red-50"
                                disabled={updateReturnMutation.isPending}
                                onClick={() => updateReturnMutation.mutate({ id: ret.id, status: 'REJECTED' })}
                              >
                                {updateReturnMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <XCircle className="h-3 w-3 mr-1" />}
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/*  TAB 5: ANALYTICS                                                */}
        {/* ================================================================ */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Trend */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-[#0F172A]">Earnings Trend</h3>
              </div>
              <p className="text-xs text-gray-400 mb-5">Revenue by date (last 7 data points)</p>

              {ordersQuery.isLoading ? (
                <BarSkeleton />
              ) : earningsByDate.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No order data available yet</div>
              ) : (
                <div className="space-y-3">
                  {earningsByDate.map(([date, amount]) => {
                    const pct = (amount / maxEarning) * 100;
                    return (
                      <div key={date} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20 shrink-0 tabular-nums">{format(new Date(date), 'MMM dd')}</span>
                        <div className="flex-1 h-7 bg-gray-50 rounded-md overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-md transition-all duration-700 ease-out"
                            style={{ width: `${Math.max(pct, 4)}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#0F172A]">
                            {formatCurrency(amount, currencyCode)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Order Status Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-[#0F172A]">Order Status Breakdown</h3>
              </div>
              <p className="text-xs text-gray-400 mb-5">Distribution of order statuses</p>

              {ordersQuery.isLoading ? (
                <BarSkeleton />
              ) : orderStatusDistribution.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No order data available yet</div>
              ) : (
                <div className="space-y-3">
                  {orderStatusDistribution.map(({ status, count }) => {
                    const pct = (count / orders.length) * 100;
                    const barColor = (() => {
                      switch (status) {
                        case 'DELIVERED': return 'from-emerald-400 to-emerald-500';
                        case 'SHIPPED': return 'from-sky-400 to-sky-500';
                        case 'PROCESSING': return 'from-amber-400 to-amber-500';
                        case 'PENDING': return 'from-gray-300 to-gray-400';
                        case 'CANCELLED': return 'from-red-400 to-red-500';
                        case 'CONFIRMED': return 'from-blue-400 to-blue-500';
                        case 'OUT_FOR_DELIVERY': return 'from-violet-400 to-violet-500';
                        default: return 'from-gray-300 to-gray-400';
                      }
                    })();
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-28 shrink-0 truncate" title={formatStatusLabel(status)}>
                          {formatStatusLabel(status)}
                        </span>
                        <div className="flex-1 h-7 bg-gray-50 rounded-md overflow-hidden relative">
                          <div
                            className={`h-full bg-gradient-to-r ${barColor} rounded-md transition-all duration-700 ease-out`}
                            style={{ width: `${Math.max(pct, 4)}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#0F172A]">
                            {count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Top Products by Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-[#0F172A]">Top Products</h3>
              </div>
              <p className="text-xs text-gray-400 mb-5">Your listed products at a glance</p>

              {productsQuery.isLoading ? (
                <BarSkeleton />
              ) : topProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No products listed yet</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.slice(0, 6).map((product, idx) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="text-amber-700 font-bold text-sm">#{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold text-[#0F172A]">{formatCurrency(product.price, currencyCode)}</span>
                          <Badge variant="secondary" className={`text-[9px] font-semibold ${productStatusBadgeColor(product.status)}`}>
                            {product.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">Stock</p>
                        <div className="flex items-center gap-1 justify-end">
                          <span className={`h-1.5 w-1.5 rounded-full ${stockLevelColor(product.stock)}`} />
                          <span className="text-xs font-semibold text-[#0F172A]">{product.stock}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Financial Overview */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[#0F172A] rounded-xl p-6 lg:col-span-2"
            >
              <h3 className="text-sm font-semibold text-amber-400 mb-4">Financial Overview</h3>
              {statsQuery.isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-3 w-16 mb-2 bg-gray-700" />
                      <Skeleton className="h-7 w-24 bg-gray-700" />
                    </div>
                  ))}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Revenue</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(stats.totalRevenue, currencyCode)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Wallet Balance</p>
                    <p className="text-xl font-bold text-amber-400">{formatCurrency(stats.balance, currencyCode)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Pending Clearance</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(stats.pendingClearance, currencyCode)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Total Withdrawn</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(stats.totalWithdrawn, currencyCode)}</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
