import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/data/va-dashboard
 * Returns the current VA's home dashboard data.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'VA' || !user.vaProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const vaId = user.vaProfile.id

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  // Active time entry
  const activeEntry = await db.timeEntry.findFirst({
    where: { vaId, status: 'Active' },
    orderBy: { clockIn: 'desc' },
  })

  // Today's hours
  const todayEntries = await db.timeEntry.findMany({
    where: { vaId, clockIn: { gte: todayStart } },
  })
  const todayMs = todayEntries.reduce((s, te) => {
    const end = te.clockOut?.getTime() ?? Date.now()
    return s + Math.max(0, end - te.clockIn.getTime() - te.breakMs)
  }, 0)

  // Week's hours
  const weekEntries = await db.timeEntry.findMany({
    where: { vaId, clockIn: { gte: weekStart } },
  })
  const weekMs = weekEntries.reduce((s, te) => {
    const end = te.clockOut?.getTime() ?? Date.now()
    return s + Math.max(0, end - te.clockIn.getTime() - te.breakMs)
  }, 0)

  // Tasks
  const myTasks = await db.task.findMany({
    where: { vaId, status: { in: ['To Do', 'In Progress', 'Review'] } },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    take: 10,
    include: { client: true },
  })

  // Schedule (today)
  const today = new Date()
  const todayName = today.toLocaleDateString('en-US', { weekday: 'long' })

  // QA feedback
  const recentQA = await db.qAReview.findMany({
    where: { vaId },
    orderBy: { date: 'desc' },
    take: 3,
    include: { evaluator: true, task: true },
  })

  // Recent deliverables
  const recentDeliverables = await db.deliverable.findMany({
    where: { vaId },
    orderBy: { date: 'desc' },
    take: 5,
    include: { client: true },
  })

  // Announcements / notifications
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Assignments (clients this VA serves)
  const assignments = await db.assignment.findMany({
    where: { vaId, status: 'Active' },
    include: { client: true },
  })

  // SOPs
  const sops = await db.sOPAssignment.findMany({
    where: { vaId },
    include: { sop: true },
  })

  return NextResponse.json({
    va: {
      id: user.vaProfile.id,
      name: user.name,
      specialization: user.vaProfile.specialization,
      status: user.vaProfile.currentStatus,
      shiftStartedAt: user.vaProfile.shiftStartedAt,
      performanceScore: user.vaProfile.performanceScore,
      qualityScore: user.vaProfile.qualityScore,
      attendanceScore: user.vaProfile.attendanceScore,
    },
    activeEntry: activeEntry
      ? {
          id: activeEntry.id,
          clockIn: activeEntry.clockIn,
          breakMs: activeEntry.breakMs,
          status: activeEntry.status,
          taskId: activeEntry.taskId,
        }
      : null,
    todayHoursMs: todayMs,
    weekHoursMs: weekMs,
    scheduledWeeklyHours: assignments.reduce((s, a) => s + a.weeklyHours, 0),
    tasks: myTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      progress: t.progress,
      dueDate: t.dueDate,
      client: t.client?.companyName ?? '—',
      service: t.service,
      timeSpentMs: t.timeSpentMs,
    })),
    todaySchedule: {
      day: todayName,
      assignments: assignments.map((a) => ({
        client: a.client.companyName,
        role: a.role,
        schedule: a.schedule,
        weeklyHours: a.weeklyHours,
      })),
    },
    qaFeedback: recentQA.map((q) => ({
      id: q.id,
      date: q.date,
      score: q.score,
      task: q.task?.title ?? 'General',
      feedback: q.feedback,
      evaluator: q.evaluator.name,
    })),
    recentDeliverables: recentDeliverables.map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
      date: d.date,
      client: d.client.companyName,
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
    })),
    sops: sops.map((s) => ({
      id: s.sop.id,
      title: s.sop.title,
      version: s.sop.version,
      category: s.sop.category,
      lastUpdated: s.sop.lastUpdated,
    })),
  })
}
