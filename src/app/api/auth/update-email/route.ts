import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * PATCH /api/auth/update-email
 *   body: { newEmail, confirmEmail }
 *   Updates the current user's email after confirmation
 */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { newEmail, confirmEmail } = await req.json()
  if (!newEmail || !confirmEmail) {
    return NextResponse.json({ error: 'New email and confirmation are required.' }, { status: 400 })
  }
  if (newEmail !== confirmEmail) {
    return NextResponse.json({ error: 'Email addresses do not match.' }, { status: 400 })
  }
  if (!newEmail.includes('@')) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const normalizedEmail = newEmail.toLowerCase().trim()

  // Check if email is already taken
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: 'This email is already in use.' }, { status: 400 })
  }

  await db.user.update({
    where: { id: user.id },
    data: { email: normalizedEmail },
  })

  // If user is a client, update client email too
  if (user.clientId) {
    await db.client.update({
      where: { id: user.clientId },
      data: { email: normalizedEmail },
    })
  }

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'EMAIL_UPDATED',
      entityType: 'User',
      entityId: user.id,
      before: user.email,
      after: normalizedEmail,
    },
  })

  return NextResponse.json({ ok: true })
}
