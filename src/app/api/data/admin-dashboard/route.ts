import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/data/admin-dashboard
 * Returns aggregated admin command-center metrics + live operations + alerts.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'OPERATIONS_MANAGER', 'QA_MANAGER', 'TEAM_LEAD'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const [activeClients, activeVAs, workingVAs, todayTimeEntries, tasksCompleted, tasksPending, qaIssues, openTickets] = await Promise.all([
    db.client.count({ where: { contractStatus: 'Active' } }),
    db.vA.count({ where: { status: 'Active' } }),
    db.vA.count({ where: { currentStatus: { in: ['Working', 'Break', 'Meeting'] } } }),
    db.timeEntry.findMany({ where: { clockIn: { gte: todayStart } } }),
    db.task.count({ where: { status: 'Completed', completedAt: { gte: todayStart } } }),
    db.task.count({ where: { status: { in: ['To Do', 'In Progress', 'Review'] } } }),
    db.qAReview.count({ where: { score: { lt: 90 }, date: { gte: weekStart } } }),
    db.ticket.count({ where: { status: { in: ['Open', 'In Progress', 'Waiting'] } } }),
  ])

  const hoursToday = todayTimeEntries.reduce((sum, te) => {
    const end = te.clockOut?.getTime() ?? Date.now()
    const start = te.clockIn.getTime()
    return sum + Math.max(0, end - start - te.breakMs)
  }, 0)
  const hoursTodayNum = Math.round((hoursToday / 3600000) * 10) / 10

  const activeVARecords = await db.vA.findMany({
    where: { currentStatus: { in: ['Working', 'Break', 'Meeting', 'Training'] } },
    include: {
      user: true,
      assignments: { where: { status: 'Active' }, include: { client: true } },
    },
  })

  const liveOps = await Promise.all(
    activeVARecords.map(async (va) => {
      const activeTask = va.currentTaskId ? await db.task.findUnique({ where: { id: va.currentTaskId } }) : null
      const activeTimeEntry = await db.timeEntry.findFirst({
        where: { vaId: va.id, status: 'Active' },
        orderBy: { clockIn: 'desc' },
      })
      const todayEntries = await db.timeEntry.findMany({
        where: { vaId: va.id, clockIn: { gte: todayStart } },
      })
      const todayMs = todayEntries.reduce((s, te) => {
        const end = te.clockOut?.getTime() ?? Date.now()
        return s + Math.max(0, end - te.clockIn.getTime() - te.breakMs)
      }, 0)
      const recentQA = await db.qAReview.findFirst({
        where: { vaId: va.id },
        orderBy: { date: 'desc' },
      })
      const elapsed = activeTimeEntry ? Date.now() - activeTimeEntry.clockIn.getTime() - activeTimeEntry.breakMs : 0
      return {
        id: va.id,
        name: va.user.name,
        avatarUrl: va.user.avatarUrl,
        specialization: va.specialization,
        status: va.currentStatus,
        clockIn: activeTimeEntry?.clockIn ?? null,
        currentTask: activeTask?.title ?? null,
        elapsedTime: elapsed,
        todayHours: todayMs,
        performanceScore: va.performanceScore,
        qaStatus: recentQA ? (recentQA.score >= 90 ? 'Good' : recentQA.score >= 80 ? 'Watch' : 'Issue') : 'No QA',
        primaryClient: va.assignments[0]?.client.companyName ?? '—',
        primaryAssignment: va.assignments[0]?.role ?? '—',
      }
    })
  )

  const alerts: Array<{ severity: 'critical' | 'warning' | 'info'; title: string; body: string; time: Date }> = []
  const lateToday = await db.attendance.findMany({
    where: { date: { gte: todayStart }, status: 'Late' },
    include: { va: { include: { user: true } } },
  })
  lateToday.forEach((a) =>
    alerts.push({
      severity: 'warning',
      title: `${a.va.user.name} was late today`,
      body: `Clocked in at ${new Date(a.clockIn ?? Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
      time: a.date,
    })
  )
  const lowQAVAs = await db.qAReview.findMany({
    where: { score: { lt: 85 }, date: { gte: weekStart } },
    include: { va: { include: { user: true } } },
  })
  lowQAVAs.forEach((qa) =>
    alerts.push({
      severity: 'warning',
      title: `QA issue: ${qa.va.user.name} scored ${qa.score}%`,
      body: qa.feedback ?? 'Review needed',
      time: qa.date,
    })
  )
  const urgentTickets = await db.ticket.findMany({
    where: { priority: 'Urgent', status: { in: ['Open', 'In Progress'] } },
    include: { client: true },
  })
  urgentTickets.forEach((t) =>
    alerts.push({
      severity: 'critical',
      title: `Urgent client request: ${t.title}`,
      body: `From ${t.client.companyName} • ${t.ticketId}`,
      time: t.createdAt,
    })
  )

  return NextResponse.json({
    metrics: {
      activeClients,
      activeVAs,
      workingVAs,
      hoursToday: hoursTodayNum,
      tasksCompleted,
      tasksPending,
      qaIssues,
      clientIssues: openTickets,
    },
    liveOps,
    alerts: alerts.slice(0, 8),
  })
}
