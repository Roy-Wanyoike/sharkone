'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  Users,
  DollarSign,
  TrendingUp,
  Truck,
  Plus,
  Search,
  Edit,
  Archive,
  ArrowLeft,
  ShieldCheck,
  Eye,
  ChevronDown,
  Loader2,
  Star,
  RefreshCw,
  Menu,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// ===================== TYPES =====================
interface Stats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeDeliveries: number;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  platformFee: number;
  deliveryFee: number;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
  buyer: { id: string; name: string; email: string };
  itemCount: number;
  delivery: { status: string; deliveryPerson: { name: string } | null } | null;
}

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string | null;
  stock: number;
  featured: boolean;
  status: string;
  createdAt: string;
  category: { id: string; name: string; slug: string };
  seller: { id: string; storeName: string; user: { name: string } };
}

interface AdminSeller {
  id: string;
  storeName: string;
  storeSlug: string;
  storeDescription: string | null;
  rating: number;
  totalSales: number;
  isVerified: boolean;
  commissionRate: number;
  createdAt: string;
  user: { id: string; name: string; email: string; phone: string | null };
  wallet: { balance: number; totalEarnings: number; pendingClearance: number } | null;
  productCount: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  createdAt: string;
  seller: { id: string; storeName: string; isVerified: boolean } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// ===================== NAV ITEMS =====================
const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'sellers', label: 'Sellers', icon: Store },
  { key: 'users', label: 'Users', icon: Users },
];

// ===================== HELPERS =====================
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-orange-100 text-orange-800',
  ACTIVE: 'bg-green-100 text-green-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  ARCHIVED: 'bg-red-100 text-red-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const roleColors: Record<string, string> = {
  BUYER: 'bg-blue-100 text-blue-800',
  SELLER: 'bg-amber-100 text-amber-800',
  DELIVERY: 'bg-green-100 text-green-800',
  ADMIN: 'bg-slate-100 text-slate-800',
};

function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ===================== LOGO SVG =====================
function AdminLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#F59E0B" />
        <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="white" />
      </svg>
      <span className="text-lg font-bold">
        <span className="text-white">SHARK</span>
        <span className="text-amber-400">ONE</span>
      </span>
    </Link>
  );
}

// ===================== SIDEBAR =====================
function Sidebar({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 flex items-center justify-between">
          <AdminLogo />
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onTabChange(item.key);
                  onClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors px-3 py-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Link>
        </div>
      </aside>
    </>
  );
}

