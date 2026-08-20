'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  User,
  MapPin,
  FileText,
  Clock,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const Logo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#0F172A" />
    <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="#F59E0B" />
  </svg>
);

const PAYMENT_TERMS = [
  { value: 'NET_15', label: 'Net 15', desc: 'Payment due within 15 days' },
  { value: 'NET_30', label: 'Net 30', desc: 'Payment due within 30 days' },
  { value: 'NET_60', label: 'Net 60', desc: 'Payment due within 60 days' },
  { value: 'NET_90', label: 'Net 90', desc: 'Payment due within 90 days' },
];

export default function B2BRegistrationPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    registrationNo: '',
    businessEmail: '',
    phone: '',
    county: '',
    city: '',
    address: '',
    paymentTerms: 'NET_30',
    contactName: '',
    contactEmail: '',
    password: '',
  });

  const update = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.companyName.trim() ||
      !form.businessEmail.trim() ||
      !form.county.trim() ||
      !form.contactName.trim() ||
      !form.contactEmail.trim() ||
      !form.password.trim()
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/b2b/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }

      setSubmitted(true);
      toast.success('Company account registered successfully!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="flex items-center gap-2.5 px-6 py-5">
          <Logo />
          <span className="text-xl font-bold tracking-tight">
            <span className="text-[#0F172A]">SHARK</span>
            <span className="text-[#F59E0B]">ONE</span>
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Registration Submitted!</h1>
            <p className="text-gray-500 mb-8">
              Your company account for <span className="font-semibold text-[#0F172A]">{form.companyName}</span> has been
              registered. Our team will verify your account and get back to you within 24-48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push('/')}
                className="bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold"
              >
                Go to Homepage
              </Button>
              <Button variant="outline" onClick={() => { setSubmitted(false); }}>
                Register Another
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-5">
          <Link href="/" className="text-gray-400 hover:text-[#0F172A] transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-xl font-bold tracking-tight">
              <span className="text-[#0F172A]">SHARK</span>
              <span className="text-[#F59E0B]">ONE</span>
            </span>
          </div>
          <span className="ml-2 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">B2B</span>
        </div>

        <div className="flex-1 flex items-start justify-center px-6 md:px-16 lg:px-24 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <h1 className="text-3xl font-bold text-[#0F172A] mb-1">B2B Company Registration</h1>
            <p className="text-gray-500 mb-8">
              Register your business for bulk ordering, credit terms, and invoicing.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section: Company Details */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-[#0F172A]">Company Details</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="companyName"
                        placeholder="Acme Corporation"
                        className="pl-10 h-11"
                        value={form.companyName}
                        onChange={(e) => update('companyName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="registrationNo" className="text-sm font-medium text-gray-700">
                      Registration Number
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="registrationNo"
                        placeholder="BRN-2024-001234"
                        className="pl-10 h-11"
                        value={form.registrationNo}
                        onChange={(e) => update('registrationNo', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="businessEmail" className="text-sm font-medium text-gray-700">
                      Business Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="businessEmail"
                        type="email"
                        placeholder="accounts@company.com"
                        className="pl-10 h-11"
                        value={form.businessEmail}
                        onChange={(e) => update('businessEmail', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Business Phone
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
              </section>

              {/* Section: Address */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-[#0F172A]">Business Address</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="county" className="text-sm font-medium text-gray-700">
                      County <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="county"
                        placeholder="Nairobi"
                        className="pl-10 h-11"
                        value={form.county}
                        onChange={(e) => update('county', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="city" className="text-sm font-medium text-gray-700">
                      City
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="city"
                        placeholder="Westlands"
                        className="pl-10 h-11"
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="address" className="text-sm font-medium text-gray-700">
                      Full Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="address"
                        placeholder="123 Business Park, Waiyaki Way"
                        className="pl-10 h-11"
                        value={form.address}
                        onChange={(e) => update('address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Payment Terms */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-[#0F172A]">Payment Terms</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PAYMENT_TERMS.map((term) => {
                    const isSelected = form.paymentTerms === term.value;
                    return (
                      <button
                        key={term.value}
                        type="button"
                        onClick={() => update('paymentTerms', term.value)}
                        className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? 'border-amber-400 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <span className={`text-sm font-semibold ${isSelected ? 'text-amber-700' : 'text-gray-600'}`}>
                          {term.label}
                        </span>
                        <span className="text-[10px] text-gray-400 leading-tight">{term.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Section: Contact Person */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-[#0F172A]">Contact Person</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contactName" className="text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="contactName"
                        placeholder="Jane Wanjiru"
                        className="pl-10 h-11"
                        value={form.contactName}
                        onChange={(e) => update('contactName', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contactEmail" className="text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="jane@company.com"
                        className="pl-10 h-11"
                        value={form.contactEmail}
                        onChange={(e) => update('contactEmail', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative max-w-xs">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 8 characters"
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
                </div>
              </section>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none h-12 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold text-sm px-8"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="h-5 w-5 border-2 border-[#0F172A]/30 border-t-[#0F172A] rounded-full"
                    />
                  ) : (
                    'Register Company Account'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="h-12"
                >
                  Cancel
                </Button>
              </div>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8">
              Already have a B2B account?{' '}
              <Link href="/login" className="text-amber-600 hover:text-amber-700 font-semibold transition">
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

          <p className="text-amber-400 text-lg font-medium mb-10 tracking-wide">B2B Commerce</p>

          <div className="space-y-6 text-left">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Company accounts</p>
                <p className="text-gray-400 text-xs mt-0.5">Manage business purchases with dedicated accounts</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Purchase orders & invoices</p>
                <p className="text-gray-400 text-xs mt-0.5">PO tracking with automated invoice generation</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Flexible credit terms</p>
                <p className="text-gray-400 text-xs mt-0.5">NET 15, 30, 60, or 90 day payment terms</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
