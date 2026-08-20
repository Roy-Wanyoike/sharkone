import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { audit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the primary user by email
    const primaryUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        seller: { select: { id: true, storeName: true, storeSlug: true } },
      },
    });

    // Demo mode: accept any password for existing users
    if (!primaryUser) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    // Build the list of available accounts/roles for this user
    const accounts: Array<{
      role: string;
      userId: string;
      label: string;
      description: string;
      redirectPath: string;
      storeName?: string;
    }> = [];

    const roleConfig: Record<string, { label: string; description: string; redirectPath: string }> = {
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

    // Add the user's primary role
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

    // Demo: certain emails simulate multi-role access
    // In production, this comes from a linked-accounts/join table
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

        // Find a real user with this role for the userId
        const roleUser = await db.user.findFirst({
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

    audit({ userId: primaryUser.id, role: primaryUser.role, action: 'LOGIN', resource: 'auth', details: `Login: ${primaryUser.email}`, req: request });

    return NextResponse.json({
      user: {
        id: primaryUser.id,
        name: primaryUser.name,
        email: primaryUser.email,
        avatar: primaryUser.avatar,
      },
      accounts,
      requiresRoleSelection: accounts.length > 1,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
