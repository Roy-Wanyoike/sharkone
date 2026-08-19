'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckCircle2,
  Circle,
  Loader2,
  MapPin,
  Eye,
  EyeOff,
  Package,
  Phone,
  Truck,
  Menu,
  X,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/ecommerce/Footer';

/* ------------------------------------------------------------------ */
/*  Simple Navbar                                                      */
/* ------------------------------------------------------------------ */
function SimpleNavbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/#products' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Sell', href: '/sell' },
  ];

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 backdrop-blur-md border-b border-gray-200 bg-white/90 shadow-sm">
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#0F172A" />
          <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="#F59E0B" />
        </svg>
        <span className="text-xl font-bold tracking-tight">
          <span className="text-[#0F172A]">SHARK</span>
          <span className="text-[#F59E0B]">ONE</span>
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-3">
        <Link href="/login">
          <Button variant="outline" size="sm" className="rounded-lg">
            Login
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm" className="rounded-lg bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A]">
            Register
          </Button>
        </Link>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-gray-600"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden"
        >
          <div className="flex flex-col p-4 gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                {l.label}
              </Link>
            ))}
            <Separator className="my-2" />
            <div className="flex gap-2 px-3">
              <Link href="/login" className="flex-1" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full rounded-lg">
                  Login
                </Button>
              </Link>
              <Link href="/register" className="flex-1" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full rounded-lg bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A]">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_TRACKING = {
  orderNumber: 'SHK-247831',
  orderDate: 'Jan 15, 2026',
  currentStep: 3, // 0-indexed, step 3 = Out for Delivery
  steps: [
    { label: 'Order Placed', time: 'Jan 15, 2026 · 10:32 AM', completed: true },
    { label: 'Confirmed', time: 'Jan 15, 2026 · 11:05 AM', completed: true },
    { label: 'Shipped', time: 'Jan 16, 2026 · 9:15 AM', completed: true },
    { label: 'Out for Delivery', time: 'Jan 17, 2026 · 7:45 AM', completed: false, active: true },
    { label: 'Delivered', time: 'Estimated Jan 18', completed: false },
  ],
  items: [
    { name: 'Wireless Bluetooth Headphones', qty: 1, price: 'KES 4,500' },
    { name: 'USB-C Charging Cable (2-pack)', qty: 2, price: 'KES 800' },
  ],
  shippingAddress: '123 Moi Avenue, Nairobi, Kenya',
  deliveryPartner: { name: 'James Mwangi', phone: '+254 712 345 678' },
  estimatedDelivery: 'January 18, 2026',
  otp: '4829',
};

