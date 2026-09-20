const TURSO_URL = "libsql://va-operations-portal-jawadmalikeee-alt.aws-ap-northeast-1.turso.io"
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3OTA1NDc3NzIsImlhdCI6MTc4OTk0Mjk3MiwiaWQiOiIwMWEwYzBlNC1iMzAxLTczYTYtOTFjZS0zNDAwZWE1NDBiNmQiLCJraWQiOiJlaGpPZXdxaXZobFhRS1lpS1p0LUhOc3lyYlotN3p2UlB0YzhCNG9RTTBrIiwicmlkIjoiMGY5YThkODAtOTA4Ny00OTRjLTg0MmItOGEzNjUyZWQ0MWFjIn0.GA6ysErfrV3KVJjUV5ur0bMwk5IXUS-S4bK_tGxq3GFUGsEpF0ND7Z-yqW99emIgtKGzSNwL6jts3J17piWoAw"

import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'
import { createHash } from 'crypto'

const libsql = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })
const adapter = new PrismaLibSQL(libsql)
const db = new PrismaClient({ adapter } as any)

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

async function main() {
  console.log('Clearing Turso...')
  await db.notification.deleteMany()
  await db.message.deleteMany()
  await db.ticket.deleteMany()
  await db.feedback.deleteMany()
  await db.qAReview.deleteMany()
  await db.workSubmission.deleteMany()
  await db.deliverable.deleteMany()
  await db.taskComment.deleteMany()
  await db.task.deleteMany()
  await db.project.deleteMany()
  await db.timeEntry.deleteMany()
  await db.attendance.deleteMany()
  await db.callSession.deleteMany()
  await db.emailLog.deleteMany()
  await db.sOPAssignment.deleteMany()
  await db.sOP.deleteMany()
  await db.document.deleteMany()
  await db.clientKPI.deleteMany()
  await db.kPI.deleteMany()
  await db.clientService.deleteMany()
  await db.service.deleteMany()
  await db.assignment.deleteMany()
  await db.auditLog.deleteMany()
  await db.report.deleteMany()
  await db.vA.deleteMany()
  await db.client.deleteMany()
  await db.user.deleteMany()
  console.log('Cleared! Counting...')
  
  const userCount = await db.user.count()
  console.log('Users after clear:', userCount)
}
main().then(() => db.$disconnect()).catch(e => { console.error('FAILED:', e.message); process.exit(1) })
