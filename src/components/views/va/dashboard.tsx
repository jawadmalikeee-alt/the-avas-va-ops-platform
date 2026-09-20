'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, StatusBadge, MetricCard, SectionHeader, EmptyState, LoadingSkeleton, Pill, MiniProgress } from '@/components/ui-primitives'
import { useAuth } from '@/stores/auth'
import { useViewStore } from '@/stores/view'
import { formatDuration, formatTimer, formatTime, formatRelative } from '@/lib/format'
import { Clock, Play, Pause, Square, ListTodo, TrendingUp, ShieldCheck, Calendar, FileCheck, ChevronRight, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'

export function VADashboard() {
  const { user } = useAuth()
  const { setView } = useViewStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/data/va-dashboard', { cache: 'no-store' })
      if (!res.ok) { setData(null); return }
      const d = await res.json()
      setData(d)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
    const i = setInterval(load, 15000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const clockAction = async (action: 'clock_in' | 'break' | 'resume' | 'clock_out') => {
    try {
      const res = await fetch('/api/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast(d.error ?? 'Action failed', 'error')
        return
      }
      const msgs = { clock_in: 'Shift started', break: 'Break started', resume: 'Resumed work', clock_out: 'Shift ended — see you tomorrow!' }
      toast(msgs[action], 'success')
      load()
    } catch {
      toast('Failed to update time', 'error')
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-72 shimmer rounded-md" />
        <div className="h-32 shimmer rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 shimmer rounded-md" />)}
        </div>
      </div>
    )
  }

  const activeEntry = data.activeEntry
  const elapsed = activeEntry ? now - new Date(activeEntry.clockIn).getTime() - (activeEntry.breakMs ?? 0) : 0

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">{greeting}, {user?.name.split(' ')[0]}.</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's what you need to focus on today.</p>
      </div>

      {/* Time tracker card */}
      <Card className="border-border/70 shadow-none p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name ?? ''} src={user?.avatarUrl} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-display font-semibold text-foreground">{user?.name}</span>
                <StatusBadge status={data.va.status} size="xs" />
              </div>
              <div className="text-xs text-muted-foreground">{data.va.specialization}</div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Timer</div>
            <div className="text-2xl font-mono tabular-nums font-semibold text-foreground">{activeEntry ? formatTimer(elapsed) : '00:00:00'}</div>
            {activeEntry && <div className="text-[11px] text-muted-foreground mt-0.5">Started {formatTime(activeEntry.clockIn)}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          {!activeEntry ? (
            <Button size="sm" className="h-9" onClick={() => clockAction('clock_in')}><Play className="h-3.5 w-3.5 mr-1" />Start Shift</Button>
          ) : (
            <>
              {activeEntry.status === 'Active' ? (
                <Button size="sm" variant="outline" className="h-9" onClick={() => clockAction('break')}><Pause className="h-3.5 w-3.5 mr-1" />Break</Button>
              ) : (
                <Button size="sm" className="h-9" onClick={() => clockAction('resume')}><Play className="h-3.5 w-3.5 mr-1" />Resume</Button>
              )}
              <Button size="sm" variant="outline" className="h-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => clockAction('clock_out')}><Square className="h-3.5 w-3.5 mr-1" />End Shift</Button>
            </>
          )}
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            <span>Today: <span className="font-medium text-foreground tabular-nums">{formatDuration(data.todayHoursMs)}</span></span>
            <span>Week: <span className="font-medium text-foreground tabular-nums">{formatDuration(data.weekHoursMs)}</span> / {data.scheduledWeeklyHours}h</span>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Today" value={formatDuration(data.todayHoursMs)} icon={Clock} />
        <MetricCard label="This Week" value={formatDuration(data.weekHoursMs)} icon={Calendar} hint={`/ ${data.scheduledWeeklyHours}h scheduled`} />
        <MetricCard label="Performance" value={`${data.va.performanceScore}%`} icon={TrendingUp} />
        <MetricCard label="QA Score" value={`${data.va.qualityScore}%`} icon={ShieldCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 space-y-3">
          <SectionHeader title="Today's Tasks" subtitle="Your queued work" action={<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView('tasks')}>View all <ChevronRight className="h-3 w-3 ml-0.5" /></Button>} />
          {data.tasks.length === 0 ? <Card className="shadow-none"><EmptyState icon={ListTodo} title="No tasks assigned" description="You're all caught up!" /></Card> :
            <Card className="border-border/70 shadow-none">
              <div className="divide-y divide-border/50">
                {data.tasks.slice(0, 6).map((t: any) => (
                  <div key={t.id} className="px-3 py-2.5 flex items-center gap-3 hover:bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{t.title}</div>
                      <div className="text-[10px] text-muted-foreground">{t.client} · {t.service ?? 'General'}</div>
                    </div>
                    <div className="hidden sm:block"><StatusBadge status={t.priority} size="xs" /></div>
                    <div className="hidden sm:block"><StatusBadge status={t.status} size="xs" /></div>
                    <div className="text-[11px] text-muted-foreground tabular-nums shrink-0">{formatDuration(t.timeSpentMs)}</div>
                  </div>
                ))}
              </div>
            </Card>
          }
        </div>

        {/* Right column */}
        <div className="space-y-3">
          <SectionHeader title="Schedule Today" />
          <Card className="border-border/70 shadow-none p-4">
            {data.todaySchedule.assignments.length === 0 ? <EmptyState icon={Calendar} title="No schedule today" /> :
              <div className="space-y-2">
                {data.todaySchedule.assignments.map((a: any, i: number) => (
                  <div key={i} className="text-xs">
                    <div className="font-medium text-foreground">{a.client}</div>
                    <div className="text-[11px] text-muted-foreground">{a.schedule}</div>
                  </div>
                ))}
              </div>
            }
          </Card>

          <SectionHeader title="Recent Feedback" action={<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView('feedback')}>View all</Button>} />
          <Card className="border-border/70 shadow-none">
            {data.qaFeedback.length === 0 ? <EmptyState icon={ShieldCheck} title="No feedback yet" /> :
              <div className="divide-y divide-border/50">
                {data.qaFeedback.slice(0, 3).map((q: any) => (
                  <div key={q.id} className="px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[11px] font-medium text-foreground truncate">{q.task}</div>
                      <Pill tone={q.score >= 90 ? 'success' : q.score >= 80 ? 'warning' : 'danger'}>{q.score}%</Pill>
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-2">{q.feedback}</div>
                  </div>
                ))}
              </div>
            }
          </Card>
        </div>
      </div>
    </div>
  )
}
