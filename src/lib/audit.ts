import prisma from '@/lib/db';

interface AuditParams {
  userId?: string;
  role?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  req?: Request;
}

export async function audit({
  userId,
  role,
  action,
  resource,
  resourceId,
  details,
  req,
}: AuditParams) {
  const ipAddress =
    req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req?.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = req?.headers.get('user-agent') || null;

  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        role: role || null,
        action,
        resource,
        resourceId: resourceId || null,
        details: details || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error('Failed to write audit log:', error);
  }
}
