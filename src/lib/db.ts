import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Turso configuration — hardcoded for reliability (env vars get overwritten by dev.sh)
const TURSO_URL = 'libsql://va-operations-portal-jawadmalikeee-alt.aws-ap-northeast-1.turso.io'
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3OTA1NDc3NzIsImlhdCI6MTc4OTk0Mjk3MiwiaWQiOiIwMWEwYzBlNC1iMzAxLTczYTYtOTFjZS0zNDAwZWE1NDBiNmQiLCJraWQiOiJlaGpPZXdxaXZobFhRS1lpS1p0LUhOc3lyYlotN3p2UlB0YzhCNG9RTTBrIiwicmlkIjoiMGY5YThkODAtOTA4Ny00OTRjLTg0MmItOGEzNjUyZWQ0MWFjIn0.GA6ysErfrV3KVJjUV5ur0bMwk5IXUS-S4bK_tGxq3GFUGsEpF0ND7Z-yqW99emIgtKGzSNwL6jts3J17piWoAw'

function createPrismaClient() {
  // Always use Turso
  const adapter = new PrismaLibSQL({ url: TURSO_URL, authToken: TURSO_TOKEN })
  return new PrismaClient({ adapter } as any)
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
