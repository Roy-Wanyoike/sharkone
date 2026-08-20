'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';

interface CouponInputProps {
  onApply: (discount: number, code: string, isFreeShipping: boolean) => void;
  onRemove: () => void;
  orderTotal: number;
  appliedCode: string | null;
}

export function CouponInput({
  onApply,
  onRemove,
  orderTotal,
  appliedCode,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currencyCode = useCurrencyStore(s => s.code);

  const handleApply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, orderTotal }),
      });

      const data = await res.json();

      if (data.valid) {
        if (data.isFreeShipping) {
          setSuccess('Free shipping applied!');
          onApply(0, trimmed, true);
        } else {
          setSuccess(`${trimmed} applied — you save ${formatCurrency(data.discount, currencyCode)}`);
          onApply(data.discount, trimmed, false);
        }
        setCode('');
      } else {
        setError(data.error || 'Invalid coupon');
      }
    } catch {
      setError('Could not validate coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setError('');
    setSuccess('');
    onRemove();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleApply();
  };

  return (
    <div className="space-y-3">
      <AnimatePresence mode="wait">
        {appliedCode ? (
          <motion.div
            key="badge"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">{appliedCode}</p>
                {success && (
                  <p className="text-xs text-[#F59E0B] font-medium">{success}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (error) setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter coupon code"
                  className="pl-9 h-11 text-sm border-gray-200 focus:border-[#F59E0B] focus:ring-[#F59E0B]/20"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleApply}
                disabled={loading || !code.trim()}
                className="h-11 px-5 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-sm shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Apply'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 text-xs text-red-500"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
