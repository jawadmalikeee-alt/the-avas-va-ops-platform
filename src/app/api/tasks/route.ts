import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * POST /api/tasks — create or update a task
 * body: { id?, title?, description?, status?, priority?, dueDate?, clientId?, vaId?, progress?, action? }
 *
 * action='submit_work' — VA submits work for review (payload, notes)
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const body = await req.json()

  // VA work submission
  if (body.action === 'submit_work') {
    if (user.role !== 'VA') return NextResponse.json({ error: 'Only VAs can submit work.' }, { status: 403 })
    const task = await db.task.findUnique({ where: { id: body.taskId } })
    if (!task || task.vaId !== user.vaProfile?.id) {
      return NextResponse.json({ error: 'Task not assigned to you.' }, { status: 403 })
    }
    const submission = await db.workSubmission.create({
      data: {
        taskId: body.taskId,
        vaId: user.vaProfile.id,
        payload: JSON.stringify(body.payload ?? {}),
        notes: body.notes ?? '',
        fileUrl: body.fileUrl ?? null,
        fileName: body.fileName ?? null,
      },
    })
    await db.task.update({ where: { id: body.taskId }, data: { status: 'Review', deliverableUrl: body.fileUrl ?? null, progress: 100 } })
    return NextResponse.json({ ok: true, submission })
  }

  // Create task (admin only)
  if (body.action === 'create') {
    if (!['ADMIN', 'OPERATIONS_MANAGER', 'TEAM_LEAD'].includes(user.role)) {
      return NextResponse.json({ error: 'Only admins can create tasks.' }, { status: 403 })
    }
    const task = await db.task.create({
      data: {
        title: body.title,
        description: body.description ?? '',
        clientId: body.clientId ?? null,
        vaId: body.vaId ?? null,
        service: body.service ?? null,
        priority: body.priority ?? 'Medium',
        status: 'To Do',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        createdById: user.id,
      },
    })
    // Notify assigned VA
    if (body.vaId) {
      const va = await db.vA.findUnique({ where: { id: body.vaId }, include: { user: true } })
      if (va) {
        await db.notification.create({
          data: {
            userId: va.user.id,
            type: 'task_assigned',
            title: 'New task assigned',
            body: body.title,
            link: '/va/tasks',
          },
        })
      }
    }
    return NextResponse.json({ ok: true, task })
  }

  // Update task status
  if (body.action === 'update') {
    const task = await db.task.findUnique({ where: { id: body.taskId } })
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    // Tenant guard
    if (user.role === 'VA' && task.vaId !== user.vaProfile?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (user.role === 'CLIENT' && task.clientId !== user.client?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const updated = await db.task.update({
      where: { id: body.taskId },
      data: {
        status: body.status ?? undefined,
        progress: body.progress ?? undefined,
        startedAt: body.status === 'In Progress' ? (task.startedAt ?? new Date()) : undefined,
        completedAt: body.status === 'Completed' ? new Date() : undefined,
      },
    })
    return NextResponse.json({ ok: true, task: updated })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
