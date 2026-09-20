import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * PATCH /api/profile — update current user's profile (name, phone, avatarUrl, timezone)
 * body: { name?, phone?, avatarUrl?, timezone?, jobTitle? }
 */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const allowed: any = {}
  ;['name', 'phone', 'avatarUrl', 'timezone', 'jobTitle'].forEach((f) => {
    if (body[f] !== undefined) allowed[f] = body[f]
  })

  if (body.client) {
    // Client-specific updates
    const clientUpdates: any = {}
    ;['contactPerson', 'companyName'].forEach((f) => {
      if (body.client[f] !== undefined) clientUpdates[f] = body.client[f]
    })
    if (Object.keys(clientUpdates).length > 0 && user.clientId) {
      if (clientUpdates.contactPerson) allowed.name = clientUpdates.contactPerson // keep name in sync
      await db.client.update({ where: { id: user.clientId }, data: clientUpdates })
    }
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: allowed,
    include: { client: true, vaProfile: true },
  })

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: user.id,
      after: JSON.stringify(allowed),
    },
  })

  return NextResponse.json({ ok: true, user: updated })
}
