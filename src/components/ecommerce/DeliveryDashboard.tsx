'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Truck,
  CheckCircle2,
  Package,
  DollarSign,
  Star,
  Copy,
  ShieldCheck,
  AlertCircle,
  PackageX,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyStore } from '@/store/currency-store';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type DeliveryStep = 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'NEAR_LOCATION' | 'DELIVERED';

const allSteps: DeliveryStep[] = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_LOCATION', 'DELIVERED'];

const stepLabels: Record<DeliveryStep, string> = {
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  NEAR_LOCATION: 'Near Location',
  DELIVERED: 'Delivered',
};

const NEXT_STEP: Partial<Record<DeliveryStep, DeliveryStep>> = {
  ASSIGNED: 'PICKED_UP',
  PICKED_UP: 'IN_TRANSIT',
  IN_TRANSIT: 'NEAR_LOCATION',
  NEAR_LOCATION: 'DELIVERED',
};

interface DeliveryDashboardProps {
  deliveryPersonId?: string;
}

interface DeliveryStats {
  activeDeliveries: number;
  completedToday: number;
  completedTotal: number;
  totalEarnings: number;
  rating: number;
}

interface OrderItemData {
  id: string;
  quantity: number;
  price: number;
  productName: string;
  productImage: string;
}

interface DeliveryItem {
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
    totalAmount: number;
    deliveryFee: number;
    shippingAddress: string;
    paymentStatus: string;
    buyer: {
      name: string;
      phone: string | null;
      email: string;
    } | null;
    orderItems: OrderItemData[];
  };
}

/* currency formatting handled by formatCurrency from @/lib/currency */

/* ------------------------------------------------------------------ */
/*  Status Stepper                                                    */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Skeletons                                                         */
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

function DeliveryCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="space-y-2 mb-3">
        <Skeleton className="h-10 w-full rounded" />
        <Skeleton className="h-10 w-full rounded" />
      </div>
      <Skeleton className="h-10 w-full rounded mb-4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-10 w-full rounded-lg mt-4" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function DeliveryDashboard({ deliveryPersonId: propDeliveryPersonId }: DeliveryDashboardProps) {
  const queryClient = useQueryClient();
  const currencyCode = useCurrencyStore((s) => s.code);
  const [confirmDialog, setConfirmDialog] = useState<DeliveryItem | null>(null);
  const [otpInput, setOtpInput] = useState('');

  // Auto-detect delivery person if not provided
  const autoDeliveryQuery = useQuery<{ users: { id: string }[] }>({
    queryKey: ['delivery-auto-detect'],
    queryFn: () => fetch('/api/admin/users?role=DELIVERY').then(r => r.json()),
    enabled: !propDeliveryPersonId,
  });

  const deliveryPersonId = propDeliveryPersonId || autoDeliveryQuery.data?.users?.[0]?.id || '';

  // Fetch stats
  const statsQuery = useQuery<DeliveryStats>({
    queryKey: ['delivery-stats', deliveryPersonId],
    queryFn: () =>
      fetch(`/api/delivery/${deliveryPersonId}/stats`).then((r) => r.json()),
    enabled: !!deliveryPersonId,
  });

  // Fetch all deliveries
  const deliveriesQuery = useQuery<{ deliveries: DeliveryItem[] }>({
    queryKey: ['deliveries', deliveryPersonId],
    queryFn: () =>
      fetch(`/api/delivery/${deliveryPersonId}/deliveries`).then((r) => r.json()),
    enabled: !!deliveryPersonId,
  });

  const deliveries = deliveriesQuery.data?.deliveries || [];
  const activeDeliveries = deliveries.filter(
    (d) => d.status !== 'DELIVERED' && d.status !== 'FAILED'
  );
  const completedDeliveries = deliveries.filter(
    (d) => d.status === 'DELIVERED' || d.status === 'FAILED'
  );

  // Confirm delivery mutation
  const confirmMutation = useMutation({
    mutationFn: ({ deliveryId, otp }: { deliveryId: string; otp: string }) =>
      fetch(`/api/delivery/${deliveryId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed'); });
        return r.json();
      }),
    onSuccess: () => {
      toast.success(`Delivery confirmed!`);
      setConfirmDialog(null);
      setOtpInput('');
      queryClient.invalidateQueries({ queryKey: ['delivery-stats', deliveryPersonId] });
      queryClient.invalidateQueries({ queryKey: ['deliveries', deliveryPersonId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ deliveryId, status }: { deliveryId: string; status: string }) =>
      fetch(`/api/delivery/${deliveryId}/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Failed'); });
        return r.json();
      }),
    onSuccess: () => {
      toast.success('Status updated!');
      queryClient.invalidateQueries({ queryKey: ['delivery-stats', deliveryPersonId] });
      queryClient.invalidateQueries({ queryKey: ['deliveries', deliveryPersonId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleConfirmDelivery = () => {
    if (!confirmDialog) return;
    confirmMutation.mutate({ deliveryId: confirmDialog.id, otp: otpInput });
  };

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp).then(() => {
      toast.success('OTP copied to clipboard');
    }).catch(() => {
      toast.info(`OTP: ${otp}`);
    });
  };

  const stats = statsQuery.data;
  const deliveryStats = [
    { label: 'Active Deliveries', value: stats?.activeDeliveries?.toString() ?? '—', icon: <Truck className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
    { label: 'Completed Today', value: stats?.completedToday?.toString() ?? '—', icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total Earnings', value: stats ? formatCurrency(stats.totalEarnings, currencyCode) : '—', icon: <DollarSign className="h-5 w-5" />, color: 'bg-gray-100 text-gray-700' },
    { label: 'Rating', value: stats?.rating?.toFixed(1) ?? '—', icon: <Star className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="px-4 md:px-16 lg:px-32 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your deliveries and track earnings</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : deliveryStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className={`p-2 rounded-lg w-fit ${stat.color} mb-3`}>{stat.icon}</div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
      </div>

      {/* Active Deliveries */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Active Deliveries</h2>
        {deliveriesQuery.isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <DeliveryCardSkeleton key={i} />
            ))}
          </div>
        ) : activeDeliveries.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <PackageX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No active deliveries right now</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeDeliveries.map((delivery) => {
              const nextStep = NEXT_STEP[delivery.status as DeliveryStep];
              return (
                <motion.div
                  key={delivery.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-900">{delivery.order.orderNumber}</span>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] font-semibold">
                      Active
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 font-medium">{delivery.order.buyer?.name ?? 'Unknown'}</p>

                  {/* Addresses */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Pickup</p>
                        <p className="text-xs text-gray-600 truncate">Seller Warehouse</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Delivery</p>
                        <p className="text-xs text-gray-600 truncate">{delivery.order.shippingAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* OTP */}
                  {delivery.deliveryOtp && (
                    <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-amber-600" />
                        <span className="text-xs text-gray-500">Delivery OTP:</span>
                        <span className="text-sm font-bold text-gray-900 font-mono tracking-widest">{delivery.deliveryOtp}</span>
                      </div>
                      <button
                        onClick={() => handleCopyOtp(delivery.deliveryOtp!)}
                        className="p-1 hover:bg-gray-200 rounded transition"
                        aria-label="Copy OTP"
                      >
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    </div>
                  )}

                  {/* Status Stepper */}
                  <StatusStepper current={delivery.status as DeliveryStep} />

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    {nextStep && (
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-200 hover:bg-gray-50 font-medium rounded-lg"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            deliveryId: delivery.id,
                            status: nextStep,
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending && (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        )}
                        Advance
                      </Button>
                    )}
                    <Button
                      className="flex-1 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg"
                      onClick={() => {
                        setConfirmDialog(delivery);
                        setOtpInput('');
                      }}
                    >
                      Confirm Delivery
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delivery History */}
      <div>
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Delivery History</h2>
        {deliveriesQuery.isLoading ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ) : completedDeliveries.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No delivery history yet</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Order #</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Earnings</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {completedDeliveries.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 font-medium text-gray-900">{item.order.orderNumber}</td>
                      <td className="px-6 py-3 text-gray-600">{item.order.buyer?.name ?? 'Unknown'}</td>
                      <td className="px-6 py-3">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold ${
                            item.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.status === 'DELIVERED' ? 'Delivered' : 'Failed'}
                        </Badge>
                      </td>
                      <td className={`px-6 py-3 font-semibold ${item.status === 'FAILED' ? 'text-gray-400' : 'text-emerald-600'}`}>
                        {item.status === 'FAILED' ? formatCurrency(0, currencyCode) : formatCurrency(item.order.deliveryFee, currencyCode)}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {item.deliveredAt ? format(new Date(item.deliveredAt), 'MMM dd, yyyy') : format(new Date(item.createdAt), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Delivery Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              Confirm Delivery
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Enter the delivery OTP to confirm delivery for{' '}
              <span className="font-semibold text-gray-900">{confirmDialog?.order.orderNumber}</span>
            </p>
            <p className="text-sm text-gray-500">
              Customer: <span className="font-medium text-gray-700">{confirmDialog?.order.buyer?.name}</span>
            </p>
            <div className="grid gap-2">
              <label htmlFor="otp-input" className="text-sm font-medium text-gray-700">OTP Code</label>
              <Input
                id="otp-input"
                placeholder="Enter 4-digit OTP"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="text-center text-lg font-mono tracking-widest"
                maxLength={4}
              />
            </div>
            <Button
              className="w-full bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg"
              onClick={handleConfirmDelivery}
              disabled={otpInput.length !== 4 || confirmMutation.isPending}
            >
              {confirmMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verify & Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
