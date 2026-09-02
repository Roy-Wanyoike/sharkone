import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  default: {
    category: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from '@/lib/db';
import { GET } from './route';

describe('GET /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns categories ordered by name ascending', async () => {
    const mockCategories = [
      { id: '1', name: 'Electronics', slug: 'electronics', _count: { products: 5 } },
      { id: '2', name: 'Fashion', slug: 'fashion', _count: { products: 12 } },
    ];
    vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Electronics');
    expect(data[1].name).toBe('Fashion');
  });

  it('returns an empty array when no categories exist', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([] as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(0);
  });

  it('calls findMany with correct options', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([] as any);

    await GET();

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  });

  it('returns 500 when prisma throws', async () => {
    vi.mocked(prisma.category.findMany).mockRejectedValue(new Error('DB down'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch categories');
  });
});
