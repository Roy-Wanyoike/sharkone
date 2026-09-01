import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma
} else {
  prisma = new PrismaClient({
    log: ['query'],
  })
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }
}

export default prisma
