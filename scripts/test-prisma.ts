import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

console.log('Step 1: Creating libsql client...')
const libsql = createClient({
  url: 'libsql://va-operations-portal-jawadmalikeee-alt.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3OTA1NDc3NzIsImlhdCI6MTc4OTk0Mjk3MiwiaWQiOiIwMWEwYzBlNC1iMzAxLTczYTYtOTFjZS0zNDAwZWE1NDBiNmQiLCJraWQiOiJlaGpPZXdxaXZobFhRS1lpS1p0LUhOc3lyYlotN3p2UlB0YzhCNG9RTTBrIiwicmlkIjoiMGY5YThkODAtOTA4Ny00OTRjLTg0MmItOGEzNjUyZWQ0MWFjIn0.GA6ysErfrV3KVJjUV5ur0bMwk5IXUS-S4bK_tGxq3GFUGsEpF0ND7Z-yqW99emIgtKGzSNwL6jts3J17piWoAw',
})
console.log('Step 2: Creating adapter...')
const adapter = new PrismaLibSQL(libsql)
console.log('Step 3: Creating PrismaClient with adapter...')
const db = new PrismaClient({ adapter } as any)
console.log('Step 4: Counting users...')
db.user.count().then(c => {
  console.log('SUCCESS! Users:', c)
  return db.$disconnect()
}).catch(e => {
  console.error('FAILED:', e.message)
  console.error('CODE:', e.code)
})
