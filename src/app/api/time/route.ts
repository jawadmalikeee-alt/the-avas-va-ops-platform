import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/time — list current VA's recent time entries
 * POST /api/time — clock in / start break / end shift
 *   body: { action: 'clock_in' | 'break' | 'resume' | 'clock_out', taskId?: string }
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user || !user.vaProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const entries = await db.timeEntry.findMany({
    where: { vaId: user.vaProfile.id },
    orderBy: { clockIn: 'desc' },
    take: 30,
    include: { task: true },
  })
  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !user.vaProfile) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const vaId = user.vaProfile.id
  const { action, taskId } = await req.json()

  const activeEntry = await db.timeEntry.findFirst({
    where: { vaId, status: 'Active' },
    orderBy: { clockIn: 'desc' },
  })

  if (action === 'clock_in') {
    if (activeEntry) return NextResponse.json({ error: 'Already clocked in.' }, { status: 400 })
    const entry = await db.timeEntry.create({
      data: {
        userId: user.id,
        vaId,
        clientId: (await db.assignment.findFirst({ where: { vaId, status: 'Active' } }))?.clientId ?? null,
        taskId: taskId ?? null,
        clockIn: new Date(),
        status: 'Active',
      },
    })
    await db.vA.update({ where: { id: vaId }, data: { currentStatus: 'Working', shiftStartedAt: new Date(), lastClockIn: new Date(), currentTaskId: taskId ?? null } })
    return NextResponse.json({ ok: true, entry })
  }

  if (action === 'break') {
    if (!activeEntry) return NextResponse.json({ error: 'No active shift.' }, { status: 400 })
    await db.timeEntry.update({ where: { id: activeEntry.id }, data: { status: 'Paused' } })
    await db.vA.update({ where: { id: vaId }, data: { currentStatus: 'Break' } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'resume') {
    if (!activeEntry) return NextResponse.json({ error: 'No active shift.' }, { status: 400 })
    await db.timeEntry.update({ where: { id: activeEntry.id }, data: { status: 'Active' } })
    await db.vA.update({ where: { id: vaId }, data: { currentStatus: 'Working' } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'clock_out') {
    if (!activeEntry) return NextResponse.json({ error: 'No active shift.' }, { status: 400 })
    const now = new Date()
    await db.timeEntry.update({
      where: { id: activeEntry.id },
      data: { clockOut: now, status: 'Ended' },
    })
    await db.vA.update({ where: { id: vaId }, data: { currentStatus: 'Offline', shiftStartedAt: null, currentTaskId: null } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
