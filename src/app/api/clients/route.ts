import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createHash } from 'crypto'

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

/**
 * GET /api/clients — list (admin: all, client: own only)
 * POST /api/clients — create new client (admin only)
 * PATCH /api/clients — update client
 * DELETE /api/clients — soft delete client
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  if (user.role === 'CLIENT') {
    return NextResponse.json({
      items: user.client ? [{
        id: user.client.id,
        companyName: user.client.companyName,
        contactPerson: user.client.contactPerson,
        email: user.email,
        timezone: user.client.timezone,
        brandColor: user.client.brandColor,
        package: user.client.package,
        contractedHours: user.client.contractedHours,
        contractStatus: 'Active',
      }] : [],
    })
  }

  const items = await db.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { assignments: true, tasks: true, tickets: true } }, user: true },
  })
  return NextResponse.json({
    items: items.map((c) => ({
      id: c.id,
      companyName: c.companyName,
      contactPerson: c.contactPerson,
      email: c.email,
      country: c.country,
      timezone: c.timezone,
      industry: c.industry,
      package: c.package,
      contractedHours: c.contractedHours,
      contractStatus: c.contractStatus,
      startDate: c.startDate,
      brandColor: c.brandColor,
      phone: c.phone,
      billingCycle: c.billingCycle,
      assignedVAs: c._count.assignments,
      openTickets: c._count.tickets,
      createdAt: c.createdAt,
    })),
  })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'OPERATIONS_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Only admins can create clients.' }, { status: 403 })
  }
  const body = await req.json()
  const { companyName, contactPerson, email, phone, country, timezone, industry, pkg, contractedHours, billingCycle, brandColor, password } = body

  if (!companyName || !contactPerson || !email || !password) {
    return NextResponse.json({ error: 'Company name, contact person, email, and password are required.' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 400 })

  const newUser = await db.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name: contactPerson,
      role: 'CLIENT',
      timezone: timezone ?? 'America/New_York',
      phone: phone,
      jobTitle: 'Account Owner',
    },
  })

  const client = await db.client.create({
    data: {
      userId: newUser.id,
      companyName,
      contactPerson,
      email: email.toLowerCase(),
      phone: phone ?? null,
      country: country ?? 'United States',
      timezone: timezone ?? 'America/New_York',
      industry: industry ?? 'Real Estate',
      package: pkg ?? 'Real Estate VA — 40 Hours/Week',
      contractedHours: parseInt(contractedHours) || 160,
      billingCycle: billingCycle ?? 'Monthly',
      startDate: new Date(),
      contractStatus: 'Active',
      brandColor: brandColor ?? '#1a1f3d',
      workingHours: String(Math.floor((parseInt(contractedHours) || 160) / 4)),
    },
  })

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'CLIENT_CREATED',
      entityType: 'Client',
      entityId: client.id,
      after: `${companyName} (${email})`,
    },
  })

  return NextResponse.json({ ok: true, client })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'OPERATIONS_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Client ID required' }, { status: 400 })

  const before = await db.client.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const allowed: any = {}
  ;['companyName', 'contactPerson', 'phone', 'country', 'timezone', 'industry', 'package', 'contractedHours', 'billingCycle', 'contractStatus', 'brandColor'].forEach((f) => {
    if (updates[f] !== undefined) allowed[f] = updates[f]
  })
  if (allowed.contractedHours) allowed.workingHours = String(Math.floor(allowed.contractedHours / 4))

  const updated = await db.client.update({ where: { id }, data: allowed })

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'CLIENT_UPDATED',
      entityType: 'Client',
      entityId: id,
      before: JSON.stringify({ companyName: before.companyName, package: before.package, contractStatus: before.contractStatus }),
      after: JSON.stringify({ companyName: updated.companyName, package: updated.package, contractStatus: updated.contractStatus }),
    },
  })

  return NextResponse.json({ ok: true, client: updated })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can delete clients.' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const client = await db.client.findUnique({ where: { id } })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.client.update({ where: { id }, data: { contractStatus: 'Ended' } })
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'CLIENT_DELETED',
      entityType: 'Client',
      entityId: id,
      before: client.companyName,
      after: 'Ended',
    },
  })
  return NextResponse.json({ ok: true })
}
