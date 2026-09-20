'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard, StatusBadge, Avatar, SectionHeader, MiniProgress, EmptyState, LoadingSkeleton } from '@/components/ui-primitives'
import { useAuth } from '@/stores/auth'
import { useViewStore } from '@/stores/view'
import { formatDuration, formatTimer, formatTime, formatRelative } from '@/lib/format'
import { Users, UserCog, Clock3, ListTodo, ShieldCheck, AlertTriangle, Activity, TrendingUp, ChevronRight, Radio } from 'lucide-react'

interface AdminData {
  metrics: {
    activeClients: number
    activeVAs: number
    workingVAs: number
    hoursToday: number
    tasksCompleted: number
    tasksPending: number
    qaIssues: number
    clientIssues: number
  }
  liveOps: Array<{
    id: string
    name: string
    avatarUrl: string | null
    specialization: string
    status: string
    clockIn: string | null
    currentTask: string | null
    elapsedTime: number
    todayHours: number
    performanceScore: number
    qaStatus: string
    primaryClient: string
    primaryAssignment: string
  }>
  alerts: Array<{ severity: 'critical' | 'warning' | 'info'; title: string; body: string; time: string }>
}

export function AdminDashboard() {
  const { user } = useAuth()
  const { setView } = useViewStore()
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/data/admin-dashboard', { cache: 'no-store' })
        if (!res.ok) {
          setData(null)
          return
        }
        const d = await res.json()
        setData(d)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
    const i = setInterval(load, 30000) // refresh every 30s
    return () => clearInterval(i)
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-72 shimmer rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 shimmer rounded-md" />)}
        </div>
        <div className="h-64 shimmer rounded-md" />
      </div>
    )
  }

  if (!data.metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Something went wrong while loading this dashboard.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>Try again</Button>
        </div>
      </div>
    )
  }

  const m = data.metrics

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display tracking-tight text-navy">
          {greeting}, {user?.name.split(' ')[0]}.
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Here's what's happening across all client operations today.</p>
      </div>

      {/* Today's Operations — prioritized metrics */}
      <section>
        <SectionHeader title="Today's Operations" subtitle="Live snapshot of your active workforce" action={<Button variant="outline" size="sm" onClick={() => setView('live')} className="h-7 text-xs"><Radio className="h-3 w-3 mr-1" />Live view</Button>} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Active Clients" value={m.activeClients} icon={Users} hint="contracts live" />
          <MetricCard label="Active VAs" value={m.activeVAs} icon={UserCog} hint={`${m.workingVAs} working now`} />
          <MetricCard label="Hours Today" value={`${m.hoursToday}h`} icon={Clock3} delta="+12% vs avg" deltaType="up" />
          <MetricCard label="Tasks Completed" value={m.tasksCompleted} icon={ListTodo} hint={`${m.tasksPending} pending`} />
          <MetricCard label="QA Issues" value={m.qaIssues} icon={ShieldCheck} deltaType={m.qaIssues > 3 ? 'down' : 'neutral'} delta={m.qaIssues > 3 ? 'needs review' : 'within target'} />
          <MetricCard label="Client Issues" value={m.clientIssues} icon={AlertTriangle} hint="open tickets" />
          <MetricCard label="Currently Working" value={m.workingVAs} icon={Activity} hint={`${m.activeVAs - m.workingVAs} offline/break`} />
          <MetricCard label="Avg Performance" value="92%" icon={TrendingUp} delta="+2.1%" deltaType="up" hint="this week" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Operations — left 2/3 */}
        <div className="lg:col-span-2 space-y-3">
          <SectionHeader
            title="Live Operations"
            subtitle="VAs currently on shift"
            action={<Button variant="ghost" size="sm" onClick={() => setView('live')} className="h-7 text-xs">View all <ChevronRight className="h-3 w-3 ml-0.5" /></Button>}
          />
          <Card className="border-border/70 shadow-none">
            <div className="px-3 py-2 border-b border-border grid grid-cols-12 gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider hidden md:grid">
              <div className="col-span-4">VA / Client</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Current Task</div>
              <div className="col-span-2">Elapsed</div>
              <div className="col-span-1 text-right">QA</div>
            </div>
            <div className="divide-y divide-border/50">
              {data.liveOps.length === 0 ? (
                <EmptyState title="No active VAs right now" description="No virtual assistants are currently clocked in." icon={Activity} />
              ) : (
                data.liveOps.slice(0, 6).map((va) => (
                  <button
                    key={va.id}
                    onClick={() => { setView('vas'); }}
                    className="w-full px-3 py-2.5 grid grid-cols-12 gap-2 items-center text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                      <Avatar name={va.name} src={va.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{va.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{va.primaryClient} · {va.primaryAssignment}</div>
                      </div>
                    </div>
                    <div className="col-span-2"><StatusBadge status={va.status} size="xs" /></div>
                    <div className="col-span-3 text-xs text-foreground truncate">{va.currentTask ?? '—'}</div>
                    <div className="col-span-2 text-xs font-mono tabular-nums text-muted-foreground">{formatTimer(va.elapsedTime)}</div>
                    <div className="col-span-1 text-right">
                      <StatusBadge
                        status={va.qaStatus === 'Good' ? 'Pass' : va.qaStatus === 'Watch' ? 'Pending' : 'Fail'}
                        size="xs"
                        label={va.qaStatus}
                      />
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Alerts — right 1/3 */}
        <div className="space-y-3">
          <SectionHeader title="Alerts" subtitle="Items needing attention" />
          <Card className="border-border/70 shadow-none p-0">
            {data.alerts.length === 0 ? (
              <EmptyState title="All clear" description="No active alerts at this time." icon={ShieldCheck} />
            ) : (
              <div className="divide-y divide-border/50">
                {data.alerts.map((a, i) => (
                  <div key={i} className="px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${a.severity === 'critical' ? 'bg-rose-500' : a.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground">{a.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{a.body}</div>
                        <div className="text-[10px] text-muted-foreground/70 mt-1">{formatRelative(a.time)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
