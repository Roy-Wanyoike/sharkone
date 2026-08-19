'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  User,
  Store,
  Truck,
  ShoppingBag,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type Role = 'buyer' | 'seller' | 'delivery' | null;

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#0F172A" />
    <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="#F59E0B" />
  </svg>
);

const ROLES = [
  { value: 'buyer' as const, label: 'Buyer', icon: User, desc: 'Shop and order products' },
  { value: 'seller' as const, label: 'Seller', icon: Store, desc: 'List and sell products' },
  { value: 'delivery' as const, label: 'Delivery', icon: Truck, desc: 'Deliver orders' },
];

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storeDescription: '',
    vehicleType: '',
    idNumber: '',
  });

  // Pre-select role from URL param (derived, no effect needed)
  const initialRole = useMemo<Role>(() => {
    const r = searchParams.get('role');
    if (r === 'seller' || r === 'delivery') return r;
    return null;
  }, [searchParams]);
  const activeRole = role ?? initialRole;

  const update = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!activeRole) {
      toast.error('Please select a role');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!terms) {
      toast.error('Please accept the Terms & Conditions');
      return;
    }
    if (activeRole === 'seller' && !form.storeName.trim()) {
      toast.error('Please enter your store name');
      return;
    }
    if (activeRole === 'delivery' && !form.vehicleType) {
      toast.error('Please select your vehicle type');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast.success('Account created successfully! Redirecting...');
      router.push('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2.5 px-6 py-5">
          <Logo />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-[#0F172A]">SHARK</span>
            <span className="text-[#F59E0B]">ONE</span>
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 md:px-16 lg:px-24 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Desktop Logo */}
            <div className="hidden lg:flex items-center gap-2.5 mb-8">
              <Logo />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-[#0F172A]">SHARK</span>
                <span className="text-[#F59E0B]">ONE</span>
              </span>
            </div>

            <h1 className="text-3xl font-bold text-[#0F172A]">Create Account</h1>
            <p className="text-gray-500 mt-1.5 mb-7">Join the SHARKONE marketplace</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    className="pl-10 h-11"
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                  />
                </div>
              </div>

              {/* Email & Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-11"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      placeholder="+254 700 000 000"
                      className="pl-10 h-11"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11"
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11"
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-gray-700">I want to join as</label>
                <div className="grid grid-cols-3 gap-3">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const isSelected = activeRole === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? 'border-amber-400 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="role-check"
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-amber-600' : 'text-gray-400'}`} />
                        <span className={`text-xs font-semibold ${isSelected ? 'text-amber-700' : 'text-gray-600'}`}>
                          {r.label}
                        </span>
                        <span className="text-[10px] text-gray-400 leading-tight">{r.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seller extra fields */}
              <AnimatePresence>
                {activeRole === 'seller' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 pt-1">
                      <div className="space-y-1.5">
                        <label htmlFor="storeName" className="text-sm font-medium text-gray-700">
                          Store Name
                        </label>
                        <div className="relative">
                          <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="storeName"
                            placeholder="My Awesome Store"
                            className="pl-10 h-11"
                            value={form.storeName}
                            onChange={(e) => update('storeName', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="storeDescription" className="text-sm font-medium text-gray-700">
                          Store Description
                        </label>
                        <Textarea
                          id="storeDescription"
                          placeholder="Tell customers about your store..."
                          rows={3}
                          className="resize-none"
                          value={form.storeDescription}
                          onChange={(e) => update('storeDescription', e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Delivery extra fields */}
              <AnimatePresence>
                {activeRole === 'delivery' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Vehicle Type</label>
                        <Select
                          value={form.vehicleType}
                          onValueChange={(v) => update('vehicleType', v)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="motorcycle">Motorcycle</SelectItem>
                            <SelectItem value="car">Car</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="idNumber" className="text-sm font-medium text-gray-700">
                          ID Number
                        </label>
                        <Input
                          id="idNumber"
                          placeholder="National ID number"
                          className="h-11"
                          value={form.idNumber}
                          onChange={(e) => update('idNumber', e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Terms */}
              <div className="flex items-start gap-2.5 pt-1">
                <Checkbox
                  id="terms"
                  checked={terms}
                  onCheckedChange={(v) => setTerms(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-gray-500 cursor-pointer leading-snug">
                  I agree to the{' '}
                  <Link href="#" className="text-amber-600 hover:text-amber-700 font-medium">
                    Terms & Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="#" className="text-amber-600 hover:text-amber-700 font-medium">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold text-sm"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="h-5 w-5 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full"
                  />
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-amber-600 hover:text-amber-700 font-semibold transition"
              >
                Sign In
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Branded (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-[#0F172A] flex-col items-center justify-center px-12 xl:px-16 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-500/5" />
        <div className="absolute -bottom-48 -left-24 w-80 h-80 rounded-full bg-amber-500/5" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 text-center max-w-sm"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#F59E0B" />
              <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="#0F172A" />
            </svg>
            <span className="text-3xl font-bold tracking-tight">
              <span className="text-white">SHARK</span>
              <span className="text-amber-400">ONE</span>
            </span>
          </div>

          <p className="text-amber-400 text-lg font-medium mb-10 tracking-wide">
            Shop. Ship. Smile.
          </p>

          <div className="space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Join a growing marketplace</p>
                <p className="text-gray-400 text-xs mt-0.5">500+ sellers, 50K+ products and counting</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Built-in logistics</p>
                <p className="text-gray-400 text-xs mt-0.5">SharkShip handles delivery for you</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Secure from day one</p>
                <p className="text-gray-400 text-xs mt-0.5">Protected payments and verified accounts</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}