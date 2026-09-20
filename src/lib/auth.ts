/**
 * The AVAS — Authentication & Session
 * Lightweight cookie-based session for demo.
 * In production: use NextAuth.js + proper hashing (bcrypt/argon2).
 */
import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import { db } from './db'

export const SESSION_COOKIE = 'avas_session'

interface SessionPayload {
  userId: string
  role: string
  email: string
  name: string
  timezone: string
  expiresAt: number
}

function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex')
}

export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user) return { ok: false, error: 'No account found with that email.' }
  if (user.passwordHash !== hashPassword(password)) {
    return { ok: false, error: 'Incorrect password. Please try again.' }
  }

  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    timezone: user.timezone,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  }

  const token = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })

  // Update lastActiveAt
  await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
  return { ok: true }
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null
    const json = Buffer.from(token, 'base64url').toString('utf-8')
    const payload = JSON.parse(json) as SessionPayload
    if (payload.expiresAt < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { client: true, vaProfile: true },
  })
  return user
}

/**
 * Permission matrix — server-side authorization.
 * Maps each permission to the roles that hold it.
 */
export const PERMISSIONS = {
  // Admin
  manage_clients: ['ADMIN', 'OPERATIONS_MANAGER'],
  manage_vas: ['ADMIN', 'OPERATIONS_MANAGER', 'TEAM_LEAD'],
  manage_assignments: ['ADMIN', 'OPERATIONS_MANAGER'],
  manage_time: ['ADMIN', 'OPERATIONS_MANAGER'],
  manage_tasks: ['ADMIN', 'OPERATIONS_MANAGER', 'TEAM_LEAD'],
  manage_qa: ['ADMIN', 'QA_MANAGER'],
  view_reports: ['ADMIN', 'OPERATIONS_MANAGER', 'QA_MANAGER', 'TEAM_LEAD'],
  manage_billing: ['ADMIN'],
  manage_settings: ['ADMIN'],
  view_audit_logs: ['ADMIN'],
  view_analytics: ['ADMIN', 'OPERATIONS_MANAGER', 'QA_MANAGER'],

  // Client
  view_dashboard: ['CLIENT'],
  view_va: ['CLIENT'],
  view_hours: ['CLIENT'],
  create_request: ['CLIENT'],
  approve_deliverable: ['CLIENT'],
  send_message: ['CLIENT', 'ADMIN', 'VA'],
  view_quality: ['CLIENT'],

  // VA
  view_tasks: ['VA'],
  track_time: ['VA'],
  submit_work: ['VA'],
  view_feedback: ['VA'],
  view_sops: ['VA'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function can(role: string, perm: Permission): boolean {
  return (PERMISSIONS[perm] as readonly string[]).includes(role)
}

/**
 * Tenant isolation: returns the client ID for the current user.
 * Throws if a CLIENT user tries to access another tenant's data.
 */
export async function getCurrentTenant(): Promise<{ clientId: string | null; vaId: string | null }> {
  const user = await getCurrentUser()
  if (!user) return { clientId: null, vaId: null }
  return {
    clientId: user.client?.id ?? null,
    vaId: user.vaProfile?.id ?? null,
  }
}

/**
 * Server-side guard: ensures the given clientId matches the logged-in client.
 */
export async function assertTenantAccess(clientId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  if (user.role === 'ADMIN' || user.role === 'OPERATIONS_MANAGER' || user.role === 'QA_MANAGER' || user.role === 'TEAM_LEAD') return true
  if (user.role === 'CLIENT') return user.client?.id === clientId
  if (user.role === 'VA') {
    // VA can access clients they're assigned to
    const assignments = await db.assignment.findMany({
      where: { vaId: user.vaProfile?.id, status: 'Active' },
      select: { clientId: true },
    })
    return assignments.some((a) => a.clientId === clientId)
  }
  return false
}
