import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { audit } from '@/lib/audit';
import { verifyPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const primaryUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        seller: { select: { id: true, storeName: true, storeSlug: true } },
      },
    });

    if (!primaryUser) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // --- Password verification ---
    const valid = await verifyPassword(password, primaryUser.password);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Set cookie with user ID
    const response = NextResponse.json({
      user: {
        id: primaryUser.id,
        name: primaryUser.name,
        email: primaryUser.email,
        avatar: primaryUser.avatar,
      },
      requiresRoleSelection: false, // will be updated below if needed
    });

    response.cookies.set('sharkone-token', primaryUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // --- Role / accounts logic (unchanged from before) ---
    const accounts: Array<{
      role: string;
      userId: string;
      label: string;
      description: string;
      redirectPath: string;
      storeName?: string;
    }> = [];

    const roleConfig: Record<
      string,
      { label: string; description: string; redirectPath: string }
    > = {
      BUYER: {
        label: 'Buyer',
        description: 'Shop products, track orders, manage payments',
        redirectPath: '/account',
      },
      SELLER: {
        label: 'Seller',
        description: 'Manage your store, products, and earnings',
        redirectPath: '/dashboard/seller',
      },
      DELIVERY: {
        label: 'Delivery Rider',
        description: 'View deliveries, verify orders, track earnings',
        redirectPath: '/dashboard/delivery',
      },
      ADMIN: {
        label: 'Admin',
        description: 'Platform management, catalogue, users',
        redirectPath: '/admin',
      },
    };

    const primaryConfig = roleConfig[primaryUser.role];
    if (primaryConfig) {
      accounts.push({
        role: primaryUser.role,
        userId: primaryUser.id,
        label: primaryConfig.label,
        description: primaryConfig.description,
        redirectPath: primaryConfig.redirectPath,
        storeName: primaryUser.seller?.storeName ?? undefined,
      });
    }

    const multiRoleEmails: Record<string, string[]> = {
      'roy@sharkone.com': ['BUYER', 'SELLER', 'DELIVERY', 'ADMIN'],
      'admin@sharkone.com': ['ADMIN', 'BUYER', 'SELLER'],
    };

    const extraRoles = multiRoleEmails[email.toLowerCase().trim()];
    if (extraRoles) {
      for (const role of extraRoles) {
        if (role === primaryUser.role) continue;
        const config = roleConfig[role];
        if (!config) continue;

        const roleUser = await prisma.user.findFirst({
          where: { role: role as 'BUYER' | 'SELLER' | 'DELIVERY' | 'ADMIN' },
          include: { seller: { select: { id: true, storeName: true, storeSlug: true } } },
        });

        if (roleUser) {
          accounts.push({
            role,
            userId: roleUser.id,
            label: config.label,
            description: config.description,
            redirectPath: config.redirectPath,
            storeName: roleUser.seller?.storeName ?? undefined,
          });
        }
      }
    }

    audit({
      userId: primaryUser.id,
      role: primaryUser.role,
      action: 'LOGIN',
      resource: 'auth',
      details: `Login: ${primaryUser.email}`,
      req: request,
    });

    // Mutate JSON body to include accounts
    const body = {
      user: {
        id: primaryUser.id,
        name: primaryUser.name,
        email: primaryUser.email,
        avatar: primaryUser.avatar,
      },
      accounts,
      requiresRoleSelection: accounts.length > 1,
    };

    return new NextResponse(JSON.stringify(body), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': response.headers.get('set-cookie')!,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
