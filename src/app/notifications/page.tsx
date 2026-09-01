'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Package,
  Truck,
  DollarSign,
  Settings,
  CheckCheck,
  ArrowLeft,
  CircleDot,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Notification } from '@/types';

// ---------- Icon Mapping ----------

const typeIcons: Record<string, React.ReactNode> = {
  ORDER: <Package className="h-5 w-5 text-amber-600" />,
  DELIVERY: <Truck className="h-5 w-5 text-emerald-600" />,
  PAYMENT: <DollarSign className="h-5 w-5 text-sky-600" />,
  SYSTEM: <Bell className="h-5 w-5 text-gray-500" />,
};

const typeBg: Record<string, string> = {
  ORDER: 'bg-amber-50',
  DELIVERY: 'bg-emerald-50',
  PAYMENT: 'bg-sky-50',
  SYSTEM: 'bg-gray-100',
};

const typeBorder: Record<string, string> = {
  ORDER: 'border-l-amber-500',
  DELIVERY: 'border-l-emerald-500',
  PAYMENT: 'border-l-sky-500',
  SYSTEM: 'border-l-gray-400',
};

type TabFilter = 'all' | 'order' | 'payment' | 'system';

const tabFilterMap: Record<TabFilter, (n: Notification) => boolean> = {
  all: () => true,
  order: (n) => n.type === 'ORDER' || n.type === 'DELIVERY',
  payment: (n) => n.type === 'PAYMENT',
  system: (n) => n.type === 'SYSTEM',
};

// ---------- Empty State Illustration ----------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-6">
        <div className="h-28 w-28 rounded-full bg-gray-50 flex items-center justify-center">
          <BellOff className="h-12 w-12 text-gray-300" />
        </div>
        <CircleDot className="h-4 w-4 text-amber-400 absolute -bottom-1 -right-1" />
      </div>
      <h3 className="text-lg font-semibold text-[#0F172A] mb-1">No notifications yet</h3>
      <p className="text-sm text-gray-500 max-w-xs">
        We&apos;ll notify you about orders, payments, and important updates here. Stay tuned!
      </p>
      <Button asChild variant="outline" className="mt-6 border-amber-300 text-amber-700 hover:bg-amber-50">
        <Link href="/">Start Shopping</Link>
      </Button>
    </div>
  );
}

// ---------- Notification Item ----------

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      onClick={() => {
        if (!notification.isRead) onMarkRead(notification.id);
      }}
      className={`flex items-start gap-4 p-4 rounded-xl border border-gray-100 cursor-pointer transition-all hover:shadow-sm hover:border-gray-200 border-l-4 ${
        typeBorder[notification.type] ?? 'border-l-gray-400'
      } ${!notification.isRead ? 'bg-amber-50/30' : 'bg-white'}`}
    >
      {/* Icon */}
      <div
        className={`shrink-0 h-11 w-11 rounded-full flex items-center justify-center ${
          typeBg[notification.type] ?? 'bg-gray-100'
        }`}
      >
        {typeIcons[notification.type] ?? <Bell className="h-5 w-5 text-gray-500" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className={`text-sm ${
              !notification.isRead
                ? 'font-semibold text-[#0F172A]'
                : 'font-medium text-gray-600'
            }`}
          >
            {notification.title}
          </h4>
          {!notification.isRead && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-amber-500" />
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </motion.div>
  );
}

// ---------- Preferences Panel ----------

function PreferencesPanel() {
  const { data, isLoading } = useQuery<{ preferences: Record<string, boolean> }>({
    queryKey: ['notification-prefs'],
    queryFn: () => fetch('/api/notifications/preferences').then((r) => r.json()),
  });

  const updatePref = useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Preferences updated');
    },
  });

  const prefs = data?.preferences ?? {
    email: true,
    push: true,
    orderUpdates: true,
    promotions: false,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const prefItems = [
    { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
    { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
    { key: 'orderUpdates', label: 'Order Updates', desc: 'Updates on order status changes' },
    { key: 'promotions', label: 'Promotions & Deals', desc: 'Special offers and discount alerts' },
  ];

  return (
    <div className="space-y-1">
      {prefItems.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between py-3 px-1 border-b border-gray-50 last:border-0"
        >
          <div className="mr-4">
            <Label className="text-sm font-medium text-[#0F172A] cursor-pointer">
              {item.label}
            </Label>
            <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
          </div>
          <Switch
            checked={!!prefs[item.key]}
            onCheckedChange={(checked) => {
              updatePref.mutate({ [item.key]: checked });
            }}
            disabled={updatePref.isPending}
          />
        </div>
      ))}
    </div>
  );
}

// ---------- Main Page ----------

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [showPrefs, setShowPrefs] = useState(false);

  const { data, isLoading } = useQuery<{
    notifications: Notification[];
    unreadCount: number;
  }>({
    queryKey: ['notifications-all'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PUT' });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const ids = (data?.notifications ?? []).filter((n) => !n.isRead).map((n) => n.id);
      if (ids.length === 0) return;
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      toast.success('All notifications marked as read');
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const filtered = notifications.filter(tabFilterMap[activeTab]);

  return (
    <main className="min-h-screen bg-gray-50/50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-[#0F172A]"
              asChild
            >
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs ${showPrefs ? 'bg-amber-50 text-amber-700' : 'text-gray-500 hover:text-[#0F172A]'}`}
              onClick={() => setShowPrefs(!showPrefs)}
            >
              <Settings className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Preferences</span>
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-[#0F172A]"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Mark all as read</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Preferences Panel */}
        <AnimatePresence>
          {showPrefs && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-amber-500" />
                  Notification Preferences
                </h3>
                <PreferencesPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabFilter)}
          className="mb-6"
        >
          <TabsList className="bg-gray-100 h-9 p-1 rounded-lg">
            <TabsTrigger
              value="all"
              className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] rounded-md h-7 px-3"
            >
              All
              {unreadCount > 0 && (
                <Badge className="ml-1.5 bg-red-500 text-white text-[9px] px-1 py-0 h-4 min-w-4 font-bold hover:bg-red-500">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="order"
              className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] rounded-md h-7 px-3"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="payment"
              className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] rounded-md h-7 px-3"
            >
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#0F172A] rounded-md h-7 px-3"
            >
              System
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notification List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {filtered.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markRead.mutate(id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}
