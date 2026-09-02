import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { audit } from '@/lib/audit';

/**
 * Switch the authenticated user's active role.
 * This updates the sharkone-token cookie to point to the target user account.
 * The client must already be authenticated (have a valid cookie).
 */
export async function POST(request: NextRequest) {
  try {
    const currentToken = request.cookies.get('sharkone-token')?.value;
    if (!currentToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // Verify the current user exists
    const currentUser = await prisma.user.findUnique({
      where: { id: currentToken },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: 'Current session invalid' }, { status: 401 });
    }

    // Verify the target user exists and is allowed
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        seller: { select: { id: true, storeName: true, storeSlug: true } },
      },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'Target account not found' }, { status: 404 });
    }

    // Build allowed role-switch map (same logic as login)
    const multiRoleEmails: Record<string, string[]> = {
      'roy@sharkone.com': ['BUYER', 'SELLER', 'DELIVERY', 'ADMIN'],
      'admin@sharkone.com': ['ADMIN', 'BUYER', 'SELLER'],
    };

    // Check if the current user's email is in the multi-role map
    const allowedRoles = multiRoleEmails[currentUser.email.toLowerCase().trim()];
    const isAllowed =
      // Same user switching to self (no-op but allowed)
      currentUser.id === targetUserId ||
      // Current user's email has multi-role access and target role is in the list
      (allowedRoles && allowedRoles.includes(targetUser.role));

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Role switch not allowed' },
        { status: 403 }
      );
    }

    // Set new cookie with target user's ID
    const response = NextResponse.json({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        avatar: targetUser.avatar,
      },
    });

    response.cookies.set('sharkone-token', targetUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    audit({
      userId: currentUser.id,
      role: currentUser.role,
      action: 'SWITCH_ROLE',
      resource: 'auth',
      details: `Switched from ${currentUser.email} (${currentUser.role}) to ${targetUser.email} (${targetUser.role})`,
      req: request,
    });

    return response;
  } catch (error) {
    console.error('Switch role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