// ===================== STAT CARD =====================
function StatCard({
  icon: Icon,
  label,
  value,
  change,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-4 md:p-6"
    >
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {change && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
            <TrendingUp className={`h-3 w-3 ${change.startsWith('-') ? 'rotate-180' : ''}`} />
            {change}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ===================== STAT SKELETONS =====================
function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-8 w-24 mb-1" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

// ===================== DASHBOARD TAB =====================
function DashboardTab() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: () => fetch('/api/admin/stats').then((r) => r.json()),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery<{ orders: AdminOrder[] }>({
    queryKey: ['admin-orders-recent'],
    queryFn: () => fetch('/api/admin/orders?limit=10').then((r) => r.json()),
  });

  const statCards = stats
    ? [
        { icon: DollarSign, label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), change: '+12.5%', color: 'bg-amber-500' },
        { icon: ShoppingBag, label: 'Total Orders', value: stats.totalOrders.toString(), change: '+8.2%', color: 'bg-blue-500' },
        { icon: Package, label: 'Total Products', value: stats.totalProducts.toString(), change: '+3.1%', color: 'bg-green-500' },
        { icon: Store, label: 'Total Sellers', value: stats.totalSellers.toString(), change: '+5.7%', color: 'bg-purple-500' },
        { icon: Users, label: 'Total Users', value: stats.totalUsers.toString(), change: '+10.3%', color: 'bg-cyan-500' },
        { icon: Truck, label: 'Active Deliveries', value: stats.activeDeliveries.toString(), color: 'bg-orange-500' },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => {}}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
        <Button variant="outline" className="border-slate-300" onClick={() => {}}>
          <Eye className="h-4 w-4 mr-2" />
          View Sellers
        </Button>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <p className="text-sm text-slate-500">Latest orders across the platform</p>
        </div>
        <div className="overflow-x-auto">
          {ordersLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !ordersData?.orders?.length ? (
            <div className="p-8 text-center text-slate-500">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p>No orders yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersData.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                    <TableCell className="font-medium">{order.buyer.name}</TableCell>
                    <TableCell>{order.itemCount}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                        {order.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===================== PRODUCTS TAB =====================
function ProductsTab({ onAddProduct }: { onAddProduct: () => void }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading, refetch } = useQuery<{ products: AdminProduct[]; total: number }>({
    queryKey: ['admin-products', search, statusFilter],
    queryFn: () => fetch(`/api/admin/products?search=${search}&status=${statusFilter}`).then((r) => r.json()),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/products/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Product archived');
      refetch();
    },
    onError: () => toast.error('Failed to archive product'),
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Header with search, filter, add button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={onAddProduct}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !data?.products?.length ? (
            <div className="p-8 text-center text-slate-500">
              <Package className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p>No products found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                        <span className="font-medium text-sm max-w-[200px] truncate block">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{product.seller?.storeName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{product.category?.name}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <span className={`text-sm ${product.stock < 10 ? 'text-red-600 font-medium' : 'text-slate-700'}`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[product.status] || ''}`}>
                        {product.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onAddProduct()}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => archiveMutation.mutate(product.id)}
                          disabled={archiveMutation.isPending}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===================== ORDERS TAB =====================
function OrdersTab() {
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading, refetch } = useQuery<{ orders: AdminOrder[]; total: number }>({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => fetch(`/api/admin/orders?status=${statusFilter}`).then((r) => r.json()),
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">All Orders</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !data?.orders?.length ? (
            <div className="p-8 text-center text-slate-500">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p>No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{order.buyer.name}</p>
                        <p className="text-xs text-slate-500">{order.buyer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{order.itemCount}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                        {order.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===================== SELLERS TAB =====================
function SellersTab() {
  const queryClient = useQueryClient();

  const { data: sellers, isLoading, refetch } = useQuery<AdminSeller[]>({
    queryKey: ['admin-sellers'],
    queryFn: () => fetch('/api/admin/sellers').then((r) => r.json()),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ sellerId, isVerified }: { sellerId: string; isVerified: boolean }) =>
      fetch('/api/admin/sellers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId, isVerified }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Seller updated');
      refetch();
    },
    onError: () => toast.error('Failed to update seller'),
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-slate-900">All Sellers</h2>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !sellers?.length ? (
            <div className="p-8 text-center text-slate-500">
              <Store className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p>No sellers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Owner Email</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{seller.storeName}</p>
                        {seller.isVerified && (
                          <ShieldCheck className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{seller.user.email}</TableCell>
                    <TableCell className="text-sm">{seller.productCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{seller.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{seller.totalSales}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(seller.wallet?.balance ?? 0)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={seller.isVerified}
                        onCheckedChange={(checked) =>
                          verifyMutation.mutate({ sellerId: seller.id, isVerified: checked })
                        }
                        disabled={verifyMutation.isPending}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===================== USERS TAB =====================
function UsersTab() {
  const [roleFilter, setRoleFilter] = useState('ALL');

  const { data, isLoading } = useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ['admin-users', roleFilter],
    queryFn: () => fetch(`/api/admin/users?role=${roleFilter}`).then((r) => r.json()),
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">All Users</h2>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="BUYER">Buyer</SelectItem>
            <SelectItem value="SELLER">Seller</SelectItem>
            <SelectItem value="DELIVERY">Delivery</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !data?.users?.length ? (
            <div className="p-8 text-center text-slate-500">
              <Users className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p>No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{user.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{user.phone || '—'}</TableCell>
                    <TableCell className="text-sm text-slate-500">{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===================== PRODUCT DIALOG =====================
function ProductDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', description: '', price: '', originalPrice: '', image: '', images: '',
    categoryId: '', sellerId: '', stock: '100', featured: false, status: 'ACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
  });

  const { data: sellers } = useQuery<AdminSeller[]>({
    queryKey: ['admin-sellers-dialog'],
    queryFn: () => fetch('/api/admin/sellers').then((r) => r.json()),
  });

  const updateField = useCallback((key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.description || !form.price || !form.image || !form.categoryId || !form.sellerId) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Product created successfully');
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        onOpenChange(false);
        setForm({
          name: '', description: '', price: '', originalPrice: '', image: '', images: '',
          categoryId: '', sellerId: '', stock: '100', featured: false, status: 'ACTIVE',
        });
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create product');
      }
    } catch {
      toast.error('Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Fill in the product details below</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Product name"
              />
            </div>
            <div className="space-y-2">
              <Label>Price (KES) *</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Original Price (KES)</Label>
              <Input
                type="number"
                value={form.originalPrice}
                onChange={(e) => updateField('originalPrice', e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Stock *</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.categoryId} onValueChange={(v) => updateField('categoryId', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Seller *</Label>
              <Select value={form.sellerId} onValueChange={(v) => updateField('sellerId', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select seller" />
                </SelectTrigger>
                <SelectContent>
                  {sellers?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.storeName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => updateField('status', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Image URL *</Label>
              <Input
                value={form.image}
                onChange={(e) => updateField('image', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Image URLs (comma-separated)</Label>
            <Input
              value={form.images}
              onChange={(e) => updateField('images', e.target.value)}
              placeholder="https://..., https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Product description"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={form.featured}
              onCheckedChange={(checked) => updateField('featured', checked)}
            />
            <Label>Featured Product</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300">
            Cancel
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== MAIN PAGE =====================
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const currentNav = navItems.find((n) => n.key === activeTab);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  {currentNav?.label || 'Dashboard'}
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  SHARKONE Admin Panel
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 hidden sm:flex"
                onClick={() => {}}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && <DashboardTab key="dashboard" />}
            {activeTab === 'products' && (
              <ProductsTab key="products" onAddProduct={() => setProductDialogOpen(true)} />
            )}
            {activeTab === 'orders' && <OrdersTab key="orders" />}
            {activeTab === 'sellers' && <SellersTab key="sellers" />}
            {activeTab === 'users' && <UsersTab key="users" />}
          </AnimatePresence>
        </div>
      </main>

      {/* Product Dialog */}
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
      />
    </div>
  );
}
