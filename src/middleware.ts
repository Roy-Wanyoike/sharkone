import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiting store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cleanup stale entries every 60 seconds
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now >= val.resetTime) {
        rateLimitMap.delete(key);
      }
    }
    lastCleanup = now;
  }
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // --- Security Headers (applied to all responses) ---
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // --- Rate Limiting (API routes only) ---
  const isApiRoute = pathname.startsWith('/api/');
  if (!isApiRoute) {
    return response;
  }

  // Determine limit based on route
  const isAuthRoute = pathname.startsWith('/api/auth/') || pathname === '/api/login';
  const limit = isAuthRoute ? 30 : 100;
  const windowMs = 60_000; // 1 minute

  // Get client IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Use IP + route prefix as key for rate limiting
  const key = `${ip}:${isAuthRoute ? 'auth' : 'api'}`;
  const now = Date.now();

  cleanup();

  let entry = rateLimitMap.get(key);

  if (!entry || now >= entry.resetTime) {
    // New window
    entry = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(key, entry);
  } else {
    entry.count++;
  }

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

  // Check if rate limit exceeded
  if (entry.count > limit) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil((entry.resetTime - now) / 1000)),
        },
      }
    );
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
