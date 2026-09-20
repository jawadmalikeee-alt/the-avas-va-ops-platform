import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/users/contacts
 * Returns users the current user can chat with:
 * - ADMIN: all clients + all VAs
 * - CLIENT: assigned VAs + all admins
 * - VA: assigned clients + all admins
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const contacts: any[] = []

  if (user.role === 'ADMIN' || user.role === 'OPERATIONS_MANAGER' || user.role === 'QA_MANAGER' || user.role === 'TEAM_LEAD') {
    // Admin: all clients + all VAs
    const [clients, vas, admins] = await Promise.all([
      db.client.findMany({ include: { user: true } }),
      db.vA.findMany({ include: { user: true } }),
      db.user.findMany({ where: { role: { in: ['ADMIN', 'OPERATIONS_MANAGER', 'QA_MANAGER', 'TEAM_LEAD'] } } }),
    ])
    clients.forEach((c) => contacts.push({
      id: c.user.id,
      name: c.user.name,
      email: c.user.email,
      role: c.user.role,
      jobTitle: 'Client Owner',
      avatarUrl: c.user.avatarUrl,
      status: 'Online',
      companyName: c.companyName,
    }))
    vas.forEach((v) => contacts.push({
      id: v.user.id,
      name: v.user.name,
      email: v.user.email,
      role: v.user.role,
      jobTitle: v.specialization,
      avatarUrl: v.user.avatarUrl,
      status: v.currentStatus,
    }))
    admins.filter((a) => a.id !== user.id).forEach((a) => contacts.push({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      jobTitle: a.jobTitle,
      avatarUrl: a.avatarUrl,
      status: 'Online',
    }))
  }

  if (user.role === 'CLIENT') {
    // Client: assigned VAs + admins
    const assignments = await db.assignment.findMany({
      where: { clientId: user.client?.id, status: 'Active' },
      include: { va: { include: { user: true } } },
    })
    assignments.forEach((a) => contacts.push({
      id: a.va.user.id,
      name: a.va.user.name,
      email: a.va.user.email,
      role: a.va.user.role,
      jobTitle: a.role,
      avatarUrl: a.va.user.avatarUrl,
      status: a.va.currentStatus,
    }))
    const admins = await db.user.findMany({ where: { role: { in: ['ADMIN', 'OPERATIONS_MANAGER'] } } })
    admins.forEach((a) => contacts.push({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      jobTitle: a.jobTitle ?? 'The AVAS Team',
      avatarUrl: a.avatarUrl,
      status: 'Online',
    }))
  }

  if (user.role === 'VA') {
    // VA: assigned clients + admins
    const assignments = await db.assignment.findMany({
      where: { vaId: user.vaProfile?.id, status: 'Active' },
      include: { client: { include: { user: true } } },
    })
    assignments.forEach((a) => contacts.push({
      id: a.client.user.id,
      name: a.client.user.name,
      email: a.client.user.email,
      role: a.client.user.role,
      jobTitle: a.role,
      avatarUrl: a.client.user.avatarUrl,
      status: 'Online',
      companyName: a.client.companyName,
    }))
    const admins = await db.user.findMany({ where: { role: { in: ['ADMIN', 'OPERATIONS_MANAGER', 'TEAM_LEAD'] } } })
    admins.forEach((a) => contacts.push({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      jobTitle: a.jobTitle ?? 'The AVAS Team',
      avatarUrl: a.avatarUrl,
      status: 'Online',
    }))
  }

  // Deduplicate by user ID
  const seen = new Set<string>()
  const unique = contacts.filter((c) => {
    if (seen.has(c.id) || c.id === user.id) return false
    seen.add(c.id)
    return true
  })

  return NextResponse.json({ items: unique })
}
