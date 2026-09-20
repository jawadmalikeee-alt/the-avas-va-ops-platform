import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createHash } from 'crypto'

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

/**
 * GET /api/vas — list VAs
 * POST /api/vas — create VA + user
 * PATCH /api/vas — update VA
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  if (user.role === 'VA') {
    // Return only self
    return NextResponse.json({
      items: user.vaProfile ? [{
        id: user.vaProfile.id,
        name: user.name,
        email: user.email,
        specialization: user.vaProfile.specialization,
        status: user.vaProfile.status,
        currentStatus: user.vaProfile.currentStatus,
        performanceScore: user.vaProfile.performanceScore,
        qualityScore: user.vaProfile.qualityScore,
        attendanceScore: user.vaProfile.attendanceScore,
        hireDate: user.vaProfile.hireDate,
        assignments: [],
      }] : [],
    })
  }

  if (user.role === 'CLIENT') {
    // Return only VAs assigned to this client
    const assignments = await db.assignment.findMany({
      where: { clientId: user.client?.id, status: 'Active' },
      include: { va: { include: { user: true, assignments: { where: { status: 'Active' }, include: { client: true } } } } },
    })
    const seen = new Set<string>()
    const items = []
    for (const a of assignments) {
      if (seen.has(a.va.id)) continue
      seen.add(a.va.id)
      items.push({
        id: a.va.id,
        name: a.va.user.name,
        email: a.va.user.email,
        specialization: a.va.specialization,
        status: a.va.status,
        currentStatus: a.va.currentStatus,
        performanceScore: a.va.performanceScore,
        qualityScore: a.va.qualityScore,
        attendanceScore: a.va.attendanceScore,
        hireDate: a.va.hireDate,
        assignments: a.va.assignments.map((asg) => ({
          id: asg.id,
          client: asg.client.companyName,
          role: asg.role,
          weeklyHours: asg.weeklyHours,
        })),
      })
    }
    return NextResponse.json({ items })
  }

  // Admin
  const items = await db.vA.findMany({
    orderBy: { createdAt: 'desc' },
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
      employmentType: v.employmentType,
      assignments: v.assignments.map((a) => ({
        id: a.id,
        client: a.client.companyName,
        role: a.role,
        weeklyHours: a.weeklyHours,
      })),
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'OPERATIONS_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Only admins can create VAs.' }, { status: 403 })
  }
  const body = await req.json()
  const { name, email, phone, specialization, skills, employmentType, monthlySalary, password } = body

  if (!name || !email || !password || !specialization) {
    return NextResponse.json({ error: 'Name, email, password, and specialization are required.' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 400 })

  const newUser = await db.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name,
      role: 'VA',
      timezone: 'Asia/Karachi',
      phone,
      jobTitle: specialization,
    },
  })

  const va = await db.vA.create({
    data: {
      userId: newUser.id,
      specialization,
      skills: skills ?? '',
      hireDate: new Date(),
      employmentType: employmentType ?? 'Full-Time',
      monthlySalary: parseInt(monthlySalary) || null,
      status: 'Active',
      currentStatus: 'Offline',
      performanceScore: 85,
      qualityScore: 90,
      attendanceScore: 95,
    },
  })

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'VA_CREATED',
      entityType: 'VA',
      entityId: va.id,
      after: `${name} (${email}) — ${specialization}`,
    },
  })

  return NextResponse.json({ ok: true, va })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'OPERATIONS_MANAGER', 'TEAM_LEAD'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'VA ID required' }, { status: 400 })

  const before = await db.vA.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'VA not found' }, { status: 404 })

  const allowed: any = {}
  ;['specialization', 'skills', 'employmentType', 'monthlySalary', 'status', 'currentStatus', 'performanceScore', 'qualityScore', 'attendanceScore'].forEach((f) => {
    if (updates[f] !== undefined) allowed[f] = updates[f]
  })

  const updated = await db.vA.update({ where: { id }, data: allowed })

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'VA_UPDATED',
      entityType: 'VA',
      entityId: id,
      before: JSON.stringify({ status: before.status, currentStatus: before.currentStatus }),
      after: JSON.stringify({ status: updated.status, currentStatus: updated.currentStatus }),
    },
  })

  return NextResponse.json({ ok: true, va: updated })
}
