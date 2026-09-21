import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

/**
 * POST /api/auth/forgot-password
 *   body: { email }
 *   If email exists: resets password to a temporary one and returns it
 *   (In production: send email with reset link. For now: return temp password.)
 */
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  const normalizedEmail = email.toLowerCase().trim()
  const user = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) {
    // Don't reveal whether email exists — return success
    return NextResponse.json({ ok: true, message: 'If an account exists with this email, a reset link has been sent.' })
  }

  // Generate temporary password
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  let tempPassword = ''
  for (let i = 0; i < 10; i++) tempPassword += chars[Math.floor(Math.random() * chars.length)]

  // Update password
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(tempPassword) },
  })

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      entityId: user.id,
    },
  })

  // In production: send email with the temp password or reset link
  // For now: return the temp password (only works if email exists)
  return NextResponse.json({
    ok: true,
    tempPassword,
    message: 'Your password has been reset. Use the temporary password to sign in, then change it from Profile Settings.',
  })
}
