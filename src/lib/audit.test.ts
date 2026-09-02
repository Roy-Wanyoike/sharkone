import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures mockCreate is available before vi.mock factory runs
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  default: {
    auditLog: {
      create: mockCreate,
    },
  },
}));

import { audit } from './audit';

describe('audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({});
  });

  it('creates an audit log entry with all fields', async () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        'user-agent': 'TestBrowser/1.0',
      },
    });

    await audit({
      userId: 'user-123',
      role: 'admin',
      action: 'create',
      resource: 'product',
      resourceId: 'prod-456',
      details: 'Created new product',
      req,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        role: 'admin',
        action: 'create',
        resource: 'product',
        resourceId: 'prod-456',
        details: 'Created new product',
        ipAddress: '1.2.3.4',
        userAgent: 'TestBrowser/1.0',
      },
    });
  });

  it('handles missing userId', async () => {
    await audit({
      action: 'delete',
      resource: 'cart',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: null,
        role: null,
        action: 'delete',
        resource: 'cart',
        resourceId: null,
        details: null,
        ipAddress: 'unknown',
        userAgent: null,
      },
    });
  });

  it('handles missing request (ip defaults to unknown, userAgent null)', async () => {
    await audit({
      userId: 'user-1',
      action: 'login',
      resource: 'session',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipAddress: 'unknown',
        userAgent: null,
      }),
    });
  });

  it('extracts IP from x-real-ip when x-forwarded-for is missing', async () => {
    const req = new Request('http://localhost', {
      headers: {
        'x-real-ip': '10.0.0.1',
        'user-agent': 'Mozilla/5.0',
      },
    });

    await audit({
      action: 'view',
      resource: 'page',
      req,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0',
      }),
    });
  });

  it('does not throw when Prisma create fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreate.mockRejectedValue(new Error('DB down'));

    await expect(
      audit({ action: 'test', resource: 'test' })
    ).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to write audit log:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
