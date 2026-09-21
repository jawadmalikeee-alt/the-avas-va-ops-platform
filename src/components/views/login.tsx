'use client'

import { useState } from 'react'
import { useAuth } from '@/stores/auth'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ShieldCheck, Clock, BarChart3, ArrowRight, Phone, Info } from 'lucide-react'

export function LoginScreen({ onRegister }: { onRegister?: () => void }) {
  const { fetchUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotResult, setForgotResult] = useState('')

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotResult('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      if (data.tempPassword) {
        setForgotResult(`Your temporary password is: ${data.tempPassword}\nPlease sign in and change it from Profile Settings.`)
      } else {
        setForgotResult(data.message || 'If an account exists with this email, a reset link has been sent.')
      }
    } catch {
      setForgotResult('Something went wrong. Please try again.')
    } finally { setForgotLoading(false) }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Login failed.')
        setLoading(false)
        return
      }
      await fetchUser()
    } catch {
      setError('Something went wrong during sign-in. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left side: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 bg-background">
        <div className="w-full max-w-sm">
          <Brand size="lg" className="mb-10" />

          <h1 className="text-3xl font-display tracking-tight text-avas-blue">Welcome back.</h1>
          <p className="text-sm text-foreground/70 mt-2 font-medium">Sign in to your AVAS workspace.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground/60">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground/60">Password</Label>
                <button type="button" onClick={() => { setShowForgot(true); setForgotResult('') }} className="text-[11px] text-avas-blue hover:underline font-medium">Forgot password?</button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 rounded-xl"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-foreground/70 cursor-pointer select-none pt-1">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded-md border-border accent-avas-blue" />
              Keep me signed in for 7 days
            </label>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-full text-sm">
              {loading ? 'Signing in…' : 'Sign in to AVAS'}
              {!loading && <ArrowRight className="h-4 w-4 ml-1.5" />}
            </Button>
          </form>

          {/* Forgot password form */}
          {showForgot && (
            <div className="mt-4 rounded-xl bg-muted/40 border border-border p-4">
              <div className="text-xs font-bold text-foreground mb-2">Reset Password</div>
              <form onSubmit={handleForgot} className="space-y-2">
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="h-10 text-sm"
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={forgotLoading} className="h-8 rounded-full text-xs bg-avas-blue hover:bg-avas-blue-light">
                    {forgotLoading ? 'Sending…' : 'Send Reset'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full text-xs" onClick={() => setShowForgot(false)}>Cancel</Button>
                </div>
                {forgotResult && (
                  <div className="rounded-lg bg-avas-blue/5 border border-avas-blue/20 px-3 py-2 text-[11px] text-foreground whitespace-pre-line font-medium">
                    {forgotResult}
                  </div>
                )}
              </form>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-foreground/70">
            Don't have an account?{' '}
            <button onClick={onRegister} className="text-avas-blue font-bold hover:underline">
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* Right side: hero */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2d4ed8 0%, #1e3a8a 60%, #172554 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)' }} />

        <div className="relative flex flex-col justify-between px-16 py-12 w-full">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1 text-[11px] text-white mb-12">
              <span className="h-1.5 w-1.5 rounded-full bg-white live-pulse" />
              Enterprise-grade VA operations platform
            </div>

            <h2 className="text-4xl font-display text-white leading-[1.1] tracking-tight max-w-md">
              Trained real-estate VAs who cold-call, run your CRM, and follow up with leads.
            </h2>
            <p className="mt-5 text-base text-white/60 leading-relaxed max-w-md">
              The AVAS platform unifies clients, virtual assistants, and operations into one elegant command center. Track hours, monitor quality, deliver work, and grow.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3 max-w-md">
              <StatCard value="60,000+" label="Calls dialled" />
              <StatCard value="3 days" label="Avg onboarding" />
              <StatCard value="10+" label="CRMs supported" />
              <StatCard value="9–6 EST" label="Business hours" />
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="text-[10px] uppercase tracking-widest text-white mb-3 font-semibold">What you get</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-md">
              <Feature icon={Clock} title="Real-time operations" desc="Live VA status & timers" />
              <Feature icon={BarChart3} title="Configurable KPIs & QA" desc="Track what matters" />
              <Feature icon={ShieldCheck} title="Audit logs & permissions" desc="Full traceability" />
              <Feature icon={Phone} title="Calls, chat & email" desc="All in one portal" />
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
            <span>© {new Date().getFullYear()} The AVAS. All rights reserved.</span>
            <a href="tel:+16464508529" className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
              <Phone className="h-3 w-3" />
              +1 (646) 450-8529
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="text-xl font-display text-white tabular-nums">{value}</div>
      <div className="text-[11px] text-white/50 mt-0.5">{label}</div>
    </div>
  )
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="h-8 w-8 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-white font-semibold">{title}</p>
        <p className="text-[10px] text-white/60 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}
