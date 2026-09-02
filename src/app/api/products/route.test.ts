import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  default: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import prisma from '@/lib/db';
import { GET } from './route';

function makeRequest(url: string): Request {
  return new Request(url, { headers: { 'x-forwarded-proto': 'http' } });
}

describe('GET /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns products with pagination metadata', async () => {
    const mockProducts = [
      {
        id: 'p1',
        name: 'Widget',
        price: 100,
        status: 'ACTIVE',
        category: { id: 'c1', name: 'Electronics', slug: 'electronics' },
        seller: { storeName: 'Store A', user: { name: 'John' } },
      },
    ];
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const response = await GET(makeRequest('http://localhost/api/products'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.products).toHaveLength(1);
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(data.totalPages).toBe(1);
  });

  it('filters by single category slug', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/products?category=electronics'));

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.where.category).toEqual({ slug: 'electronics' });
  });

  it('filters by multiple category slugs', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/products?category=electronics&category=fashion'));

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.where.category).toEqual({ slug: { in: ['electronics', 'fashion'] } });
  });

  it('filters by search term', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/products?search=phone'));

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.where.OR).toEqual([
      { name: { contains: 'phone' } },
      { description: { contains: 'phone' } },
    ]);
  });

  it('sanitizes search input (strips control chars)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/products?search=phone\x00bad'));

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.where.OR[0].name.contains).toBe('phonebad');
  });

  it('sorts by price ascending', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/products?sort=price_asc'));

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.orderBy).toEqual({ price: 'asc' });
  });

  it('sorts by price descending', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/products?sort=price_desc'));

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.orderBy).toEqual({ price: 'desc' });
  });

  it('sorts by rating', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/products?sort=rating'));

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.orderBy).toEqual({ rating: 'desc' });
  });

  it('sorts by popularity (reviewCount)', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/products?sort=popular'));

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.orderBy).toEqual({ reviewCount: 'desc' });
  });

  it('defaults to newest sort', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/products'));

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('paginates correctly with page and limit', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(50);

    const response = await GET(makeRequest('http://localhost/api/products?page=3&limit=10'));
    const data = await response.json();

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.skip).toBe(20);
    expect(findManyCall.take).toBe(10);
    expect(data.page).toBe(3);
    expect(data.totalPages).toBe(5);
  });

  it('maps sellerName from seller.storeName', async () => {
    const mockProducts = [
      {
        id: 'p1',
        name: 'Widget',
        price: 100,
        status: 'ACTIVE',
        category: { id: 'c1', name: 'Electronics', slug: 'electronics' },
        seller: { storeName: 'My Store', user: { name: 'Jane' } },
      },
    ];
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const response = await GET(makeRequest('http://localhost/api/products'));
    const data = await response.json();

    expect(data.products[0].sellerName).toBe('My Store');
  });

  it('sets sellerName to null when no seller', async () => {
    const mockProducts = [
      {
        id: 'p1',
        name: 'Widget',
        price: 100,
        status: 'ACTIVE',
        category: { id: 'c1', name: 'Electronics', slug: 'electronics' },
        seller: null,
      },
    ];
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const response = await GET(makeRequest('http://localhost/api/products'));
    const data = await response.json();

    expect(data.products[0].sellerName).toBeNull();
  });

  it('filters by min and max price', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/products?minPrice=10&maxPrice=500'));

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.where.price).toEqual({ gte: 10, lte: 500 });
  });

  it('filters by featured', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    await GET(makeRequest('http://localhost/api/products?featured=true'));

    const findManyCall = vi.mocked(prisma.product.findMany).mock.calls[0][0] as any;
    expect(findManyCall.where.featured).toBe(true);
  });

  it('returns 500 on error', async () => {
    vi.mocked(prisma.product.findMany).mockRejectedValue(new Error('DB error'));

    const response = await GET(makeRequest('http://localhost/api/products'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch products');
  });
});
