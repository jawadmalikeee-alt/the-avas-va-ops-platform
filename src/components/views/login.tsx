'use client'

import { useState } from 'react'
import { useAuth } from '@/stores/auth'
import { Brand } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ShieldCheck, Clock, Users, BarChart3, ArrowRight } from 'lucide-react'

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

  const fillDemo = (em: string) => {
    setEmail(em)
    setPassword(em === 'jawad@theavas.com' ? 'admin123' : em === 'michael@abcrealty.com' ? 'client123' : 'va123')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-sm">
          <Brand size="lg" className="mb-10" />

          <h1 className="text-2xl font-display font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your AVAS workspace.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Password</Label>
                <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground">Forgot?</button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-10"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-border" />
              Keep me signed in for 7 days
            </label>

            {error && (
              <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-10 text-sm">
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4 ml-1.5" />}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Demo accounts</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <DemoButton onClick={() => fillDemo('jawad@theavas.com')} label="Admin" email="jawad@theavas.com" icon={BarChart3} />
            <DemoButton onClick={() => fillDemo('michael@abcrealty.com')} label="Client" email="michael@abcrealty.com" icon={Users} />
            <DemoButton onClick={() => fillDemo('sarah@theavas.com')} label="VA" email="sarah@theavas.com" icon={Clock} />
          </div>

          <p className="mt-8 text-[11px] text-muted-foreground/70 leading-relaxed">
            By signing in you agree to The AVAS Terms of Service and acknowledge our Privacy Policy. Protected by enterprise-grade encryption and role-based access control.
          </p>
        </div>
      </div>

      {/* Right side: hero */}
      <div className="hidden lg:flex flex-1 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-emerald-500/10 blur-[120px] rounded-full" />

        <div className="relative flex flex-col justify-center px-16 py-12 w-full">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 ring-1 ring-white/10 px-3 py-1 text-[11px] text-white/70 mb-8">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Enterprise-grade secure platform
            </div>
            <h2 className="text-4xl font-display font-semibold text-white leading-[1.1] tracking-tight">
              Your virtual assistant operations, fully visible.
            </h2>
            <p className="mt-5 text-base text-white/60 leading-relaxed">
              The AVAS platform unifies clients, virtual assistants, and operations into one elegant command center. Track hours, monitor quality, deliver work, and grow — all from a single pane.
            </p>

            <div className="mt-10 space-y-4">
              <Feature icon={Clock} title="Real-time operations" desc="Live VA status, time tracking, and current tasks." />
              <Feature icon={BarChart3} title="Configurable KPIs & QA" desc="Track exactly what matters for each service." />
              <Feature icon={Users} title="Multi-tenant isolation" desc="Each client sees only their own data. Always." />
              <Feature icon={ShieldCheck} title="Audit logs & permissions" desc="Every action recorded, every role scoped." />
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
            <span>© {new Date().getFullYear()} The AVAS. All rights reserved.</span>
            <span>v1.0 · Real Estate VA Edition</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-white/80" />
      </div>
      <div>
        <p className="text-sm text-white font-medium">{title}</p>
        <p className="text-xs text-white/50 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function DemoButton({ onClick, label, email, icon: Icon }: { onClick: () => void; label: string; email: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-between gap-2 rounded-md border border-border bg-card hover:bg-muted/50 transition-colors px-3 py-2 text-left"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-foreground">{label}</div>
          <div className="text-[10px] text-muted-foreground truncate">{email}</div>
        </div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
    </button>
  )
}