const RECENT_ORDERS = [
  { orderNumber: 'SHK-198452', date: 'Jan 10, 2026' },
  { orderNumber: 'SHK-175623', date: 'Jan 5, 2026' },
  { orderNumber: 'SHK-162874', date: 'Dec 28, 2025' },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TrackPage() {
  const [searchInput, setSearchInput] = useState('');
  const [trackingResult, setTrackingResult] = useState<typeof MOCK_TRACKING | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleTrack = () => {
    if (!searchInput.trim()) return;
    setSearching(true);
    // Simulate API call
    setTimeout(() => {
      setTrackingResult(MOCK_TRACKING);
      setSearching(false);
    }, 800);
  };

  const handleRecentTrack = (orderNumber: string) => {
    setSearchInput(orderNumber);
    setSearching(true);
    setTimeout(() => {
      setTrackingResult({ ...MOCK_TRACKING, orderNumber });
      setSearching(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SimpleNavbar />

      <main className="flex-1">
        {/* Search Section */}
        <section className="bg-[#0F172A] py-16 md:py-20">
          <div className="px-6 md:px-16 lg:px-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto text-center"
            >
              <Package className="h-10 w-10 text-amber-400 mx-auto mb-4" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Track Your Order</h1>
              <p className="text-gray-400 mt-2 mb-8">
                Enter your order number to get real-time delivery updates
              </p>

              <div className="flex gap-3 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="SHK-XXXXXX"
                    className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-amber-500"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  />
                </div>
                <Button
                  onClick={handleTrack}
                  disabled={searching || !searchInput.trim()}
                  className="h-12 px-6 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold shrink-0"
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Track'
                  )}
                </Button>
              </div>

              {/* Recent Orders */}
              {!trackingResult && (
                <div className="mt-8">
                  <p className="text-gray-500 text-sm mb-3">Recent tracked orders</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {RECENT_ORDERS.map((order) => (
                      <button
                        key={order.orderNumber}
                        onClick={() => handleRecentTrack(order.orderNumber)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition text-sm"
                      >
                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-gray-300 font-mono text-xs">{order.orderNumber}</span>
                        <span className="text-gray-500 text-xs">{order.date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Tracking Result */}
        <AnimatePresence>
          {trackingResult && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 md:px-16 lg:px-32 py-10"
            >
              <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Stepper + Order Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Order Header */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Order Number</p>
                        <p className="text-xl font-bold text-[#0F172A] font-mono">
                          {trackingResult.orderNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Order Date</p>
                        <p className="font-medium text-[#0F172A]">{trackingResult.orderDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Stepper */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-[#0F172A] mb-6">Delivery Status</h2>
                    <div className="space-y-0">
                      {trackingResult.steps.map((step, i) => {
                        const isLast = i === trackingResult.steps.length - 1;
                        const isCompleted = step.completed;
                        const isActive = step.active;

                        return (
                          <motion.div
                            key={step.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-4"
                          >
                            {/* Icon + Line */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                                  isCompleted
                                    ? 'bg-green-500 text-white'
                                    : isActive
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : isActive ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </div>
                              {!isLast && (
                                <div
                                  className={`w-0.5 flex-1 min-h-[40px] ${
                                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                  }`}
                                />
                              )}
                            </div>

                            {/* Content */}
                            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                              <p
                                className={`font-semibold text-sm ${
                                  isCompleted
                                    ? 'text-green-600'
                                    : isActive
                                    ? 'text-amber-600'
                                    : 'text-gray-400'
                                }`}
                              >
                                {step.label}
                                {isActive && (
                                  <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                    In Progress
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{step.time}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-[#0F172A] mb-4">Order Items</h2>
                    <div className="divide-y divide-gray-100">
                      {trackingResult.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#0F172A]">{item.name}</p>
                              <p className="text-xs text-gray-400">Qty: {item.qty}</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-[#0F172A]">{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Map Placeholder */}
                  <div className="bg-[#0F172A] rounded-xl p-8 flex flex-col items-center justify-center min-h-[180px]">
                    <MapPin className="h-10 w-10 text-amber-400 mb-3" />
                    <p className="text-white font-semibold">Live tracking map coming soon</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Real-time GPS tracking of your delivery
                    </p>
                  </div>
                </div>

                {/* Right Column: Details Card */}
                <div className="space-y-6">
                  {/* Shipping Address */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      Shipping Address
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {trackingResult.shippingAddress}
                    </p>
                  </div>

                  {/* Delivery Partner */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-amber-500" />
                      Delivery Partner
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                          {trackingResult.deliveryPartner.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A]">
                            {trackingResult.deliveryPartner.name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            {trackingResult.deliveryPartner.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Delivery */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Estimated Delivery
                    </h3>
                    <p className="text-lg font-bold text-amber-600">
                      {trackingResult.estimatedDelivery}
                    </p>
                  </div>

                  {/* Delivery OTP */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0F172A] mb-3">Delivery OTP</h3>
                    <p className="text-xs text-gray-400 mb-3">
                      Share this with the delivery partner upon delivery
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-2.5 bg-gray-50 rounded-lg font-mono text-xl font-bold text-center tracking-[0.3em] text-[#0F172A]">
                        {showOtp ? trackingResult.otp : '••••'}
                      </div>
                      <button
                        onClick={() => setShowOtp(!showOtp)}
                        className="p-2.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                        aria-label={showOtp ? 'Hide OTP' : 'Show OTP'}
                      >
                        {showOtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}