import { describe, it, expect } from 'vitest';
import { cn, sanitizeSearch } from './utils';

describe('cn', () => {
  it('merges class names from strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('merges tailwind classes (tailwind-merge)', () => {
    // twMerge should deduplicate conflicting Tailwind classes
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes via clsx syntax', () => {
    const active = true;
    expect(cn('base', active && 'active')).toBe('base active');
  });

  it('handles object syntax from clsx', () => {
    expect(cn({ 'text-red': true, 'text-blue': false })).toBe('text-red');
  });

  it('handles array syntax from clsx', () => {
    expect(cn(['a', 'b', 'c'])).toBe('a b c');
  });

  it('deduplicates conflicting margin classes', () => {
    expect(cn('m-2', 'm-4')).toBe('m-4');
  });

  it('deduplicates conflicting padding classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('sanitizeSearch', () => {
  it('removes control characters', () => {
    expect(sanitizeSearch('hello\x00world')).toBe('helloworld');
  });

  it('trims whitespace', () => {
    expect(sanitizeSearch('  hello world  ')).toBe('hello world');
  });

  it('truncates to default maxLength of 200', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeSearch(long)).toHaveLength(200);
  });

  it('respects custom maxLength', () => {
    const input = 'hello world';
    expect(sanitizeSearch(input, 5)).toBe('hello');
  });

  it('returns clean string unchanged', () => {
    expect(sanitizeSearch('normal search query')).toBe('normal search query');
  });

  it('handles empty string', () => {
    expect(sanitizeSearch('')).toBe('');
  });

  it('strips multiple control characters', () => {
    expect(sanitizeSearch('\x01\x02\x03test\x7f')).toBe('test');
  });

  it('preserves special characters that are not control chars', () => {
    expect(sanitizeSearch('price>100 & status="active"')).toBe('price>100 & status="active"');
  });
});
