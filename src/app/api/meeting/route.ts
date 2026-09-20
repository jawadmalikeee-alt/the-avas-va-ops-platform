import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createHash } from 'crypto'

/**
 * POST /api/meeting
 *   body: { partnerId, type: 'audio' | 'video' }
 *   Returns: { roomId, url, expiresAt }
 *
 * Generates a unique meeting room URL using Jitsi Meet (free, no API key needed).
 * The room name is hashed from both user IDs + timestamp for privacy.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { partnerId, type } = await req.json()
  if (!partnerId) return NextResponse.json({ error: 'partnerId required' }, { status: 400 })

  // Generate a stable, private room ID from both user IDs
  const ids = [user.id, partnerId].sort().join('|')
  const hash = createHash('sha256').update(ids + Date.now()).digest('hex').slice(0, 16)
  const roomId = `avas-${hash}`
  // Use the public Jitsi Meet instance — production should self-host meet.jitsi
  const url = `https://meet.jit.si/${roomId}`

  // Log as a system notification for the partner
  const partner = await db.user.findUnique({ where: { id: partnerId } })
  if (partner) {
    await db.notification.create({
      data: {
        userId: partnerId,
        type: 'call',
        title: `${type === 'video' ? 'Video' : 'Audio'} call from ${user.name}`,
        body: `Join the meeting now — tap to open`,
        link: url,
      },
    })
  }

  // Update sender's lastActiveAt
  await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })

  return NextResponse.json({
    ok: true,
    roomId,
    url,
    type,
    partnerName: partner?.name ?? 'Contact',
    initiatedBy: user.name,
  })
}
