'use client';

import { useState, useMemo, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  MapPin,
  Repeat,
  Star,
  Phone,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '@/components/ecommerce/Footer';
import { useCartStore } from '@/store/cart-store';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';

const queryClient = new QueryClient();

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu',
  'Kiambu', 'Machakos', 'Kakamega', 'Meru', 'Embu',
  'Nyeri', "Murang'a", 'Kisii', 'Nyamira', 'Bungoma',
  'Trans Nzoia', 'Nandi', 'Baringo', 'Laikipia', 'Narok',
  'Kajiado', 'Makueni', 'Kitui', 'Tharaka Nithi',
  'Homa Bay', 'Migori', 'Siaya', 'Busia', 'Vihiga',
  'West Pokot', 'Samburu', 'Turkana', 'Marsabit', 'Isiolo',
  'Garissa', 'Wajir', 'Mandera', 'Lamu', 'Tana River',
  'Taita Taveta', 'Kilifi', 'Kwale', 'Other',
];

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
  productId: string;
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

interface Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  county: string;
  city: string | null;
  addressLine: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddressFormData {
  label: string;
  fullName: string;
  phone: string;
  county: string;
  city: string;
  addressLine: string;
  isDefault: boolean;
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

const LABEL_COLORS: Record<string, string> = {
  Home: 'bg-emerald-100 text-emerald-700',
  Office: 'bg-blue-100 text-blue-700',
  Other: 'bg-gray-100 text-gray-700',
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

const emptyAddressForm: AddressFormData = {
  label: 'Home',
  fullName: '',
  phone: '',
  county: '',
  city: '',
  addressLine: '',
  isDefault: false,
};

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

function AccountPageContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const queryClientQC = useQueryClient();
  const currencyCode = useCurrencyStore((s) => s.code);

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

  // Addresses
  const addressesQuery = useQuery<{ addresses: Address[] }>({
    queryKey: ['addresses', buyerId],
    queryFn: () => fetch(`/api/addresses?userId=${buyerId}`).then((r) => r.json()),
    enabled: !!buyerId,
  });

  // Address mutations
  const createAddressMutation = useMutation({
    mutationFn: (data: AddressFormData) =>
      fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId: buyerId }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClientQC.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address added successfully!');
      setAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm(emptyAddressForm);
    },
    onError: () => toast.error('Failed to add address'),
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressFormData> }) =>
      fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClientQC.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address updated successfully!');
      setAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm(emptyAddressForm);
    },
    onError: () => toast.error('Failed to update address'),
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/addresses/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClientQC.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted successfully!');
    },
    onError: () => toast.error('Failed to delete address'),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClientQC.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Default address updated!');
    },
    onError: () => toast.error('Failed to set default address'),
  });

  // Address dialog state
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>(emptyAddressForm);

  const openNewAddressDialog = () => {
    setEditingAddress(null);
    setAddressForm({ ...emptyAddressForm, fullName: buyer?.name || '', phone: buyer?.phone || '' });
    setAddressDialogOpen(true);
  };

  const openEditAddressDialog = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      county: addr.county,
      city: addr.city || '',
      addressLine: addr.addressLine,
      isDefault: addr.isDefault,
    });
    setAddressDialogOpen(true);
  };

  const handleAddressSubmit = () => {
    if (!addressForm.fullName || !addressForm.phone || !addressForm.county || !addressForm.addressLine) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm });
    } else {
      createAddressMutation.mutate(addressForm);
    }
  };

  // Wishlist from cart store
  const { wishlist, toggleWishlist, addItem, openCart } = useCartStore();

  const orders = ordersQuery.data?.orders || [];
  const transactions = transactionsQuery.data?.transactions || [];
  const addresses = addressesQuery.data?.addresses || [];
  const stats = statsQuery.data;

  // Reorder handler
  const handleReorder = async (order: BuyerOrder) => {
    try {
      // Fetch the order details to get product IDs
      const orderRes = await fetch(`/api/orders/${order.id}`);
      const orderData = await orderRes.json();
      const orderItems = orderData.order?.orderItems || [];

      for (const item of orderItems) {
        // Fetch the full product
        const productRes = await fetch(`/api/products/${item.productId}`);
        const productData = await productRes.json();
        if (productData.product) {
          // Add the product to cart, with the original quantity
          const product = productData.product;
          for (let i = 0; i < item.quantity; i++) {
            addItem(product);
          }
        }
      }

      toast.success('Items added to cart');
      openCart();
    } catch {
      toast.error('Failed to reorder items');
    }
  };

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
    { label: 'Total Spent', value: stats ? formatCurrency(stats.totalSpent, currencyCode) : '—', icon: <DollarSign className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-700' },
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
              <TabsTrigger value="addresses" className="rounded-lg gap-2 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white text-gray-600 px-4 py-2 text-sm">
                <MapPin className="h-4 w-4" />
                Addresses
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
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-3 font-medium text-gray-900">{order.orderNumber}</td>
                            <td className="px-6 py-3 text-gray-600">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</td>
                            <td className="px-6 py-3 font-semibold text-gray-900">{formatCurrency(order.totalAmount, currencyCode)}</td>
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
                              <div className="flex items-center gap-1">
                                <Link href={`/track`}>
                                  <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1">
                                    <Eye className="h-4 w-4" />
                                    View
                                  </Button>
                                </Link>
                                {order.status === 'DELIVERED' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                                    onClick={() => handleReorder(order)}
                                  >
                                    <Repeat className="h-4 w-4" />
                                    Reorder
                                  </Button>
                                )}
                              </div>
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
                              {tx.type === 'REFUND' ? '+' : '-'}{formatCurrency(tx.amount, currencyCode)}
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

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Saved Addresses</h3>
                    <p className="text-sm text-gray-500">Manage your delivery addresses</p>
                  </div>
                  <Button
                    onClick={openNewAddressDialog}
                    className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Address
                  </Button>
                </div>

                {addressesQuery.isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
                        <Skeleton className="h-5 w-20 mb-4" />
                        <Skeleton className="h-4 w-40 mb-2" />
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No saved addresses yet</p>
                    <Button
                      onClick={openNewAddressDialog}
                      className="mt-4 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`bg-white border rounded-xl p-5 transition-all hover:shadow-sm ${
                          addr.isDefault ? 'border-[#F59E0B] ring-1 ring-amber-200' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-semibold ${LABEL_COLORS[addr.label] || 'bg-gray-100 text-gray-700'}`}
                            >
                              {addr.label === 'Other' ? 'Other' : addr.label}
                            </Badge>
                            {addr.isDefault && (
                              <Badge className="bg-[#F59E0B] text-[#0F172A] text-[10px] font-semibold gap-1">
                                <Star className="h-3 w-3" />
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            {addr.fullName}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {addr.phone}
                          </div>
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <span>
                              {addr.addressLine}
                              {addr.city && `, ${addr.city}`}
                              {`, ${addr.county}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs gap-1"
                            onClick={() => openEditAddressDialog(addr)}
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          {!addr.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs gap-1"
                              onClick={() => setDefaultMutation.mutate(addr.id)}
                            >
                              <Star className="h-3 w-3" />
                              Set Default
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs gap-1"
                            onClick={() => deleteAddressMutation.mutate(addr.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label>Label</Label>
              <Select value={addressForm.label} onValueChange={(v) => setAddressForm((f) => ({ ...f, label: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select label" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="John Doe"
                value={addressForm.fullName}
                onChange={(e) => setAddressForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Phone *</Label>
              <Input
                placeholder="+254 712 345 678"
                value={addressForm.phone}
                onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>County *</Label>
              <Select value={addressForm.county} onValueChange={(v) => setAddressForm((f) => ({ ...f, county: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {KENYAN_COUNTIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>City</Label>
              <Input
                placeholder="e.g. Kilimani"
                value={addressForm.city}
                onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Address Line *</Label>
              <Input
                placeholder="Street address, estate, building"
                value={addressForm.addressLine}
                onChange={(e) => setAddressForm((f) => ({ ...f, addressLine: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is-default"
                checked={addressForm.isDefault}
                onCheckedChange={(checked) => setAddressForm((f) => ({ ...f, isDefault: !!checked }))}
              />
              <Label htmlFor="is-default" className="text-sm font-normal cursor-pointer">
                Set as default address
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button
              onClick={handleAddressSubmit}
              disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
              className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg"
            >
              {createAddressMutation.isPending || updateAddressMutation.isPending
                ? 'Saving...'
                : editingAddress
                  ? 'Update Address'
                  : 'Add Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
  const currencyCode = useCurrencyStore((s) => s.code);
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
        <p className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(productData.price, currencyCode)}</p>
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
