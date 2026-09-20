import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/tickets/list — list tickets
 * - CLIENT: only own tickets (tenant-scoped)
 * - ADMIN: all tickets
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let where: any = {}
  if (user.role === 'CLIENT') where.clientId = user.client?.id
  // Admin sees all

  const items = await db.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { client: true, assignee: true },
  })

  return NextResponse.json({
    items: items.map((t) => ({
      id: t.id,
      ticketId: t.ticketId,
      title: t.title,
      description: t.description,
      type: t.type,
      priority: t.priority,
      status: t.status,
      client: t.client?.companyName ?? '—',
      assignee: t.assignee?.name ?? 'Unassigned',
      createdAt: t.createdAt,
      dueDate: t.dueDate,
    })),
  })
}
