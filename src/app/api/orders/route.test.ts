import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  default: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    order: {
      create: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    seller: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    delivery: {
      create: vi.fn(),
    },
    coupon: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    usedCoupon: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/audit', () => ({
  audit: vi.fn().mockResolvedValue(undefined),
}));

import prisma from '@/lib/db';
import { POST } from './route';

const mockBuyer = {
  id: 'buyer-1',
  email: 'buyer@test.com',
  name: 'Test Buyer',
  phone: '123456',
  role: 'BUYER',
  companyId: null,
};

const mockProduct = {
  id: 'prod-1',
  name: 'Widget',
  price: 100,
  stock: 10,
  sellerId: 'seller-1',
};

const mockSeller = {
  id: 'seller-1',
  storeName: 'Test Store',
  commissionRate: 0.1,
};

function makeOrderRequest(overrides: Record<string, unknown> = {}): Request {
  const body = {
    orderNumber: 'ORD-001',
    items: [{ productId: 'prod-1', price: 100, quantity: 2 }],
    shippingAddress: '123 Main St',
    paymentMethod: 'mpesa',
    totalAmount: 200,
    ...overrides,
  };
  return new Request('http://localhost/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('returns 400 when items array is empty', async () => {
    const req = makeOrderRequest({ items: [] });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('creates an order successfully', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockBuyer as any);
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-001',
      totalAmount: 200,
      status: 'PENDING',
      paymentStatus: 'PENDING',
    } as any);
    vi.mocked(prisma.seller.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(mockSeller as any);
    vi.mocked(prisma.orderItem.create).mockResolvedValue({} as any);
    vi.mocked(prisma.product.update).mockResolvedValue({} as any);
    vi.mocked(prisma.delivery.create).mockResolvedValue({} as any);

    const response = await POST(makeOrderRequest());
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.orderNumber).toBe('ORD-001');
    expect(data.totalAmount).toBe(200);
  });

  it('creates a buyer user if none exists', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.user.create).mockResolvedValue(mockBuyer as any);
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-001',
      totalAmount: 200,
    } as any);
    vi.mocked(prisma.seller.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(mockSeller as any);
    vi.mocked(prisma.orderItem.create).mockResolvedValue({} as any);
    vi.mocked(prisma.product.update).mockResolvedValue({} as any);
    vi.mocked(prisma.delivery.create).mockResolvedValue({} as any);

    const response = await POST(makeOrderRequest({
      buyerEmail: 'new@test.com',
      buyerName: 'New User',
    }));

    expect(response.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'new@test.com',
          name: 'New User',
          role: 'BUYER',
        }),
      })
    );
  });

  it('deducts stock for each order item', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockBuyer as any);
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'order-1', orderNumber: 'ORD-001', totalAmount: 200,
    } as any);
    vi.mocked(prisma.seller.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(mockSeller as any);
    vi.mocked(prisma.orderItem.create).mockResolvedValue({} as any);
    vi.mocked(prisma.product.update).mockResolvedValue({} as any);
    vi.mocked(prisma.delivery.create).mockResolvedValue({} as any);

    await POST(makeOrderRequest());

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stock: { decrement: 2 } },
    });
  });

  it('skips items when product is not found', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockBuyer as any);
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'order-1', orderNumber: 'ORD-001', totalAmount: 200,
    } as any);
    vi.mocked(prisma.seller.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null as any);
    vi.mocked(prisma.orderItem.create).mockResolvedValue({} as any);
    vi.mocked(prisma.product.update).mockResolvedValue({} as any);
    vi.mocked(prisma.delivery.create).mockResolvedValue({} as any);

    await POST(makeOrderRequest());

    expect(prisma.orderItem.create).not.toHaveBeenCalled();
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('enforces B2B credit limit', async () => {
    const b2bBuyer = { ...mockBuyer, companyId: 'company-1' };
    vi.mocked(prisma.user.findFirst).mockResolvedValue(b2bBuyer as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue({
      id: 'company-1',
      creditLimit: 1000,
      creditUsed: 900,
    } as any);

    const response = await POST(makeOrderRequest({ totalAmount: 200 }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Credit limit exceeded');
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('allows order within B2B credit limit and increments credit used', async () => {
    const b2bBuyer = { ...mockBuyer, companyId: 'company-1' };
    vi.mocked(prisma.user.findFirst).mockResolvedValue(b2bBuyer as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue({
      id: 'company-1',
      creditLimit: 1000,
      creditUsed: 500,
    } as any);
    vi.mocked(prisma.company.update).mockResolvedValue({} as any);
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'order-1', orderNumber: 'ORD-001', totalAmount: 200,
    } as any);
    vi.mocked(prisma.seller.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(mockSeller as any);
    vi.mocked(prisma.orderItem.create).mockResolvedValue({} as any);
    vi.mocked(prisma.product.update).mockResolvedValue({} as any);
    vi.mocked(prisma.delivery.create).mockResolvedValue({} as any);

    const response = await POST(makeOrderRequest({ totalAmount: 200 }));

    expect(response.status).toBe(201);
    expect(prisma.company.update).toHaveBeenCalledWith({
      where: { id: 'company-1' },
      data: { creditUsed: { increment: 200 } },
    });
  });

  it('tracks coupon usage when coupon code is provided', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockBuyer as any);
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'order-1', orderNumber: 'ORD-001', totalAmount: 200,
    } as any);
    vi.mocked(prisma.seller.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(mockSeller as any);
    vi.mocked(prisma.orderItem.create).mockResolvedValue({} as any);
    vi.mocked(prisma.product.update).mockResolvedValue({} as any);
    vi.mocked(prisma.coupon.findUnique).mockResolvedValue({
      id: 'coupon-1',
      code: 'SAVE10',
    } as any);
    vi.mocked(prisma.coupon.update).mockResolvedValue({} as any);
    vi.mocked(prisma.usedCoupon.create).mockResolvedValue({} as any);
    vi.mocked(prisma.delivery.create).mockResolvedValue({} as any);

    await POST(makeOrderRequest({ couponCode: 'save10' }));

    expect(prisma.coupon.findUnique).toHaveBeenCalledWith({
      where: { code: 'SAVE10' },
    });
    expect(prisma.coupon.update).toHaveBeenCalledWith({
      where: { id: 'coupon-1' },
      data: { usageCount: { increment: 1 } },
    });
    expect(prisma.usedCoupon.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          couponId: 'coupon-1',
          userId: 'buyer-1',
          orderId: 'order-1',
        }),
      })
    );
  });

  it('creates a delivery record for the order', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockBuyer as any);
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'order-1', orderNumber: 'ORD-001', totalAmount: 200,
    } as any);
    vi.mocked(prisma.seller.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(mockSeller as any);
    vi.mocked(prisma.orderItem.create).mockResolvedValue({} as any);
    vi.mocked(prisma.product.update).mockResolvedValue({} as any);
    vi.mocked(prisma.delivery.create).mockResolvedValue({} as any);

    await POST(makeOrderRequest());

    expect(prisma.delivery.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-1',
        status: 'ASSIGNED',
      },
    });
  });

  it('sets paymentStatus to PAID for wallet payment', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(mockBuyer as any);
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'order-1', orderNumber: 'ORD-001', totalAmount: 200, paymentStatus: 'PAID',
    } as any);
    vi.mocked(prisma.seller.findFirst).mockResolvedValue(null as any);
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
    vi.mocked(prisma.seller.findUnique).mockResolvedValue(mockSeller as any);
    vi.mocked(prisma.orderItem.create).mockResolvedValue({} as any);
    vi.mocked(prisma.product.update).mockResolvedValue({} as any);
    vi.mocked(prisma.delivery.create).mockResolvedValue({} as any);

    await POST(makeOrderRequest({ paymentMethod: 'wallet' }));

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentStatus: 'PAID' }),
      })
    );
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(prisma.user.findFirst).mockRejectedValue(new Error('DB error'));

    const response = await POST(makeOrderRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create order');
  });
});
