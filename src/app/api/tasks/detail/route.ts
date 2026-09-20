import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/tasks/detail?id=... — get task with comments, time entries, QA
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 })

  const task = await db.task.findUnique({
    where: { id },
    include: {
      client: true,
      va: { include: { user: true } },
      creator: true,
      comments: { include: { user: true }, orderBy: { createdAt: 'asc' } },
      timeEntries: { orderBy: { clockIn: 'desc' }, take: 20 },
      qaReview: true,
      submissions: true,
      project: true,
    },
  })

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  // Tenant guard
  if (user.role === 'CLIENT' && task.clientId !== user.client?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'VA' && task.vaId !== user.vaProfile?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ task })
}
