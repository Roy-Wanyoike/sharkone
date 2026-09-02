'use client';

import { useState, useEffect, useCallback, Suspense, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckCircle2,
  Circle,
  Loader2,
  MapPin,
  Eye,
  EyeOff,
  Package,
  Phone,
  Truck,
  Menu,
  X,
  Clock,
  Navigation,
  Ruler,
  Gauge,
  Signal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Footer } from '@/components/ecommerce/Footer';
import { useCurrencyStore } from '@/store/currency-store';
import { formatCurrency } from '@/lib/currency';

/* ------------------------------------------------------------------ */
/*  Hydration-safe mounted hook                                        */
/* ------------------------------------------------------------------ */
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

interface TrackingDelivery {
  id: string;
  status: string;
  pickupOtp: string | null;
  deliveryOtp: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    shippingAddress: string;
    createdAt: string;
    items: { id: string; name: string; image: string; quantity: number; price: number }[];
  };
  deliveryPerson: { id: string; name: string; phone: string | null; avatar: string | null } | null;
  waypoints: Waypoint[];
}

interface TrackingInfo {
  eta: string | null;
  totalDistanceKm: number;
  currentSpeedKmh: number | null;
  waypointCount: number;
}

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
            className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
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
                className="py-2.5 text-sm font-medium px-3 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                {l.label}
              </Link>
            ))}
            <Separator className="my-2" />
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
/*  SVG Route Map Visualization                                        */
/* ------------------------------------------------------------------ */
function RouteMap({ waypoints }: { waypoints: Waypoint[] }) {
  const mounted = useMounted();
  if (!mounted || waypoints.length === 0) return null;

  const W = 600;
  const H = 320;
  const PAD = 60;

  const lats = waypoints.map((w) => w.latitude);
  const lngs = waypoints.map((w) => w.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  const toSvgX = (lng: number) => PAD + ((lng - minLng) / lngRange) * (W - 2 * PAD);
  const toSvgY = (lat: number) => PAD + ((maxLat - lat) / latRange) * (H - 2 * PAD);

  const svgPoints = waypoints.map((w) => ({ x: toSvgX(w.longitude), y: toSvgY(w.latitude) }));

  // Build a smooth path through all waypoints
  const pathD = svgPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Pickup point (first waypoint)
  const pickup = svgPoints[0];
  // Destination is an extrapolated point beyond the last waypoint
  const lastWp = waypoints[waypoints.length - 1];
  const lastPt = svgPoints[svgPoints.length - 1];
  const destX = lastPt.x + Math.min(80, (W - 2 * PAD) * 0.15);
  const destY = lastPt.y - Math.min(30, (H - 2 * PAD) * 0.1);

  return (
    <div className="bg-[#0F172A] rounded-xl p-4 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Navigation className="h-4 w-4 text-amber-400" />
          Live Route Map
        </h3>
        <span className="flex items-center gap-1.5 text-[10px] text-green-400 font-medium bg-green-900/30 px-2.5 py-1 rounded-full">
          <Signal className="h-3 w-3" />
          LIVE
        </span>
      </div>

      <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-700/50">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          style={{ minHeight: '200px' }}
          aria-label="Delivery route visualization"
        >
          {/* Grid lines for map feel */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="url(#grid)" />

          {/* Route path (dotted) */}
          <path
            d={pathD}
            fill="none"
            stroke="#475569"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            strokeLinecap="round"
          />

          {/* Completed waypoint dots (slate) */}
          {svgPoints.slice(0, -1).map((p, i) => (
            <circle
              key={waypoints[i].id}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="1.5"
            />
          ))}

          {/* Pickup marker */}
          <g transform={`translate(${pickup.x}, ${pickup.y})`}>
            <circle r="14" fill="#0F172A" stroke="#22c55e" strokeWidth="2" />
            <text textAnchor="middle" dominantBaseline="central" fill="#22c55e" fontSize="12" fontWeight="bold">
              P
            </text>
          </g>

          {/* Destination marker */}
          <g transform={`translate(${destX}, ${destY})`}>
            <circle r="14" fill="#0F172A" stroke="#ef4444" strokeWidth="2" />
            <text textAnchor="middle" dominantBaseline="central" fill="#ef4444" fontSize="12" fontWeight="bold">
              D
            </text>
            {/* Dashed line from last waypoint to destination */}
          </g>
          <line
            x1={lastPt.x}
            y1={lastPt.y}
            x2={destX}
            y2={destY}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Current position - pulsing amber dot */}
          <g transform={`translate(${lastPt.x}, ${lastPt.y})`}>
            <circle r="20" fill="url(#pulseGlow)" opacity="0.5">
              <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="8" fill="#F59E0B" stroke="#0F172A" strokeWidth="2.5" />
            <circle r="3" fill="#0F172A" />
          </g>

          {/* Labels */}
          <text x={pickup.x} y={pickup.y - 22} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
            Pickup
          </text>
          <text x={destX} y={destY - 22} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
            Destination
          </text>
        </svg>
      </div>

      {/* Waypoint count badge */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
          {waypoints.length} waypoints
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          Current position
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delivery Status Timeline                                           */
/* ------------------------------------------------------------------ */
const ALL_STATUSES: { key: string; label: string }[] = [
  { key: 'ASSIGNED', label: 'Driver Assigned' },
  { key: 'PICKED_UP', label: 'Package Picked Up' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'NEAR_LOCATION', label: 'Near Your Location' },
  { key: 'DELIVERED', label: 'Delivered' },
];

function DeliveryTimeline({ status }: { status: string }) {
  const currentIdx = ALL_STATUSES.findIndex((s) => s.key === status);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-[#0F172A] mb-6">Delivery Status</h2>
      <div className="space-y-0">
        {ALL_STATUSES.map((step, i) => {
          const isLast = i === ALL_STATUSES.length - 1;
          const isCompleted = i < currentIdx || (i === currentIdx && (status === 'DELIVERED' || status === 'FAILED'));
          const isActive = i === currentIdx && status !== 'DELIVERED' && status !== 'FAILED';
          const isFailed = status === 'FAILED' && i === currentIdx;

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    isFailed
                      ? 'bg-red-500 text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isFailed ? (
                    <X className="h-4 w-4" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[40px] ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                <p
                  className={`font-semibold text-sm ${
                    isFailed
                      ? 'text-red-600'
                      : isCompleted
                      ? 'text-green-600'
                      : isActive
                      ? 'text-amber-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                  {isActive && (
                    <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      In Progress
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tracking Stats Row                                                 */
/* ------------------------------------------------------------------ */
function TrackingStats({ info }: { info: TrackingInfo }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white rounded-xl p-4 shadow-sm text-center">
        <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">ETA</p>
        <p className="text-sm font-bold text-[#0F172A] mt-0.5">{info.eta || 'Calculating...'}</p>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm text-center">
        <Ruler className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Distance</p>
        <p className="text-sm font-bold text-[#0F172A] mt-0.5">{info.totalDistanceKm} km</p>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm text-center">
        <Gauge className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Speed</p>
        <p className="text-sm font-bold text-[#0F172A] mt-0.5">{info.currentSpeedKmh ? `${info.currentSpeedKmh} km/h` : '--'}</p>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm text-center">
        <Navigation className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Waypoints</p>
        <p className="text-sm font-bold text-[#0F172A] mt-0.5">{info.waypointCount}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Track Content (inside Suspense for useSearchParams)           */
/* ------------------------------------------------------------------ */
function TrackContent() {
  const currencyCode = useCurrencyStore((s) => s.code);
  const mounted = useMounted();
  const searchParams = useSearchParams();
  const prefillOrder = searchParams.get('order') || '';

  const [searchInput, setSearchInput] = useState(prefillOrder);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [noTracking, setNoTracking] = useState(false);

  const [delivery, setDelivery] = useState<TrackingDelivery | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTracking = useCallback(async (query: string) => {
    try {
      const isPhone = /^[\d+\-\s()]{7,}$/.test(query.trim());
      const url = isPhone
        ? `/api/delivery/lookup?phone=${encodeURIComponent(query.trim())}`
        : `/api/delivery/lookup?orderNumber=${encodeURIComponent(query.trim())}`;
      const res = await fetch(url);
      if (!res.ok) {
        // Try to parse the body for a noDelivery flag
        let body: { noDelivery?: boolean } = {};
        try { body = await res.json(); } catch { /* ignore */ }
        if (body.noDelivery) {
          setNoTracking(true);
          setNotFound(false);
        } else {
          setNotFound(true);
          setNoTracking(false);
        }
        return null;
      }
      const data = await res.json();
      setDelivery(data.delivery);
      setTrackingInfo(data.trackingInfo);
      setNotFound(false);
      setNoTracking(false);
      return data.delivery as TrackingDelivery;
    } catch {
      setNotFound(true);
      setNoTracking(false);
      return null;
    }
  }, []);

  const stopSimulation = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setSimulating(false);
  }, []);

  const handleTrack = async () => {
    if (!searchInput.trim()) return;
    setSearching(true);
    setNotFound(false);
    setNoTracking(false);
    setDelivery(null);
    setTrackingInfo(null);
    stopSimulation();
    await fetchTracking(searchInput.trim());
    setSearching(false);
  };

  const handleRecentTrack = useCallback(async (orderNumber: string) => {
    setSearchInput(orderNumber);
    setSearching(true);
    setNotFound(false);
    setNoTracking(false);
    setDelivery(null);
    setTrackingInfo(null);
    stopSimulation();
    await fetchTracking(orderNumber);
    setSearching(false);
  }, [fetchTracking, stopSimulation]);

  // Simulation: add a new waypoint every 5 seconds
  const startSimulation = useCallback(() => {
    if (!delivery) return;
    setSimulating(true);

    simIntervalRef.current = setInterval(async () => {
      const currentDelivery = await new Promise<TrackingDelivery | null>((resolve) => {
        setDelivery((prev) => {
          resolve(prev);
          return prev;
        });
      });

      if (!currentDelivery || currentDelivery.waypoints.length === 0) return;

      const latest = currentDelivery.waypoints[currentDelivery.waypoints.length - 1];
      // Simulate GPS movement: small random offsets trending toward destination
      const latOffset = (Math.random() - 0.4) * 0.002;
      const lngOffset = (Math.random() - 0.35) * 0.003;
      const speed = 25 + Math.random() * 20; // 25-45 km/h
      const heading = latest.heading ? latest.heading + (Math.random() - 0.5) * 15 : 45 + Math.random() * 30;

      try {
        await fetch(`/api/delivery/${currentDelivery.id}/waypoints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: latest.latitude + latOffset,
            longitude: latest.longitude + lngOffset,
            speed: Math.round(speed * 10) / 10,
            heading: Math.round(heading * 10) / 10,
          }),
        });

        // Re-fetch tracking data
        const res = await fetch(`/api/delivery/lookup?orderNumber=${encodeURIComponent(currentDelivery.order.orderNumber)}`);
        if (res.ok) {
          const data = await res.json();
          setDelivery(data.delivery);
          setTrackingInfo(data.trackingInfo);
        }
      } catch {
        // Simulation error - silently continue
      }
    }, 5000);
  }, [delivery]);

  // Auto-start simulation when delivery has waypoints and is in transit
  useEffect(() => {
    if (
      delivery &&
      delivery.waypoints.length > 0 &&
      (delivery.status === 'IN_TRANSIT' || delivery.status === 'PICKED_UP') &&
      !simulating
    ) {
      // Start GPS simulation in a microtask to avoid synchronous setState in effect
      void Promise.resolve().then(() => startSimulation());
    }
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [delivery, simulating, startSimulation]);

  // Prefill and auto-search if URL has order param
  useEffect(() => {
    if (prefillOrder && mounted) {
      handleRecentTrack(prefillOrder);
    }
  }, [prefillOrder, mounted, handleRecentTrack]);

  const hasWaypoints = delivery && delivery.waypoints.length > 0;

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <SimpleNavbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SimpleNavbar />

      <main className="flex-1">
        {/* Search Section */}
        <section className="bg-[#0F172A] py-16 md:py-20">
          <div className="px-6 md:px-16 lg:px-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto text-center"
            >
              <Package className="h-10 w-10 text-amber-400 mx-auto mb-4" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Track Your Order</h1>
              <p className="text-gray-400 mt-2 mb-8">
                Enter your order number or phone number to get real-time delivery updates
              </p>

              <div className="flex gap-3 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Order number (SHK-XXXXXX) or phone"
                    className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-amber-500"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  />
                </div>
                <Button
                  onClick={handleTrack}
                  disabled={searching || !searchInput.trim()}
                  className="h-12 px-6 bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A] font-semibold shrink-0"
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Track'
                  )}
                </Button>
              </div>

              {/* Not found message */}
              {notFound && !searching && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm mt-3"
                >
                  No delivery found. The order may not exist or has not been assigned for delivery yet.
                </motion.p>
              )}

              {/* No tracking info available */}
              {noTracking && !searching && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <div className="flex flex-col items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-6 max-w-md mx-auto">
                    <Package className="h-8 w-8 text-gray-500" />
                    <p className="text-white font-semibold">No Tracking Information Available</p>
                    <p className="text-gray-500 text-sm text-center">
                      This order has not been assigned for delivery yet. Please check back later.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Recent Orders */}
              {!delivery && !searching && !noTracking && (
                <div className="mt-8">
                  <p className="text-gray-500 text-sm mb-3">Recent tracked orders</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { orderNumber: 'SHK-198452', date: 'Jan 10, 2026' },
                      { orderNumber: 'SHK-175623', date: 'Jan 5, 2026' },
                      { orderNumber: 'SHK-162874', date: 'Dec 28, 2025' },
                    ].map((order) => (
                      <button
                        key={order.orderNumber}
                        onClick={() => handleRecentTrack(order.orderNumber)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-white/10 transition text-sm"
                      >
                        <Clock className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-gray-300 font-mono text-xs">{order.orderNumber}</span>
                        <span className="text-gray-500 text-xs">{order.date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Loading overlay while searching */}
        {searching && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
            <p className="text-gray-500 text-sm">Looking up your order...</p>
          </div>
        )}

        {/* Tracking Result */}
        <AnimatePresence>
          {delivery && trackingInfo && !searching && (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 md:px-16 lg:px-32 py-10"
            >
              <div className="max-w-5xl mx-auto space-y-6">
                {/* Order Header */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Order Number</p>
                      <p className="text-xl font-bold text-[#0F172A] font-mono">
                        {delivery.order.orderNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="font-medium text-[#0F172A]">
                        {new Date(delivery.order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Status</p>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          delivery.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-700'
                            : delivery.status === 'FAILED'
                            ? 'bg-red-100 text-red-700'
                            : delivery.status === 'IN_TRANSIT' || delivery.status === 'NEAR_LOCATION'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {(delivery.status === 'IN_TRANSIT' || delivery.status === 'NEAR_LOCATION') && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        )}
                        {delivery.status.split('_').join(' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tracking Stats */}
                <TrackingStats info={trackingInfo} />

                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Route Map (only when waypoints exist) */}
                    {hasWaypoints && <RouteMap waypoints={delivery.waypoints} />}

                    {/* Delivery Timeline */}
                    <DeliveryTimeline status={delivery.status} />

                    {/* Order Items */}
                    {delivery.order.items.length > 0 && (
                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-[#0F172A] mb-4">Order Items</h2>
                        <div className="divide-y divide-gray-100">
                          {delivery.order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                  {item.image ? (
                                    <div className="w-full h-full bg-gray-200" />
                                  ) : (
                                    <Package className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[#0F172A]">{item.name}</p>
                                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold text-[#0F172A]">
                                {formatCurrency(item.price, currencyCode)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No waypoints placeholder */}
                    {!hasWaypoints && (
                      <div className="bg-[#0F172A] rounded-xl p-8 flex flex-col items-center justify-center min-h-[180px]">
                        <MapPin className="h-10 w-10 text-amber-400 mb-3" />
                        <p className="text-white font-semibold">Waiting for GPS signal...</p>
                        <p className="text-gray-500 text-sm mt-1">
                          The driver has not started moving yet
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Delivery Partner */}
                    {delivery.deliveryPerson && (
                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                          <Truck className="h-4 w-4 text-amber-500" />
                          Delivery Partner
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                            {delivery.deliveryPerson.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#0F172A] truncate">
                              {delivery.deliveryPerson.name}
                            </p>
                            {delivery.deliveryPerson.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="truncate">{delivery.deliveryPerson.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-amber-500" />
                        Shipping Address
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {delivery.order.shippingAddress}
                      </p>
                    </div>

                    {/* Estimated Delivery */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        Estimated Arrival
                      </h3>
                      <p className="text-lg font-bold text-amber-600">
                        {trackingInfo.eta || 'Calculating...'}
                      </p>
                      {trackingInfo.currentSpeedKmh && (
                        <p className="text-xs text-gray-400 mt-1">
                          Moving at {trackingInfo.currentSpeedKmh} km/h
                        </p>
                      )}
                    </div>

                    {/* Delivery OTP */}
                    {delivery.deliveryOtp && (
                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-[#0F172A] mb-3">Delivery OTP</h3>
                        <p className="text-xs text-gray-400 mb-3">
                          Share this with the delivery partner upon delivery
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 px-4 py-2.5 bg-gray-50 rounded-lg font-mono text-xl font-bold text-center tracking-[0.3em] text-[#0F172A]">
                            {showOtp ? delivery.deliveryOtp : '\u2022\u2022\u2022\u2022'}
                          </div>
                          <button
                            onClick={() => setShowOtp(!showOtp)}
                            className="p-2.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                            aria-label={showOtp ? 'Hide OTP' : 'Show OTP'}
                          >
                            {showOtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Simulation Control */}
                    {hasWaypoints && (delivery.status === 'IN_TRANSIT' || delivery.status === 'PICKED_UP') && (
                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                          <Signal className={`h-4 w-4 ${simulating ? 'text-amber-500' : 'text-gray-400'}`} />
                          GPS Simulation
                        </h3>
                        <p className="text-xs text-gray-400 mb-3">
                          {simulating
                            ? 'Simulating real-time GPS movement every 5 seconds'
                            : 'Start simulating GPS waypoints' }
                        </p>
                        <Button
                          size="sm"
                          variant={simulating ? 'destructive' : 'default'}
                          className={`w-full rounded-lg ${
                            !simulating ? 'bg-[#F59E0B] hover:bg-amber-600 text-[#0F172A]' : ''
                          }`}
                          onClick={simulating ? stopSimulation : startSimulation}
                        >
                          {simulating ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-2" />
                              Stop Simulation
                            </>
                          ) : (
                            'Start Simulation'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Export (Suspense boundary for useSearchParams)                */
/* ------------------------------------------------------------------ */
export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-gray-50">
          <SimpleNavbar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </main>
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
