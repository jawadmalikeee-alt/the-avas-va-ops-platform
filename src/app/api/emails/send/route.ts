import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * POST /api/emails/send
 *   body: { receiverId, toEmail, subject, body }
 *
 * - Creates an EmailLog record
 * - Creates a Message in the conversation thread (so it appears in chat)
 * - Creates a notification for the recipient (push notification trigger)
 * - Returns success — actual SMTP can be added via Nodemailer later
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const { receiverId, toEmail, subject, body } = await req.json()

  if (!receiverId || !toEmail || !subject) {
    return NextResponse.json({ error: 'receiverId, toEmail, and subject are required' }, { status: 400 })
  }

  // 1. Log the email
  const emailLog = await db.emailLog.create({
    data: {
      senderId: user.id,
      receiverId,
      toEmail,
      subject,
      body: body ?? '',
      status: 'sent',
    },
  })

  // 2. Create a message in conversation with email marker
  await db.message.create({
    data: {
      senderId: user.id,
      receiverId,
      body: `📧 ${subject}\n\n${body ?? ''}`,
      attachmentType: 'email',
      attachmentName: subject,
      deliveredAt: new Date(),
    },
  })

  // 3. Create a notification for the recipient — this triggers push notification
  await db.notification.create({
    data: {
      userId: receiverId,
      type: 'email',
      title: `New email from ${user.name}`,
      body: subject,
      link: '/messages',
    },
  })

  // 4. Update sender's lastActiveAt
  await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })

  return NextResponse.json({
    ok: true,
    email: emailLog,
    mailtoUrl: `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body ?? '')}`,
  })
}
