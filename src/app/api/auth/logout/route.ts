import { NextRequest, NextResponse } from 'next/server';
import { audit } from '@/lib/audit';

/**
 * Log out the current user by clearing the sharkone-token cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('sharkone-token')?.value;

    if (token) {
      audit({
        userId: token,
        action: 'LOGOUT',
        resource: 'auth',
        details: 'User logged out',
        req: request,
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('sharkone-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
