import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  default: {
    coupon: {
      findUnique: vi.fn(),
    },
    usedCoupon: {
      count: vi.fn(),
    },
  },
}));

import prisma from '@/lib/db';
import { POST } from './route';

function makeValidateRequest(code: string, orderTotal: number, overrides: Record<string, unknown> = {}): Request {
  const body = { code, orderTotal, ...overrides };
  return new Request('http://localhost/api/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validCoupon = {
  id: 'coupon-1',
  code: 'SAVE10',
  type: 'PERCENTAGE',
  value: 10,
  isActive: true,
  validFrom: null,
  validUntil: null,
  usageLimit: null,
  usageCount: 0,
  perUserLimit: 1,
  minOrderValue: null,
  maxDiscount: null,
  applicableCategories: null,
  description: '10% off',
};

describe('POST /api/coupons/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when code is missing', async () => {
    const req = new Request('http://localhost/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderTotal: 100 }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
    expect(data.error).toContain('required');
  });

  it('returns 400 when orderTotal is missing', async () => {
    const req = new Request('http://localhost/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SAVE10' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.valid).toBe(false);
  });

  it('returns invalid for non-existent coupon code', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(null as any);

    const response = await POST(makeValidateRequest('FAKE', 100) as any);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toBe('Invalid coupon code');
  });

  it('returns invalid for inactive coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...validCoupon,
      isActive: false,
    } as any);

    const response = await POST(makeValidateRequest('SAVE10', 100) as any);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toBe('This coupon is no longer active');
  });

  it('returns invalid for expired coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...validCoupon,
      validUntil: new Date('2020-01-01'),
    } as any);

    const response = await POST(makeValidateRequest('SAVE10', 100) as any);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toBe('This coupon has expired');
  });

  it('returns invalid for coupon not yet valid', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...validCoupon,
      validFrom: new Date('2099-12-31'),
    } as any);

    const response = await POST(makeValidateRequest('SAVE10', 100) as any);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toBe('This coupon is not yet valid');
  });

  it('returns invalid when usage limit exceeded', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...validCoupon,
      usageLimit: 100,
      usageCount: 100,
    } as any);

    const response = await POST(makeValidateRequest('SAVE10', 100) as any);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toContain('usage limit');
  });

  it('returns invalid when per-user limit exceeded', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(validCoupon as any);
    vi.mocked(prisma.usedCoupon.count).mockResolvedValue(1);

    const response = await POST(makeValidateRequest('SAVE10', 100, { userId: 'user-1' }) as any);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toContain('already used');
  });

  it('returns invalid when order total is below min order value', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...validCoupon,
      minOrderValue: 500,
    } as any);

    const response = await POST(makeValidateRequest('SAVE10', 100) as any);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toContain('Minimum order value');
  });

  it('validates a valid percentage coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(validCoupon as any);

    const response = await POST(makeValidateRequest('SAVE10', 1000) as any);
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.discount).toBe(100); // 10% of 1000
    expect(data.newTotal).toBe(900);
    expect(data.isFreeShipping).toBe(false);
  });

  it('respects max discount cap on percentage coupon', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...validCoupon,
      type: 'PERCENTAGE',
      value: 50,
      maxDiscount: 200,
    } as any);

    const response = await POST(makeValidateRequest('BIG50', 1000) as any);
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.discount).toBe(200); // 50% of 1000 = 500, capped at 200
    expect(data.newTotal).toBe(800);
  });

  it('handles FIXED_AMOUNT coupon type', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...validCoupon,
      type: 'FIXED_AMOUNT',
      value: 50,
    } as any);

    const response = await POST(makeValidateRequest('FLAT50', 200) as any);
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.discount).toBe(50);
    expect(data.newTotal).toBe(150);
  });

  it('caps FIXED_AMOUNT discount at order total', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...validCoupon,
      type: 'FIXED_AMOUNT',
      value: 500,
    } as any);

    const response = await POST(makeValidateRequest('BIGFLAT', 200) as any);
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.discount).toBe(200); // can't exceed order total
    expect(data.newTotal).toBe(0);
  });

  it('handles FREE_SHIPPING coupon type', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...validCoupon,
      type: 'FREE_SHIPPING',
    } as any);

    const response = await POST(makeValidateRequest('FREESHIP', 500) as any);
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.discount).toBe(0);
    expect(data.isFreeShipping).toBe(true);
    expect(data.newTotal).toBe(500);
  });

  it('normalizes coupon code to uppercase and trimmed', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue(validCoupon as any);

    await POST(makeValidateRequest('  save10  ', 100) as any);

    expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
      where: { code: 'SAVE10' },
    });
  });

  it('returns valid when category restriction matches', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...validCoupon,
      applicableCategories: 'cat-1,cat-2',
    } as any);

    const response = await POST(makeValidateRequest('SAVE10', 100, { categoryIds: ['cat-1'] }) as any);
    const data = await response.json();

    expect(data.valid).toBe(true);
  });

  it('returns invalid when category restriction has no match', async () => {
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      ...validCoupon,
      applicableCategories: 'cat-1,cat-2',
    } as any);

    const response = await POST(makeValidateRequest('SAVE10', 100, { categoryIds: ['cat-99'] }) as any);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toBe('This coupon does not apply to the items in your cart');
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(prisma.coupon.findUnique).mockRejectedValue(new Error('DB error'));

    const response = await POST(makeValidateRequest('SAVE10', 100) as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.valid).toBe(false);
    expect(data.error).toContain('Something went wrong');
  });
});
