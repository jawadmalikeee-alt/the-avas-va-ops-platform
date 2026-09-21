import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * POST /api/messages/clear
 *   body: { partnerId } — clears all messages between current user and partner (for current user only)
 *
 * DELETE /api/messages/delete?id=<messageId> — deletes a single message
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { partnerId } = await req.json()
  if (!partnerId) return NextResponse.json({ error: 'partnerId required' }, { status: 400 })

  // Delete all messages in conversation where user is sender or receiver
  const result = await db.message.deleteMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: partnerId },
        { senderId: partnerId, receiverId: user.id },
      ],
    },
  })

  return NextResponse.json({ ok: true, deleted: result.count })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Message ID required' }, { status: 400 })

  // Can only delete messages sent by current user
  const msg = await db.message.findUnique({ where: { id } })
  if (!msg || msg.senderId !== user.id) {
    return NextResponse.json({ error: 'Cannot delete this message' }, { status: 403 })
  }

  await db.message.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
