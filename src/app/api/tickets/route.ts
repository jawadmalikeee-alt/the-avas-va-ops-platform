import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * POST /api/tickets — create a client request/ticket.
 * Strictly tenant-scoped.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'CLIENT' || !user.client) {
    return NextResponse.json({ error: 'Only clients can create tickets.' }, { status: 403 })
  }
  const { title, description, type, priority, dueDate } = await req.json()
  if (!title) return NextResponse.json({ error: 'Title required.' }, { status: 400 })

  // Generate next ticket ID
  const count = await db.ticket.count()
  const ticketId = `TKT-${String(count + 1).padStart(4, '0')}`

  const ticket = await db.ticket.create({
    data: {
      ticketId,
      clientId: user.client.id,
      title,
      description: description ?? '',
      type: type ?? 'Task Request',
      priority: priority ?? 'Medium',
      status: 'Open',
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  })

  // Notify admins
  const admins = await db.user.findMany({ where: { role: 'ADMIN' } })
  await Promise.all(
    admins.map((a) =>
      db.notification.create({
        data: {
          userId: a.id,
          type: 'client_request',
          title: `New ${type} from ${user.client!.companyName}`,
          body: title,
          link: '/admin/requests',
        },
      })
    )
  )

  return NextResponse.json({ ok: true, ticket })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  // Client can close their own; admin can update any
  const where = user.role === 'CLIENT' ? { id, clientId: user.client?.id } : { id }
  await db.ticket.updateMany({ where, data: { status } })
  return NextResponse.json({ ok: true })
}
