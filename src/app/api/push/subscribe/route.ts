import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/push/subscribe
 *   body: { endpoint, keys: { p256dh, auth } }
 *   Stores in memory (production should persist to DB). For demo, we just acknowledge.
 */
export async function POST(req: NextRequest) {
  // For demo — we don't actually persist (would need a PushSubscription table)
  // Real push notifications require a VAPID key pair + service worker + push service
  // For now, the app uses in-app notifications + browser Notification API instead
  return NextResponse.json({ ok: true, message: 'Subscribed to in-app push notifications' })
}
