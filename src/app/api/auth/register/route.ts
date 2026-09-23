import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

/**
 * POST /api/auth/register — DISABLED for public use
 * Account creation is admin-only via /api/admin/create-user
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Public registration is not available. Please contact your AVAS account manager.' },
    { status: 403 }
  )
}
