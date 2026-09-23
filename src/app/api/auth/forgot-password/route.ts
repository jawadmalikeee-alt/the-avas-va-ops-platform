import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

/**
 * POST /api/auth/forgot-password
 *   body: { email }
 *   Generates a temporary password and returns it (for dev without email service).
 *   In production: send email with reset link/token.
 */
export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  const normalizedEmail = email.toLowerCase().trim()
  const user = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (!user) {
    return NextResponse.json({ ok: true, message: 'If an account exists with this email, a reset link has been sent.' })
  }

  if (user.status === 'INACTIVE' || user.status === 'REMOVED') {
    return NextResponse.json({ ok: true, message: 'If an account exists with this email, a reset link has been sent.' })
  }

  // Generate temporary password
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  let tempPassword = ''
  for (let i = 0; i < 10; i++) tempPassword += chars[Math.floor(Math.random() * chars.length)]

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(tempPassword), mustChangePassword: true },
  })

  await db.auditLog.create({
    data: { actorId: user.id, action: 'PASSWORD_RESET_REQUESTED', entityType: 'User', entityId: user.id },
  })

  // In production: send email with reset link/token instead of returning temp password
  // For now: return the temp password (dev mode without email service configured)
  return NextResponse.json({
    ok: true,
    tempPassword,
    message: 'Your password has been reset. Use the temporary password to sign in, then change it from Profile Settings.',
  })
}
