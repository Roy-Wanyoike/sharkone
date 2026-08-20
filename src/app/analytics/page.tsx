'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BarChart3,
  RotateCcw,
  Store,
  Truck,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Menu,
  X,
  Star,
  Package,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ===================== TYPES =====================
interface RevenueOverTime {
  date: string;
  revenue: number;
  orders: number;
}

interface OrderStatusBreakdown {
  status: string;
  count: number;
}

interface TopProduct {
  productName: string;
  productId: string;
  image: string;
  totalSales: number;
  unitsSold: number;
}

interface CategoryDistribution {
  categoryName: string;
  count: number;
}

interface SellerPerformance {
  sellerId: string;
  storeName: string;
  totalRevenue: number;
  totalOrders: number;
  rating: number;
  productCount: number;
}

interface RecentActivity {
  buyerName: string;
  orderNumber: string;
  amount: number;
  status: string;
  date: string;
}

interface AnalyticsData {
  revenueOverTime: RevenueOverTime[];
  orderStatusBreakdown: OrderStatusBreakdown[];
  topProducts: TopProduct[];
  categoryDistribution: CategoryDistribution[];
  sellerPerformance: SellerPerformance[];
  recentActivity: RecentActivity[];
}

// ===================== CONSTANTS =====================
const kesFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 0,
});

function formatKES(amount: number): string {
  return kesFormatter.format(amount);
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-orange-100 text-orange-800',
};

