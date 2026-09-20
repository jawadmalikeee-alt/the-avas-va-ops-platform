import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * PATCH /api/deliverables — approve or request revision
 * body: { id, action: 'approve' | 'revision', notes? }
 */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { id, action, notes } = await req.json()
  if (!id || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const deliverable = await db.deliverable.findUnique({ where: { id } })
  if (!deliverable) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Tenant guard
  if (user.role === 'CLIENT' && deliverable.clientId !== user.client?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'CLIENT' && !user.client?.canApproveDeliverable) {
    return NextResponse.json({ error: 'Approval permission disabled.' }, { status: 403 })
  }

  if (action === 'approve') {
    await db.deliverable.update({
      where: { id },
      data: { status: 'Approved', approvedAt: new Date(), approvedById: user.id },
    })
    return NextResponse.json({ ok: true })
  }
  if (action === 'revision') {
    await db.deliverable.update({
      where: { id },
      data: { status: 'Revision Requested', revisionNotes: notes ?? '' },
    })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
