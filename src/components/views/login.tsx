'use client'

import { useState } from 'react'
import { useAuth } from '@/stores/auth'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ShieldCheck, Clock, Users, BarChart3, ArrowRight, Phone, CheckCircle2 } from 'lucide-react'

export function LoginScreen() {
  const { fetchUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const fillDemo = (em: string, pw: string) => {
    setEmail(em)
    setPassword(pw)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 bg-white">
        <div className="w-full max-w-sm">
          <Brand size="lg" className="mb-10" />

          <h1 className="text-2xl font-display font-semibold tracking-tight text-navy">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your AVAS workspace.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                className="h-10 focus-gold"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
                <button type="button" className="text-[11px] text-gold hover:text-gold-dark font-medium">Forgot?</button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-10 focus-gold"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-border accent-[#1a1f3d]" />
              Keep me signed in for 7 days
            </label>

            {error && (
              <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-10 text-sm bg-navy hover:bg-navy-light">
              {loading ? 'Signing in…' : 'Sign in to AVAS'}
              {!loading && <ArrowRight className="h-4 w-4 ml-1.5" />}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Demo accounts</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <DemoButton onClick={() => fillDemo('jawad@theavas.com', 'admin123')} label="Administrator" email="jawad@theavas.com" icon={BarChart3} desc="Full operations command center" />
            <DemoButton onClick={() => fillDemo('michael@abcrealty.com', 'client123')} label="Client" email="michael@abcrealty.com" icon={Users} desc="ABC Realty portal access" />
            <DemoButton onClick={() => fillDemo('sarah@theavas.com', 'va123')} label="Virtual Assistant" email="sarah@theavas.com" icon={Clock} desc="VA workspace & time tracker" />
          </div>

          <p className="mt-8 text-[11px] text-muted-foreground/70 leading-relaxed">
            By signing in you agree to The AVAS Terms of Service and acknowledge our Privacy Policy. Protected by enterprise-grade encryption and role-based access control.
          </p>
        </div>
      </div>

      {/* Right side: corporate hero */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1f3d 0%, #11152b 60%, #0a0d1f 100%)' }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        {/* Gold accent orbs */}
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-20 left-20 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.08) 0%, transparent 70%)' }} />

        <div className="relative flex flex-col justify-between px-16 py-12 w-full">
          <div>
            {/* Top badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-3 py-1 text-[11px] text-white/70 mb-12">
              <span className="h-1.5 w-1.5 rounded-full bg-gold live-pulse" />
              Enterprise-grade VA operations platform
            </div>

            <h2 className="text-4xl font-display font-semibold text-white leading-[1.1] tracking-tight max-w-md">
              Trained real-estate VAs who cold-call, run your CRM, and follow up with leads.
            </h2>
            <p className="mt-5 text-base text-white/60 leading-relaxed max-w-md">
              The AVAS platform unifies clients, virtual assistants, and operations into one elegant command center. Track hours, monitor quality, deliver work, and grow — all from a single pane.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3 max-w-md">
              <StatCard value="60,000+" label="Calls dialled" />
              <StatCard value="3 days" label="Avg onboarding" />
              <StatCard value="10+" label="CRMs supported" />
              <StatCard value="9–6 EST" label="Business hours" />
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="text-[10px] uppercase tracking-widest text-gold mb-3">What you get</div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-md">
              <Feature icon={Clock} title="Real-time operations" desc="Live VA status & timers" />
              <Feature icon={BarChart3} title="Configurable KPIs & QA" desc="Track what matters" />
              <Feature icon={Users} title="Multi-tenant isolation" desc="Per-client data security" />
              <Feature icon={ShieldCheck} title="Audit logs & permissions" desc="Full traceability" />
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
            <span>© {new Date().getFullYear()} The AVAS. All rights reserved.</span>
            <a href="tel:+16464508529" className="flex items-center gap-1.5 text-white/60 hover:text-gold transition-colors">
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
    <div className="rounded-lg bg-white/5 ring-1 ring-white/10 p-3">
      <div className="text-lg font-display font-semibold text-white tabular-nums">{value}</div>
      <div className="text-[11px] text-white/50 mt-0.5">{label}</div>
    </div>
  )
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="h-7 w-7 rounded-md bg-gold/10 ring-1 ring-gold/20 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-gold" />
      </div>
      <div>
        <p className="text-xs text-white font-medium">{title}</p>
        <p className="text-[10px] text-white/40 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function DemoButton({ onClick, label, email, icon: Icon, desc }: { onClick: () => void; label: string; email: string; icon: React.ComponentType<{ className?: string }>; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-between gap-2 rounded-md border border-border bg-card hover:border-navy hover:shadow-sm transition-all px-3 py-2 text-left"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-8 w-8 rounded-md bg-navy/5 flex items-center justify-center shrink-0 group-hover:bg-navy/10 transition-colors">
          <Icon className="h-4 w-4 text-navy" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-navy">{label}</div>
          <div className="text-[10px] text-muted-foreground truncate">{email}</div>
        </div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-navy group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  )
}
