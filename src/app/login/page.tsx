'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  Truck,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#0F172A" />
    <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="#F59E0B" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { setLoginData, selectedAccount, isAuthenticated } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated && selectedAccount) {
      router.push(selectedAccount.redirectPath);
    }
  }, [isAuthenticated, selectedAccount, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      setLoginData(data.user, data.accounts);

      if (data.requiresRoleSelection) {
        toast.success(`Welcome, ${data.user.name}!`);
        setLoading(false);
      } else {
        const account = data.accounts[0];
        toast.success(`Welcome back, ${data.user.name}!`);
        setLoading(false);
        setTimeout(() => {
          router.push(account.redirectPath);
        }, 500);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col bg-white">
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
            <div className="hidden lg:flex items-center gap-2.5 mb-10">
              <Logo />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-[#0F172A]">SHARK</span>
                <span className="text-[#F59E0B]">ONE</span>
              </span>
            </div>

            <h1 className="text-3xl font-bold text-[#0F172A]">Welcome Back</h1>
            <p className="text-gray-500 mt-1.5 mb-2">Sign in to your account</p>

            {/* Demo hint */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-6">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Demo:</span> Use{' '}
                <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">roy@sharkone.com</code>
                {' '}with any password to see the multi-account role picker.
                {' '}Or try{' '}
                <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">techstore@sharkone.com</code>
                {' '}for direct seller login.
              </p>
            </div>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 h-11"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(''); }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter any password (demo mode)"
                    className="pl-10 pr-10 h-11"
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(''); }}
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

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">Remember me</label>
                </div>
                <Link href="#" className="text-sm text-amber-600 hover:text-amber-700 font-medium transition">
                  Forgot password?
                </Link>
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
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-gray-200 hover:bg-gray-50 text-sm font-medium"
              onClick={() => toast.info('Google sign-in coming soon')}
            >
              <svg className="h-4 w-4 mr-2.5" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-500 mt-7">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-amber-600 hover:text-amber-700 font-semibold transition">
                Sign Up
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

          <p className="text-amber-400 text-lg font-medium mb-10 tracking-wide">Shop. Ship. Smile.</p>

          <div className="space-y-6 text-left">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Browse thousands of products</p>
                <p className="text-gray-400 text-xs mt-0.5">From electronics to fashion, find it all</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Track orders in real-time</p>
                <p className="text-gray-400 text-xs mt-0.5">Know exactly where your package is</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Secure payments</p>
                <p className="text-gray-400 text-xs mt-0.5">Your transactions are always protected</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
