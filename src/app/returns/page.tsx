'use client';

import { Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  Eye,
  Loader2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';

// ─── Types ───────────────────────────────────────────────

interface ReturnItem {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  productName: string;
  productImage: string;
  buyerName: string;
  sellerName: string;
  reason: string;
  description: string | null;
  status: string;
  refundAmount: number;
  refundStatus: string;
  resolvedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BuyerOrderItem {
  id: string;
  quantity: number;
  price: number;
  productName: string;
  productImage: string;
  productSlug: string;
  sellerName: string;
  sellerUserId: string;
}

interface BuyerOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  orderItems: BuyerOrderItem[];
}

interface ReturnDetail extends ReturnItem {
  buyerEmail: string;
  buyerPhone: string | null;
  order: {
    orderNumber: string;
    totalAmount: number;
    status: string;
    shippingAddress: string;
  };
}

// ─── Constants ───────────────────────────────────────────

/* currency formatting handled by formatCurrency from @/lib/currency */

const RETURN_REASONS = [
  'Defective',
  'Wrong Item',
  'Not as Described',
  'Changed Mind',
  'Other',
];

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string; icon: React.ElementType }
> = {
  PENDING: { label: 'Pending', variant: 'outline', className: 'border-amber-400 text-amber-700 bg-amber-50', icon: Clock },
  APPROVED: { label: 'Approved', variant: 'default', className: 'bg-sky-100 text-sky-800 hover:bg-sky-100', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-100', icon: XCircle },
  PICKUP_SCHEDULED: { label: 'Pickup Scheduled', variant: 'outline', className: 'border-violet-400 text-violet-700 bg-violet-50', icon: Truck },
  PICKED_UP: { label: 'Picked Up', variant: 'outline', className: 'border-violet-400 text-violet-700 bg-violet-50', icon: Truck },
  INSPECTING: { label: 'Inspecting', variant: 'outline', className: 'border-orange-400 text-orange-700 bg-orange-50', icon: Eye },
  COMPLETED: { label: 'Completed', variant: 'default', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', variant: 'secondary', className: 'bg-gray-100 text-gray-600 hover:bg-gray-100', icon: XCircle },
};

const REFUND_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: { label: 'Pending', className: 'bg-gray-100 text-gray-600' },
  PROCESSING: { label: 'Processing', className: 'bg-sky-100 text-sky-700' },
  COMPLETED: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700' },
};

// ─── Sub-components ──────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className={`gap-1.5 text-xs font-medium ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function RefundStatusBadge({ status }: { status: string }) {
  const config = REFUND_STATUS_CONFIG[status] || REFUND_STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function ReturnDetailDialog({
  returnId,
  open,
  onOpenChange,
}: {
  returnId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const currencyCode = useCurrencyStore((s) => s.code);
  const { data: returnDetail, isLoading } = useQuery<ReturnDetail>({
    queryKey: ['return-detail', returnId],
    queryFn: async () => {
      const res = await fetch(`/api/returns/${returnId}`);
      if (!res.ok) throw new Error('Failed to fetch return details');
      return res.json();
    },
    enabled: !!returnId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0F172A]">Return Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4 p-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : returnDetail ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono font-semibold text-[#0F172A]">{returnDetail.returnNumber}</p>
                <p className="text-xs text-muted-foreground">Order: {returnDetail.orderNumber}</p>
              </div>
              <StatusBadge status={returnDetail.status} />
            </div>

            <Separator />

            {/* Product Info */}
            <div className="flex gap-4">
              <img
                src={returnDetail.productImage}
                alt={returnDetail.productName}
                className="h-20 w-20 rounded-lg object-cover border"
              />
              <div className="flex-1">
                <p className="font-semibold text-[#0F172A]">{returnDetail.productName}</p>
                <p className="text-sm text-muted-foreground">Seller: {returnDetail.sellerName}</p>
                <p className="text-lg font-bold text-amber-600 mt-1">{formatCurrency(returnDetail.refundAmount, currencyCode)}</p>
              </div>
            </div>

            <Separator />

            {/* Return Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Reason</p>
                <p className="font-medium text-[#0F172A]">{returnDetail.reason}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Refund Status</p>
                <RefundStatusBadge status={returnDetail.refundStatus} />
              </div>
              <div>
                <p className="text-muted-foreground">Requested On</p>
                <p className="font-medium text-[#0F172A]">{format(new Date(returnDetail.createdAt), 'dd MMM yyyy')}</p>
              </div>
              {returnDetail.resolvedAt && (
                <div>
                  <p className="text-muted-foreground">Resolved On</p>
                  <p className="font-medium text-[#0F172A]">{format(new Date(returnDetail.resolvedAt), 'dd MMM yyyy')}</p>
                </div>
              )}
            </div>

            {returnDetail.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-[#0F172A]">
                  {returnDetail.description}
                </div>
              </div>
            )}

            {returnDetail.adminNotes && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-800 flex items-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3" /> Admin Notes
                </p>
                <p className="text-sm text-amber-900">{returnDetail.adminNotes}</p>
              </div>
            )}

            {/* Order Info */}
            <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p>Shipping: {returnDetail.order?.shippingAddress}</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function NewReturnDialog({
  buyerId,
  open,
  onOpenChange,
}: {
  buyerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const currencyCode = useCurrencyStore((s) => s.code);
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const { data: orders = [], isLoading: ordersLoading } = useQuery<BuyerOrder[]>({
    queryKey: ['buyer-delivered-orders', buyerId],
    queryFn: async () => {
      const res = await fetch(`/api/buyer/${buyerId}/orders?status=DELIVERED`);
      const json = await res.json();
      return json.orders || [];
    },
    enabled: open,
  });

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const orderItems = selectedOrder?.orderItems || [];

  const createReturn = useMutation({
    mutationFn: async (data: {
      orderId: string;
      orderItemId: string;
      reason: string;
      description: string;
      buyerId: string;
      sellerId: string;
    }) => {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create return request');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns', buyerId] });
      toast.success('Return request submitted successfully!');
      setSelectedOrderId('');
      setSelectedItemId('');
      setReason('');
      setDescription('');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!selectedOrderId || !selectedItemId || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    const item = orderItems.find((i) => i.id === selectedItemId);
    if (!item || !item.sellerUserId) return;

    createReturn.mutate({
      orderId: selectedOrderId,
      orderItemId: selectedItemId,
      reason,
      description,
      buyerId,
      sellerId: item.sellerUserId,
    });
  };

  const canSubmit = selectedOrderId && selectedItemId && reason && !createReturn.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0F172A] flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-amber-500" />
            Request a Return
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Order Selection */}
          <div className="space-y-2">
            <Label>Select Order</Label>
            {ordersLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No delivered orders available for return.</p>
            ) : (
              <Select value={selectedOrderId} onValueChange={(val) => {
                setSelectedOrderId(val);
                setSelectedItemId('');
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an order" />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.orderNumber} — {formatCurrency(order.totalAmount, currencyCode)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Item Selection */}
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <Label>Select Item</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an item" />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {orderItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="h-6 w-6 rounded object-cover"
                        />
                        <span>{item.productName}</span>
                        <span className="text-muted-foreground ml-auto">{formatCurrency(item.price * item.quantity, currencyCode)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Return *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {RETURN_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="return-desc">Description (Optional)</Label>
            <Textarea
              id="return-desc"
              placeholder="Provide more details about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Refund Preview */}
          {selectedItemId && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm"
            >
              <p className="text-muted-foreground">Estimated Refund</p>
              <p className="text-lg font-bold text-amber-700">
                {formatCurrency(
                  (orderItems.find((i) => i.id === selectedItemId)?.price || 0) *
                  (orderItems.find((i) => i.id === selectedItemId)?.quantity || 1),
                  currencyCode
                )}
              </p>
            </motion.div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-[#0F172A] hover:bg-slate-800 text-white"
          >
            {createReturn.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Submit Return Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────

function ReturnsContent() {
  const currencyCode = useCurrencyStore((s) => s.code);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [detailReturnId, setDetailReturnId] = useState<string | null>(null);
  const [newReturnOpen, setNewReturnOpen] = useState(false);

  // Find the first buyer user for demo
  const { data: buyerUser } = useQuery<{ id: string }>({
    queryKey: ['first-buyer'],
    queryFn: async () => {
      // Use the returns API with a known buyer - we'll fetch all and pick the first buyerId
      const res = await fetch('/api/returns?limit=1');
      const json = await res.json();
      if (json.returns?.length > 0) {
        return { id: json.returns[0].buyerId };
      }
      // Fallback: fetch from orders
      const orderRes = await fetch('/api/orders');
      // If no orders either, create a fallback
      return { id: 'unknown' };
    },
  });

  const buyerId = buyerUser?.id || '';

  const { data, isLoading } = useQuery<{
    returns: ReturnItem[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ['returns', buyerId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ buyerId, limit: '50' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/returns?${params}`);
      if (!res.ok) throw new Error('Failed to fetch returns');
      return res.json();
    },
    enabled: !!buyerId,
  });

  const returns = data?.returns || [];
  const total = data?.total || 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-[#0F172A]" />
            </a>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#0F172A]">My Returns</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Manage your return and refund requests</p>
            </div>
          </div>
          <Dialog open={newReturnOpen} onOpenChange={setNewReturnOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Request a Return</span>
                <span className="sm:hidden">New</span>
              </Button>
            </DialogTrigger>
            {buyerId && buyerId !== 'unknown' && (
              <NewReturnDialog buyerId={buyerId} open={newReturnOpen} onOpenChange={setNewReturnOpen} />
            )}
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className={
                  statusFilter === s
                    ? 'bg-[#0F172A] hover:bg-slate-800 text-white'
                    : 'text-[#0F172A] hover:bg-slate-100'
                }
              >
                {s === 'ALL' ? `All (${total})` : s}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && returns.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <RotateCcw className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-1">No returns found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              {statusFilter !== 'ALL'
                ? `You don't have any ${statusFilter.toLowerCase()} returns.`
                : "You haven't made any return requests yet. If you've received a defective or wrong item, you can request a return."}
            </p>
            {statusFilter === 'ALL' && (
              <Button
                onClick={() => setNewReturnOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
              >
                <Plus className="h-4 w-4" />
                Request a Return
              </Button>
            )}
          </motion.div>
        )}

        {/* Returns List */}
        {!isLoading && returns.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {returns.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Product Image */}
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover border flex-shrink-0"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-mono font-semibold text-amber-600">
                                {item.returnNumber}
                              </p>
                              <h3 className="font-semibold text-[#0F172A] truncate">
                                {item.productName}
                              </h3>
                            </div>
                            <StatusBadge status={item.status} />
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>Order: {item.orderNumber}</span>
                            <span>Reason: {item.reason}</span>
                            <span>{format(new Date(item.createdAt), 'dd MMM yyyy')}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-[#0F172A]">
                                {formatCurrency(item.refundAmount, currencyCode)}
                              </span>
                              <RefundStatusBadge status={item.refundStatus} />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#0F172A] hover:bg-slate-100 gap-1.5"
                              onClick={() => setDetailReturnId(item.id)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Summary Footer */}
            <div className="text-center text-sm text-muted-foreground pt-4">
              Showing {returns.length} of {total} return{total !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </main>

      {/* Detail Dialog */}
      <ReturnDetailDialog
        returnId={detailReturnId}
        open={!!detailReturnId}
        onOpenChange={(open) => {
          if (!open) setDetailReturnId(null);
        }}
      />
    </div>
  );
}

export default function ReturnsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <ReturnsContent />
    </Suspense>
  );
}
