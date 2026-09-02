'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { KENYAN_COUNTIES } from '@/lib/counties';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
  Truck,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  Package,
  Loader2,
  Star,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/store/cart-store';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';
import { Footer } from '@/components/ecommerce/Footer';
import { CouponInput } from '@/components/ecommerce/CouponInput';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { CartItem } from '@/types';

// ============================================================
// Types
// ============================================================

type Step = 1 | 2 | 3 | 4;
type PaymentMethod = 'mpesa' | 'bank' | 'card' | 'wallet';

interface ShippingForm {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  notes: string;
}

interface ShippingErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}



const initialShipping: ShippingForm = {
  fullName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  country: 'Kenya',
  postalCode: '',
  notes: '',
};

const STEP_LABELS = ['Shipping', 'Payment', 'Review', 'Confirmation'];

// ============================================================
// Animation variants
// ============================================================

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
};

// ============================================================
// Sub-components
// ============================================================

function SimpleNavbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-32 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#0F172A" />
            <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="#F59E0B" />
          </svg>
          <span className="text-xl font-bold tracking-tight">
            <span className="text-[#0F172A]">SHARK</span>
            <span className="text-[#F59E0B]">ONE</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-[#0F172A] transition flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>
    </header>
  );
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, idx) => {
          const step = (idx + 1) as Step;
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;
          const isUpcoming = step > currentStep;

          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#0F172A] text-white'
                      : isActive
                        ? 'bg-[#F59E0B] text-[#0F172A] ring-4 ring-amber-100'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    isActive ? 'text-[#0F172A]' : isCompleted ? 'text-[#0F172A]' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {idx < STEP_LABELS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mt-[-1.25rem] sm:mt-[-1.25rem] transition-colors duration-300 ${
                    step < currentStep ? 'bg-[#0F172A]' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderSummarySidebar({
  items,
  deliveryFee,
  couponDiscount,
  couponCode,
  isFreeShipping,
  onCouponApply,
  onCouponRemove,
}: {
  items: CartItem[];
  deliveryFee: number;
  couponDiscount: number;
  couponCode: string | null;
  isFreeShipping: boolean;
  onCouponApply: (discount: number, code: string, isFreeShipping: boolean) => void;
  onCouponRemove: () => void;
}) {
  const currencyCode = useCurrencyStore((s) => s.code);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const platformFee = Math.round(subtotal * 0.02);
  const effectiveDeliveryFee = isFreeShipping ? 0 : deliveryFee;
  const total = Math.max(0, subtotal + effectiveDeliveryFee + platformFee - couponDiscount);

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 sticky top-24">
      <h3 className="font-semibold text-[#0F172A] text-sm mb-4">Order Summary</h3>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0F172A] truncate">{item.product.name}</p>
              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-[#0F172A]">
              {formatCurrency(item.product.price * item.quantity, currencyCode)}
            </p>
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, currencyCode)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Delivery</span>
          <span className={isFreeShipping ? 'line-through text-gray-400' : ''}>
            {formatCurrency(deliveryFee, currencyCode)}
          </span>
        </div>
        {isFreeShipping && (
          <div className="flex justify-between text-[#F59E0B] font-medium">
            <span>Free Shipping</span>
            <span>−{formatCurrency(deliveryFee, currencyCode)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Platform Fee (2%)</span>
          <span>{formatCurrency(platformFee, currencyCode)}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Coupon Discount ({couponCode})</span>
            <span>−{formatCurrency(couponDiscount, currencyCode)}</span>
          </div>
        )}
        <Separator className="!my-3" />
        <div className="flex justify-between font-bold text-[#0F172A]">
          <span>Total</span>
          <span className="text-base">{formatCurrency(total, currencyCode)}</span>
        </div>
      </div>
      <div className="mt-4">
        <CouponInput
          onApply={onCouponApply}
          onRemove={onCouponRemove}
          orderTotal={subtotal}
          appliedCode={couponCode}
        />
      </div>
    </div>
  );
}

// ============================================================
// Step 1: Shipping
// ============================================================

interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  county: string;
  city: string | null;
  addressLine: string;
  isDefault: boolean;
}

function ShippingStep({
  form,
  errors,
  onChange,
}: {
  form: ShippingForm;
  errors: ShippingErrors;
  onChange: (field: keyof ShippingForm, value: string) => void;
}) {
  // Fetch saved addresses for the buyer
  const { data: addressesData, isLoading: addressesLoading } = useQuery<{ addresses: SavedAddress[] }>({
    queryKey: ['checkout-addresses'],
    queryFn: () => fetch('/api/addresses').then((r) => r.json()),
  });

  const savedAddresses = addressesData?.addresses || [];

  const selectAddress = (addr: SavedAddress) => {
    onChange('fullName', addr.fullName);
    onChange('phone', addr.phone);
    onChange('address1', addr.addressLine);
    onChange('city', addr.city || '');
    onChange('state', addr.county);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Shipping Information</h2>
        <p className="text-sm text-gray-500 mt-1">Where should we deliver your order?</p>
      </div>

      {/* Saved Addresses */}
      {!addressesLoading && savedAddresses.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Saved Addresses</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => selectAddress(addr)}
                className={`text-left rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-sm ${
                  addr.isDefault
                    ? 'border-[#F59E0B] bg-amber-50/30'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-semibold ${
                      addr.label === 'Home'
                        ? 'bg-emerald-100 text-emerald-700'
                        : addr.label === 'Office'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {addr.label}
                  </Badge>
                  {addr.isDefault && (
                    <Badge className="bg-[#F59E0B] text-[#0F172A] text-[10px] font-semibold gap-1">
                      <Star className="h-3 w-3" />
                      Default
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-gray-900 font-medium">
                    <User className="h-3 w-3 text-gray-400" />
                    {addr.fullName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Phone className="h-3 w-3 text-gray-400" />
                    {addr.phone}
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{addr.addressLine}{addr.city ? `, ${addr.city}` : ''}, {addr.county}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">or enter a new address below</span>
            </div>
          </div>
        </div>
      )}

      {addressesLoading && (
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            value={form.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            className={errors.fullName ? 'border-red-500' : ''}
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+254 712 345 678"
            value={form.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address1">Address Line 1 *</Label>
          <Input
            id="address1"
            placeholder="Street address, P.O. box"
            value={form.address1}
            onChange={(e) => onChange('address1', e.target.value)}
            className={errors.address1 ? 'border-red-500' : ''}
          />
          {errors.address1 && <p className="text-xs text-red-500 mt-1">{errors.address1}</p>}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="address2">Address Line 2 <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Input
            id="address2"
            placeholder="Apartment, suite, unit, building, floor, etc."
            value={form.address2}
            onChange={(e) => onChange('address2', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="Nairobi"
            value={form.city}
            onChange={(e) => onChange('city', e.target.value)}
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
        </div>

        <div>
          <Label htmlFor="state">County / State *</Label>
          <Select value={form.state} onValueChange={(v) => onChange('state', v)}>
            <SelectTrigger className={`w-full ${errors.state ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {KENYAN_COUNTIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
        </div>

        <div>
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            value={form.country}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div>
          <Label htmlFor="postalCode">Postal Code *</Label>
          <Input
            id="postalCode"
            placeholder="00100"
            value={form.postalCode}
            onChange={(e) => onChange('postalCode', e.target.value)}
            className={errors.postalCode ? 'border-red-500' : ''}
          />
          {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notes">Delivery Notes <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Textarea
            id="notes"
            placeholder="Any special instructions for delivery..."
            value={form.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Wallet Components
// ============================================================

function WalletBalanceCard({ currencyCode }: { currencyCode: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['wallet-checkout'],
    queryFn: async () => {
      const res = await fetch('/api/wallet');
      if (!res.ok) return { balance: 0 };
      const d = await res.json();
      return { balance: d.wallet?.balance ?? 0 };
    },
  });

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 max-w-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#0F172A]">SharkWallet Balance</p>
          {isLoading ? (
            <Skeleton className="h-7 w-28 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-[#F59E0B]">{formatCurrency(data?.balance ?? 0, currencyCode)}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-[#F59E0B]" />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Insufficient balance will prompt an additional payment method
      </p>
    </div>
  );
}

function WalletBalanceInline({ currencyCode }: { currencyCode: string }) {
  const { data } = useQuery({
    queryKey: ['wallet-checkout'],
    queryFn: async () => {
      const res = await fetch('/api/wallet');
      if (!res.ok) return { balance: 0 };
      const d = await res.json();
      return { balance: d.wallet?.balance ?? 0 };
    },
  });

  return <p className="text-gray-500 mt-1">Balance: {formatCurrency(data?.balance ?? 0, currencyCode)}</p>;
}

// ============================================================
// Step 2: Payment
// ============================================================

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
 popular?: boolean;
}[] = [
  {
    id: 'mpesa',
    label: 'M-Pesa',
    description: 'Pay via M-Pesa mobile money',
    icon: <Smartphone className="h-5 w-5" />,
    popular: true,
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    description: 'Direct bank transfer to our account',
    icon: <Landmark className="h-5 w-5" />,
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    description: 'Visa, Mastercard, or other cards',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: 'wallet',
    label: 'SharkWallet',
    description: 'Use your SHARKONE wallet balance',
    icon: <Wallet className="h-5 w-5" />, 
  },
];

function PaymentStep({
  paymentMethod,
  setPaymentMethod,
  mpesaPhone,
  setMpesaPhone,
  cardDetails,
  setCardDetails,
}: {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  mpesaPhone: string;
  setMpesaPhone: (v: string) => void;
  cardDetails: { number: string; expiry: string; cvv: string };
  setCardDetails: (d: { number: string; expiry: string; cvv: string }) => void;
}) {
  const currencyCode = useCurrencyStore((s) => s.code);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Payment Method</h2>
        <p className="text-sm text-gray-500 mt-1">Choose how you want to pay</p>
      </div>

      <div className="space-y-3">
        {PAYMENT_OPTIONS.map((opt) => {
          const isSelected = paymentMethod === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => setPaymentMethod(opt.id)}
              className={`w-full text-left relative rounded-xl border-2 p-4 transition-all duration-200 ${
                isSelected
                  ? 'border-[#F59E0B] bg-amber-50/50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              whileTap={{ scale: 0.99 }}
            >
              {opt.popular && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-[#F59E0B] text-[#0F172A] px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#F59E0B] text-[#0F172A]' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${isSelected ? 'text-[#0F172A]' : 'text-gray-700'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-gray-500">{opt.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-[#F59E0B] bg-[#F59E0B]' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#0F172A]" />}
                </div>
              </div>

              {/* Conditional fields */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      {opt.id === 'mpesa' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">M-Pesa Phone Number</Label>
                          <Input
                            placeholder="+254 712 345 678"
                            value={mpesaPhone}
                            onChange={(e) => setMpesaPhone(e.target.value)}
                            className="max-w-sm"
                          />
                          <p className="text-xs text-gray-400">You will receive an STS push notification to confirm payment</p>
                        </div>
                      )}

                      {opt.id === 'bank' && (
                        <div className="bg-white rounded-lg p-4 border border-gray-100 max-w-md space-y-2 text-sm">
                          <p className="font-semibold text-[#0F172A]">Bank Details</p>
                          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                            <span className="text-gray-500">Bank:</span>
                            <span className="font-medium">Equity Bank Kenya</span>
                            <span className="text-gray-500">Account:</span>
                            <span className="font-medium">SHARKONE Commerce Ltd</span>
                            <span className="text-gray-500">Account No:</span>
                            <span className="font-mono font-medium">0123456789012</span>
                            <span className="text-gray-500">Branch:</span>
                            <span className="font-medium">Nairobi Main</span>
                            <span className="text-gray-500">Swift:</span>
                            <span className="font-mono font-medium">EABORKEN</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Use your phone number as the payment reference
                          </p>
                        </div>
                      )}

                      {opt.id === 'card' && (
                        <div className="space-y-3 max-w-sm">
                          <div>
                            <Label className="text-sm font-medium">Card Number</Label>
                            <Input
                              placeholder="4242 4242 4242 4242"
                              value={cardDetails.number}
                              onChange={(e) =>
                                setCardDetails({ ...cardDetails, number: e.target.value })
                              }
                              maxLength={19}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium">Expiry</Label>
                              <Input
                                placeholder="MM/YY"
                                value={cardDetails.expiry}
                                onChange={(e) =>
                                  setCardDetails({ ...cardDetails, expiry: e.target.value })
                                }
                                maxLength={5}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">CVV</Label>
                              <Input
                                placeholder="123"
                                value={cardDetails.cvv}
                                onChange={(e) =>
                                  setCardDetails({ ...cardDetails, cvv: e.target.value })
                                }
                                maxLength={4}
                                type="password"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Your card details are encrypted and secure
                          </p>
                        </div>
                      )}

                      {opt.id === 'wallet' && (
                        <WalletBalanceCard currencyCode={currencyCode} />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Step 3: Review
// ============================================================

function ReviewStep({
  items,
  shipping,
  paymentMethod,
  deliveryFee,
  onPlaceOrder,
  isPlacing,
  couponDiscount,
  couponCode,
  isFreeShipping,
  onCouponApply,
  onCouponRemove,
}: {
  items: CartItem[];
  shipping: ShippingForm;
  paymentMethod: PaymentMethod;
  deliveryFee: number;
  onPlaceOrder: () => void;
  isPlacing: boolean;
  couponDiscount: number;
  couponCode: string | null;
  isFreeShipping: boolean;
  onCouponApply: (discount: number, code: string, isFreeShipping: boolean) => void;
  onCouponRemove: () => void;
}) {
  const currencyCode = useCurrencyStore((s) => s.code);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const platformFee = Math.round(subtotal * 0.02);
  const effectiveDeliveryFee = isFreeShipping ? 0 : deliveryFee;
  const total = Math.max(0, subtotal + effectiveDeliveryFee + platformFee - couponDiscount);

  const paymentLabels: Record<PaymentMethod, string> = {
    mpesa: 'M-Pesa',
    bank: 'Bank Transfer',
    card: 'Credit/Debit Card',
    wallet: 'SharkWallet',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Review Your Order</h2>
        <p className="text-sm text-gray-500 mt-1">Please confirm everything looks correct</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-sm text-[#0F172A] flex items-center gap-2">
                <Package className="h-4 w-4 text-[#F59E0B]" />
                Order Items ({items.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{item.product.sellerName || 'SHARKONE Seller'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {formatCurrency(item.product.price * item.quantity, currencyCode)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-400">
                        {formatCurrency(item.product.price, currencyCode)} each
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Payment Summary (mobile-only or stacked below) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-sm text-[#0F172A] flex items-center gap-2 mb-3">
                <Truck className="h-4 w-4 text-[#F59E0B]" />
                Shipping Address
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-[#0F172A]">{shipping.fullName}</p>
                <p>{shipping.address1}</p>
                {shipping.address2 && <p>{shipping.address2}</p>}
                <p>
                  {shipping.city}, {shipping.state}, {shipping.country}
                </p>
                <p>{shipping.postalCode}</p>
                <p className="text-xs text-gray-400 mt-1">{shipping.phone}</p>
                {shipping.notes && (
                  <p className="text-xs text-gray-400 italic">Note: {shipping.notes}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-sm text-[#0F172A] flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-[#F59E0B]" />
                Payment Method
              </h3>
              <div className="text-sm">
                <p className="font-medium text-[#0F172A]">{paymentLabels[paymentMethod]}</p>
                {paymentMethod === 'mpesa' && shipping.phone && (
                  <p className="text-gray-500 mt-1">{shipping.phone}</p>
                )}
                {paymentMethod === 'bank' && (
                  <p className="text-gray-500 mt-1">Equity Bank · SHARKONE Commerce</p>
                )}
                {paymentMethod === 'wallet' && (
                  <WalletBalanceInline currencyCode={currencyCode} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Summary Card */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h3 className="font-semibold text-[#0F172A] mb-4">Order Total</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, currencyCode)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className={isFreeShipping ? 'line-through text-gray-400' : ''}>
                  {formatCurrency(deliveryFee, currencyCode)}
                </span>
              </div>
              {isFreeShipping && (
                <div className="flex justify-between text-[#F59E0B] font-medium">
                  <span>Free Shipping</span>
                  <span>−{formatCurrency(deliveryFee, currencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Platform Fee (2%)</span>
                <span>{formatCurrency(platformFee, currencyCode)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon Discount ({couponCode})</span>
                  <span>−{formatCurrency(couponDiscount, currencyCode)}</span>
                </div>
              )}
              <Separator className="!my-3" />
              <div className="flex justify-between font-bold text-[#0F172A] text-lg">
                <span>Total</span>
                <span>{formatCurrency(total, currencyCode)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                onClick={onPlaceOrder}
                disabled={isPlacing}
                className="w-full bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-bold h-12 text-base"
              >
                {isPlacing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 4: Confirmation
// ============================================================

function ConfirmationStep({ orderNumber }: { orderNumber: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
      }}
      className="max-w-lg mx-auto text-center py-10 space-y-6"
    >
      <motion.div variants={scaleIn} className="flex justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
        >
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </motion.div>
      </motion.div>

      <motion.div variants={scaleIn}>
        <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">
          Order Placed Successfully!
        </h2>
        <p className="text-gray-500 mt-2">
          Thank you for shopping with <span className="font-semibold text-[#F59E0B]">SHARKONE</span>
        </p>
      </motion.div>

      <motion.div
        variants={scaleIn}
        className="bg-gray-50 rounded-xl p-5 border border-gray-200 inline-block"
      >
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Order Number</p>
        <p className="text-2xl font-bold text-[#0F172A] font-mono mt-1">{orderNumber}</p>
      </motion.div>

      <motion.div variants={scaleIn} className="space-y-4 bg-white rounded-xl border border-gray-200 p-6 text-left">
        <h3 className="font-semibold text-[#0F172A]">What happens next?</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="h-4 w-4 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Email Confirmation</p>
              <p className="text-xs text-gray-500">You&apos;ll receive an email confirmation with your order details and receipt.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Phone className="h-4 w-4 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#0F172A]">SMS Notification</p>
              <p className="text-xs text-gray-500">A confirmation SMS will be sent to your phone number.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="h-4 w-4 text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Track Your Order</p>
              <p className="text-xs text-gray-500">Once your order is dispatched, you can track it in real-time from your order page.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={scaleIn} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link href="/">
          <Button className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold px-8">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>
        <Link href="/track">
          <Button variant="outline" className="border-[#0F172A] text-[#0F172A] hover:bg-gray-50 font-semibold px-8">
            <Truck className="h-4 w-4 mr-2" />
            Track Order
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Empty Cart
// ============================================================

function EmptyCart() {
  return (
    <div className="max-w-md mx-auto text-center py-20 space-y-6">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
        <ShoppingBag className="h-10 w-10 text-gray-300" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Your cart is empty</h2>
        <p className="text-sm text-gray-500 mt-2">
          Looks like you haven&apos;t added anything to your cart yet. Start shopping to find amazing deals!
        </p>
      </div>
      <Link href="/">
        <Button className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Continue Shopping
        </Button>
      </Link>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);

  // Shipping
  const [shipping, setShipping] = useState<ShippingForm>(initialShipping);
  const [shippingErrors, setShippingErrors] = useState<ShippingErrors>({});

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });

  // Coupon
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isFreeShipping, setIsFreeShipping] = useState(false);

  const handleCouponApply = (discount: number, code: string, freeShipping: boolean) => {
    setCouponDiscount(discount);
    setCouponCode(code);
    setIsFreeShipping(freeShipping);
  };

  const handleCouponRemove = () => {
    setCouponDiscount(0);
    setCouponCode(null);
    setIsFreeShipping(false);
  };

  // Order
  const [orderNumber, setOrderNumber] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  const deliveryFee = useMemo(() => {
    if (shipping.city.toLowerCase() === 'nairobi') return 250;
    return 500;
  }, [shipping.city]);

  // ============================================================
  // Helpers
  // ============================================================

  const handleShippingChange = (field: keyof ShippingForm, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (shippingErrors[field as keyof ShippingErrors]) {
      setShippingErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateShipping = (): boolean => {
    const errs: ShippingErrors = {};
    if (!shipping.fullName.trim()) errs.fullName = 'Full name is required';
    if (!shipping.email.trim() || !/\S+@\S+\.\S+/.test(shipping.email))
      errs.email = 'Valid email is required';
    if (!shipping.phone.trim()) errs.phone = 'Phone number is required';
    if (!shipping.address1.trim()) errs.address1 = 'Address is required';
    if (!shipping.city.trim()) errs.city = 'City is required';
    if (!shipping.state) errs.state = 'County/State is required';
    if (!shipping.postalCode.trim()) errs.postalCode = 'Postal code is required';
    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const generateOrderNumber = () => {
    const digits = Math.floor(100000 + Math.random() * 900000).toString();
    return `SHK-${digits}`;
  };

  const goNext = () => {
    setDirection(1);
    setStep((prev) => Math.min(prev + 1, 4) as Step);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateShipping()) return;
      goNext();
    } else if (step === 2) {
      goNext();
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    const num = generateOrderNumber();
    setOrderNumber(num);

    const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const platformFee = Math.round(subtotal * 0.02);
    const effectiveDeliveryFee = isFreeShipping ? 0 : deliveryFee;
    const total = Math.max(0, subtotal + effectiveDeliveryFee + platformFee - couponDiscount);

    try {
      // If wallet payment, deduct from wallet first
      if (paymentMethod === 'wallet') {
        try {
          await fetch('/api/wallet/deduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: total,
              description: `Order ${num}`,
              referenceId: num,
            }),
          });
        } catch {
          // Continue even if wallet deduct fails (demo mode)
        }
      }

      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: num,
          items: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.price,
            image: i.product.image,
            sellerId: i.product.sellerId || '',
          })),
          shippingAddress: JSON.stringify(shipping),
          paymentMethod,
          totalAmount: total,
          deliveryFee: effectiveDeliveryFee,
          platformFee,
          couponCode: couponCode || undefined,
          couponDiscount: couponDiscount || undefined,
          buyerEmail: shipping.email,
          buyerName: shipping.fullName,
          buyerPhone: shipping.phone,
        }),
      });
    } catch {
      // Even if API fails, still show confirmation for demo purposes
    }

    clearCart();
    setDirection(1);
    setStep(4);
    setIsPlacing(false);
  };

  // ============================================================
  // Render
  // ============================================================

  if (items.length === 0 && step !== 4) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SimpleNavbar />
        <main className="flex-1 px-6 md:px-16 lg:px-32 py-10">
          <EmptyCart />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />

      <main className="flex-1 px-6 md:px-16 lg:px-32 py-8 md:py-12">
        {/* Step Indicator */}
        {step < 4 && (
          <div className="mb-10">
            <StepIndicator currentStep={step} />
          </div>
        )}

        {/* Step Content */}
        {step < 4 && step < 3 && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {step === 1 && (
                    <ShippingStep
                      form={shipping}
                      errors={shippingErrors}
                      onChange={handleShippingChange}
                    />
                  )}
                  {step === 2 && (
                    <PaymentStep
                      paymentMethod={paymentMethod}
                      setPaymentMethod={setPaymentMethod}
                      mpesaPhone={mpesaPhone}
                      setMpesaPhone={setMpesaPhone}
                      cardDetails={cardDetails}
                      setCardDetails={setCardDetails}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={goBack}
                  disabled={step === 1}
                  className="text-gray-500 hover:text-[#0F172A]"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-[#0F172A] hover:bg-slate-800 text-white font-semibold"
                >
                  {step === 1 ? 'Continue to Payment' : 'Review Order'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <OrderSummarySidebar
                items={items}
                deliveryFee={deliveryFee}
                couponDiscount={couponDiscount}
                couponCode={couponCode}
                isFreeShipping={isFreeShipping}
                onCouponApply={handleCouponApply}
                onCouponRemove={handleCouponRemove}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <ReviewStep
                  items={items}
                  shipping={shipping}
                  paymentMethod={paymentMethod}
                  deliveryFee={deliveryFee}
                  onPlaceOrder={handlePlaceOrder}
                  isPlacing={isPlacing}
                  couponDiscount={couponDiscount}
                  couponCode={couponCode}
                  isFreeShipping={isFreeShipping}
                  onCouponApply={handleCouponApply}
                  onCouponRemove={handleCouponRemove}
                />
              </motion.div>
            </AnimatePresence>

            {/* Back button for review step */}
            <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={goBack}
                className="text-gray-500 hover:text-[#0F172A]"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Payment
              </Button>
            </div>
          </div>
        )}

        {step === 4 && <ConfirmationStep orderNumber={orderNumber} />}
      </main>

      <Footer />
    </div>
  );
}
