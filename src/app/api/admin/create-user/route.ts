import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createHash } from 'crypto'

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

/**
 * POST /api/admin/create-user
 *   Admin creates a VA or Client account
 *   body: { name, email, password, role: 'VA'|'CLIENT', ...extraFields }
 *
 * For CLIENT: also creates a Client record with company info
 * For VA: also creates a VA record with specialization
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can create accounts.' }, { status: 403 })
  }

  const { name, email, password, role, ...extra } = await req.json()

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Name, email, password, and role are required.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }
  if (!['VA', 'CLIENT'].includes(role)) {
    return NextResponse.json({ error: 'Role must be VA or CLIENT.' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Check if email exists
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 })
  }

  // Create user
  const newUser = await db.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      name: name.trim(),
      role,
      timezone: extra.timezone || 'America/New_York',
      phone: extra.phone || null,
      jobTitle: extra.jobTitle || (role === 'VA' ? extra.specialization : 'Account Owner'),
    },
  })

  // Create role-specific record
  if (role === 'CLIENT') {
    await db.client.create({
      data: {
        userId: newUser.id,
        companyName: extra.companyName || name.trim(),
        contactPerson: name.trim(),
        email: normalizedEmail,
        phone: extra.phone || null,
        country: extra.country || 'United States',
        timezone: extra.timezone || 'America/New_York',
        industry: extra.industry || 'Real Estate',
        package: extra.package || 'Real Estate VA — 40 Hours/Week',
        contractedHours: parseInt(extra.contractedHours) || 160,
        billingCycle: extra.billingCycle || 'Monthly',
        startDate: new Date(),
        contractStatus: 'Active',
        brandColor: extra.brandColor || '#2d4ed8',
        workingHours: String(Math.floor((parseInt(extra.contractedHours) || 160) / 4)),
      },
    })
  } else if (role === 'VA') {
    await db.vA.create({
      data: {
        userId: newUser.id,
        specialization: extra.specialization || 'Real Estate Virtual Assistant',
        skills: extra.skills || '',
        hireDate: new Date(),
        employmentType: extra.employmentType || 'Full-Time',
        monthlySalary: parseInt(extra.monthlySalary) || null,
        status: 'Active',
        currentStatus: 'Offline',
        performanceScore: 85,
        qualityScore: 90,
        attendanceScore: 95,
      },
    })
  }

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser.id,
      after: `Created ${role} account: ${name} (${normalizedEmail})`,
    },
  })

  return NextResponse.json({ ok: true, userId: newUser.id })
}
