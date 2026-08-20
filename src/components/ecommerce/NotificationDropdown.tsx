'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Package, Truck, DollarSign, Bell, CheckCheck, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Notification } from '@/types';

interface NotificationDropdownProps {
  open: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  ORDER: <Package className="h-4 w-4 text-amber-600" />,
  DELIVERY: <Truck className="h-4 w-4 text-emerald-600" />,
  PAYMENT: <DollarSign className="h-4 w-4 text-sky-600" />,
  SYSTEM: <Bell className="h-4 w-4 text-gray-500" />,
};

const typeBg: Record<string, string> = {
  ORDER: 'bg-amber-50',
  DELIVERY: 'bg-emerald-50',
  PAYMENT: 'bg-sky-50',
  SYSTEM: 'bg-gray-50',
};

export function NotificationDropdown({ open, onClose }: NotificationDropdownProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    notifications: Notification[];
    unreadCount: number;
  }>({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then((r) => r.json()),
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids }),
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      toast.success('All notifications marked as read');
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleMarkAllRead = () => {
    const unreadIds = notifications
      .filter((n) => !n.isRead)
      .map((n) => n.id);
    if (unreadIds.length === 0) return;
    markAllRead.mutate(unreadIds);
  };

  const handleNotificationClick = (notification: Notification) => {
    toast.info(notification.title, { description: notification.message });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[65]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-2xl z-[70] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-5 font-bold hover:bg-red-500"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500 hover:text-[#0F172A] h-7 px-2"
                  onClick={handleMarkAllRead}
                  disabled={markAllRead.isPending}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark all as read
                </Button>
              )}
            </div>

            {/* Notification List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-amber-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <BellOff className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">
                  No notifications yet
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  We&apos;ll let you know when something arrives
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[360px]">
                <div className="divide-y divide-gray-50">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-gray-50 cursor-pointer ${
                        !notification.isRead ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`shrink-0 mt-0.5 h-8 w-8 rounded-full flex items-center justify-center ${
                          typeBg[notification.type] ?? 'bg-gray-50'
                        }`}
                      >
                        {typeIcons[notification.type] ?? (
                          <Bell className="h-4 w-4 text-gray-500" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm truncate ${
                              !notification.isRead
                                ? 'font-semibold text-[#0F172A]'
                                : 'font-medium text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="shrink-0 h-2 w-2 rounded-full bg-amber-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
