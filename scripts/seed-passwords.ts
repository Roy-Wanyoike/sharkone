/**
 * Seed script: set password 'password123' for all existing users
 * that don't have a password hash yet.
 *
 * Run: npx tsx scripts/seed-passwords.ts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { password: null },
    select: { id: true, email: true },
  });

  console.log(`Found ${users.length} users without a password hash.`);

  const hashed = await hashPassword('password123');

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    console.log(`  ✓ ${user.email}`);
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
