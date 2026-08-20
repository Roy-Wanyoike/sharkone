'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Package,
  MapPin,
  CreditCard,
  Truck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Footer } from '@/components/ecommerce/Footer';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';

/* ------------------------------------------------------------------ */
/*  Simple Navbar                                                      */
/* ------------------------------------------------------------------ */
function SimpleNavbar() {
  const links = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-32 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#F59E0B" />
            <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="white" />
          </svg>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-[#0F172A]">SHARK</span>
            <span className="text-amber-500">ONE</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-gray-600 hover:text-[#0F172A] font-medium transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Success Animation                                                  */
/* ------------------------------------------------------------------ */
function SuccessAnimation() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      className="flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.4 }}
      >
        <div className="relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            className="absolute inset-0 rounded-full bg-green-400/20"
          />
          <CheckCircle2 className="h-24 w-24 text-green-500" strokeWidth={1.5} />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Order Detail Content (inside Suspense)                            */
/* ------------------------------------------------------------------ */
function OrderConfirmationContent() {
  const { id } = useParams<{ id: string }>();
  const currencyCode = useCurrencyStore((s) => s.code);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load order');
      }
      return res.json() as Promise<{
        order: {
          id: string;
          orderNumber: string;
          status: string;
          totalAmount: number;
          deliveryFee: number;
          platformFee: number;
          shippingAddress: string;
          paymentStatus: string;
          paidAt: string | null;
          createdAt: string;
          buyer: { name: string; email: string };
          orderItems: {
            id: string;
            quantity: number;
            price: number;
            product: { id: string; name: string; image: string; price: number };
          }[];
        };
      }>;
    },
  });

  const order = data?.order;

  if (isLoading) {
    return (
      <div className="px-6 md:px-16 lg:px-32 py-16 max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Order not found</h2>
        <p className="text-gray-500 mb-6 max-w-md">{error?.message || 'We could not locate this order.'}</p>
        <Link href="/">
          <Button className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const paymentLabel =
    order.paymentStatus === 'PAID'
      ? 'Paid'
      : order.paymentStatus === 'PENDING'
        ? 'Pending'
        : order.paymentStatus;

  const paymentColor =
    order.paymentStatus === 'PAID'
      ? 'bg-green-100 text-green-700'
      : 'bg-amber-100 text-amber-700';

  return (
    <div className="px-6 md:px-16 lg:px-32 py-12 max-w-4xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-10">
        <SuccessAnimation />
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-[#0F172A] mt-6"
        >
          Order Confirmed!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-gray-500 mt-2"
        >
          Thank you for shopping on SHARKONE. Your order has been received.
        </motion.p>
      </div>

      {/* Order Number */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center mb-8"
      >
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-amber-600" />
            <span className="text-sm text-gray-600">Order Number:</span>
            <span className="font-bold text-[#0F172A] text-lg tracking-wide">
              {order.orderNumber}
            </span>
          </CardContent>
        </Card>
      </motion.div>

      {/* Details Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
      >
        {/* Order Items */}
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <h2 className="font-bold text-[#0F172A] text-base mb-4 flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" />
              Order Summary
            </h2>
            <div className="space-y-3">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity} × {formatCurrency(item.price, currencyCode)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#0F172A] shrink-0">
                    {formatCurrency(item.price * item.quantity, currencyCode)}
                  </span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.totalAmount - order.deliveryFee, currencyCode)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{formatCurrency(order.deliveryFee, currencyCode)}</span>
              </div>
              <div className="flex justify-between font-bold text-[#0F172A] text-base pt-1">
                <span>Total</span>
                <span>{formatCurrency(order.totalAmount, currencyCode)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping & Payment */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <h2 className="font-bold text-[#0F172A] text-base mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-500" />
                Shipping Address
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {order.shippingAddress}
              </p>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <h2 className="font-bold text-[#0F172A] text-base mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-amber-500" />
                Payment Status
              </h2>
              <Badge className={`${paymentColor} hover:${paymentColor} text-xs font-semibold`}>
                {paymentLabel}
              </Badge>
              {order.paidAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Paid on {new Date(order.paidAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Estimated Delivery */}
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <h2 className="font-bold text-[#0F172A] text-base mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-amber-500" />
                Estimated Delivery
              </h2>
              <p className="text-sm font-medium text-[#0F172A]">
                3-5 business days
              </p>
              <p className="text-xs text-gray-500 mt-1">
                You will receive a tracking update once your order is shipped.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
      >
        <Link href="/track">
          <Button className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold px-8 py-6 text-base">
            <Truck className="h-4 w-4 mr-2" />
            Track Order
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
        <Link href="/">
          <Button
            variant="outline"
            className="border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-white font-semibold px-8 py-6 text-base transition-colors"
          >
            Continue Shopping
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (with Suspense for useParams)                                 */
/* ------------------------------------------------------------------ */
export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="px-6 md:px-16 lg:px-32 py-16 max-w-3xl mx-auto space-y-6">
              <div className="flex flex-col items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
          }
        >
          <OrderConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
