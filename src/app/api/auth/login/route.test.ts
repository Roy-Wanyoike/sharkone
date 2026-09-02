import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/password', () => ({
  verifyPassword: vi.fn(),
}));

vi.mock('@/lib/audit', () => ({
  audit: vi.fn().mockResolvedValue(undefined),
}));

import prisma from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { POST } from './route';

function makeLoginRequest(email: string, password: string): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when email is missing', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'pass' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email and password are required');
  });

  it('returns 400 when password is missing', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email and password are required');
  });

  it('returns 401 with generic message when user not found (no enumeration)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as any);

    const response = await POST(makeLoginRequest('notfound@test.com', 'whatever') as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid email or password');
  });

  it('returns 401 with same generic message for wrong password (no enumeration)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      name: 'Test User',
      email: 'test@test.com',
      password: 'hashed',
      avatar: null,
      role: 'BUYER',
      seller: null,
    } as any);
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const response = await POST(makeLoginRequest('test@test.com', 'wrongpass') as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid email or password');
  });

  it('returns 200 with user data on successful login', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      name: 'Test User',
      email: 'test@test.com',
      password: 'hashed',
      avatar: '/avatar.jpg',
      role: 'BUYER',
      seller: null,
    } as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const response = await POST(makeLoginRequest('test@test.com', 'correctpass') as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.id).toBe('u1');
    expect(data.user.name).toBe('Test User');
    expect(data.user.email).toBe('test@test.com');
    expect(data.user.avatar).toBe('/avatar.jpg');
  });

  it('sets a session cookie on successful login', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      name: 'Test User',
      email: 'test@test.com',
      password: 'hashed',
      avatar: null,
      role: 'BUYER',
      seller: null,
    } as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const response = await POST(makeLoginRequest('test@test.com', 'correctpass') as any);

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('sharkone-token=u1');
  });

  it('normalizes email to lowercase and trimmed', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as any);

    await POST(makeLoginRequest('  TEST@TEST.COM  ', 'pass') as any);

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'test@test.com' } })
    );
  });

  it('returns accounts array with single role for regular users', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      name: 'Buyer User',
      email: 'buyer@test.com',
      password: 'hashed',
      avatar: null,
      role: 'BUYER',
      seller: null,
    } as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const response = await POST(makeLoginRequest('buyer@test.com', 'pass') as any);
    const data = await response.json();

    expect(data.accounts).toHaveLength(1);
    expect(data.accounts[0].role).toBe('BUYER');
    expect(data.requiresRoleSelection).toBe(false);
  });

  it('returns requiresRoleSelection true for multi-role users', async () => {
    // Mock primary user as SELLER
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'seller1',
      name: 'Roy',
      email: 'roy@sharkone.com',
      password: 'hashed',
      avatar: null,
      role: 'SELLER',
      seller: { id: 's1', storeName: 'Roy Store', storeSlug: 'roy-store' },
    } as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);

    // Mock extra role users
    vi.mocked(prisma.user.findFirst)
      .mockResolvedValueOnce({ id: 'buyer1', role: 'BUYER', seller: null })
      .mockResolvedValueOnce({ id: 'delivery1', role: 'DELIVERY', seller: null })
      .mockResolvedValueOnce({ id: 'admin1', role: 'ADMIN', seller: null });

    const response = await POST(makeLoginRequest('roy@sharkone.com', 'pass') as any);
    const data = await response.json();

    // Primary (SELLER) + BUYER + DELIVERY + ADMIN = 4 accounts
    expect(data.accounts.length).toBeGreaterThanOrEqual(2);
    expect(data.requiresRoleSelection).toBe(true);
  });

  it('returns 500 on unexpected error', async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error('DB connection lost'));

    const response = await POST(makeLoginRequest('test@test.com', 'pass') as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
