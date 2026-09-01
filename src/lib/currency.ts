// ============================================================
// SHARKONE Multi-Currency System
// Default: KSH (Kenyan Shilling) — switches based on user location
// ============================================================

export interface CurrencyConfig {
  code: string;        // ISO 4217
  symbol: string;      // Display symbol
  name: string;        // Full name
  rate: number;        // Exchange rate vs KSH (1 KSH = rate * this currency)
  locale: string;      // For number formatting
  flag: string;        // Emoji flag
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  KSH: {
    code: 'KSH',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    rate: 1,
    locale: 'en-KE',
    flag: '🇰🇪',
  },
  UGX: {
    code: 'UGX',
    symbol: 'USh',
    name: 'Ugandan Shilling',
    rate: 0.0302,
    locale: 'en-UG',
    flag: '🇺🇬',
  },
  TZS: {
    code: 'TZS',
    symbol: 'TZSh',
    name: 'Tanzanian Shilling',
    rate: 0.0154,
    locale: 'en-TZ',
    flag: '🇹🇿',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    rate: 0.0077,
    locale: 'en-US',
    flag: '🇺🇸',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    rate: 0.0071,
    locale: 'de-DE',
    flag: '🇪🇺',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    rate: 0.0061,
    locale: 'en-GB',
    flag: '🇬🇧',
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    rate: 11.84,
    locale: 'en-NG',
    flag: '🇳🇬',
  },
  RWF: {
    code: 'RWF',
    symbol: 'FRw',
    name: 'Rwandan Franc',
    rate: 9.71,
    locale: 'rw-RW',
    flag: '🇷🇼',
  },
};

// Country → currency mapping (East Africa focus, global fallback)
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  KE: 'KSH',
  UG: 'UGX',
  TZ: 'TZS',
  US: 'USD',
  GB: 'GBP',
  EU: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  NG: 'NGN',
  RW: 'RWF',
  CA: 'USD',
  AU: 'USD',
};

// All prices in the database are stored in KSH
// Convert from KSH to target currency
export function convertFromKSH(amountKSH: number, targetCode: string): number {
  const currency = CURRENCIES[targetCode];
  if (!currency) return amountKSH;
  return amountKSH * currency.rate;
}

// Format a price for display
export function formatCurrency(
  amountKSH: number,
  currencyCode: string = 'KSH',
  options?: { compact?: boolean; hideSymbol?: boolean }
): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.KSH;
  const converted = convertFromKSH(amountKSH, currencyCode);

  if (options?.compact && converted >= 1000000) {
    return `${currency.symbol}${(converted / 1000000).toFixed(1)}M`;
  }
  if (options?.compact && converted >= 1000) {
    return `${currency.symbol}${(converted / 1000).toFixed(1)}K`;
  }

  const formatted = converted.toLocaleString(currency.locale, {
    minimumFractionDigits: converted % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  if (options?.hideSymbol) return formatted;
  return `${currency.symbol} ${formatted}`;
}

// Detect currency from country code
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] || 'KSH';
}

// Get sorted list of available currencies
export function getAvailableCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCIES).sort((a, b) => {
    // KSH first, then East African, then global
    const order = ['KSH', 'UGX', 'TZS', 'RWF', 'NGN', 'USD', 'EUR', 'GBP'];
    return order.indexOf(a.code) - order.indexOf(b.code);
  });
}