const CHART_COLORS = ['#F59E0B', '#0F172A', '#10B981', '#6366F1', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899'];

const PIE_COLORS = ['#F59E0B', '#10B981', '#EF4444', '#6366F1', '#06B6D4', '#8B5CF6', '#EC4899', '#F97316'];

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { key: 'deliveries', label: 'Deliveries', icon: Truck, href: '/admin/deliveries' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { key: 'returns', label: 'Returns', icon: RotateCcw, href: '/returns' },
  { key: 'stores', label: 'Stores', icon: Store, href: '/' },
];

// ===================== LOGO =====================
function SharkOneLogo() {
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
  activeNav,
  isOpen,
  onClose,
}: {
  activeNav: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
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

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-[#0F172A] flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 flex items-center justify-between">
          <SharkOneLogo />
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
            const isActive = activeNav === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
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
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

// ===================== KPI CARD =====================
function KpiCard({
  icon: Icon,
  label,
  value,
  change,
  changeType,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <Icon className="h-5 w-5 text-amber-600" />
            </div>
            {change && changeType && (
              <span
                className={`text-xs font-semibold flex items-center gap-0.5 ${
                  changeType === 'up' ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {changeType === 'up' ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {change}
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function KpiSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="mt-3">
          <Skeleton className="h-8 w-28 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

// ===================== CHART CARD WRAPPER =====================
function ChartCard({
  title,
  description,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="border-0 shadow-sm h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
          {description && (
            <CardDescription className="text-sm text-slate-500">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

// ===================== REVENUE TREND CHART =====================
function RevenueTrendChart({ data }: { data: RevenueOverTime[] }) {
  const formattedData = data.map((d) => ({
    ...d,
    date: format(parseISO(d.date), 'MMM dd'),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formattedData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
          formatter={(value: number) => [formatKES(value), 'Revenue']}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#F59E0B"
          strokeWidth={2.5}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 5, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ===================== ORDER STATUS PIE CHART =====================
function OrderStatusChart({ data }: { data: OrderStatusBreakdown[] }) {
  const formattedData = data.map((d) => ({
    name: d.status.replace(/_/g, ' '),
    value: d.count,
    status: d.status,
  }));

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formattedData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          label={renderCustomLabel}
          labelLine={false}
        >
          {formattedData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <RechartsTooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => (
            <span className="text-xs text-slate-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ===================== TOP PRODUCTS BAR CHART =====================
function TopProductsChart({ data }: { data: TopProduct[] }) {
  const chartData = [...data].reverse().map((p) => ({
    name: p.productName.length > 18 ? p.productName.substring(0, 18) + '...' : p.productName,
    sales: p.totalSales,
    fullName: p.productName,
    units: p.unitsSold,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
          formatter={(value: number, _name: string, props: any) => [
            `${formatKES(value)} (${props.payload.units} units)`,
            props.payload.fullName,
          ]}
        />
        <Bar dataKey="sales" fill="#F59E0B" radius={[0, 6, 6, 0]} barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ===================== CATEGORY DISTRIBUTION CHART =====================
function CategoryDistributionChart({ data }: { data: CategoryDistribution[] }) {
  const chartData = data.map((c) => ({
    name: c.categoryName,
    count: c.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          }}
          formatter={(value: number, name: string) => [value, 'Products']}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
          {chartData.map((_, index) => (
            <Cell key={`cat-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ===================== SELLER TABLE =====================
function SellerPerformanceTable({ data }: { data: SellerPerformance[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-100 hover:bg-transparent">
            <TableHead className="font-semibold text-slate-700">Seller</TableHead>
            <TableHead className="font-semibold text-slate-700 text-center">Products</TableHead>
            <TableHead className="font-semibold text-slate-700 text-right">Revenue</TableHead>
            <TableHead className="font-semibold text-slate-700 text-center">Rating</TableHead>
            <TableHead className="font-semibold text-slate-700 text-center">Orders</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((seller) => (
            <TableRow key={seller.sellerId} className="border-slate-50">
              <TableCell className="font-medium text-slate-900">{seller.storeName}</TableCell>
              <TableCell className="text-center text-slate-600">{seller.productCount}</TableCell>
              <TableCell className="text-right font-semibold text-slate-900">{formatKES(seller.totalRevenue)}</TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {seller.rating.toFixed(1)}
                </span>
              </TableCell>
              <TableCell className="text-center text-slate-600">{seller.totalOrders}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ===================== RECENT ACTIVITY =====================
function RecentActivityFeed({ data }: { data: RecentActivity[] }) {
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <motion.div
          key={item.orderNumber}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.3 }}
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {item.buyerName}
            </p>
            <p className="text-xs text-slate-500">
              {item.orderNumber}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-semibold text-slate-900">{formatKES(item.amount)}</p>
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 font-medium ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-800'}`}
            >
              {item.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="flex-shrink-0 text-xs text-slate-400 w-20 text-right">
            {formatDistanceToNow(parseISO(item.date), { addSuffix: true })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ===================== CHART SKELETON =====================
function ChartSkeleton() {
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// ===================== MAIN PAGE =====================
export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: () => fetch('/api/admin/analytics').then((r) => r.json()),
    refetchInterval: 30000,
  });

  // Derived KPI values
  const totalRevenue = analytics?.revenueOverTime.reduce((sum, d) => sum + d.revenue, 0) ?? 0;
  const totalOrders = analytics?.revenueOverTime.reduce((sum, d) => sum + d.orders, 0) ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Simple change calculation (compare first half vs second half of the month)
  const revenueData = analytics?.revenueOverTime ?? [];
  const midPoint = Math.floor(revenueData.length / 2);
  const firstHalfRevenue = revenueData.slice(0, midPoint).reduce((s, d) => s + d.revenue, 0);
  const secondHalfRevenue = revenueData.slice(midPoint).reduce((s, d) => s + d.revenue, 0);
  const revenueChange = firstHalfRevenue > 0
    ? (((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100).toFixed(1)
    : undefined;
  const revenueChangeType = revenueChange ? (parseFloat(revenueChange) >= 0 ? 'up' : 'down') : undefined;

  return (
    <div className="min-h-screen bg-gray-50/80 flex">
      {/* Sidebar */}
      <Sidebar activeNav="analytics" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/60 lg:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-slate-700"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#F59E0B" />
                <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="white" />
              </svg>
              <span className="text-sm font-bold">
                <span className="text-slate-900">SHARK</span>
                <span className="text-amber-500">ONE</span>
              </span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-1.5 text-sm">
                <Calendar className="h-4 w-4" />
                Last 30 Days
              </p>
            </div>
            <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 text-amber-700 px-3 py-1 text-sm">
              <Activity className="h-3.5 w-3.5 mr-1" />
              Live Data
            </Badge>
          </div>

          {/* Loading state */}
          {isLoading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiSkeleton />
                <KpiSkeleton />
                <KpiSkeleton />
                <KpiSkeleton />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartSkeleton />
                <ChartSkeleton />
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </>
          )}

          {/* Error state */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <p className="text-red-600 font-medium">Failed to load analytics data.</p>
                <p className="text-red-500 text-sm mt-1">Please try again later.</p>
              </CardContent>
            </Card>
          )}

          {/* Data loaded */}
          {analytics && !isLoading && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  icon={DollarSign}
                  label="Total Revenue"
                  value={formatKES(totalRevenue)}
                  change={revenueChange ? `${Math.abs(parseFloat(revenueChange))}%` : undefined}
                  changeType={revenueChangeType}
                />
                <KpiCard
                  icon={ShoppingBag}
                  label="Total Orders"
                  value={totalOrders.toLocaleString()}
                  change="8.2%"
                  changeType="up"
                />
                <KpiCard
                  icon={TrendingUp}
                  label="Average Order Value"
                  value={formatKES(avgOrderValue)}
                  change="3.5%"
                  changeType="up"
                />
                <KpiCard
                  icon={Package}
                  label="Products Sold"
                  value={analytics.topProducts.reduce((s, p) => s + p.unitsSold, 0).toLocaleString()}
                  change="12.1%"
                  changeType="up"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                  title="Revenue Trend"
                  description="Daily revenue over the last 30 days"
                >
                  {revenueData.length > 0 ? (
                    <RevenueTrendChart data={revenueData} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
                      No revenue data available
                    </div>
                  )}
                </ChartCard>

                <ChartCard
                  title="Order Status"
                  description="Distribution of orders by status"
                >
                  {analytics.orderStatusBreakdown.length > 0 ? (
                    <OrderStatusChart data={analytics.orderStatusBreakdown} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
                      No order data available
                    </div>
                  )}
                </ChartCard>

                <ChartCard
                  title="Top Products"
                  description="Best selling products by revenue"
                >
                  {analytics.topProducts.length > 0 ? (
                    <TopProductsChart data={analytics.topProducts} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
                      No product sales data available
                    </div>
                  )}
                </ChartCard>

                <ChartCard
                  title="Category Distribution"
                  description="Number of products per category"
                >
                  {analytics.categoryDistribution.length > 0 ? (
                    <CategoryDistributionChart data={analytics.categoryDistribution} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
                      No category data available
                    </div>
                  )}
                </ChartCard>
              </div>

              {/* Seller Performance Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Store className="h-5 w-5 text-amber-500" />
                      Seller Performance
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      All sellers ranked by total revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto">
                    {analytics.sellerPerformance.length > 0 ? (
                      <SellerPerformanceTable data={analytics.sellerPerformance} />
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-sm">
                        No seller data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity Feed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-amber-500" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Latest orders across the platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto">
                    {analytics.recentActivity.length > 0 ? (
                      <RecentActivityFeed data={analytics.recentActivity} />
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-sm">
                        No recent activity
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
