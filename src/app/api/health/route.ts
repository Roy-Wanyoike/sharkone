import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const start = Date.now();
  let dbStatus = 'ok';
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = 'error';
  }

  const uptime = process.uptime();
  const totalLatency = Date.now() - start;

  return NextResponse.json({
    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: { status: dbStatus, latency: `${dbLatency}ms` },
      api: { status: 'ok', latency: `${totalLatency}ms` },
    },
  });
}
