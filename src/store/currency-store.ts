import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCurrencyForCountry } from '@/lib/currency';

interface CurrencyState {
  code: string;
  setCurrency: (code: string) => void;
  detectFromLocation: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      code: 'KSH',
      setCurrency: (code) => set({ code }),
      detectFromLocation: async () => {
        try {
          // Try browser geolocation to get country
          const resp = await fetch('https://ipapi.co/json/', {
            signal: AbortSignal.timeout(3000),
          });
          const data = await resp.json();
          if (data.country_code) {
            const currency = getCurrencyForCountry(data.country_code);
            set({ code: currency });
          }
        } catch {
          // Silent fail — keep default KSH
        }
      },
    }),
    {
      name: 'sharkone-currency',
    }
  )
);
