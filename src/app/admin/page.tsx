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
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Eye,
  ChevronDown,
  Loader2,
  Star,
  RefreshCw,
  Menu,
  X,
  Warehouse,
  AlertTriangle,
  MapPin,
  User,
  Phone,
  BarChart3,
  Image as ImageIcon,
  MousePointerClick,
  ExternalLink,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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

interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  totalProducts: number;
  totalSellers: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueChangePercent: number;
  thisMonthOrders: number;
  lastMonthOrders: number;
  ordersChangePercent: number;
  topProducts: {
    productId: string;
    name: string;
    image: string;
    totalSold: number;
    revenue: number;
  }[];
  orderStatusDistribution: { status: string; count: number }[];
  paymentStatusDistribution: { status: string; count: number }[];
  dailyRevenue: { date: string; revenue: number; orders: number }[];
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

interface AdminWarehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  county: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  capacity: number;
  managerName: string | null;
  managerPhone: string | null;
  createdAt: string;
  updatedAt: string;
  totalItems: number;
  totalReserved: number;
  inventoryCount: number;
  lowStockCount: number;
  capacityUsed: number;
  capacityPercentage: number;
}

interface WarehouseStats {
  totalWarehouses: number;
  activeWarehouses: number;
  maintenanceCount: number;
  totalCapacity: number;
  totalItemsInStock: number;
  totalReserved: number;
  capacityPercentage: number;
  lowStockAlerts: number;
  inventoryValue: number;
  inventoryItemCount: number;
}

interface InventoryItemRow {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  binLocation: string | null;
  lastRestocked: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    seller: {
      storeName: string;
      user: { name: string };
    };
  };
}

interface WarehouseDetail extends AdminWarehouse {
  inventoryItems: InventoryItemRow[];
}

// ===================== NAV ITEMS =====================
interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'sellers', label: 'Sellers', icon: Store },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'warehouses', label: 'Warehouses', icon: Warehouse },
  { key: 'banners', label: 'Banners', icon: ImageIcon },
  { key: 'deliveries', label: 'Deliveries', icon: Truck, href: '/admin/deliveries' },
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
  INACTIVE: 'bg-gray-200 text-gray-600',
  MAINTENANCE: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const warehouseStatusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-600 border-gray-200',
  MAINTENANCE: 'bg-amber-100 text-amber-800 border-amber-200',
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

function getCapacityColor(pct: number): string {
  if (pct >= 90) return 'text-red-600';
  if (pct >= 70) return 'text-amber-600';
  return 'text-green-600';
}

