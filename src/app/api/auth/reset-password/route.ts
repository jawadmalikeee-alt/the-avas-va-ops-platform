import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createHash } from 'crypto'

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

/**
 * POST /api/auth/reset-password
 *   body: { userId, newPassword }
 *   Admin-only: resets any user's password
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can reset passwords.' }, { status: 403 })
  }

  const { userId, newPassword } = await req.json()
  if (!userId || !newPassword) {
    return NextResponse.json({ error: 'User ID and new password are required.' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } })
  if (!targetUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  await db.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(newPassword) },
  })

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'PASSWORD_RESET',
      entityType: 'User',
      entityId: userId,
      after: `Reset password for ${targetUser.email}`,
    },
  })

  return NextResponse.json({ ok: true })
}
