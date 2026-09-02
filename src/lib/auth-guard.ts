import { cookies } from 'next/headers';
import prisma from './db';

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sharkone-token')?.value;
  if (!token) return null;
  const user = await prisma.user.findUnique({
    where: { id: token },
    select: { id: true, name: true, email: true, role: true, avatar: true },
  });
  return user;
}

export async function requireAuth(requiredRole?: string) {
  const user = await getAuthUser();
  if (!user) return null;
  if (requiredRole && user.role !== requiredRole) return null;
  return user;
}
