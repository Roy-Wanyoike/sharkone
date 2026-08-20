'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  LayoutDashboard,
  BarChart3,
  RotateCcw,
  Truck,
  Menu,
  X,
  Search,
  Eye,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  PackageX,
  Loader2,
  RefreshCw,
  Copy,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

type DeliveryStep = 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'NEAR_LOCATION' | 'DELIVERED';

const allSteps: DeliveryStep[] = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_LOCATION', 'DELIVERED'];

const stepLabels: Record<DeliveryStep, string> = {
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  NEAR_LOCATION: 'Near Location',
  DELIVERED: 'Delivered',
};

interface DeliveryListItem {
  id: string;
  orderId: string;
  status: string;
  pickupOtp: string | null;
  deliveryOtp: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    buyerName: string;
    shippingAddress: string;
    totalAmount: number;
  };
  deliveryPerson: { name: string } | null;
}

interface DeliveryDetail {
  id: string;
  orderId: string;
  status: string;
  pickupOtp: string | null;
  deliveryOtp: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    deliveryFee: number;
    shippingAddress: string;
    paymentStatus: string;
    buyer: { id: string; name: string; email: string; phone: string | null } | null;
    orderItems: {
      id: string;
      quantity: number;
      price: number;
      product: { name: string; image: string } | null;
    }[];
  };
  deliveryPerson: { id: string; name: string; email: string; phone: string | null; avatar: string | null } | null;
}

interface DeliveryStats {
  active: number;
  completedToday: number;
  pendingAssignment: number;
  failed: number;
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingAddress: string;
  buyer: { name: string } | null;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

// ===================== HELPERS =====================

const formatKES = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

const deliveryStatusColors: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-amber-100 text-amber-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  NEAR_LOCATION: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-700',
};

const deliveryStatusLabels: Record<string, string> = {
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  NEAR_LOCATION: 'Near Location',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
};

