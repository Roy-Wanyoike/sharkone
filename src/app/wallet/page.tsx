'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  History,
  Landmark,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';
import { Footer } from '@/components/ecommerce/Footer';
import { toast } from 'sonner';

// ============================================================
// Types
// ============================================================

interface WalletData {
  id: string;
  balance: number;
  isActive: boolean;
  transactions: WalletTx[];
}

interface WalletTx {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  referenceId: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

const TYPE_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  TOP_UP: { label: 'Top Up', variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  PURCHASE: { label: 'Purchase', variant: 'default', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  REFUND: { label: 'Refund', variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  CASHBACK: { label: 'Cashback', variant: 'default', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  TRANSFER_IN: { label: 'Transfer In', variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  TRANSFER_OUT: { label: 'Transfer Out', variant: 'default', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
};

function getTypeBadge(type: string) {
  return TYPE_BADGE[type] || { label: type, variant: 'outline' as const, className: '' };
}

// ============================================================
// Simple Navbar
// ============================================================

function SimpleNavbar() {
  return (
    <nav className="bg-[#0F172A] text-white px-6 md:px-16 lg:px-32 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-black tracking-tight">
        SHARK<span className="text-[#F59E0B]">ONE</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/account">
          <Button variant="ghost" className="text-gray-300 hover:text-white">
            ← Account
          </Button>
        </Link>
      </div>
    </nav>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function WalletPage() {
  const queryClient = useQueryClient();
  const currencyCode = useCurrencyStore((s) => s.code);

  // Dialog state
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<string>('MPESA');

  // Pagination
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const limit = 10;

  // Fetch wallet
  const walletQuery = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await fetch('/api/wallet');
      if (!res.ok) throw new Error('Failed to load wallet');
      const data = await res.json();
      return data.wallet as WalletData;
    },
  });

  // Fetch paginated transactions
  const txQuery = useQuery({
    queryKey: ['wallet-tx', page, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      const res = await fetch(`/api/wallet/transactions?${params}`);
      if (!res.ok) throw new Error('Failed to load transactions');
      return res.json() as Promise<{ transactions: WalletTx[]; total: number; page: number; limit: number }>;
    },
  });

  // Top-up mutation
  const topUpMutation = useMutation({
    mutationFn: async (topUpData: { amount: number; method: string }) => {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topUpData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Top-up failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Top-up successful!');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-tx'] });
      setTopUpOpen(false);
      setAmount('');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Top-up failed');
    },
  });

  const handleTopUp = () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    topUpMutation.mutate({ amount: numAmount, method });
  };

  const totalPages = txQuery.data ? Math.ceil(txQuery.data.total / limit) : 1;
  const wallet = walletQuery.data;
  const transactions = txQuery.data?.transactions || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SimpleNavbar />

      <main className="flex-1 px-6 md:px-16 lg:px-32 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">HoneyCoin Wallet</h1>
            <p className="text-gray-500 mt-1">Manage your balance and transactions</p>
          </div>

          {/* Balance Card */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0F172A] p-8 text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59E0B]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F59E0B]/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Wallet className="h-4 w-4" />
                Available Balance
              </div>
              {walletQuery.isLoading ? (
                <Skeleton className="h-12 w-48 bg-white/10" />
              ) : (
                <p className="text-4xl md:text-5xl font-black tracking-tight">
                  {formatCurrency(wallet?.balance ?? 0, currencyCode)}
                </p>
              )}
              <div className="mt-6">
                <Button
                  onClick={() => setTopUpOpen(true)}
                  className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-bold rounded-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Top Up
                </Button>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[#0F172A]" />
                <h2 className="text-lg font-bold text-[#0F172A]">Transaction History</h2>
              </div>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="TOP_UP">Top Up</SelectItem>
                  <SelectItem value="PURCHASE">Purchase</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                  <SelectItem value="CASHBACK">Cashback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {txQuery.isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center">
                <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No transactions yet</p>
                <p className="text-gray-400 text-xs mt-1">Top up your wallet to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3 text-right">Balance After</th>
                      <th className="px-6 py-3 hidden md:table-cell">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((tx) => {
                      const isIn = tx.type === 'TOP_UP' || tx.type === 'REFUND' || tx.type === 'CASHBACK' || tx.type === 'TRANSFER_IN';
                      const badge = getTypeBadge(tx.type);
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={badge.variant} className={badge.className}>
                              {isIn ? <ArrowDownLeft className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
                              {badge.label}
                            </Badge>
                          </td>
                          <td className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${isIn ? 'text-green-600' : 'text-red-600'}`}>
                            {isIn ? '+' : '-'}{formatCurrency(tx.amount, currencyCode)}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600 whitespace-nowrap">
                            {formatCurrency(tx.balanceAfter, currencyCode)}
                          </td>
                          <td className="px-6 py-4 text-gray-500 hidden md:table-cell max-w-[200px] truncate">
                            {tx.description || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {txQuery.data && txQuery.data.total > limit && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, txQuery.data.total)} of {txQuery.data.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Top-Up Dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0F172A]">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B] flex items-center justify-center">
                <Plus className="h-4 w-4 text-[#0F172A]" />
              </div>
              Top Up Wallet
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Preset amounts */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Amount</p>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === String(preset) ? 'default' : 'outline'}
                    className={amount === String(preset)
                      ? 'bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-bold'
                      : 'border-gray-200 hover:border-[#F59E0B] hover:text-[#F59E0B]'
                    }
                    onClick={() => setAmount(String(preset))}
                  >
                    {formatCurrency(preset, currencyCode)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Custom Amount</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">KSh</span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-12"
                  min={1}
                  max={1000000}
                />
              </div>
            </div>

            {/* Payment method */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setMethod('MPESA')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    method === 'MPESA'
                      ? 'border-[#F59E0B] bg-amber-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`
                }
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    method === 'MPESA' ? 'bg-[#F59E0B] text-[#0F172A]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-[#0F172A]">M-Pesa</p>
                    <p className="text-xs text-gray-500">Pay via mobile money</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('MANUAL')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                    method === 'MANUAL'
                      ? 'border-[#F59E0B] bg-amber-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    method === 'MANUAL' ? 'bg-[#F59E0B] text-[#0F172A]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-[#0F172A]">Manual Bank Transfer</p>
                    <p className="text-xs text-gray-500">Transfer to our bank account</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTopUpOpen(false)} className="border-gray-200">
              Cancel
            </Button>
            <Button
              onClick={handleTopUp}
              disabled={topUpMutation.isPending || !amount || Number(amount) <= 0}
              className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-bold"
            >
              {topUpMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm Top Up
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
