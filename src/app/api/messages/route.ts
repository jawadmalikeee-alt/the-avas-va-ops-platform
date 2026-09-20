import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/messages?userId=<other>
 *   - Returns conversation between current user and another user
 *   - Marks received messages as delivered
 * GET /api/messages (no userId)
 *   - Returns list of conversation partners
 *
 * POST /api/messages
 *   - body: { receiverId, body, attachmentUrl?, attachmentType?, attachmentName?, attachmentSize? }
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const otherUserId = searchParams.get('userId')

  if (!otherUserId) {
    // List conversation partners
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
      select: {
        id: true, name: true, role: true, avatarUrl: true, jobTitle: true,
        email: true, phone: true, timezone: true, lastActiveAt: true,
        vaProfile: { select: { currentStatus: true, shiftStartedAt: true } },
      },
    })

    // Get last message + unread count for each partner
    const enriched = await Promise.all(
      partners.map(async (p) => {
        const lastMsg = await db.message.findFirst({
          where: {
            OR: [
              { senderId: user.id, receiverId: p.id },
              { senderId: p.id, receiverId: user.id },
            ],
          },
          orderBy: { createdAt: 'desc' },
        })
        const unreadCount = await db.message.count({
          where: { senderId: p.id, receiverId: user.id, read: false },
        })
        return {
          ...p,
          status: p.vaProfile?.currentStatus ?? (p.lastActiveAt && (Date.now() - p.lastActiveAt.getTime() < 5 * 60 * 1000) ? 'Online' : 'Offline'),
          lastActiveAt: p.lastActiveAt,
          unreadCount,
          lastMessage: lastMsg?.body ?? '',
          lastMessageAt: lastMsg?.createdAt ?? null,
          lastMessageAttachment: lastMsg?.attachmentType ?? null,
        }
      })
    )

    // Sort by last message time
    enriched.sort((a, b) => {
      const aT = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const bT = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return bT - aT
    })

    return NextResponse.json({ partners: enriched })
  }

  // Fetch conversation
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

  // Mark received messages as seen
  await db.message.updateMany({
    where: { senderId: otherUserId, receiverId: user.id, seenAt: null },
    data: { read: true, seenAt: new Date(), deliveredAt: new Date() },
  })

  // Get the other user's info (with online status)
  const otherUser = await db.user.findUnique({
    where: { id: otherUserId },
    select: {
      id: true, name: true, role: true, avatarUrl: true, jobTitle: true,
      email: true, phone: true, timezone: true, lastActiveAt: true,
      vaProfile: { select: { currentStatus: true, shiftStartedAt: true } },
      client: { select: { companyName: true } },
    },
  })

  return NextResponse.json({
    messages,
    otherUser: otherUser ? {
      ...otherUser,
      status: otherUser.vaProfile?.currentStatus ?? (otherUser.lastActiveAt && (Date.now() - otherUser.lastActiveAt.getTime() < 5 * 60 * 1000) ? 'Online' : 'Offline'),
      lastActiveAt: otherUser.lastActiveAt,
    } : null,
  })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await req.json()
  const { receiverId, body: text, attachmentUrl, attachmentType, attachmentName, attachmentSize } = body

  if (!receiverId || (!text && !attachmentUrl)) {
    return NextResponse.json({ error: 'Missing receiver or content' }, { status: 400 })
  }

  const msg = await db.message.create({
    data: {
      senderId: user.id,
      receiverId,
      body: text ?? '',
      attachmentUrl: attachmentUrl ?? null,
      attachmentType: attachmentType ?? null,
      attachmentName: attachmentName ?? null,
      attachmentSize: attachmentSize ?? null,
      deliveredAt: new Date(), // Mark as delivered immediately
    },
  })

  // Update sender's lastActiveAt
  await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })

  return NextResponse.json({ ok: true, message: msg })
}
