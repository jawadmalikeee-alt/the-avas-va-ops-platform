'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, MetricCard, StatusBadge, SectionHeader, MiniProgress, EmptyState, LoadingSkeleton, Pill } from '@/components/ui-primitives'
import { useAuth } from '@/stores/auth'
import { useViewStore } from '@/stores/view'
import { formatDuration, formatTime, formatRelative, hoursFromMs } from '@/lib/format'
import { Clock, ListTodo, TrendingUp, ShieldCheck, ChevronRight, Activity, Send, FileText, Package } from 'lucide-react'

interface ClientData {
  visibility: any
  client: { companyName: string; contactPerson: string; timezone: string; brandColor: string; package: string; contractedHours: number }
  vas: Array<{ id: string; name: string; avatarUrl: string | null; specialization: string; role: string; weeklyHours: number; status: string; performanceScore: number; qualityScore: number; shiftStartedAt: string | null }>
  today: { hoursMs: number; tasksCompleted: number; tasksInProgress: number; activeTask: { id: string; title: string; startedAt: string | null; progress: number; service: string | null } | null }
  week: { hoursMs: number; scheduledHours: number; tasksCompleted: number; tasksPending: number; kpisByService: Record<string, Array<{ name: string; value: number; target: number; unit: string }>> }
  qa: { score: number; trend: number; recent: Array<{ task: string; score: number }> } | null
  recentDeliverables: Array<{ id: string; title: string; status: string; date: string; service: string | null; vaName: string }>
  openTickets: Array<{ id: string; ticketId: string; title: string; type: string; priority: string; status: string; createdAt: string }>
  activity: Array<{ id: string; time: string; actor: string; action: string }>
}

