import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/data/messages?userId=<other>
 * Returns conversation between current user and another user.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const otherUserId = searchParams.get('userId')

  // Conversation partners: who has the user talked to?
  if (!otherUserId) {
    const sent = await db.message.findMany({
      where: { senderId: user.id },
      select: { receiverId: true },
      distinct: ['receiverId'],
    })
    const received = await db.message.findMany({
      where: { receiverId: user.id },
      select: { senderId: true },
      distinct: ['senderId'],
    })
    const partnerIds = new Set<string>([
      ...sent.map((m) => m.receiverId).filter(Boolean) as string[],
      ...received.map((m) => m.senderId),
    ])
    const partners = await db.user.findMany({
      where: { id: { in: Array.from(partnerIds) } },
      select: { id: true, name: true, role: true, avatarUrl: true, jobTitle: true },
    })
    // Unread counts
    const unreadByPartner: Record<string, number> = {}
    for (const p of partners) {
      const c = await db.message.count({ where: { senderId: p.id, receiverId: user.id, read: false } })
      unreadByPartner[p.id] = c
    }
    return NextResponse.json({
      partners: partners.map((p) => ({
        ...p,
        unreadCount: unreadByPartner[p.id] ?? 0,
      })),
    })
  }

  const messages = await db.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })
  // Mark received as read
  await db.message.updateMany({
    where: { senderId: otherUserId, receiverId: user.id, read: false },
    data: { read: true },
  })
  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { receiverId, body } = await req.json()
  if (!receiverId || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const msg = await db.message.create({
    data: { senderId: user.id, receiverId, body },
  })
  return NextResponse.json({ ok: true, message: msg })
}
