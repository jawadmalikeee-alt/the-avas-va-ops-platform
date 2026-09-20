import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const items = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  return NextResponse.json({ items })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { id, all } = await req.json()
  if (all) {
    await db.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } })
  } else if (id) {
    await db.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } })
  }
  return NextResponse.json({ ok: true })
}
