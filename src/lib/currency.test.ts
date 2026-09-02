import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  convertFromKSH,
  getCurrencyForCountry,
  getAvailableCurrencies,
  CURRENCIES,
} from './currency';

describe('convertFromKSH', () => {
  it('returns same amount for KSH (rate = 1)', () => {
    expect(convertFromKSH(1000, 'KSH')).toBe(1000);
  });

  it('converts to USD with correct rate (0.0077)', () => {
    const result = convertFromKSH(1000, 'USD');
    expect(result).toBeCloseTo(7.7, 1);
  });

  it('converts to EUR with correct rate (0.0071)', () => {
    const result = convertFromKSH(1000, 'EUR');
    expect(result).toBeCloseTo(7.1, 1);
  });

  it('converts to UGX with correct rate (0.0302)', () => {
    const result = convertFromKSH(1000, 'UGX');
    expect(result).toBeCloseTo(30.2, 1);
  });

  it('returns original amount for unknown currency code', () => {
    expect(convertFromKSH(500, 'XYZ')).toBe(500);
  });

  it('handles zero amount', () => {
    expect(convertFromKSH(0, 'USD')).toBe(0);
  });
});

describe('formatCurrency', () => {
  describe('KSH formatting (no conversion)', () => {
    it('formats a basic KSH amount with symbol', () => {
      const result = formatCurrency(1500, 'KSH');
      expect(result).toContain('KSh');
      expect(result).toContain('1,500');
    });

    it('formats zero correctly', () => {
      const result = formatCurrency(0, 'KSH');
      expect(result).toContain('KSh');
      expect(result).toContain('0');
    });
  });

  describe('currency conversion in formatting', () => {
    it('formats USD with $ symbol', () => {
      const result = formatCurrency(1000, 'USD');
      expect(result).toContain('$');
    });

    it('formats EUR with € symbol', () => {
      const result = formatCurrency(1000, 'EUR');
      expect(result).toContain('€');
    });

    it('formats GBP with £ symbol', () => {
      const result = formatCurrency(1000, 'GBP');
      expect(result).toContain('£');
    });

    it('formats UGX with USh symbol', () => {
      const result = formatCurrency(1000, 'UGX');
      expect(result).toContain('USh');
    });
  });

  describe('compact mode', () => {
    it('shows K suffix for converted amounts in the thousands range', () => {
      // 1,000,000 KSH → USD = 7,700 which is >= 1000
      const result = formatCurrency(1_000_000, 'USD', { compact: true });
      expect(result).toMatch(/\$[\d.]+K/);
    });

    it('shows M suffix for amounts >= 1,000,000 converted', () => {
      // 1,000,000,000 KSH → KSH = 1,000,000,000 (no conversion)
      const result = formatCurrency(1_000_000_000, 'KSH', { compact: true });
      expect(result).toMatch(/KSh[\d.]+M/);
    });

    it('does not use compact suffix for amounts < 1000', () => {
      // Small KSH amount stays normal even in compact mode
      const result = formatCurrency(500, 'KSH', { compact: true });
      expect(result).not.toContain('KSh500'); // Should have space (normal format)
      expect(result).toContain('500');
    });
  });

  describe('hideSymbol option', () => {
    it('hides the currency symbol when hideSymbol is true', () => {
      const result = formatCurrency(1500, 'KSH', { hideSymbol: true });
      expect(result).not.toContain('KSh');
      expect(result).toContain('1,500');
    });

    it('shows symbol by default', () => {
      const result = formatCurrency(1500, 'KSH');
      expect(result).toContain('KSh');
    });
  });

  describe('edge cases', () => {
    it('handles negative numbers', () => {
      const result = formatCurrency(-500, 'KSH');
      expect(result).toContain('KSh');
      expect(result).toMatch(/-500/);
    });

    it('handles very large numbers', () => {
      const result = formatCurrency(999_999_999, 'KSH');
      expect(result).toContain('KSh');
      expect(result).toContain('999,999,999');
    });

    it('handles decimal amounts with fractional digits', () => {
      // Converting 100 KSH to USD gives 0.77, which has decimals
      const result = formatCurrency(100, 'USD');
      expect(result).toContain('$');
    });

    it('defaults to KSH for unknown currency code', () => {
      const result = formatCurrency(1000, 'UNKNOWN');
      expect(result).toContain('KSh');
    });
  });
});

describe('getCurrencyForCountry', () => {
  it('returns KSH for Kenya', () => {
    expect(getCurrencyForCountry('KE')).toBe('KSH');
  });

  it('returns UGX for Uganda', () => {
    expect(getCurrencyForCountry('UG')).toBe('UGX');
  });

  it('returns TZS for Tanzania', () => {
    expect(getCurrencyForCountry('TZ')).toBe('TZS');
  });

  it('returns USD for United States', () => {
    expect(getCurrencyForCountry('US')).toBe('USD');
  });

  it('returns EUR for Germany (EU member)', () => {
    expect(getCurrencyForCountry('DE')).toBe('EUR');
  });

  it('returns EUR for France', () => {
    expect(getCurrencyForCountry('FR')).toBe('EUR');
  });

  it('returns GBP for United Kingdom', () => {
    expect(getCurrencyForCountry('GB')).toBe('GBP');
  });

  it('returns NGN for Nigeria', () => {
    expect(getCurrencyForCountry('NG')).toBe('NGN');
  });

  it('returns RWF for Rwanda', () => {
    expect(getCurrencyForCountry('RW')).toBe('RWF');
  });

  it('handles lowercase country codes', () => {
    expect(getCurrencyForCountry('ke')).toBe('KSH');
    expect(getCurrencyForCountry('us')).toBe('USD');
  });

  it('defaults to KSH for unknown country', () => {
    expect(getCurrencyForCountry('JP')).toBe('KSH');
    expect(getCurrencyForCountry('')).toBe('KSH');
  });
});

describe('getAvailableCurrencies', () => {
  it('returns all 8 currencies', () => {
    const currencies = getAvailableCurrencies();
    expect(currencies).toHaveLength(8);
  });

  it('returns KSH as the first currency', () => {
    const currencies = getAvailableCurrencies();
    expect(currencies[0].code).toBe('KSH');
  });

  it('is sorted in the expected order', () => {
    const currencies = getAvailableCurrencies();
    const order = ['KSH', 'UGX', 'TZS', 'RWF', 'NGN', 'USD', 'EUR', 'GBP'];
    currencies.forEach((c, i) => {
      expect(c.code).toBe(order[i]);
    });
  });

  it('each currency has required fields', () => {
    const currencies = getAvailableCurrencies();
    currencies.forEach((c) => {
      expect(c.code).toBeTruthy();
      expect(c.symbol).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(typeof c.rate).toBe('number');
      expect(c.locale).toBeTruthy();
      expect(c.flag).toBeTruthy();
    });
  });
});
