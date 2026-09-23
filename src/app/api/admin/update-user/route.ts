import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * PATCH /api/admin/update-user
 * Admin edits a user's profile fields.
 * body: { userId, name?, phone?, email?, designation?, customDesignation?, description?, timezone?, jobTitle? }
 */
export async function PATCH(req: NextRequest) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can edit users.' }, { status: 403 })
  }

  const { userId, ...updates } = await req.json()
  if (!userId) return NextResponse.json({ error: 'User ID required.' }, { status: 400 })

  const target = await db.user.findUnique({ where: { id: userId } })
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  const allowed: any = {}
  if (updates.name !== undefined) allowed.name = updates.name.trim()
  if (updates.phone !== undefined) allowed.phone = updates.phone || null
  if (updates.designation !== undefined) allowed.designation = updates.designation || null
  if (updates.customDesignation !== undefined) allowed.customDesignation = updates.customDesignation || null
  if (updates.description !== undefined) allowed.description = updates.description || null
  if (updates.timezone !== undefined) allowed.timezone = updates.timezone
  if (updates.jobTitle !== undefined) allowed.jobTitle = updates.jobTitle || null

  // Email change — check for duplicates
  if (updates.email && updates.email !== target.email) {
    const normalizedEmail = updates.email.toLowerCase().trim()
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: 'This email is already in use.' }, { status: 400 })
    }
    allowed.email = normalizedEmail
    // Also update client record email if applicable
    if (target.clientId) {
      await db.client.update({ where: { id: target.clientId }, data: { email: normalizedEmail } })
    }
  }

  await db.user.update({ where: { id: userId }, data: allowed })

  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'USER_EDITED',
      entityType: 'User',
      entityId: userId,
      after: `Updated: ${Object.keys(allowed).join(', ')}`,
    },
  })

  return NextResponse.json({ ok: true })
}
