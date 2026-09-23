import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * PATCH /api/admin/user-status
 * body: { userId, action: 'disable'|'activate'|'remove'|'delete' }
 *
 * disable  → status = INACTIVE (can be reactivated)
 * activate → status = ACTIVE
 * remove   → status = REMOVED (soft delete, historical records preserved)
 * delete   → hard delete (cascade removes related records)
 */
export async function PATCH(req: NextRequest) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can manage user accounts.' }, { status: 403 })
  }

  const { userId, action } = await req.json()
  if (!userId || !action) {
    return NextResponse.json({ error: 'User ID and action are required.' }, { status: 400 })
  }
  if (!['disable', 'activate', 'remove', 'delete'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } })
  if (!targetUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  // Prevent admin from deleting themselves
  if (userId === admin.id && action === 'delete') {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 })
  }

  if (action === 'disable') {
    await db.user.update({ where: { id: userId }, data: { status: 'INACTIVE' } })
    await db.auditLog.create({ data: { actorId: admin.id, action: 'USER_DISABLED', entityType: 'User', entityId: userId, after: `Disabled: ${targetUser.name}` } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'activate') {
    await db.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } })
    await db.auditLog.create({ data: { actorId: admin.id, action: 'USER_ACTIVATED', entityType: 'User', entityId: userId, after: `Activated: ${targetUser.name}` } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'remove') {
    await db.user.update({ where: { id: userId }, data: { status: 'REMOVED' } })
    // End all active assignments
    await db.assignment.updateMany({ where: { userId, status: 'Active' }, data: { status: 'Ended', endDate: new Date() } })
    await db.auditLog.create({ data: { actorId: admin.id, action: 'USER_REMOVED', entityType: 'User', entityId: userId, after: `Removed: ${targetUser.name}` } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete') {
    // Hard delete — cascade will remove related records
    await db.user.delete({ where: { id: userId } })
    await db.auditLog.create({ data: { actorId: admin.id, action: 'USER_DELETED', entityType: 'User', entityId: userId, after: `Permanently deleted: ${targetUser.name}` } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
