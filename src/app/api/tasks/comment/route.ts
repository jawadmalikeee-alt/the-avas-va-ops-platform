import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * POST /api/tasks/comment — add comment to a task
 * body: { taskId, content }
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { taskId, content } = await req.json()
  if (!taskId || !content) return NextResponse.json({ error: 'Task ID and content required' }, { status: 400 })

  // Tenant guard
  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  if (user.role === 'CLIENT' && task.clientId !== user.client?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (user.role === 'VA' && task.vaId !== user.vaProfile?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const comment = await db.taskComment.create({
    data: { taskId, userId: user.id, content },
    include: { user: true },
  })

  return NextResponse.json({ ok: true, comment })
}
