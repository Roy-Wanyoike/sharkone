'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  ShoppingBag,
  Truck,
  Wallet,
  CreditCard,
  ShieldCheck,
  Bell,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/ecommerce/Footer';

/* ------------------------------------------------------------------ */
/*  Minimal Navbar (no props needed)                                   */
/* ------------------------------------------------------------------ */
function SimpleNavbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
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

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-8">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium transition-colors ${l.href === '/about' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'}`}
          >
            {l.label}
          </Link>
        ))}
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

      {/* Mobile menu */}
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
                className={`py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 ${l.href === '/about' ? 'text-amber-600' : 'text-gray-700'}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setValue(target);
        clearInterval(interval);
      } else {
        setValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [inView, target]);

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

/* ------------------------------------------------------------------ */
/*  Fade-in on scroll wrapper                                          */
/* ------------------------------------------------------------------ */
function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const stats = [
  { label: 'Products', value: 10000, suffix: '+', prefix: '' },
  { label: 'Sellers', value: 500, suffix: '+', prefix: '' },
  { label: 'Orders', value: 50000, suffix: '+', prefix: '' },
  { label: 'Uptime', value: 99.9, suffix: '%', prefix: '' },
];

const ecosystemPillars = [
  { name: 'SharkCart', icon: ShoppingBag, desc: 'Commerce', color: 'bg-amber-100 text-amber-700' },
  { name: 'SharkShip', icon: Truck, desc: 'Logistics', color: 'bg-sky-100 text-sky-700' },
  { name: 'SharkWallet', icon: Wallet, desc: 'Payments', color: 'bg-emerald-100 text-emerald-700' },
];

const ecosystemSupport = [
  { name: 'SharkPay', icon: CreditCard, color: 'text-purple-600' },
  { name: 'SharkIdentity', icon: ShieldCheck, color: 'text-teal-600' },
  { name: 'SharkNotify', icon: Bell, color: 'text-rose-600' },
];

const team = [
  { name: 'Roy Wanyoike', role: 'Founder & CEO', initials: 'RW', featured: true },
  { name: 'Amina Odhiambo', role: 'Head of Operations', initials: 'AO', featured: false },
  { name: 'David Kimutai', role: 'Lead Engineer', initials: 'DK', featured: false },
  { name: 'Fatima Hassan', role: 'Head of Design', initials: 'FH', featured: false },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SimpleNavbar />

      <main className="flex-1">
        {/* ---- 1. Hero Banner ---- */}
        <section className="bg-[#0F172A] px-6 md:px-16 lg:px-32 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center gap-4"
          >
            <svg width="56" height="56" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#F59E0B" />
              <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="white" />
            </svg>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
              About <span className="text-amber-400">SHARKONE</span>
            </h1>
            <p className="text-amber-400 text-sm md:text-base font-medium uppercase tracking-widest">
              Shop &middot; Ship &middot; Smile
            </p>
          </motion.div>
        </section>

        {/* ---- 2. Our Story ---- */}
        <section className="px-6 md:px-16 lg:px-32 py-16 md:py-24">
          <FadeIn className="max-w-3xl mx-auto text-center">
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-3">Our Story</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-6">
              Building the Everything-Commerce Platform
            </h2>
            <p className="text-gray-600 leading-relaxed">
              SHARKONE was founded by <strong className="text-[#0F172A]">Roy Wanyoike</strong> with a bold
              vision: to build Africa&apos;s most comprehensive multi-tenant commerce platform — one that
              seamlessly connects buyers, sellers, and delivery partners. Born out of the need to
              democratize access to digital commerce tools for entrepreneurs across the continent, SHARKONE
              has grown from an idea into a living ecosystem powering thousands of transactions every day.
              From Nairobi to Lagos, Accra to Kigali, we&apos;re on a mission to make commerce accessible,
              affordable, and delightful for everyone.
            </p>
          </FadeIn>
        </section>

        {/* ---- 3. Mission & Vision ---- */}
        <section className="px-6 md:px-16 lg:px-32 pb-16 md:pb-24">
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <FadeIn delay={0}>
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-amber-50 to-white p-8 h-full">
                <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-2">Mission</p>
                <h3 className="text-xl font-bold text-[#0F172A] mb-4">What Drives Us</h3>
                <p className="text-gray-600 leading-relaxed">
                  To democratize commerce by giving every entrepreneur the tools to sell online,
                  every buyer a trusted marketplace to discover products, and every delivery partner
                  a reliable platform to earn — creating economic opportunity at scale across Africa.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-8 h-full">
                <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-2">Vision</p>
                <h3 className="text-xl font-bold text-[#0F172A] mb-4">Where We&apos;re Headed</h3>
                <p className="text-gray-600 leading-relaxed">
                  To be Africa&apos;s leading multi-tenant commerce platform — the one place where
                  shopping, logistics, and payments converge into a single, seamless experience.
                  We envision a future where geography is never a barrier to trade.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ---- 4. The SHARKONE Ecosystem ---- */}
        <section className="px-6 md:px-16 lg:px-32 pb-16 md:pb-24">
          <FadeIn className="text-center mb-12">
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-3">Ecosystem</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A]">The SHARKONE Ecosystem</h2>
          </FadeIn>

          {/* 3 pillars */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            {ecosystemPillars.map((p, i) => (
              <FadeIn key={p.name} delay={i * 0.1}>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center hover:shadow-lg transition-shadow">
                  <div className={`inline-flex items-center justify-center h-14 w-14 rounded-xl ${p.color} mb-4`}>
                    <p.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A]">{p.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Supporting services */}
          <FadeIn>
            <div className="flex flex-wrap justify-center gap-6 max-w-2xl mx-auto">
              {ecosystemSupport.map((s) => (
                <div key={s.name} className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gray-50 border border-gray-200">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-sm font-medium text-[#0F172A]">{s.name}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>

        {/* ---- 5. Stats Section ---- */}
        <section className="bg-[#0F172A] px-6 md:px-16 lg:px-32 py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {stats.map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.1}>
                <div>
                  <p className="text-3xl md:text-4xl font-bold text-amber-400">
                    {s.prefix}<AnimatedCounter target={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-gray-400 text-sm mt-1">{s.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ---- 6. Team Section ---- */}
        <section className="px-6 md:px-16 lg:px-32 py-16 md:py-24">
          <FadeIn className="text-center mb-12">
            <p className="text-amber-600 text-xs font-semibold uppercase tracking-wider mb-3">Our Team</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A]">Meet the People Behind SHARKONE</h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {team.map((m, i) => (
              <FadeIn key={m.name} delay={i * 0.1}>
                <div className={`rounded-2xl border p-6 text-center ${m.featured ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-white' : 'border-gray-200 bg-white hover:shadow-md transition-shadow'}`}>
                  <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold mb-4 ${m.featured ? 'bg-amber-500 text-white' : 'bg-[#0F172A] text-white'}`}>
                    {m.initials}
                  </div>
                  <h3 className="font-bold text-[#0F172A]">{m.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{m.role}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ---- 7. CTA Banner ---- */}
        <section className="px-6 md:px-16 lg:px-32 pb-16 md:pb-24">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-[#0F172A] px-8 py-14 md:px-16 md:py-20 text-center">
              {/* decorative amber glow */}
              <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
              <h2 className="relative text-3xl md:text-4xl font-bold text-white mb-4">
                Join the SHARKONE Revolution
              </h2>
              <p className="relative text-gray-400 max-w-lg mx-auto mb-8">
                Whether you&apos;re looking to sell products, deliver packages, or discover amazing deals —
                SHARKONE has a place for you.
              </p>
              <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/sell">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-[#0F172A] font-semibold rounded-xl px-8">
                    Become a Seller
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl px-8">
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <Footer />
    </div>
  );
}