function getCapacityBarColor(pct: number): string {
  if (pct >= 90) return '[&>div]:bg-red-500';
  if (pct >= 70) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-green-500';
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
            const isActive = 'href' in item ? false : activeTab === item.key;
            const navClassName = `
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-amber-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `;
            if ('href' in item && item.href) {
              return (
                <Link key={item.key} href={item.href as string} className={navClassName}>
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.key}
                onClick={() => {
                  onTabChange(item.key);
                  onClose();
                }}
                className={navClassName}
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

// ===================== ORDER STATUS BAR COLORS =====================
const orderStatusBarColors: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  PROCESSING: 'bg-purple-500',
  SHIPPED: 'bg-indigo-500',
  OUT_FOR_DELIVERY: 'bg-cyan-500',
  DELIVERED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
  REFUNDED: 'bg-orange-500',
};

// ===================== ANALYTICS SKELETON =====================
function AnalyticsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

// ===================== DASHBOARD TAB =====================
function DashboardTab() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: () => fetch('/api/admin/stats').then((r) => r.json()),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['admin-analytics-overview'],
    queryFn: () => fetch('/api/admin/analytics/overview').then((r) => r.json()),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery<{ orders: AdminOrder[] }>({
    queryKey: ['admin-orders-recent'],
    queryFn: () => fetch('/api/admin/orders?limit=10').then((r) => r.json()),
  });

  const statCards = stats
    ? [
        { icon: DollarSign, label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), change: analytics ? `${analytics.revenueChangePercent > 0 ? '+' : ''}${analytics.revenueChangePercent}%` : undefined, color: 'bg-amber-500' },
        { icon: ShoppingBag, label: 'Total Orders', value: stats.totalOrders.toString(), change: analytics ? `${analytics.ordersChangePercent > 0 ? '+' : ''}${analytics.ordersChangePercent}%` : undefined, color: 'bg-blue-500' },
        { icon: Package, label: 'Total Products', value: stats.totalProducts.toString(), color: 'bg-green-500' },
        { icon: Store, label: 'Total Sellers', value: stats.totalSellers.toString(), color: 'bg-purple-500' },
        { icon: Users, label: 'Total Customers', value: analytics?.totalCustomers?.toString() || stats.totalUsers.toString(), color: 'bg-cyan-500' },
        { icon: Truck, label: 'Active Deliveries', value: stats.activeDeliveries.toString(), color: 'bg-orange-500' },
      ]
    : [];

  // Revenue chart data: last 14 days
  const last14Days = analytics?.dailyRevenue?.slice(-14) || [];
  const maxRevenue = Math.max(...last14Days.map((d) => d.revenue), 1);

  // Order status distribution
  const statusDist = analytics?.orderStatusDistribution || [];
  const totalStatusCount = statusDist.reduce((sum, s) => sum + s.count, 0) || 1;

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

      {/* Month-over-Month Comparison Cards */}
      {analytics && !analyticsLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Revenue MoM */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500">Revenue — This Month vs Last Month</p>
              <BarChart3 className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(analytics.thisMonthRevenue)}</p>
                <p className="text-xs text-slate-500 mt-0.5">This month</p>
              </div>
              <div className="pb-0.5">
                <p className="text-sm text-slate-500">vs {formatCurrency(analytics.lastMonthRevenue)}</p>
                <p className="text-xs text-slate-400">Last month</p>
              </div>
              <div className={`ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold ${analytics.revenueChangePercent >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {analytics.revenueChangePercent >= 0 ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                {Math.abs(analytics.revenueChangePercent)}%
              </div>
            </div>
          </motion.div>

          {/* Orders MoM */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl border border-gray-200 p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500">Orders — This Month vs Last Month</p>
              <ShoppingBag className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{analytics.thisMonthOrders}</p>
                <p className="text-xs text-slate-500 mt-0.5">This month</p>
              </div>
              <div className="pb-0.5">
                <p className="text-sm text-slate-500">vs {analytics.lastMonthOrders}</p>
                <p className="text-xs text-slate-400">Last month</p>
              </div>
              <div className={`ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold ${analytics.ordersChangePercent >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {analytics.ordersChangePercent >= 0 ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                {Math.abs(analytics.ordersChangePercent)}%
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Revenue Chart + Top Products row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart (CSS only) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 md:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Revenue Trend</h2>
              <p className="text-sm text-slate-500">Daily revenue for the last 14 days</p>
            </div>
            {analytics && (
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">Avg Order Value</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(analytics.averageOrderValue)}</p>
              </div>
            )}
          </div>
          {analyticsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : last14Days.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <BarChart3 className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p>No revenue data available</p>
            </div>
          ) : (
            <div className="flex items-end gap-1.5 sm:gap-2 h-48">
              {last14Days.map((day, i) => {
                const heightPct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                const dateObj = new Date(day.date + 'T00:00:00');
                const label = dateObj.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
                const dayName = dateObj.toLocaleDateString('en-KE', { weekday: 'short' });
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative min-w-0">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                      <p className="font-semibold">{formatCurrency(day.revenue)}</p>
                      <p className="text-slate-400">{day.orders} orders</p>
                      <p className="text-slate-400">{dayName}, {label}</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
                    </div>
                    <div
                      className="w-full rounded-t-sm bg-amber-500 hover:bg-amber-600 transition-colors duration-150 cursor-default min-h-[2px]"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                    <span className="text-[10px] text-slate-400 truncate w-full text-center hidden sm:block">
                      {label.split(' ')[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Top Selling Products */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Top Selling Products</h2>
          <p className="text-sm text-slate-500 mb-4">By units sold</p>
          {analyticsLoading ? (
            <AnalyticsSkeleton />
          ) : !analytics?.topProducts?.length ? (
            <div className="py-8 text-center text-slate-500">
              <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {analytics.topProducts.map((product, idx) => (
                <div key={product.productId} className="flex items-center gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>
                    {idx + 1}
                  </span>
                  <div className="h-9 w-9 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.totalSold} sold · {formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Order Status Distribution */}
      {analytics && !analyticsLoading && statusDist.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-4 md:p-6"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Order Status Distribution</h2>
          <p className="text-sm text-slate-500 mb-5">Breakdown of all orders by status</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {statusDist.map((s) => {
              const pct = Math.round((s.count / totalStatusCount) * 1000) / 10;
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${orderStatusBarColors[s.status] || 'bg-gray-400'}`} />
                      <span className="text-sm font-medium text-slate-700">{s.status.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {s.count} <span className="text-xs text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${orderStatusBarColors[s.status] || 'bg-gray-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

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

// ===================== WAREHOUSES TAB =====================
function WarehousesTab({ onAddWarehouse }: { onAddWarehouse: () => void }) {
  const queryClient = useQueryClient();
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: stats, isLoading: statsLoading } = useQuery<WarehouseStats>({
    queryKey: ['warehouse-stats'],
    queryFn: () => fetch('/api/admin/warehouses/stats').then((r) => r.json()),
  });

  const { data, isLoading, refetch } = useQuery<{ warehouses: AdminWarehouse[] }>({
    queryKey: ['admin-warehouses', statusFilter],
    queryFn: () => fetch(`/api/admin/warehouses?status=${statusFilter}`).then((r) => r.json()),
  });

  const { data: warehouseDetail, isLoading: detailLoading } = useQuery<WarehouseDetail>({
    queryKey: ['warehouse-detail', expandedWarehouse],
    queryFn: () => fetch(`/api/admin/warehouses/${expandedWarehouse}`).then((r) => r.json()),
    enabled: !!expandedWarehouse,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/warehouses/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Warehouse deactivated');
      queryClient.invalidateQueries({ queryKey: ['admin-warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stats'] });
      refetch();
    },
    onError: () => toast.error('Failed to deactivate warehouse'),
  });

  const handleToggleExpand = (id: string) => {
    setExpandedWarehouse(expandedWarehouse === id ? null : id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard
              icon={Warehouse}
              label="Total Warehouses"
              value={stats.totalWarehouses.toString()}
              color="bg-slate-800"
            />
            <StatCard
              icon={Package}
              label="Items in Stock"
              value={stats.totalItemsInStock.toLocaleString()}
              color="bg-green-500"
            />
            <StatCard
              icon={AlertTriangle}
              label="Low Stock Alerts"
              value={stats.lowStockAlerts.toString()}
              color="bg-red-500"
            />
            <StatCard
              icon={DollarSign}
              label="Inventory Value"
              value={formatCurrency(stats.inventoryValue)}
              color="bg-amber-500"
            />
          </>
        ) : null}
      </div>

      {/* Header with filter and add button */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">All Warehouses</h2>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={onAddWarehouse}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Warehouse
          </Button>
        </div>
      </div>

      {/* Warehouse Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : !data?.warehouses?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-slate-500">
          <Warehouse className="h-10 w-10 mx-auto mb-2 text-slate-300" />
          <p>No warehouses found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.warehouses.map((warehouse) => {
            const isExpanded = expandedWarehouse === warehouse.id;
            return (
              <div key={warehouse.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Warehouse Card Header */}
                <button
                  onClick={() => handleToggleExpand(warehouse.id)}
                  className="w-full text-left p-4 md:p-6 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-slate-900 text-base">{warehouse.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${warehouseStatusColors[warehouse.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {warehouse.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{warehouse.code}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {warehouse.city}, {warehouse.county}
                        </span>
                        {warehouse.managerName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {warehouse.managerName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                      {/* Capacity Bar */}
                      <div className="flex-1 md:w-48">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">Capacity</span>
                          <span className={`text-xs font-medium ${getCapacityColor(warehouse.capacityPercentage)}`}>
                            {warehouse.capacityPercentage}%
                          </span>
                        </div>
                        <Progress value={Math.min(warehouse.capacityPercentage, 100)} className={`h-2 ${getCapacityBarColor(warehouse.capacityPercentage)}`} />
                        <p className="text-xs text-slate-400 mt-1">
                          {warehouse.totalItems.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
                        </p>
                      </div>

                      <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {/* Expanded: Inventory Items Table */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="border-t border-gray-100">
                        <div className="p-4 md:p-6">
                          {/* Warehouse Info Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div>
                              <p className="text-xs text-slate-500">Address</p>
                              <p className="text-sm font-medium text-slate-700 mt-0.5">{warehouse.address}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Manager</p>
                              <p className="text-sm font-medium text-slate-700 mt-0.5">{warehouse.managerName || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Phone</p>
                              <p className="text-sm font-medium text-slate-700 mt-0.5">{warehouse.managerPhone || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Low Stock Items</p>
                              <p className="text-sm font-medium text-slate-700 mt-0.5">{warehouse.lowStockCount}</p>
                            </div>
                          </div>

                          {/* Inventory Items */}
                          <h4 className="font-medium text-sm text-slate-900 mb-3">Inventory Items</h4>
                          {detailLoading ? (
                            <div className="space-y-2">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                              ))}
                            </div>
                          ) : !warehouseDetail?.inventoryItems?.length ? (
                            <p className="text-sm text-slate-500 py-4 text-center">No inventory items in this warehouse</p>
                          ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-100">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Reserved</TableHead>
                                    <TableHead>Bin Location</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {warehouseDetail.inventoryItems.map((item) => {
                                    const isLow = item.quantity <= item.reorderLevel;
                                    return (
                                      <TableRow key={item.id}>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                              <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                                            </div>
                                            <span className="text-sm font-medium max-w-[180px] truncate block">{item.product.name}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">{item.product.seller.storeName}</TableCell>
                                        <TableCell>
                                          <span className={`text-sm font-medium ${isLow ? 'text-red-600' : 'text-slate-700'}`}>
                                            {item.quantity}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">{item.reservedQuantity}</TableCell>
                                        <TableCell className="text-sm font-mono text-slate-600">{item.binLocation || '—'}</TableCell>
                                        <TableCell>
                                          {isLow ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                              <AlertTriangle className="h-3 w-3" />
                                              Low Stock
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                              In Stock
                                            </span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => deactivateMutation.mutate(warehouse.id)}
                              disabled={deactivateMutation.isPending || warehouse.status === 'INACTIVE'}
                            >
                              {deactivateMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                              Deactivate
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
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

// ===================== CREATE WAREHOUSE DIALOG =====================
function CreateWarehouseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    county: '',
    latitude: '',
    longitude: '',
    capacity: '1000',
    managerName: '',
    managerPhone: '',
    status: 'ACTIVE',
  });
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.address || !form.city || !form.county) {
      toast.error('Please fill all required fields (name, code, address, city, county)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Warehouse created successfully');
        queryClient.invalidateQueries({ queryKey: ['admin-warehouses'] });
        queryClient.invalidateQueries({ queryKey: ['warehouse-stats'] });
        onOpenChange(false);
        setForm({
          name: '', code: '', address: '', city: '', county: '',
          latitude: '', longitude: '', capacity: '1000',
          managerName: '', managerPhone: '', status: 'ACTIVE',
        });
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create warehouse');
      }
    } catch {
      toast.error('Failed to create warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Warehouse</DialogTitle>
          <DialogDescription>Set up a new warehouse location for inventory management</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Warehouse Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Warehouse D - Kisumu"
              />
            </div>
            <div className="space-y-2">
              <Label>Warehouse Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => updateField('code', e.target.value)}
                placeholder="e.g. WH-KSM-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address *</Label>
            <Input
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Full street address"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="e.g. Nairobi"
              />
            </div>
            <div className="space-y-2">
              <Label>County *</Label>
              <Input
                value={form.county}
                onChange={(e) => updateField('county', e.target.value)}
                placeholder="e.g. Nairobi"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => updateField('latitude', e.target.value)}
                placeholder="-1.2921"
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => updateField('longitude', e.target.value)}
                placeholder="36.8219"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Capacity (units)</Label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => updateField('capacity', e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label>Manager Name</Label>
              <Input
                value={form.managerName}
                onChange={(e) => updateField('managerName', e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Manager Phone</Label>
              <Input
                value={form.managerPhone}
                onChange={(e) => updateField('managerPhone', e.target.value)}
                placeholder="+2547..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => updateField('status', v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
            Create Warehouse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== BANNERS TAB =====================
interface AdminBanner {
  id: string;
  title: string;
  image: string;
  link: string | null;
  position: string;
  order: number;
  active: boolean;
  clicksCount: number;
  createdAt: string;
  updatedAt: string;
}

const bannerPositionColors: Record<string, string> = {
  HERO: 'bg-amber-100 text-amber-800',
  SIDEBAR: 'bg-purple-100 text-purple-800',
  FOOTER: 'bg-slate-100 text-slate-800',
  POPUP: 'bg-green-100 text-green-800',
};

function BannersTab({ onAddBanner, onEditBanner }: { onAddBanner: () => void; onEditBanner: (b: AdminBanner) => void }) {
  const queryClient = useQueryClient();
  const [positionFilter, setPositionFilter] = useState('ALL');

  const { data: banners, isLoading, refetch } = useQuery<AdminBanner[]>({
    queryKey: ['admin-banners', positionFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (positionFilter !== 'ALL') params.set('position', positionFilter);
      return fetch(`/api/admin/banners?${params}`).then((r) => r.json());
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      fetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Banner updated');
      refetch();
    },
    onError: () => toast.error('Failed to update banner'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/banners/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Banner deleted');
      refetch();
    },
    onError: () => toast.error('Failed to delete banner'),
  });

  const moveMutation = useMutation({
    mutationFn: (bannerOrders: { id: string; order: number }[]) =>
      fetch('/api/admin/banners/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerOrders }),
      }).then((r) => r.json()),
    onSuccess: () => {
      refetch();
    },
    onError: () => toast.error('Failed to reorder banners'),
  });

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!banners) return;
    const arr = [...banners];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= arr.length) return;
    const temp = arr[index].order;
    arr[index] = { ...arr[index], order: arr[newIndex].order };
    arr[newIndex] = { ...arr[newIndex], order: temp };
    moveMutation.mutate([
      { id: arr[index].id, order: arr[index].order },
      { id: arr[newIndex].id, order: arr[newIndex].order },
    ]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Banner Management</h2>
        <div className="flex gap-3">
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Positions</SelectItem>
              <SelectItem value="HERO">Hero</SelectItem>
              <SelectItem value="SIDEBAR">Sidebar</SelectItem>
              <SelectItem value="FOOTER">Footer</SelectItem>
              <SelectItem value="POPUP">Popup</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={onAddBanner}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </div>
      </div>

      {/* Banner Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <Skeleton className="h-36 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !banners?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-slate-500">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 text-slate-300" />
          <p>No banners found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner, idx) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${banner.active ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}
            >
              {/* Image */}
              <div className="relative h-36 bg-gray-100 overflow-hidden cursor-pointer" onClick={() => onEditBanner(banner)}>
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${bannerPositionColors[banner.position] || 'bg-gray-100 text-gray-800'}`}>
                    {banner.position}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white">
                    #{banner.order + 1}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm truncate flex-1">{banner.title}</h3>
                  <Switch
                    checked={banner.active}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: banner.id, active: checked })}
                    disabled={toggleMutation.isPending}
                  />
                </div>

                {banner.link && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{banner.link}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MousePointerClick className="h-3 w-3" />
                    <span>{banner.clicksCount} clicks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0 || moveMutation.isPending}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === banners.length - 1 || moveMutation.isPending}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditBanner(banner)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700"
                      onClick={() => deleteMutation.mutate(banner.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ===================== BANNER DIALOGS =====================
function BannerEditDialog({ banner, open, onOpenChange }: { banner: AdminBanner | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', image: '', link: '', position: 'HERO', order: 0, active: true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (banner) {
      setForm({
        title: banner.title,
        image: banner.image,
        link: banner.link || '',
        position: banner.position,
        order: banner.order,
        active: banner.active,
      });
    }
  }, [banner]);

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.image) {
      toast.error('Title and image are required');
      return;
    }
    if (!banner) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Banner updated');
        queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
        onOpenChange(false);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update banner');
      }
    } catch {
      toast.error('Failed to update banner');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Banner</DialogTitle>
          <DialogDescription>Update banner details</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Banner title" />
          </div>
          <div className="space-y-2">
            <Label>Image URL *</Label>
            <Input value={form.image} onChange={(e) => updateField('image', e.target.value)} placeholder="https://..." />
            {form.image && (
              <div className="h-24 rounded-lg bg-gray-100 overflow-hidden mt-1">
                <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Link</Label>
            <Input value={form.link} onChange={(e) => updateField('link', e.target.value)} placeholder="https://... (optional)" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={form.position} onValueChange={(v) => updateField('position', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HERO">Hero</SelectItem>
                  <SelectItem value="SIDEBAR">Sidebar</SelectItem>
                  <SelectItem value="FOOTER">Footer</SelectItem>
                  <SelectItem value="POPUP">Popup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={form.order} onChange={(e) => updateField('order', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.active} onCheckedChange={(v) => updateField('active', v)} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300">Cancel</Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BannerCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', image: '', link: '', position: 'HERO', order: 0, active: true });
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.image) {
      toast.error('Title and image are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Banner created');
        queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
        onOpenChange(false);
        setForm({ title: '', image: '', link: '', position: 'HERO', order: 0, active: true });
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create banner');
      }
    } catch {
      toast.error('Failed to create banner');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Banner</DialogTitle>
          <DialogDescription>Add a new marketing banner</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Banner title" />
          </div>
          <div className="space-y-2">
            <Label>Image URL *</Label>
            <Input value={form.image} onChange={(e) => updateField('image', e.target.value)} placeholder="https://..." />
            {form.image && (
              <div className="h-24 rounded-lg bg-gray-100 overflow-hidden mt-1">
                <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Link</Label>
            <Input value={form.link} onChange={(e) => updateField('link', e.target.value)} placeholder="https://... (optional)" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={form.position} onValueChange={(v) => updateField('position', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HERO">Hero</SelectItem>
                  <SelectItem value="SIDEBAR">Sidebar</SelectItem>
                  <SelectItem value="FOOTER">Footer</SelectItem>
                  <SelectItem value="POPUP">Popup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={form.order} onChange={(e) => updateField('order', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.active} onCheckedChange={(v) => updateField('active', v)} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-300">Cancel</Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Banner
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
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [bannerCreateOpen, setBannerCreateOpen] = useState(false);
  const [bannerEditOpen, setBannerEditOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdminBanner | null>(null);

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
            {activeTab === 'warehouses' && (
              <WarehousesTab key="warehouses" onAddWarehouse={() => setWarehouseDialogOpen(true)} />
            )}
            {activeTab === 'banners' && (
              <BannersTab
                key="banners"
                onAddBanner={() => setBannerCreateOpen(true)}
                onEditBanner={(b) => {
                  setEditingBanner(b);
                  setBannerEditOpen(true);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Product Dialog */}
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
      />

      {/* Warehouse Dialog */}
      <CreateWarehouseDialog
        open={warehouseDialogOpen}
        onOpenChange={setWarehouseDialogOpen}
      />

      {/* Banner Dialogs */}
      <BannerCreateDialog
        open={bannerCreateOpen}
        onOpenChange={setBannerCreateOpen}
      />
      <BannerEditDialog
        banner={editingBanner}
        open={bannerEditOpen}
        onOpenChange={setBannerEditOpen}
      />
    </div>
  );
}
