'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const currencyFmt = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 2,
});

function formatCurrency(value: number): string {
  return currencyFmt.format(value);
}

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM dd, yyyy');
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

function formatTxnStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
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

function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-5 w-14 rounded-full shrink-0" />
        </div>
        <div className="flex items-center justify-between mt-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function SellerDashboard({ sellerId: propSellerId }: SellerDashboardProps) {
  const queryClient = useQueryClient();

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
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawOpen, setWithdrawOpen] = useState(false);

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

  const transactionsQuery = useQuery<SellerTransaction[]>({
    queryKey: ['seller-transactions', sellerId],
    queryFn: () => fetch(`/api/seller/${sellerId}/transactions`).then(r => r.json()),
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

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) =>
      fetch(`/api/seller/${sellerId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      }).then(r => {
        if (!r.ok) return r.json().then(d => { throw new Error(d.error || 'Withdrawal failed'); });
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-stats', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['seller-transactions', sellerId] });
      toast.success('Withdrawal request submitted!');
      setWithdrawOpen(false);
      setWithdrawAmount('');
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

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const categories = categoriesQuery.data || [];
  const stats = statsQuery.data;
  const products = productsQuery.data || [];
  const orders = ordersQuery.data || [];
  const transactions = transactionsQuery.data || [];

  const statsCards = stats
    ? [
        { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), change: '+12.5%', icon: <DollarSign className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
        { label: 'Total Orders', value: String(stats.totalOrders), change: '+8.2%', icon: <ShoppingBag className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-700' },
        { label: 'Products Listed', value: String(stats.totalProducts), change: `+${stats.totalProducts > 0 ? '1' : '0'}`, icon: <Package className="h-5 w-5" />, color: 'bg-gray-100 text-gray-700' },
        { label: 'Rating', value: stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A', change: stats.rating > 0 ? `+${(stats.rating * 0.02).toFixed(1)}` : '', icon: <Star className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
      ]
    : [];

  return (
    <div className="px-4 md:px-16 lg:px-32 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Seller Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your store, products, and earnings</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
        </TabsList>

        {/* ---- Overview Tab ---- */}
        <TabsContent value="overview">
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
                  className="bg-white border border-gray-200 rounded-xl p-5"
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
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
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
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Recent Orders</h2>
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
                        <td className="px-6 py-3 font-medium text-gray-900">{order.orderNumber}</td>
                        <td className="px-6 py-3 text-gray-600">{order.buyerName}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">{formatCurrency(order.total)}</td>
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

        {/* ---- Products Tab ---- */}
        <TabsContent value="products">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900 text-lg">Your Products</h2>
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
                      <Label htmlFor="prod-price">Price (KES)</Label>
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

          {productsQuery.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No products yet. Click &quot;Add Product&quot; to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                      <Badge variant="secondary" className={`text-[10px] font-semibold shrink-0 ${product.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {product.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(product.price)}</span>
                      <span className={`text-xs ${product.stock > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- Orders Tab ---- */}
        <TabsContent value="orders">
          {ordersQuery.isLoading ? (
            <TableSkeleton rows={6} />
          ) : orders.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No orders yet. Orders containing your products will appear here.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Order #</th>
                      <th className="px-6 py-3">Items</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3 font-medium text-gray-900">{order.orderNumber}</td>
                        <td className="px-6 py-3 text-gray-600">{order.itemCount} item{order.itemCount > 1 ? 's' : ''}</td>
                        <td className="px-6 py-3 font-medium text-gray-900">{formatCurrency(order.total)}</td>
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

        {/* ---- Wallet Tab ---- */}
        <TabsContent value="wallet">
          {statsQuery.isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0F172A] text-white rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs font-medium">Wallet Balance</span>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.balance)}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Total Earnings</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">Pending Clearance</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingClearance)}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <ArrowDownRight className="h-4 w-4" />
                    <span className="text-xs font-medium">Total Withdrawn</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalWithdrawn)}</p>
                </motion.div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-lg">Transaction History</h2>
                <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-gray-300 text-gray-700 rounded-lg">
                      Withdraw Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Withdraw Funds</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        Available balance: <span className="font-bold">{formatCurrency(stats.balance)}</span>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="withdraw-amount">Amount (KES)</Label>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleWithdraw}
                        disabled={withdrawMutation.isPending}
                        className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold"
                      >
                        {withdrawMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Submit Withdrawal
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </>
          ) : null}

          {transactionsQuery.isLoading ? (
            <TableSkeleton rows={5} />
          ) : transactions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No transactions yet. Your earnings and withdrawals will appear here.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3 text-gray-500">{formatDate(txn.createdAt)}</td>
                        <td className="px-6 py-3 text-gray-900 font-medium">{txn.description || '-'}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-semibold ${txnTypeColor(txn.type)}`}>{formatTxnType(txn.type)}</span>
                        </td>
                        <td className={`px-6 py-3 font-semibold ${txnTypeColor(txn.type)}`}>
                          {txn.type === 'EARNING' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </td>
                        <td className="px-6 py-3">
                          <span className="flex items-center gap-1 text-xs">
                            {txn.status === 'COMPLETED' ? (
                              <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600">Completed</span></>
                            ) : txn.status === 'FAILED' ? (
                              <><XCircle className="h-3.5 w-3.5 text-red-500" /><span className="text-red-600">Failed</span></>
                            ) : (
                              <><AlertCircle className="h-3.5 w-3.5 text-amber-500" /><span className="text-amber-600">Pending</span></>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
