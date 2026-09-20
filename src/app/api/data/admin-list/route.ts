import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/data/admin-list?type=clients|vas|tasks|attendance|qa|deliverables|tickets|assignments|audit|documents|sops
 * Returns paginated list data for admin tables.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'OPERATIONS_MANAGER', 'QA_MANAGER', 'TEAM_LEAD'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'clients'
  const q = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? ''
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)

  switch (type) {
    case 'clients': {
      const items = await db.client.findMany({
        where: {
          OR: q ? [
            { companyName: { contains: q } },
            { contactPerson: { contains: q } },
            { email: { contains: q } },
          ] : undefined,
          contractStatus: status || undefined,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { _count: { select: { assignments: true, tasks: true, tickets: true } } },
      })
      return NextResponse.json({
        items: items.map((c) => ({
          id: c.id,
          companyName: c.companyName,
          contactPerson: c.contactPerson,
          email: c.email,
          country: c.country,
          timezone: c.timezone,
          package: c.package,
          contractedHours: c.contractedHours,
          contractStatus: c.contractStatus,
          startDate: c.startDate,
          assignedVAs: c._count.assignments,
          openTickets: c._count.tickets,
        })),
      })
    }
    case 'vas': {
      const items = await db.vA.findMany({
        where: {
          OR: q ? [
            { specialization: { contains: q } },
            { user: { name: { contains: q } } },
            { user: { email: { contains: q } } },
          ] : undefined,
          status: status || undefined,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: true,
          assignments: { where: { status: 'Active' }, include: { client: true } },
        },
      })
      return NextResponse.json({
        items: items.map((v) => ({
          id: v.id,
          name: v.user.name,
          email: v.user.email,
          specialization: v.specialization,
          status: v.status,
          currentStatus: v.currentStatus,
          performanceScore: v.performanceScore,
          qualityScore: v.qualityScore,
          attendanceScore: v.attendanceScore,
          hireDate: v.hireDate,
          assignments: v.assignments.map((a) => ({
            id: a.id,
            client: a.client.companyName,
            role: a.role,
            weeklyHours: a.weeklyHours,
          })),
        })),
      })
    }
    case 'tasks': {
      const items = await db.task.findMany({
        where: {
          OR: q ? [{ title: { contains: q } }, { description: { contains: q } }] : undefined,
          status: status || undefined,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { client: true, va: { include: { user: true } } },
      })
      return NextResponse.json({
        items: items.map((t) => ({
          id: t.id,
          title: t.title,
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
        })),
      })
    }
    case 'attendance': {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const items = await db.attendance.findMany({
        where: { date: { gte: sevenDaysAgo }, status: status || undefined },
        orderBy: { date: 'desc' },
        take: limit,
        include: { va: { include: { user: true } } },
      })
      return NextResponse.json({
        items: items.map((a) => ({
          id: a.id,
          vaName: a.va.user.name,
          date: a.date,
          scheduled: a.scheduled,
          clockIn: a.clockIn,
          clockOut: a.clockOut,
          breakMs: a.breakMs,
          workedMs: a.workedMs,
          status: a.status,
        })),
      })
    }
    case 'qa': {
      const items = await db.qAReview.findMany({
        orderBy: { date: 'desc' },
        take: limit,
        include: {
          va: { include: { user: true } },
          evaluator: true,
          client: true,
          task: true,
        },
      })
      return NextResponse.json({
        items: items.map((q) => ({
          id: q.id,
          vaName: q.va.user.name,
          client: q.client?.companyName ?? '—',
          task: q.task?.title ?? 'General',
          score: q.score,
          date: q.date,
          evaluator: q.evaluator.name,
          feedback: q.feedback,
          mistakes: q.mistakes,
          accuracy: q.accuracy,
          completeness: q.completeness,
          sopAdherence: q.sopAdherence,
          communication: q.communication,
          timeliness: q.timeliness,
          professionalism: q.professionalism,
        })),
      })
    }
    case 'deliverables': {
      const items = await db.deliverable.findMany({
        orderBy: { date: 'desc' },
        take: limit,
        where: { status: status || undefined },
        include: { client: true, va: { include: { user: true } } },
      })
      return NextResponse.json({
        items: items.map((d) => ({
          id: d.id,
          title: d.title,
          client: d.client.companyName,
          va: d.va?.user.name ?? '—',
          service: d.service,
          status: d.status,
          date: d.date,
          fileName: d.fileName,
          notes: d.notes,
        })),
      })
    }
    case 'tickets': {
      const items = await db.ticket.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        where: { status: status || undefined },
        include: { client: true, assignee: true },
      })
      return NextResponse.json({
        items: items.map((t) => ({
          id: t.id,
          ticketId: t.ticketId,
          title: t.title,
          type: t.type,
          priority: t.priority,
          status: t.status,
          client: t.client.companyName,
          assignee: t.assignee?.name ?? 'Unassigned',
          createdAt: t.createdAt,
          dueDate: t.dueDate,
        })),
      })
    }
    case 'audit': {
      const items = await db.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: { actor: true },
      })
      return NextResponse.json({
        items: items.map((a) => ({
          id: a.id,
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId,
          before: a.before,
          after: a.after,
          actor: a.actor.name,
          createdAt: a.createdAt,
        })),
      })
    }
    case 'documents': {
      const items = await db.document.findMany({
        orderBy: { uploadedAt: 'desc' },
        take: limit,
        include: { client: true },
      })
      return NextResponse.json({
        items: items.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          client: d.client?.companyName ?? 'Internal',
          fileName: d.fileName,
          fileSize: d.fileSize,
          isSensitive: d.isSensitive,
          uploadedAt: d.uploadedAt,
        })),
      })
    }
    case 'sops': {
      const items = await db.sOP.findMany({
        orderBy: { lastUpdated: 'desc' },
        take: limit,
        include: { client: true },
      })
      return NextResponse.json({
        items: items.map((s) => ({
          id: s.id,
          title: s.title,
          version: s.version,
          category: s.category,
          client: s.client?.companyName ?? 'General',
          lastUpdated: s.lastUpdated,
        })),
      })
    }
    default:
      return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  }
}
