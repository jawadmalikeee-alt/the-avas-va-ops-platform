import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/tasks/list — list tasks
 * - CLIENT: only own client's tasks
 * - VA: only tasks assigned to them
 * - ADMIN: all tasks
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let where: any = {}
  if (user.role === 'CLIENT') where.clientId = user.client?.id
  if (user.role === 'VA') where.vaId = user.vaProfile?.id

  const items = await db.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { client: true, va: { include: { user: true } } },
  })

  return NextResponse.json({
    items: items.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      service: t.service,
      progress: t.progress,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      client: t.client?.companyName ?? '—',
      va: t.va?.user.name ?? '—',
      timeSpentMs: t.timeSpentMs,
      qaStatus: t.qaStatus,
      clientId: t.clientId,
      vaId: t.vaId,
    })),
  })
}
