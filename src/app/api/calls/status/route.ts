import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * PATCH /api/calls/status
 *   body: { callId, status: 'accepted' | 'declined' | 'ended' | 'missed', duration? }
 *
 * GET /api/calls/incoming — checks for active incoming calls for the current user
 */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { callId, status, duration } = await req.json()
  if (!callId || !status) return NextResponse.json({ error: 'callId and status required' }, { status: 400 })

  const call = await db.callSession.findUnique({ where: { id: callId } })
  if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 })

  // Only caller or receiver can update status
  if (call.callerId !== user.id && call.receiverId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates: any = { status }
  if (status === 'accepted') updates.startedAt = new Date()
  if (status === 'ended' || status === 'missed') {
    updates.endedAt = new Date()
    if (duration) updates.duration = duration
  }

  // Mark notification as read
  await db.notification.updateMany({
    where: { userId: user.id, type: 'call', link: `/call/${callId}` },
    data: { read: true },
  })

  const updated = await db.callSession.update({ where: { id: callId }, data: updates })

  return NextResponse.json({ ok: true, call: updated })
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  // Check for incoming calls (status = ringing, receiver = current user, created in last 60s)
  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000)
  const incomingCall = await db.callSession.findFirst({
    where: {
      receiverId: user.id,
      status: 'ringing',
      createdAt: { gte: sixtySecondsAgo },
    },
    include: { caller: true },
    orderBy: { createdAt: 'desc' },
  })

  if (incomingCall) {
    return NextResponse.json({
      hasIncomingCall: true,
      call: {
        id: incomingCall.id,
        type: incomingCall.type,
        roomId: incomingCall.roomId,
        roomUrl: incomingCall.roomUrl,
        callerName: incomingCall.caller.name,
        callerAvatarUrl: incomingCall.caller.avatarUrl,
        callerId: incomingCall.callerId,
        createdAt: incomingCall.createdAt,
      },
    })
  }

  // Auto-mark old ringing calls as missed
  const oldRinging = await db.callSession.findMany({
    where: {
      receiverId: user.id,
      status: 'ringing',
      createdAt: { lt: sixtySecondsAgo },
    },
  })
  if (oldRinging.length > 0) {
    await db.callSession.updateMany({
      where: { id: { in: oldRinging.map((c) => c.id) } },
      data: { status: 'missed', endedAt: new Date() },
    })
  }

  return NextResponse.json({ hasIncomingCall: false })
}
