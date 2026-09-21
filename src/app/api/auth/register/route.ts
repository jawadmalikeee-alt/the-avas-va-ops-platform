import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

/**
 * POST /api/auth/register
 *   body: { name, email, password }
 *   Creates a new ADMIN account (open registration — first admin or additional admins)
 *   This is the ONLY public signup endpoint. VA/Client accounts are created by admin only.
 */
export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }
  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Check if email already exists
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 })
  }

  // Create admin user
  const user = await db.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      name: name.trim(),
      role: 'ADMIN',
      timezone: 'America/New_York',
      jobTitle: 'Administrator',
    },
  })

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'ADMIN_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      after: `${name} (${normalizedEmail}) registered as admin`,
    },
  })

  return NextResponse.json({ ok: true, userId: user.id })
}
