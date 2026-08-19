'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                         */
/* ------------------------------------------------------------------ */

const stats = [
  { label: 'Total Revenue', value: '$12,450.00', change: '+12.5%', icon: <DollarSign className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
  { label: 'Total Orders', value: '156', change: '+8.2%', icon: <ShoppingBag className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-700' },
  { label: 'Products Listed', value: '42', change: '+3', icon: <Package className="h-5 w-5" />, color: 'bg-gray-100 text-gray-700' },
  { label: 'Rating', value: '4.8', change: '+0.1', icon: <Star className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
];

const recentOrders = [
  { id: 'ORD-2401', customer: 'Alice Johnson', amount: '$124.99', status: 'Delivered', date: '2026-01-15' },
  { id: 'ORD-2402', customer: 'Bob Smith', amount: '$89.50', status: 'Shipped', date: '2026-01-15' },
  { id: 'ORD-2403', customer: 'Carol Williams', amount: '$56.00', status: 'Processing', date: '2026-01-14' },
  { id: 'ORD-2404', customer: 'David Brown', amount: '$210.00', status: 'Pending', date: '2026-01-14' },
  { id: 'ORD-2405', customer: 'Eva Martinez', amount: '$45.99', status: 'Delivered', date: '2026-01-13' },
];

const sellerProducts = [
  { id: '1', name: 'Wireless Bluetooth Headphones', price: 79.99, stock: 145, status: 'Active', image: 'https://picsum.photos/seed/prod1/200/200' },
  { id: '2', name: 'USB-C Fast Charger 65W', price: 34.99, stock: 230, status: 'Active', image: 'https://picsum.photos/seed/prod2/200/200' },
  { id: '3', name: 'Ergonomic Mouse Pad XL', price: 24.99, stock: 0, status: 'Draft', image: 'https://picsum.photos/seed/prod3/200/200' },
  { id: '4', name: 'Mechanical Keyboard RGB', price: 129.99, stock: 67, status: 'Active', image: 'https://picsum.photos/seed/prod4/200/200' },
  { id: '5', name: 'Webcam 1080p HD', price: 59.99, stock: 89, status: 'Active', image: 'https://picsum.photos/seed/prod5/200/200' },
  { id: '6', name: 'Phone Stand Adjustable', price: 19.99, stock: 0, status: 'Draft', image: 'https://picsum.photos/seed/prod6/200/200' },
];

const allOrders = [
  { id: 'ORD-2401', items: 3, total: '$124.99', status: 'Delivered', date: '2026-01-15' },
  { id: 'ORD-2402', items: 1, total: '$89.50', status: 'Shipped', date: '2026-01-15' },
  { id: 'ORD-2403', items: 2, total: '$56.00', status: 'Processing', date: '2026-01-14' },
  { id: 'ORD-2404', items: 4, total: '$210.00', status: 'Pending', date: '2026-01-14' },
  { id: 'ORD-2405', items: 1, total: '$45.99', status: 'Delivered', date: '2026-01-13' },
  { id: 'ORD-2398', items: 2, total: '$67.50', status: 'Delivered', date: '2026-01-12' },
  { id: 'ORD-2395', items: 1, total: '$129.99', status: 'Delivered', date: '2026-01-11' },
  { id: 'ORD-2390', items: 5, total: '$245.00', status: 'Cancelled', date: '2026-01-10' },
];

const walletData = {
  balance: 3420.50,
  totalEarnings: 12450.00,
  pendingClearance: 890.25,
  totalWithdrawn: 8139.25,
};

const transactions = [
  { id: '1', date: '2026-01-15', description: 'Order ORD-2401 Payment', type: 'Earning', amount: '+$112.49', status: 'Completed' },
  { id: '2', date: '2026-01-15', description: 'Order ORD-2402 Payment', type: 'Earning', amount: '+$80.55', status: 'Completed' },
  { id: '3', date: '2026-01-14', description: 'Withdrawal to Bank', type: 'Withdrawal', amount: '-$2,000.00', status: 'Completed' },
  { id: '4', date: '2026-01-13', description: 'Order ORD-2405 Payment', type: 'Earning', amount: '+$41.39', status: 'Pending' },
  { id: '5', date: '2026-01-12', description: 'Refund for ORD-2390', type: 'Refund', amount: '-$220.50', status: 'Completed' },
  { id: '6', date: '2026-01-11', description: 'Order ORD-2395 Payment', type: 'Earning', amount: '+$116.99', status: 'Completed' },
  { id: '7', date: '2026-01-10', description: 'Withdrawal to Bank', type: 'Withdrawal', amount: '-$1,500.00', status: 'Completed' },
];

const categories = ['Headphones', 'Laptops', 'Cameras', 'Smartwatches', 'Accessories', 'Gaming'];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function statusBadgeColor(status: string) {
  switch (status) {
    case 'Delivered': return 'bg-emerald-100 text-emerald-700';
    case 'Shipped': return 'bg-sky-100 text-sky-700';
    case 'Processing': return 'bg-amber-100 text-amber-700';
    case 'Pending': return 'bg-gray-100 text-gray-700';
    case 'Cancelled': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function txnTypeColor(type: string) {
  switch (type) {
    case 'Earning': return 'text-emerald-600';
    case 'Withdrawal': return 'text-orange-600';
    case 'Refund': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function SellerDashboard() {
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category: '', stock: '' });

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error('Please fill in product name and price');
      return;
    }
    toast.success(`"${newProduct.name}" has been added as a draft`);
    setAddProductOpen(false);
    setNewProduct({ name: '', price: '', description: '', category: '', stock: '' });
  };

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Orders Table */}
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
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-3 text-gray-600">{order.customer}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{order.amount}</td>
                      <td className="px-6 py-3">
                        <Badge variant="secondary" className={`text-[10px] font-semibold ${statusBadgeColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
                      <Label htmlFor="prod-price">Price ($)</Label>
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
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                  <Button onClick={handleAddProduct} className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold mt-2">
                    Create Product
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellerProducts.map((product) => (
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
                    <Badge variant="secondary" className={`text-[10px] font-semibold shrink-0 ${product.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
                    <span className={`text-xs ${product.stock > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ---- Orders Tab ---- */}
        <TabsContent value="orders">
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
                  {allOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-3 font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-3 text-gray-600">{order.items} item{order.items > 1 ? 's' : ''}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{order.total}</td>
                      <td className="px-6 py-3">
                        <Badge variant="secondary" className={`text-[10px] font-semibold ${statusBadgeColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ---- Wallet Tab ---- */}
        <TabsContent value="wallet">
          {/* Wallet Stats */}
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
              <p className="text-2xl font-bold">${walletData.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
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
              <p className="text-2xl font-bold text-gray-900">${walletData.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
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
              <p className="text-2xl font-bold text-gray-900">${walletData.pendingClearance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
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
              <p className="text-2xl font-bold text-gray-900">${walletData.totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </motion.div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-lg">Transaction History</h2>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 rounded-lg"
              onClick={() => toast.success('Withdrawal request submitted!')}
            >
              Withdraw Funds
            </Button>
          </div>

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
                      <td className="px-6 py-3 text-gray-500">{txn.date}</td>
                      <td className="px-6 py-3 text-gray-900 font-medium">{txn.description}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-semibold ${txnTypeColor(txn.type)}`}>{txn.type}</span>
                      </td>
                      <td className={`px-6 py-3 font-semibold ${txnTypeColor(txn.type)}`}>{txn.amount}</td>
                      <td className="px-6 py-3">
                        <span className="flex items-center gap-1 text-xs">
                          {txn.status === 'Completed' ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600">Completed</span></>
                          ) : txn.status === 'Failed' ? (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
