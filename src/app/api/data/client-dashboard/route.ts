import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/data/client-dashboard
 * Strictly returns ONLY the current client's tenant data.
 * NEVER trust client-side filters — all queries are scoped by user.client.id.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'CLIENT' || !user.client) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const clientId = user.client.id
  const visibility = {
    canSeeHours: user.client.canSeeHours,
    canSeeQA: user.client.canSeeQA,
    canSeeActivity: user.client.canSeeActivity,
    canSeeTaskDetails: user.client.canSeeTaskDetails,
    canMessageVA: user.client.canMessageVA,
    canApproveDeliverable: user.client.canApproveDeliverable,
    canSeePerformance: user.client.canSeePerformance,
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  // VAs assigned to THIS client only
  const assignments = await db.assignment.findMany({
    where: { clientId, status: 'Active' },
    include: { va: { include: { user: true } } },
  })
  const vaIds = assignments.map((a) => a.vaId)

  // Today's time entries for this client's VAs
  const todayEntries = await db.timeEntry.findMany({
    where: { clientId, clockIn: { gte: todayStart } },
  })
  const todayMs = todayEntries.reduce((s, te) => {
    const end = te.clockOut?.getTime() ?? Date.now()
    return s + Math.max(0, end - te.clockIn.getTime() - te.breakMs)
  }, 0)

  // Weekly hours
  const weekEntries = await db.timeEntry.findMany({
    where: { clientId, clockIn: { gte: weekStart } },
  })
  const weekMs = weekEntries.reduce((s, te) => {
    const end = te.clockOut?.getTime() ?? Date.now()
    return s + Math.max(0, end - te.clockIn.getTime() - te.breakMs)
  }, 0)

  // Tasks
  const tasksCompletedWeek = await db.task.count({
    where: { clientId, status: 'Completed', completedAt: { gte: weekStart } },
  })
  const tasksInProgress = await db.task.count({
    where: { clientId, status: 'In Progress' },
  })
  const tasksPending = await db.task.count({
    where: { clientId, status: { in: ['To Do', 'Review'] } },
  })

  // Current active task
  const activeTask = await db.task.findFirst({
    where: { clientId, status: 'In Progress' },
    orderBy: { startedAt: 'desc' },
  })

  // KPIs
  const weekKey = new Date().toISOString().slice(0, 8) + '-W' + getWeekNumber()
  const kpiResults = await db.clientKPI.findMany({
    where: { clientId, period: weekKey },
    include: { kpi: true },
  })
  // Group KPIs by service (via kpi.service relation)
  const kpisByService: Record<string, Array<{ name: string; value: number; target: number; unit: string }>> = {}
  for (const kr of kpiResults) {
    const kpi = kr.kpi
    if (!kpi) continue
    const svc = await db.service.findUnique({ where: { id: kpi.serviceId ?? '' } })
    const svcName = svc?.name ?? 'General'
    if (!kpisByService[svcName]) kpisByService[svcName] = []
    kpisByService[svcName].push({
      name: kpi.name,
      value: kr.value,
      target: kr.target ?? kpi.target ?? 100,
      unit: kpi.unit,
    })
  }

  // QA summary (only if visible)
  let qaSummary: { score: number; trend: number; recent: Array<{ task: string; score: number }> } | null = null
  if (visibility.canSeeQA) {
    const recentQA = await db.qAReview.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
      take: 5,
      include: { task: true },
    })
    const weekQA = await db.qAReview.findMany({
      where: { clientId, date: { gte: weekStart } },
    })
    const prevWeekStart = new Date(weekStart)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)
    const prevWeekQA = await db.qAReview.findMany({
      where: { clientId, date: { gte: prevWeekStart, lt: weekStart } },
    })
    const avg = (arr: Array<{ score: number }>) => arr.length ? arr.reduce((s, q) => s + q.score, 0) / arr.length : 0
    const score = Math.round(avg(weekQA) * 10) / 10
    const prev = Math.round(avg(prevWeekQA) * 10) / 10
    const trend = Math.round((score - prev) * 10) / 10
    qaSummary = {
      score,
      trend,
      recent: recentQA.map((q) => ({ task: q.task?.title ?? 'Review', score: q.score })),
    }
  }

  // Recent deliverables
  const recentDeliverables = await db.deliverable.findMany({
    where: { clientId },
    orderBy: { date: 'desc' },
    take: 5,
    include: { va: { include: { user: true } } },
  })

  // Open requests/tickets
  const openTickets = await db.ticket.findMany({
    where: { clientId, status: { in: ['Open', 'In Progress', 'Waiting'] } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Activity feed (last 10 events from this client only)
  const recentTasks = await db.task.findMany({
    where: { clientId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: { va: { include: { user: true } } },
  })
  const activity = recentTasks
    .filter((t) => t.status === 'Completed' || t.status === 'In Progress' || t.status === 'Review')
    .map((t) => ({
      id: t.id,
      time: t.updatedAt,
      actor: t.va?.user.name ?? 'VA',
      action:
        t.status === 'Completed'
          ? `completed "${t.title}"`
          : t.status === 'In Progress'
            ? `started "${t.title}"`
            : `submitted "${t.title}" for review`,
    }))

  return NextResponse.json({
    visibility,
    client: {
      id: user.client.id,
      companyName: user.client.companyName,
      contactPerson: user.client.contactPerson,
      timezone: user.client.timezone,
      brandColor: user.client.brandColor,
      package: user.client.package,
      contractedHours: user.client.contractedHours,
    },
    vas: assignments.map((a) => ({
      id: a.va.id,
      name: a.va.user.name,
      avatarUrl: a.va.user.avatarUrl,
      specialization: a.va.specialization,
      role: a.role,
      weeklyHours: a.weeklyHours,
      status: a.va.currentStatus,
      performanceScore: a.va.performanceScore,
      qualityScore: a.va.qualityScore,
      shiftStartedAt: a.va.shiftStartedAt,
    })),
    today: {
      hoursMs: todayMs,
      tasksCompleted: await db.task.count({ where: { clientId, status: 'Completed', completedAt: { gte: todayStart } } }),
      tasksInProgress,
      activeTask: activeTask
        ? {
            id: activeTask.id,
            title: activeTask.title,
            startedAt: activeTask.startedAt,
            progress: activeTask.progress,
            service: activeTask.service,
          }
        : null,
    },
    week: {
      hoursMs: weekMs,
      scheduledHours: user.client.contractedHours / 4, // weekly
      tasksCompleted: tasksCompletedWeek,
      tasksPending,
      kpisByService,
    },
    qa: qaSummary,
    recentDeliverables: recentDeliverables.map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
      date: d.date,
      service: d.service,
      vaName: d.va?.user.name ?? '—',
    })),
    openTickets: openTickets.map((t) => ({
      id: t.id,
      ticketId: t.ticketId,
      title: t.title,
      type: t.type,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
    })),
    activity: activity.slice(0, 8),
  })
}

function getWeekNumber(): number {
  const d = new Date()
  const oneJan = new Date(d.getFullYear(), 0, 1)
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
  return Math.ceil((d.getDay() + 1 + numberOfDays) / 7)
}
