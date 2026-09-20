import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createHash } from 'crypto'

/**
 * POST /api/calls/initiate
 *   body: { partnerId, type: 'audio' | 'video' }
 *   Creates a CallSession with status='ringing', creates a notification for the receiver
 *   Returns the call session + meeting URL
 *
 * PATCH /api/calls/status
 *   body: { callId, status: 'accepted' | 'declined' | 'ended' | 'missed' }
 *   Updates call status. 'missed' is auto-set after 45s timeout.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { partnerId, type } = await req.json()
  if (!partnerId || !type) return NextResponse.json({ error: 'partnerId and type required' }, { status: 400 })

  // Generate meeting room
  const ids = [user.id, partnerId].sort().join('|')
  const hash = createHash('sha256').update(ids + Date.now()).digest('hex').slice(0, 16)
  const roomId = `avas-${hash}`
  const roomUrl = `https://meet.jit.si/${roomId}`

  // Create call session
  const call = await db.callSession.create({
    data: {
      callerId: user.id,
      receiverId: partnerId,
      type,
      roomId,
      roomUrl,
      status: 'ringing',
    },
  })

  // Create notification with type='call' for the receiver
  await db.notification.create({
    data: {
      userId: partnerId,
      type: 'call',
      title: `Incoming ${type === 'video' ? 'Video' : 'Audio'} Call`,
      body: `${user.name} is calling you — tap to answer`,
      link: `/call/${call.id}`,
    },
  })

  // Update lastActiveAt for caller
  await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })

  return NextResponse.json({
    ok: true,
    call: {
      id: call.id,
      roomId,
      roomUrl,
      type,
      status: 'ringing',
      partnerId,
      partnerName: (await db.user.findUnique({ where: { id: partnerId } }))?.name ?? 'Contact',
    },
  })
}
