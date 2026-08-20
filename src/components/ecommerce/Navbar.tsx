'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Bell, ShoppingBag, Menu, X, User, Store, Truck, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCartStore } from '@/store/cart-store';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationDropdown } from '@/components/ecommerce/NotificationDropdown';
import type { Role } from '@/types';

interface NavbarProps {
  onSearchOpen: () => void;
  onRoleChange: (role: Role) => void;
  activeRole: Role;
}

const roleOptions: { value: Role; label: string; icon: React.ReactNode; href: string }[] = [
  { value: 'buyer', label: 'Buyer', icon: <User className="h-4 w-4" />, href: '/account' },
  { value: 'seller', label: 'Seller Dashboard', icon: <Store className="h-4 w-4" />, href: '/dashboard/seller' },
  { value: 'delivery', label: 'Delivery Dashboard', icon: <Truck className="h-4 w-4" />, href: '/dashboard/delivery' },
];

export function Navbar({ onSearchOpen, onRoleChange, activeRole }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);
  const openCart = useCartStore((s) => s.openCart);

  const currentRoleLabel = roleOptions.find((r) => r.value === activeRole)?.label ?? 'Buyer';

  const { data: notifData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
    refetchInterval: 30_000,
  });
  const notificationCount = notifData?.unreadCount ?? 0;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-16 lg:px-32 py-3 backdrop-blur-md border-b border-gray-200 bg-white/90 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M16 4C14 4 10 8 8 12C6 16 6 22 8 26C10 28 14 28 16 28C18 28 22 28 24 26C26 22 26 16 24 12C22 8 18 4 16 4Z" fill="#0F172A" />
          <path d="M16 4C15 4 13 6 12 8C11 10 11 14 12 16C13 17 15 17 16 17C17 17 19 17 20 16C21 14 21 10 20 8C19 6 17 4 16 4Z" fill="#F59E0B" />
        </svg>
        <span className="text-xl font-bold tracking-tight">
          <span className="text-[#0F172A]">SHARK</span>
          <span className="text-[#F59E0B]">ONE</span>
        </span>
      </div>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/"
          className="text-gray-700 hover:text-amber-600 transition-colors text-sm font-medium"
        >
          Home
        </Link>
        <a
          href="#products"
          className="text-gray-700 hover:text-amber-600 transition-colors text-sm font-medium"
        >
          Shop
        </a>
        <Link
          href="/sell"
          className="text-gray-700 hover:text-amber-600 transition-colors text-sm font-medium"
        >
          Sell
        </Link>
        <Link
          href="/track"
          className="text-gray-700 hover:text-amber-600 transition-colors text-sm font-medium"
        >
          Track Order
        </Link>
        <Link
          href="/about"
          className="text-gray-700 hover:text-amber-600 transition-colors text-sm font-medium"
        >
          About
        </Link>
        <Link
          href="/contact"
          className="text-gray-700 hover:text-amber-600 transition-colors text-sm font-medium"
        >
          Contact
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Search Button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={onSearchOpen}
          aria-label="Open search"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Notification Bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Notifications"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
              >
                {notificationCount}
              </motion.span>
            )}
          </Button>
          <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* Login Button */}
        <Button asChild variant="ghost" size="sm" className="hidden lg:flex items-center gap-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg">
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild size="sm" className="hidden lg:flex items-center bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg">
          <Link href="/register">Sign Up</Link>
        </Button>

        {/* Role Switcher Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-1.5 text-xs border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              {roleOptions.find((r) => r.value === activeRole)?.icon}
              <span>{currentRoleLabel}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {roleOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onRoleChange(option.value)}
                className={`flex items-center gap-2 cursor-pointer ${
                  activeRole === option.value ? 'bg-amber-50 text-amber-700' : ''
                }`}
              >
                {option.icon}
                <span className="text-sm">{option.label}</span>
              </DropdownMenuItem>
            ))}
            <div className="border-t border-gray-100 my-1" />
            <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
              <Link href={roleOptions.find((r) => r.value === activeRole)?.href ?? '/'} className="flex items-center gap-2 text-sm w-full">
                <LayoutDashboard className="h-4 w-4" />
                <span>Open Full Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="flex items-center gap-2 cursor-pointer">
              <Link href="/admin" className="flex items-center gap-2 text-sm w-full">
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Cart Button */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          onClick={openCart}
          aria-label="Shopping Cart"
        >
          <ShoppingBag className="h-5 w-5" />
          {totalItems() > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {totalItems()}
            </motion.span>
          )}
        </Button>

        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-gray-600 hover:text-gray-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg md:hidden"
          >
            <div className="flex flex-col p-4 gap-1">
              <Link
                href="/"
                className="text-gray-700 hover:text-amber-600 py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 block"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <a
                href="#products"
                className="text-gray-700 hover:text-amber-600 py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 block"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </a>
              <Link
                href="/sell"
                className="text-gray-700 hover:text-amber-600 py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 block"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell
              </Link>
              <Link
                href="/track"
                className="text-gray-700 hover:text-amber-600 py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 block"
                onClick={() => setMobileMenuOpen(false)}
              >
                Track Order
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-amber-600 py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 block"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-gray-700 hover:text-amber-600 py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 block"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="border-t border-gray-100 my-2" />
              <p className="px-3 text-xs text-gray-400 uppercase tracking-wider mb-1">Switch Role</p>
              {roleOptions.map((option) => (
                <Link
                  key={option.value}
                  href={option.href}
                  className={`flex items-center gap-2 py-2.5 text-sm font-medium px-3 rounded-lg transition-colors ${
                    activeRole === option.value
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    onRoleChange(option.value);
                    setMobileMenuOpen(false);
                  }}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </Link>
              ))}
              <Link
                href="/admin"
                className="flex items-center gap-2 py-2.5 text-sm font-medium px-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
              <div className="border-t border-gray-100 my-2" />
              <div className="flex gap-2 px-3">
                <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                </Button>
                <Button asChild size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs">
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
