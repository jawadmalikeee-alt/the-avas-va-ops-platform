import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createHash } from 'crypto'

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

/**
 * POST /api/auth/change-password
 *   body: { currentPassword, newPassword }
 *   Changes the current user's password — requires knowing the current password
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current password and new password are required.' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 })
  }

  // Verify current password
  if (user.passwordHash !== hashPassword(currentPassword)) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
  }

  // Update password
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  })

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
    },
  })

  return NextResponse.json({ ok: true })
}
