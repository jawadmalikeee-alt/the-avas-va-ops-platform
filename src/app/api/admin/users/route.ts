import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/admin/users — list all users (admin only)
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can view users.' }, { status: 403 })
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      timezone: true,
      phone: true,
      jobTitle: true,
      avatarUrl: true,
      lastActiveAt: true,
      createdAt: true,
      client: { select: { companyName: true } },
      vaProfile: { select: { specialization: true, currentStatus: true } },
    },
  })

  return NextResponse.json({
    items: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      timezone: u.timezone,
      phone: u.phone,
      jobTitle: u.jobTitle,
      avatarUrl: u.avatarUrl,
      lastActiveAt: u.lastActiveAt,
      createdAt: u.createdAt,
      clientCompany: u.client?.companyName ?? null,
      vaSpecialization: u.vaProfile?.specialization ?? null,
      vaStatus: u.vaProfile?.currentStatus ?? null,
    })),
  })
}
