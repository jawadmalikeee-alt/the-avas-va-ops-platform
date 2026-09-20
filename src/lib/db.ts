import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  // Use Turso if configured, otherwise fall back to local SQLite
  if (tursoUrl && tursoUrl.startsWith('libsql://')) {
    const adapter = new PrismaLibSQL({ url: tursoUrl, authToken: tursoToken })
    return new PrismaClient({ adapter } as any)
  }

  return new PrismaClient({ log: ['error', 'warn'] })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
