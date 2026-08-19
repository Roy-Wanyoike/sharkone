'use client';

import { useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Store,
  Truck,
  Shield,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type AuthAccount } from '@/store/auth-store';
import { toast } from 'sonner';

const roleIcons: Record<string, React.ReactNode> = {
  BUYER: <User className="h-6 w-6" />,
  SELLER: <Store className="h-6 w-6" />,
  DELIVERY: <Truck className="h-6 w-6" />,
  ADMIN: <Shield className="h-6 w-6" />,
};

const roleColors: Record<string, { bg: string; border: string; iconBg: string; iconText: string; badge: string }> = {
  BUYER: {
    bg: 'bg-white hover:border-amber-300 hover:shadow-md',
    border: 'border-gray-200',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-700',
  },
  SELLER: {
    bg: 'bg-white hover:border-amber-300 hover:shadow-md',
    border: 'border-gray-200',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700',
  },
  DELIVERY: {
    bg: 'bg-white hover:border-amber-300 hover:shadow-md',
    border: 'border-gray-200',
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
    badge: 'bg-orange-50 text-orange-700',
  },
  ADMIN: {
    bg: 'bg-white hover:border-amber-300 hover:shadow-md',
    border: 'border-gray-200',
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
    badge: 'bg-purple-50 text-purple-700',
  },
};

export function RolePickerModal() {
  const router = useRouter();
  const { user, accounts, selectAccount, logout } = useAuthStore();
  // useSyncExternalStore: false on server, true on client — avoids hydration mismatch
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const handleSelect = (account: AuthAccount) => {
    selectAccount(account);
    toast.success(`Logged in as ${account.label}${account.storeName ? ` (${account.storeName})` : ''}`);
    setTimeout(() => {
      router.push(account.redirectPath);
    }, 400);
  };

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    router.push('/login');
  };

  // Don't render if not authenticated or no role selection needed
  if (!mounted || !user || accounts.length <= 1) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#0F172A] px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Welcome back</p>
                <h2 className="text-white text-lg font-bold mt-1">Choose an Account</h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  {user.name} &middot; {user.email}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 font-bold text-lg">
                  {user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
            </div>
          </div>

          {/* Role Cards */}
          <div className="p-5">
            <p className="text-sm text-gray-500 mb-4">
              You have access to multiple accounts. Select one to continue:
            </p>
            <div className="space-y-3">
              {accounts.map((account, i) => {
                const colors = roleColors[account.role] ?? roleColors.BUYER;
                return (
                  <motion.button
                    key={account.role}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => handleSelect(account)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 ${colors.bg} ${colors.border} transition-all duration-200 cursor-pointer group text-left`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center shrink-0 ${colors.iconText} group-hover:scale-105 transition-transform`}>
                      {roleIcons[account.role] ?? <User className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{account.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                          {account.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {account.storeName
                          ? `${account.storeName} — ${account.description}`
                          : account.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Use a different account</span>
              </button>
              <p className="text-[10px] text-gray-300">SHARKONE &middot; Secure Login</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