export function ClientOverview() {
  const { user } = useAuth()
  const { setView } = useViewStore()
  const [data, setData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/data/client-dashboard', { cache: 'no-store' })
        if (!res.ok) { setData(null); return }
        const d = await res.json()
        setData(d)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
    const i = setInterval(load, 30000)
    return () => clearInterval(i)
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-72 shimmer rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 shimmer rounded-md" />)}
        </div>
        <div className="h-64 shimmer rounded-md" />
      </div>
    )
  }

  const v = data.visibility
  const primaryVA = data.vas[0]
  const weekPct = data.week.scheduledHours ? Math.min(100, (hoursFromMs(data.week.hoursMs) / data.week.scheduledHours) * 100) : 0

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">
          {greeting}, {user?.name.split(' ')[0]}.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here's how your VA operations are running today.</p>
      </div>

      {/* VA status — primary card */}
      {primaryVA && (
        <Card className="border-border/70 shadow-none p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={primaryVA.name} src={primaryVA.avatarUrl} size="lg" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Your VA</div>
                <div className="text-lg font-display font-semibold text-foreground">{primaryVA.name}</div>
                <div className="text-xs text-muted-foreground">{primaryVA.specialization} · {primaryVA.role}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <Stat label="Status" value={<StatusBadge status={primaryVA.status} size="xs" />} />
              <Stat label="Today" value={<span className="text-base font-semibold tabular-nums">{formatDuration(data.today.hoursMs)}</span>} />
              <Stat label="This Week" value={<span className="text-base font-semibold tabular-nums">{formatDuration(data.week.hoursMs)}</span>} hint={`/ ${data.week.scheduledHours}h`} />
              {v.canSeePerformance && <Stat label="Performance" value={<span className="text-base font-semibold">{primaryVA.performanceScore}%</span>} hint="on track" />}
            </div>
          </div>
          {v.canSeeActivity && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-muted-foreground">Weekly Hours Progress</span>
                <span className="text-xs font-medium tabular-nums">{weekPct.toFixed(0)}%</span>
              </div>
              <MiniProgress value={weekPct} tone={weekPct >= 90 ? 'success' : weekPct >= 50 ? 'default' : 'warning'} />
            </div>
          )}
        </Card>
      )}

      {/* Today + This Week row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today */}
        <Card className="border-border/70 shadow-none p-4">
          <SectionHeader title="Today" subtitle="What's happening right now" />
          {data.today.activeTask ? (
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Task</div>
                <div className="text-sm font-medium text-foreground mt-0.5">{data.today.activeTask.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {data.today.activeTask.service} · Started {data.today.activeTask.startedAt ? formatTime(data.today.activeTask.startedAt) : '—'}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground tabular-nums">{data.today.activeTask.progress}%</span>
                </div>
                <MiniProgress value={data.today.activeTask.progress} />
              </div>
            </div>
          ) : (
            <EmptyState icon={Activity} title="No active task" description="Your VA is not currently working on a tracked task." />
          )}
        </Card>

        {/* This Week */}
        <Card className="border-border/70 shadow-none p-4">
          <SectionHeader title="This Week" subtitle="Performance summary" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Hours" value={formatDuration(data.week.hoursMs)} hint={`/ ${data.week.scheduledHours}h`} />
            <MetricCard label="Tasks Done" value={data.week.tasksCompleted} icon={ListTodo} />
            <MetricCard label="Pending" value={data.week.tasksPending} icon={Clock} />
            {v.canSeeQA && data.qa && <MetricCard label="QA Score" value={`${data.qa.score}%`} icon={ShieldCheck} delta={`${data.qa.trend > 0 ? '+' : ''}${data.qa.trend}%`} deltaType={data.qa.trend >= 0 ? 'up' : 'down'} />}
          </div>
        </Card>
      </div>

      {/* Service KPIs */}
      {Object.keys(data.week.kpisByService).length > 0 && (
        <div>
          <SectionHeader title="Service Performance" subtitle="KPIs delivered this week" action={<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView('services')}>View all <ChevronRight className="h-3 w-3 ml-0.5" /></Button>} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data.week.kpisByService).slice(0, 6).map(([svc, kpis]) => (
              <Card key={svc} className="border-border/70 shadow-none p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{svc}</span>
                  </div>
                  <Pill tone="muted">{kpis.length} KPIs</Pill>
                </div>
                <div className="space-y-2">
                  {kpis.slice(0, 4).map((k) => {
                    const pct = k.target ? Math.min(100, (k.value / k.target) * 100) : 0
                    return (
                      <div key={k.name}>
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="text-muted-foreground truncate">{k.name}</span>
                          <span className="font-medium text-foreground tabular-nums">{k.value}{k.unit === '%' ? '%' : ''}</span>
                        </div>
                        <MiniProgress value={pct} tone={pct >= 90 ? 'success' : pct >= 50 ? 'default' : 'warning'} />
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Deliverables */}
        <Card className="border-border/70 shadow-none p-4">
          <SectionHeader title="Recent Deliverables" action={<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView('documents')}>View all <ChevronRight className="h-3 w-3 ml-0.5" /></Button>} />
          {data.recentDeliverables.length === 0 ? <EmptyState icon={FileText} title="No deliverables yet" /> :
            <div className="space-y-2">
              {data.recentDeliverables.map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{d.title}</div>
                    <div className="text-[10px] text-muted-foreground">{d.vaName} · {formatRelative(d.date)}</div>
                  </div>
                  <StatusBadge status={d.status} size="xs" />
                </div>
              ))}
            </div>
          }
        </Card>

        {/* Open Requests */}
        <Card className="border-border/70 shadow-none p-4">
          <SectionHeader title="Open Requests" action={<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView('requests')}><Send className="h-3 w-3 mr-1" />New</Button>} />
          {data.openTickets.length === 0 ? <EmptyState icon={Send} title="No open requests" description="Submit a new task request to your VA team." /> :
            <div className="space-y-2">
              {data.openTickets.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{t.title}</div>
                    <div className="text-[10px] text-muted-foreground">{t.ticketId} · {t.type} · {formatRelative(t.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.priority} size="xs" />
                    <StatusBadge status={t.status} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          }
        </Card>
      </div>

      {/* Activity Feed */}
      {v.canSeeActivity && data.activity.length > 0 && (
        <Card className="border-border/70 shadow-none p-4">
          <SectionHeader title="Recent Activity" subtitle="Your VA's recent work updates" />
          <div className="space-y-2.5">
            {data.activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-foreground"><span className="font-medium">{a.actor}</span> {a.action}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(a.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  )
}
