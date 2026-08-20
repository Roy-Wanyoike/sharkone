'use client';

import { useSyncExternalStore } from 'react';
import { Globe } from 'lucide-react';
import { useCurrencyStore } from '@/store/currency-store';
import { getAvailableCurrencies } from '@/lib/currency';

const mounted = useSyncExternalStore(
  () => () => {},
  () => true,
  () => false
);

export function CurrencySwitcher() {
  const { code, setCurrency } = useCurrencyStore();
  const currencies = getAvailableCurrencies();
  const current = currencies.find((c) => c.code === code) || currencies[0];

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100"
        aria-label="Change currency"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline font-medium">{current.flag} {current.code}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Currency
        </div>
        {currencies.map((c) => (
          <button
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
              code === c.code
                ? 'bg-amber-50 text-amber-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{c.flag}</span>
            <div className="flex-1 text-left">
              <div className="font-medium">{c.code}</div>
              <div className="text-xs text-gray-400">{c.name}</div>
            </div>
            {code === c.code && (
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
