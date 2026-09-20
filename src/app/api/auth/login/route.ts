import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }
    const result = await signIn(email, password)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'Login failed.' }, { status: 401 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Something went wrong during sign-in.' }, { status: 500 })
  }
}
