'use client'

import { useState } from 'react'
import { useAuth } from '@/stores/auth'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, User, Mail, Lock, Eye, EyeOff, Building2, Briefcase, ChevronDown } from 'lucide-react'

type AccountType = 'CLIENT' | 'VA' | null

export function RegisterScreen() {
  const { fetchUser } = useAuth()
  const [accountType, setAccountType] = useState<AccountType>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (accountType === 'CLIENT' && !companyName.trim()) {
      setError('Company name is required for client accounts.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Clients and VAs can't self-register — they need admin to create their account
      // Only show a message
      if (accountType !== 'ADMIN') {
        setError('VA and Client accounts are created by the admin. Please contact your AVAS account manager.')
        setLoading(false)
        return
      }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Registration failed.')
        setLoading(false)
        return
      }
      // Auto-login
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (loginRes.ok) {
        await fetchUser()
      } else {
        setError('Account created! Please sign in.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Brand size="lg" className="mb-10 justify-center" />

        <h1 className="text-3xl font-display tracking-tight text-avas-blue text-center">Create your account</h1>

        {!accountType ? (
          /* Account type selection */
          <div className="mt-8 space-y-3">
            <button
              onClick={() => setAccountType('CLIENT')}
              className="w-full rounded-2xl border border-border bg-card p-5 text-left hover:border-avas-blue/40 hover:shadow-apple-md transition-all btn-press"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-avas-blue/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-avas-blue" />
                </div>
                <div>
                  <div className="text-base font-bold text-foreground">Client / Realtor</div>
                  <div className="text-xs text-foreground/60 mt-0.5">Sign in to monitor your VA's work</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setAccountType('VA')}
              className="w-full rounded-2xl border border-border bg-card p-5 text-left hover:border-avas-blue/40 hover:shadow-apple-md transition-all btn-press"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-avas-blue/10 flex items-center justify-center shrink-0">
                  <Briefcase className="h-6 w-6 text-avas-blue" />
                </div>
                <div>
                  <div className="text-base font-bold text-foreground">Virtual Assistant</div>
                  <div className="text-xs text-foreground/60 mt-0.5">Sign in to track your work & time</div>
                </div>
              </div>
            </button>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div className="pt-4 border-t border-border text-center">
              <p className="text-[11px] text-foreground/50 mb-2">Are you a THE AVAS admin?</p>
              <button
                onClick={() => setAccountType('ADMIN')}
                className="text-xs text-avas-blue font-bold hover:underline"
              >
                Access admin panel →
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-foreground/70">
              Already have an account?{' '}
              <button onClick={() => window.location.reload()} className="text-avas-blue font-semibold hover:underline">
                Sign in
              </button>
            </p>
          </div>
        ) : accountType === 'ADMIN' ? (
          /* Admin signup form */
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/60">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required autoFocus className="h-12 rounded-xl pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/60">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@theavas.com" required className="h-12 rounded-xl pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/60">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                <Input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required className="h-12 rounded-xl pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700 font-medium">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-full text-sm">
              {loading ? 'Creating account…' : 'Create Admin Account'}
              {!loading && <ArrowRight className="h-4 w-4 ml-1.5" />}
            </Button>
            <button type="button" onClick={() => { setAccountType(null); setError('') }} className="w-full text-center text-xs text-foreground/60 hover:text-foreground font-medium">← Back</button>
          </form>
        ) : (
          /* Client/VA info — they need admin to create account */
          <div className="mt-8 text-center space-y-4">
            <div className="rounded-2xl bg-avas-blue/5 border border-avas-blue/20 p-6">
              <Building2 className="h-10 w-10 text-avas-blue mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">
                {accountType === 'CLIENT' ? 'Client / Realtor Access' : 'Virtual Assistant Access'}
              </h3>
              <p className="text-sm text-foreground/70 mt-2 leading-relaxed">
                {accountType === 'CLIENT'
                  ? 'Your VA operations portal access is set up by The AVAS team. Once your account is created, you can sign in here to monitor your VA\'s work, hours, tasks, and quality.'
                  : 'Your VA workspace is set up by The AVAS admin team. Once your account is created, you can sign in to track time, manage tasks, submit work, and view feedback.'}
              </p>
            </div>
            <p className="text-sm text-foreground/70">
              Already have an account?{' '}
              <button onClick={() => window.location.reload()} className="text-avas-blue font-bold hover:underline">Sign in</button>
            </p>
            <button onClick={() => { setAccountType(null); setError('') }} className="text-xs text-foreground/60 hover:text-foreground font-medium">← Back to account types</button>
          </div>
        )}
      </div>
    </div>
  )
}
