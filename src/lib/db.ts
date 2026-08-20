import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let db: PrismaClient

if (globalForPrisma.prisma) {
  db = globalForPrisma.prisma
} else {
  db = new PrismaClient({
    log: ['query'],
  })
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = db
  }
}

export { db }
