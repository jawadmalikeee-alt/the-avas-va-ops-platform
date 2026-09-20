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
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left side: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 bg-background">
        <div className="w-full max-w-sm">
          <Brand size="lg" className="mb-10" />

          <h1 className="text-3xl font-display tracking-tight text-navy">Welcome back.</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your AVAS workspace.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">Email address</Label>
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
                <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">Password</Label>
                <button type="button" className="text-[11px] text-avas-blue hover:underline font-medium">Forgot?</button>
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
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none pt-1">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded-md border-border accent-navy" />
              Keep me signed in for 7 days
            </label>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-full text-sm">
              {loading ? 'Signing in…' : 'Sign in to AVAS'}
              {!loading && <ArrowRight className="h-4 w-4 ml-1.5" />}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Demo accounts</span>
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

      {/* Right side: Apple-inspired hero with AVAS blue */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5271ff 0%, #3e5bff 60%, #2a3fcc 100%)' }}>
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

function DemoButton({ onClick, label, email, icon: Icon, desc }: { onClick: () => void; label: string; email: string; icon: React.ComponentType<{ className?: string }>; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-between gap-2 rounded-2xl border border-border bg-card hover:border-navy/30 hover:shadow-apple-md transition-all px-4 py-2.5 text-left btn-press"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-navy/5 flex items-center justify-center shrink-0 group-hover:bg-navy/10 transition-colors">
          <Icon className="h-4 w-4 text-navy" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-navy">{label}</div>
          <div className="text-[10px] text-muted-foreground truncate">{email}</div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-navy group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  )
}
