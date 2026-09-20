import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/assignments — list assignments
 * POST /api/assignments — create assignment (assign VA to client)
 * PATCH /api/assignments — update
 * DELETE /api/assignments — end assignment
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let where: any = {}
  if (user.role === 'CLIENT') where.clientId = user.client?.id
  if (user.role === 'VA') where.vaId = user.vaProfile?.id

  const items = await db.assignment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { client: true, va: { include: { user: true } } },
  })
  return NextResponse.json({
    items: items.map((a) => ({
      id: a.id,
      clientId: a.clientId,
      vaId: a.vaId,
      client: a.client.companyName,
      clientTimezone: a.client.timezone,
      va: a.va.user.name,
      vaAvatar: a.va.user.avatarUrl,
      vaSpecialization: a.va.specialization,
      role: a.role,
      weeklyHours: a.weeklyHours,
      schedule: a.schedule,
      startDate: a.startDate,
      endDate: a.endDate,
      status: a.status,
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'OPERATIONS_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Only admins can create assignments.' }, { status: 403 })
  }
  const body = await req.json()
  const { clientId, vaId, role, weeklyHours, schedule } = body

  if (!clientId || !vaId || !role) {
    return NextResponse.json({ error: 'Client, VA, and role are required.' }, { status: 400 })
  }

  // Check for existing active assignment
  const existing = await db.assignment.findFirst({
    where: { clientId, vaId, status: 'Active' },
  })
  if (existing) return NextResponse.json({ error: 'This VA is already assigned to this client.' }, { status: 400 })

  const assignment = await db.assignment.create({
    data: {
      clientId,
      vaId,
      role,
      weeklyHours: parseInt(weeklyHours) || 40,
      schedule: schedule ?? 'Mon-Fri 9:00 AM - 6:00 PM PKT',
      startDate: new Date(),
      status: 'Active',
    },
  })

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'ASSIGNMENT_CREATED',
      entityType: 'Assignment',
      entityId: assignment.id,
      after: `Client ${clientId} → VA ${vaId} (${role})`,
    },
  })

  // Notify VA
  const va = await db.vA.findUnique({ where: { id: vaId }, include: { user: true } })
  if (va) {
    const client = await db.client.findUnique({ where: { id: clientId } })
    await db.notification.create({
      data: {
        userId: va.user.id,
        type: 'task_assigned',
        title: 'New client assignment',
        body: `You've been assigned to ${client?.companyName ?? 'a client'} as ${role}.`,
        link: '/va/dashboard',
      },
    })
  }

  return NextResponse.json({ ok: true, assignment })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'OPERATIONS_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })

  const allowed: any = {}
  ;['role', 'weeklyHours', 'schedule', 'status', 'endDate'].forEach((f) => {
    if (updates[f] !== undefined) {
      if (f === 'endDate') allowed[f] = updates[f] ? new Date(updates[f]) : null
      else allowed[f] = updates[f]
    }
  })

  const updated = await db.assignment.update({ where: { id }, data: allowed })

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'ASSIGNMENT_UPDATED',
      entityType: 'Assignment',
      entityId: id,
      after: JSON.stringify(allowed),
    },
  })

  return NextResponse.json({ ok: true, assignment: updated })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'OPERATIONS_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  await db.assignment.update({ where: { id }, data: { status: 'Ended', endDate: new Date() } })

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'ASSIGNMENT_ENDED',
      entityType: 'Assignment',
      entityId: id,
    },
  })

  return NextResponse.json({ ok: true })
}
