import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * POST /api/qa — create QA review (admin/qa_manager)
 * PATCH /api/qa — update review
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'QA_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Only admins and QA managers can create reviews.' }, { status: 403 })
  }
  const body = await req.json()
  const { vaId, clientId, taskId, accuracy, completeness, sopAdherence, communication, timeliness, professionalism, mistakes, feedback, correctiveAction, weight } = body

  if (!vaId) return NextResponse.json({ error: 'VA ID is required.' }, { status: 400 })

  // Calculate score using weights (default: 25,20,20,15,10,10)
  const w = weight ? weight.split(',').map(Number) : [25, 20, 20, 15, 10, 10]
  const score = Math.round(
    (accuracy * w[0] + completeness * w[1] + sopAdherence * w[2] + communication * w[3] + timeliness * w[4] + professionalism * w[5]) / 100 * 10
  ) / 10

  const review = await db.qAReview.create({
    data: {
      evaluatorId: user.id,
      vaId,
      clientId: clientId || null,
      taskId: taskId || null,
      accuracy: parseFloat(accuracy) || 100,
      completeness: parseFloat(completeness) || 100,
      sopAdherence: parseFloat(sopAdherence) || 100,
      communication: parseFloat(communication) || 100,
      timeliness: parseFloat(timeliness) || 100,
      professionalism: parseFloat(professionalism) || 100,
      score,
      mistakes: mistakes || null,
      feedback: feedback || null,
      correctiveAction: correctiveAction || null,
      weight: weight || '25,20,20,15,10,10',
    },
  })

  // Update VA's qualityScore (running average)
  const allQA = await db.qAReview.findMany({ where: { vaId }, take: 10, orderBy: { date: 'desc' } })
  const avg = allQA.length ? allQA.reduce((s, q) => s + q.score, 0) / allQA.length : 90
  await db.vA.update({ where: { id: vaId }, data: { qualityScore: Math.round(avg * 10) / 10 } })

  // If task linked, update task qaStatus
  if (taskId) {
    await db.task.update({ where: { id: taskId }, data: { qaStatus: score >= 90 ? 'Pass' : score >= 80 ? 'Pending' : 'Fail' } })
  }

  // Notify VA
  const va = await db.vA.findUnique({ where: { id: vaId }, include: { user: true } })
  if (va) {
    await db.notification.create({
      data: {
        userId: va.user.id,
        type: 'qa_completed',
        title: `QA Review: ${score}%`,
        body: score >= 90 ? 'Great work — keep it up!' : score >= 80 ? 'Good overall, minor improvements needed.' : 'Needs attention. Please review feedback.',
        link: '/va/feedback',
      },
    })
  }

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: 'QA_REVIEW_CREATED',
      entityType: 'QAReview',
      entityId: review.id,
      after: `VA ${vaId} — Score: ${score}%`,
    },
  })

  return NextResponse.json({ ok: true, review, score })
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !['ADMIN', 'QA_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Review ID required' }, { status: 400 })

  const allowed: any = {}
  ;['accuracy', 'completeness', 'sopAdherence', 'communication', 'timeliness', 'professionalism', 'mistakes', 'feedback', 'correctiveAction'].forEach((f) => {
    if (updates[f] !== undefined) allowed[f] = updates[f]
  })

  // Recalculate score if metrics changed
  if (Object.keys(allowed).some((k) => ['accuracy', 'completeness', 'sopAdherence', 'communication', 'timeliness', 'professionalism'].includes(k))) {
    const existing = await db.qAReview.findUnique({ where: { id } })
    if (existing) {
      const w = existing.weight.split(',').map(Number)
      const score = Math.round(
        ((allowed.accuracy ?? existing.accuracy) * w[0] +
          (allowed.completeness ?? existing.completeness) * w[1] +
          (allowed.sopAdherence ?? existing.sopAdherence) * w[2] +
          (allowed.communication ?? existing.communication) * w[3] +
          (allowed.timeliness ?? existing.timeliness) * w[4] +
          (allowed.professionalism ?? existing.professionalism) * w[5]) / 100 * 10
      ) / 10
      allowed.score = score
    }
  }

  const updated = await db.qAReview.update({ where: { id }, data: allowed })
  return NextResponse.json({ ok: true, review: updated })
}
