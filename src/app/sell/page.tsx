'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Store,
  Package,
  DollarSign,
  Truck,
  ShieldCheck,
  BarChart3,
  Star,
  ArrowRight,
  Menu,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { useCurrencyStore } from '@/store/currency-store';
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
            className={`text-sm font-medium transition-colors ${l.href === '/sell' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
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
                className={`py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 ${l.href === '/sell' ? 'text-amber-600' : 'text-gray-700'}`}
              >
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-gray-100 my-2" />
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
/*  Fade In Animation Wrapper                                          */
/* ------------------------------------------------------------------ */
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    num: 1,
    icon: Store,
    title: 'Create Your Store',
    desc: 'Set up your store in minutes with our guided onboarding flow',
  },
  {
    num: 2,
    icon: Package,
    title: 'Add Products',
    desc: 'List your products with photos, descriptions, and competitive pricing',
  },
  {
    num: 3,
    icon: DollarSign,
    title: 'Start Earning',
    desc: 'Receive payments directly to your wallet with every sale',
  },
];

const BENEFITS = [
  {
    icon: DollarSign,
    title: 'Low Commission',
    desc: 'Only 10% per sale — the lowest in the market. Keep more of what you earn.',
  },
  {
    icon: Truck,
    title: 'Built-in Logistics',
    desc: 'SharkShip integration handles pickup, delivery, and proof of delivery automatically.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    desc: 'SharkWallet and HoneyCoin support. Escrow protection for every transaction.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Real-time insights into sales, orders, revenue, and customer behavior.',
  },
];

const PRICING_FEATURES = [
  'Unlimited product listings',
  'Built-in order management',
  'SharkShip logistics integration',
  'SharkWallet payments',
  'Analytics dashboard',
  'Marketing tools & promotions',
  'Seller support 24/7',
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SellPage() {
  const currencyCode = useCurrencyStore((s) => s.code);
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[#0F172A] relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-500/5" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-amber-500/5" />

          <div className="relative z-10 px-6 md:px-16 lg:px-32 py-20 md:py-28 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  Join 500+ sellers
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Start Selling on{' '}
                <span className="text-amber-400">SHARKONE</span>
              </h1>

              <p className="text-gray-400 mt-5 text-lg max-w-xl mx-auto leading-relaxed">
                Reach thousands of buyers across Kenya. No hidden fees, no complicated setup.
                Just list, sell, and grow.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-9">
                <Link href="/register?role=seller">
                  <Button
                    size="lg"
                    className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold px-8 h-12 text-base"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/20 text-white hover:bg-white/10 h-12 px-8 text-base"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="px-6 md:px-16 lg:px-32 py-16 md:py-24">
          <FadeIn className="text-center mb-14">
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-2">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A]">
              Start selling in 3 simple steps
            </h2>
          </FadeIn>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeIn key={step.num} delay={i * 0.15}>
                  <div className="relative text-center p-6">
                    {/* Connector line (desktop) */}
                    {i < STEPS.length - 1 && (
                      <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gray-200" />
                    )}

                    {/* Numbered circle */}
                    <div className="relative inline-flex items-center justify-center mb-5">
                      <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center">
                        <Icon className="h-8 w-8 text-amber-600" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center">
                        {step.num}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#0F172A] mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                      {step.desc}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="px-6 md:px-16 lg:px-32 py-16 md:py-24 bg-gray-50">
          <FadeIn className="text-center mb-14">
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-2">
              Why SHARKONE
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A]">
              Everything you need to succeed
            </h2>
          </FadeIn>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <FadeIn key={b.title} delay={i * 0.1}>
                  <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0F172A] mb-2">{b.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="px-6 md:px-16 lg:px-32 py-16 md:py-24">
          <FadeIn className="text-center mb-14">
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-2">
              Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A]">
              Simple, transparent pricing
            </h2>
          </FadeIn>

          <FadeIn className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl border-2 border-amber-400 p-8 text-center relative overflow-hidden shadow-lg">
              {/* Popular badge */}
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-bl-xl">
                Popular
              </div>

              <h3 className="text-xl font-bold text-[#0F172A] mb-1">Free to Start</h3>
              <p className="text-gray-400 text-sm mb-6">No monthly fees, no setup costs</p>

              <div className="mb-8">
                <span className="text-4xl font-bold text-[#0F172A]">{formatCurrency(0, currencyCode)}</span>
                <span className="text-gray-400 text-sm"> /month</span>
              </div>

              <div className="space-y-3 text-left mb-8">
                {PRICING_FEATURES.map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>

              <Link href="/register?role=seller">
                <Button
                  size="lg"
                  className="w-full bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold h-12"
                >
                  Start Selling for Free
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </FadeIn>
        </section>

        {/* Testimonial */}
        <section className="px-6 md:px-16 lg:px-32 py-16 md:py-24 bg-gray-50">
          <FadeIn className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100 text-center">
              <div className="flex items-center justify-center gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <blockquote className="text-lg md:text-xl text-gray-700 leading-relaxed italic">
                &ldquo;SHARKONE completely changed my business. I went from selling at a local
                market stall to reaching customers across Kenya. The platform is easy to use,
                the logistics are handled for me, and I get paid quickly. My sales have
                tripled in just 6 months.&rdquo;
              </blockquote>

              <div className="mt-8 flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">
                  AK
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[#0F172A]">Amina Kariuki</p>
                  <p className="text-sm text-gray-500">Founder, Nairobi Threads • Selling since 2025</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* Final CTA */}
        <section className="bg-[#0F172A] relative overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-amber-500/5" />
          <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-amber-500/5" />

          <div className="relative z-10 px-6 md:px-16 lg:px-32 py-20 text-center">
            <FadeIn>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to start selling?
              </h2>
              <p className="text-gray-400 text-lg max-w-lg mx-auto mb-8">
                Join 500+ sellers already earning on SHARKONE. It&apos;s free to start.
              </p>
              <Link href="/register?role=seller">
                <Button
                  size="lg"
                  className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold px-8 h-12 text-base"
                >
                  Create Your Store
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}