// ===================== NAV =====================

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { key: 'deliveries', label: 'Deliveries', icon: Truck, href: '/admin/deliveries' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { key: 'returns', label: 'Returns', icon: RotateCcw, href: '/returns' },
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

function Sidebar({ activeNav, isOpen, onClose }: { activeNav: string; isOpen: boolean; onClose: () => void }) {
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

// ===================== STATUS STEPPER =====================

function StatusStepper({ current }: { current: DeliveryStep }) {
  const currentIndex = allSteps.indexOf(current);

  return (
    <div className="flex items-center gap-0 w-full mt-4">
      {allSteps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === allSteps.length - 1;

        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                      ? 'bg-[#F59E0B] text-white ring-4 ring-amber-100'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[9px] mt-1 text-center leading-tight hidden sm:block ${isCurrent ? 'text-amber-700 font-semibold' : isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>
                {stepLabels[step]}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-12px] sm:mt-0 ${i < currentIndex ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ===================== MAIN COMPONENT =====================

export default function AdminDeliveriesPage() {
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog state
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [reassignDialogId, setReassignDialogId] = useState<string | null>(null);
  const [autoAssignDialogOpen, setAutoAssignDialogOpen] = useState(false);

  // Admin note & status override state
  const [adminNotes, setAdminNotes] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('');

  // Reassign state
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // ===================== QUERIES =====================

  const statsQuery = useQuery<DeliveryStats>({
    queryKey: ['admin-delivery-stats'],
    queryFn: () => fetch('/api/admin/deliveries/stats').then(r => r.json()),
  });

  const deliveriesQuery = useQuery<{ deliveries: DeliveryListItem[]; total: number; page: number; totalPages: number }>({
    queryKey: ['admin-deliveries', statusFilter, searchQuery, currentPage],
    queryFn: () => {
      const params = new URLSearchParams({ page: currentPage.toString() });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      return fetch(`/api/admin/deliveries?${params}`).then(r => r.json());
    },
  });

  const detailQuery = useQuery<{ delivery: DeliveryDetail }>({
    queryKey: ['admin-delivery-detail', selectedDeliveryId],
    queryFn: () => fetch(`/api/admin/deliveries/${selectedDeliveryId}`).then(r => r.json()),
    enabled: !!selectedDeliveryId,
  });

  const driversQuery = useQuery<{ users: Driver[] }>({
    queryKey: ['delivery-drivers'],
    queryFn: () => fetch('/api/admin/users?role=DELIVERY').then(r => r.json()),
  });

  const pendingOrdersQuery = useQuery<{ orders: PendingOrder[] }>({
    queryKey: ['pending-delivery-orders'],
    queryFn: () => fetch('/api/admin/deliveries/pending-orders').then(r => r.json()),
    enabled: autoAssignDialogOpen,
  });

  // ===================== MUTATIONS =====================

  const assignMutation = useMutation({
    mutationFn: (orderId: string) =>
      fetch('/api/delivery/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      }).then(r => {
        if (!r.ok) return r.json().then((e: { error: string }) => { throw new Error(e.error || 'Assignment failed'); });
        return r.json();
      }),
    onSuccess: () => {
      toast.success('Delivery assigned successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-delivery-orders'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status?: string; notes?: string }) =>
      fetch(`/api/admin/deliveries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      }).then(r => {
        if (!r.ok) return r.json().then((e: { error: string }) => { throw new Error(e.error || 'Update failed'); });
        return r.json();
      }),
    onSuccess: () => {
      toast.success('Delivery updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-delivery-detail', selectedDeliveryId] });
      setAdminNotes('');
      setOverrideStatus('');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reassignMutation = useMutation({
    mutationFn: ({ deliveryId, deliveryPersonId }: { deliveryId: string; deliveryPersonId: string }) =>
      fetch(`/api/admin/deliveries/${deliveryId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryPersonId }),
      }).then(r => {
        if (!r.ok) return r.json().then((e: { error: string }) => { throw new Error(e.error || 'Reassign failed'); });
        return r.json();
      }),
    onSuccess: () => {
      toast.success('Delivery reassigned successfully!');
      setReassignDialogId(null);
      setSelectedDriverId('');
      queryClient.invalidateQueries({ queryKey: ['admin-deliveries'] });
      if (selectedDeliveryId) {
        queryClient.invalidateQueries({ queryKey: ['admin-delivery-detail', selectedDeliveryId] });
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // ===================== HANDLERS =====================

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp).then(() => {
      toast.success('OTP copied to clipboard');
    }).catch(() => {
      toast.info(`OTP: ${otp}`);
    });
  };

  const handleOpenDetail = (id: string) => {
    setSelectedDeliveryId(id);
    setAdminNotes('');
    setOverrideStatus('');
  };

  const handleSaveNotes = () => {
    if (!selectedDeliveryId) return;
    updateStatusMutation.mutate({ id: selectedDeliveryId, notes: adminNotes });
  };

  const handleOverrideStatus = () => {
    if (!selectedDeliveryId || !overrideStatus) return;
    updateStatusMutation.mutate({ id: selectedDeliveryId, status: overrideStatus });
  };

  const handleReassign = () => {
    if (!reassignDialogId || !selectedDriverId) return;
    reassignMutation.mutate({ deliveryId: reassignDialogId, deliveryPersonId: selectedDriverId });
  };

  // ===================== COMPUTED =====================

  const deliveries = deliveriesQuery.data?.deliveries || [];
  const totalPages = deliveriesQuery.data?.totalPages || 1;
  const total = deliveriesQuery.data?.total || 0;
  const deliveryDetail = detailQuery.data?.delivery || null;
  const pendingOrders = pendingOrdersQuery.data?.orders || [];

  const statCards = [
    { label: 'Active Deliveries', value: statsQuery.data?.active?.toString() ?? '—', icon: Truck, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Completed Today', value: statsQuery.data?.completedToday?.toString() ?? '—', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Pending Assignment', value: statsQuery.data?.pendingAssignment?.toString() ?? '—', icon: Clock, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Failed', value: statsQuery.data?.failed?.toString() ?? '—', icon: PackageX, color: 'bg-red-500/10 text-red-600' },
  ];

  // ===================== RENDER =====================

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeNav="deliveries" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
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
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">Delivery Management</h1>
                <p className="text-sm text-slate-500 hidden sm:block">Monitor and manage all deliveries</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['admin-deliveries'] });
                  queryClient.invalidateQueries({ queryKey: ['admin-delivery-stats'] });
                }}
              >
                <RefreshCw className={`h-4 w-4 ${deliveriesQuery.isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold"
                onClick={() => setAutoAssignDialogOpen(true)}
              >
                <Zap className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Auto-Assign Pending</span>
                <span className="sm:hidden">Assign</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6 flex-1">
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 p-4 md:p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-lg ${stat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order number..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="PICKED_UP">Picked Up</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="NEAR_LOCATION">Near Location</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deliveries Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {deliveriesQuery.isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : deliveries.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No deliveries found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="max-h-[480px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="text-xs uppercase tracking-wider">Order #</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Customer</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Driver</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-right">Amount</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Pickup OTP</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Delivery OTP</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                      {deliveries.map((d) => (
                        <TableRow key={d.id} className="hover:bg-gray-50 transition">
                          <TableCell className="font-medium text-slate-900 text-sm">{d.order.orderNumber}</TableCell>
                          <TableCell className="text-sm text-slate-600">{d.order.buyerName}</TableCell>
                          <TableCell className="text-sm text-slate-600">{d.deliveryPerson?.name || <span className="text-gray-400">Unassigned</span>}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-[10px] font-semibold ${deliveryStatusColors[d.status] || 'bg-gray-100 text-gray-700'}`}>
                              {deliveryStatusLabels[d.status] || d.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-slate-900">{formatKES(d.order.totalAmount)}</TableCell>
                          <TableCell>
                            {d.pickupOtp ? (
                              <button
                                onClick={() => handleCopyOtp(d.pickupOtp!)}
                                className="flex items-center gap-1 text-sm font-mono font-semibold text-slate-700 hover:text-amber-600 transition"
                                aria-label="Copy pickup OTP"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {d.pickupOtp}
                                <Copy className="h-3 w-3 text-gray-400" />
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {d.deliveryOtp ? (
                              <button
                                onClick={() => handleCopyOtp(d.deliveryOtp!)}
                                className="flex items-center gap-1 text-sm font-mono font-semibold text-slate-700 hover:text-amber-600 transition"
                                aria-label="Copy delivery OTP"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {d.deliveryOtp}
                                <Copy className="h-3 w-3 text-gray-400" />
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {format(new Date(d.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 hover:text-amber-600"
                                onClick={() => handleOpenDetail(d.id)}
                                aria-label="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {d.status !== 'DELIVERED' && d.status !== 'FAILED' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-600 hover:text-blue-600"
                                  onClick={() => {
                                    setReassignDialogId(d.id);
                                    setSelectedDriverId('');
                                  }}
                                  aria-label="Reassign driver"
                                >
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-slate-500">
                  Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, total)} of {total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="px-1 text-slate-400">...</span>
                        )}
                        <Button
                          variant={currentPage === p ? 'default' : 'outline'}
                          size="sm"
                          className={currentPage === p ? 'bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A]' : ''}
                          onClick={() => setCurrentPage(p)}
                        >
                          {p}
                        </Button>
                      </React.Fragment>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===================== DELIVERY DETAIL DIALOG ===================== */}
      <Dialog open={!!selectedDeliveryId} onOpenChange={(open) => { if (!open) setSelectedDeliveryId(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailQuery.isLoading ? (
            <div className="py-8 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : deliveryDetail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-amber-500" />
                  Delivery Details
                </DialogTitle>
                <DialogDescription>
                  {deliveryDetail.order.orderNumber} — {deliveryStatusLabels[deliveryDetail.status] || deliveryDetail.status}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Status Stepper */}
                {deliveryDetail.status !== 'FAILED' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Delivery Progress</p>
                    <StatusStepper current={deliveryDetail.status as DeliveryStep} />
                  </div>
                )}

                {/* OTP Display */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">Pickup OTP</p>
                    <p className="text-2xl font-mono font-bold text-amber-800 tracking-widest">{deliveryDetail.pickupOtp || '—'}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-1">Delivery OTP</p>
                    <p className="text-2xl font-mono font-bold text-emerald-800 tracking-widest">{deliveryDetail.deliveryOtp || '—'}</p>
                  </div>
                </div>

                {/* Order Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Order Information</p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                    <div>
                      <span className="text-slate-500">Order:</span>
                      <span className="ml-2 font-medium text-slate-900">{deliveryDetail.order.orderNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Amount:</span>
                      <span className="ml-2 font-medium text-slate-900">{formatKES(deliveryDetail.order.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Delivery Fee:</span>
                      <span className="ml-2 font-medium text-slate-900">{formatKES(deliveryDetail.order.deliveryFee)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Payment:</span>
                      <Badge variant="secondary" className="ml-2 text-[10px] font-semibold bg-emerald-100 text-emerald-700">{deliveryDetail.order.paymentStatus}</Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Shipping Address:</span>
                      <span className="ml-2 text-slate-700">{deliveryDetail.order.shippingAddress}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  {deliveryDetail.order.orderItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Items</p>
                      <div className="space-y-2">
                        {deliveryDetail.order.orderItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 text-sm">
                            {item.product?.image && (
                              <img src={item.product.image} alt={item.product?.name} className="h-8 w-8 rounded object-cover" />
                            )}
                            <span className="text-slate-700 flex-1 truncate">{item.product?.name || 'Unknown Product'}</span>
                            <span className="text-slate-500">x{item.quantity}</span>
                            <span className="font-medium text-slate-900">{formatKES(item.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Driver Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Driver Information</p>
                  {deliveryDetail.deliveryPerson ? (
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                      <div>
                        <span className="text-slate-500">Name:</span>
                        <span className="ml-2 font-medium text-slate-900">{deliveryDetail.deliveryPerson.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Email:</span>
                        <span className="ml-2 text-slate-700">{deliveryDetail.deliveryPerson.email}</span>
                      </div>
                      {deliveryDetail.deliveryPerson.phone && (
                        <div>
                          <span className="text-slate-500">Phone:</span>
                          <span className="ml-2 text-slate-700">{deliveryDetail.deliveryPerson.phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No driver assigned</p>
                  )}
                </div>

                {/* Buyer Info */}
                {deliveryDetail.order.buyer && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Customer Information</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                      <div>
                        <span className="text-slate-500">Name:</span>
                        <span className="ml-2 font-medium text-slate-900">{deliveryDetail.order.buyer.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Email:</span>
                        <span className="ml-2 text-slate-700">{deliveryDetail.order.buyer.email}</span>
                      </div>
                      {deliveryDetail.order.buyer.phone && (
                        <div>
                          <span className="text-slate-500">Phone:</span>
                          <span className="ml-2 text-slate-700">{deliveryDetail.order.buyer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Admin Notes</p>
                  <Textarea
                    placeholder="Add internal notes about this delivery..."
                    value={adminNotes || deliveryDetail.notes || ''}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveNotes}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Save Notes
                  </Button>
                </div>

                {/* Status Override */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Admin Status Override</p>
                  <div className="flex gap-2">
                    <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASSIGNED">Assigned</SelectItem>
                        <SelectItem value="PICKED_UP">Picked Up</SelectItem>
                        <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                        <SelectItem value="NEAR_LOCATION">Near Location</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={handleOverrideStatus}
                      disabled={!overrideStatus || updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Override
                    </Button>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-gray-100">
                  <p>Created: {format(new Date(deliveryDetail.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  {deliveryDetail.deliveredAt && <p>Delivered: {format(new Date(deliveryDetail.deliveredAt), 'MMM dd, yyyy HH:mm')}</p>}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ===================== REASSIGN DIALOG ===================== */}
      <Dialog open={!!reassignDialogId} onOpenChange={(open) => { if (!open) setReassignDialogId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-amber-500" />
              Reassign Delivery
            </DialogTitle>
            <DialogDescription>
              Select a new driver to handle this delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver..." />
              </SelectTrigger>
              <SelectContent>
                {driversQuery.data?.users?.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} {driver.phone ? `(${driver.phone})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold"
              onClick={handleReassign}
              disabled={!selectedDriverId || reassignMutation.isPending}
            >
              {reassignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reassign Delivery
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== AUTO-ASSIGN DIALOG ===================== */}
      <Dialog open={autoAssignDialogOpen} onOpenChange={setAutoAssignDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Auto-Assign Pending Orders
            </DialogTitle>
            <DialogDescription>
              Orders that are ready for delivery (PROCESSING or SHIPPED) without an assigned delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {pendingOrdersQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No orders pending delivery assignment</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500 truncate">{order.buyer?.name} — {order.shippingAddress}</p>
                      <p className="text-sm font-medium text-amber-600 mt-1">{formatKES(order.totalAmount)}</p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold"
                      disabled={assignMutation.isPending}
                      onClick={() => assignMutation.mutate(order.id)}
                    >
                      {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
