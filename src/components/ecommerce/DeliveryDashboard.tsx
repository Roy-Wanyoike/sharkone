'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Truck,
  CheckCircle2,
  Package,
  DollarSign,
  Star,
  MapPin,
  Navigation,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                         */
/* ------------------------------------------------------------------ */

const deliveryStats = [
  { label: 'Active Deliveries', value: '3', icon: <Truck className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
  { label: 'Completed Today', value: '7', icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-700' },
  { label: 'Total Earnings', value: '$184.50', icon: <DollarSign className="h-5 w-5" />, color: 'bg-gray-100 text-gray-700' },
  { label: 'Rating', value: '4.9', icon: <Star className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
];

type DeliveryStep = 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'NEAR_LOCATION' | 'DELIVERED';

const allSteps: DeliveryStep[] = ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_LOCATION', 'DELIVERED'];

const stepLabels: Record<DeliveryStep, string> = {
  ASSIGNED: 'Assigned',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  NEAR_LOCATION: 'Near Location',
  DELIVERED: 'Delivered',
};

interface ActiveDelivery {
  id: string;
  orderNumber: string;
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  otp: string;
  currentStep: DeliveryStep;
}

const activeDeliveries: ActiveDelivery[] = [
  {
    id: 'd1',
    orderNumber: 'ORD-2401',
    customerName: 'Alice Johnson',
    pickupAddress: '1234 Warehouse Blvd, Suite 100',
    deliveryAddress: '789 Oak Street, Apt 4B',
    otp: '4829',
    currentStep: 'IN_TRANSIT',
  },
  {
    id: 'd2',
    orderNumber: 'ORD-2403',
    customerName: 'Carol Williams',
    pickupAddress: '567 Commerce Ave, Unit 3',
    deliveryAddress: '321 Pine Lane',
    otp: '7156',
    currentStep: 'PICKED_UP',
  },
  {
    id: 'd3',
    orderNumber: 'ORD-2405',
    customerName: 'Eva Martinez',
    pickupAddress: '890 Logistics Park, Bldg C',
    deliveryAddress: '456 Elm Drive, House 12',
    otp: '3062',
    currentStep: 'NEAR_LOCATION',
  },
];

const deliveryHistory = [
  { id: 'h1', orderNumber: 'ORD-2398', customer: 'David Brown', status: 'Delivered', earnings: '$12.50', date: '2026-01-15' },
  { id: 'h2', orderNumber: 'ORD-2395', customer: 'Frank Lee', status: 'Delivered', earnings: '$8.00', date: '2026-01-15' },
  { id: 'h3', orderNumber: 'ORD-2390', customer: 'Grace Kim', status: 'Delivered', earnings: '$15.00', date: '2026-01-14' },
  { id: 'h4', orderNumber: 'ORD-2387', customer: 'Henry Park', status: 'Delivered', earnings: '$9.50', date: '2026-01-14' },
  { id: 'h5', orderNumber: 'ORD-2382', customer: 'Ivy Chen', status: 'Delivered', earnings: '$22.00', date: '2026-01-13' },
  { id: 'h6', orderNumber: 'ORD-2378', customer: 'Jack Wilson', status: 'Failed', earnings: '$0.00', date: '2026-01-13' },
  { id: 'h7', orderNumber: 'ORD-2375', customer: 'Karen Adams', status: 'Delivered', earnings: '$11.00', date: '2026-01-12' },
];

/* ------------------------------------------------------------------ */
/*  Status Stepper                                                    */
/* ------------------------------------------------------------------ */

function StatusStepper({ current }: { current: DeliveryStep }) {
  const currentIndex = allSteps.indexOf(current);

  return (
    <div className="flex items-center gap-0 w-full mt-4">
      {allSteps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === allSteps.length - 1;

        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                      ? 'bg-[#F59E0B] text-white ring-4 ring-amber-100'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[9px] mt-1 text-center leading-tight hidden sm:block ${isCurrent ? 'text-amber-700 font-semibold' : isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>
                {stepLabels[step]}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-12px] sm:mt-0 ${i < currentIndex ? 'bg-emerald-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function DeliveryDashboard() {
  const [confirmDialog, setConfirmDialog] = useState<ActiveDelivery | null>(null);
  const [otpInput, setOtpInput] = useState('');

  const handleConfirmDelivery = () => {
    if (otpInput !== confirmDialog?.otp) {
      toast.error('Invalid OTP. Please try again.');
      return;
    }
    toast.success(`Delivery ${confirmDialog?.orderNumber} confirmed!`);
    setConfirmDialog(null);
    setOtpInput('');
  };

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp).then(() => {
      toast.success('OTP copied to clipboard');
    }).catch(() => {
      toast.info(`OTP: ${otp}`);
    });
  };

  return (
    <div className="px-4 md:px-16 lg:px-32 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your deliveries and track earnings</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {deliveryStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div className={`p-2 rounded-lg w-fit ${stat.color} mb-3`}>{stat.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Active Deliveries */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Active Deliveries</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeDeliveries.map((delivery) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-900">{delivery.orderNumber}</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] font-semibold">
                  Active
                </Badge>
              </div>

              <p className="text-sm text-gray-700 font-medium">{delivery.customerName}</p>

              {/* Addresses */}
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Package className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Pickup</p>
                    <p className="text-xs text-gray-600 truncate">{delivery.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Delivery</p>
                    <p className="text-xs text-gray-600 truncate">{delivery.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              {/* OTP */}
              <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-gray-500">Delivery OTP:</span>
                  <span className="text-sm font-bold text-gray-900 font-mono tracking-widest">{delivery.otp}</span>
                </div>
                <button
                  onClick={() => handleCopyOtp(delivery.otp)}
                  className="p-1 hover:bg-gray-200 rounded transition"
                  aria-label="Copy OTP"
                >
                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>

              {/* Status Stepper */}
              <StatusStepper current={delivery.currentStep} />

              {/* Confirm Button */}
              <Button
                className="w-full mt-4 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg"
                onClick={() => {
                  setConfirmDialog(delivery);
                  setOtpInput('');
                }}
              >
                Confirm Delivery
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Delivery History */}
      <div>
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Delivery History</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Order #</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Earnings</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deliveryHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-900">{item.orderNumber}</td>
                    <td className="px-6 py-3 text-gray-600">{item.customer}</td>
                    <td className="px-6 py-3">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold ${
                          item.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className={`px-6 py-3 font-semibold ${item.earnings === '$0.00' ? 'text-gray-400' : 'text-emerald-600'}`}>
                      {item.earnings}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirm Delivery Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) setConfirmDialog(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              Confirm Delivery
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-gray-600">
              Enter the delivery OTP to confirm delivery for{' '}
              <span className="font-semibold text-gray-900">{confirmDialog?.orderNumber}</span>
            </p>
            <p className="text-sm text-gray-500">
              Customer: <span className="font-medium text-gray-700">{confirmDialog?.customerName}</span>
            </p>
            <div className="grid gap-2">
              <label htmlFor="otp-input" className="text-sm font-medium text-gray-700">OTP Code</label>
              <Input
                id="otp-input"
                placeholder="Enter 4-digit OTP"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="text-center text-lg font-mono tracking-widest"
                maxLength={4}
              />
            </div>
            <Button
              className="w-full bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold rounded-lg"
              onClick={handleConfirmDelivery}
              disabled={otpInput.length !== 4}
            >
              Verify & Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
