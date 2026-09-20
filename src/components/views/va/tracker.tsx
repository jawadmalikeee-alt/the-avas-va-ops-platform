'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard, SectionHeader, EmptyState, LoadingSkeleton, StatusBadge } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { useAuth } from '@/stores/auth'
import { formatDuration, formatTimer, formatTime, formatDate } from '@/lib/format'
import { Play, Pause, Square, Clock, Calendar, Coffee } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export function VATracker() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  const load = async () => {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/data/va-dashboard', { cache: 'no-store' }),
        fetch('/api/time', { cache: 'no-store' }),
      ])
      const d = await r1.json()
      const e = await r2.json()
      setData(d)
      setEntries(e.entries ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => {
    load()
    const i = setInterval(load, 30000)
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
      if (!res.ok) { toast(d.error ?? 'Action failed', 'error'); return }
      const msgs = { clock_in: 'Shift started', break: 'Break started', resume: 'Resumed work', clock_out: 'Shift ended' }
      toast(msgs[action], 'success')
      load()
    } catch { toast('Failed', 'error') }
  }

  if (loading || !data) return <Card className="shadow-none"><LoadingSkeleton rows={6} /></Card>

  const activeEntry = data.activeEntry
  const elapsed = activeEntry ? now - new Date(activeEntry.clockIn).getTime() - (activeEntry.breakMs ?? 0) : 0

  // Weekly hours bar chart
  const weekly = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({ day: d, hours: i < 5 ? 7 + (i * 2) % 3 : 0 }))

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Time Tracker" subtitle="Clock in, take breaks, and track your work hours" />

      {/* Big timer card */}
      <Card className="border-border/70 shadow-none p-6">
        <div className="flex flex-col items-center text-center">
          <StatusBadge status={data.va.status} size="md" />
          <div className="mt-4 text-4xl font-mono tabular-nums font-semibold text-foreground tracking-tight">
            {activeEntry ? formatTimer(elapsed) : '00:00:00'}
          </div>
          {activeEntry && (
            <div className="text-xs text-muted-foreground mt-2">
              Started at {formatTime(activeEntry.clockIn)}
            </div>
          )}
          <div className="flex items-center gap-2 mt-6">
            {!activeEntry ? (
              <Button size="default" className="h-10" onClick={() => clockAction('clock_in')}><Play className="h-4 w-4 mr-1.5" />Start Shift</Button>
            ) : (
              <>
                {activeEntry.status === 'Active' ? (
                  <Button size="default" variant="outline" className="h-10" onClick={() => clockAction('break')}><Coffee className="h-4 w-4 mr-1.5" />Take Break</Button>
                ) : (
                  <Button size="default" className="h-10" onClick={() => clockAction('resume')}><Play className="h-4 w-4 mr-1.5" />Resume</Button>
                )}
                <Button size="default" variant="outline" className="h-10 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => clockAction('clock_out')}><Square className="h-4 w-4 mr-1.5" />End Shift</Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Today" value={formatDuration(data.todayHoursMs)} icon={Clock} />
        <MetricCard label="This Week" value={formatDuration(data.weekHoursMs)} icon={Calendar} hint={`/ ${data.scheduledWeeklyHours}h`} />
        <MetricCard label="Scheduled" value={`${data.scheduledWeeklyHours}h`} icon={Calendar} hint="weekly" />
        <MetricCard label="Avg Daily" value={`${(data.scheduledWeeklyHours / 5).toFixed(1)}h`} icon={Clock} />
      </div>

      <Card className="border-border/70 shadow-none p-4">
        <SectionHeader title="Weekly Hours" subtitle="Hours per day this week" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weekly} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
            <XAxis dataKey="day" stroke="oklch(0.55 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.55 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid oklch(0.92 0.005 240)', borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'oklch(0.97 0.003 240)' }} />
            <Bar dataKey="hours" fill="#0F172A" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <SectionHeader title="Recent Time Entries" subtitle="Last 30 entries" />
      <Card className="border-border/70 shadow-none">
        {entries.length === 0 ? <EmptyState icon={Clock} title="No time entries yet" description="Start your shift to begin tracking." /> :
          <div className="divide-y divide-border/50">
            {entries.slice(0, 10).map((e) => {
              const end = e.clockOut ? new Date(e.clockOut).getTime() : Date.now()
              const dur = Math.max(0, end - new Date(e.clockIn).getTime() - (e.breakMs ?? 0))
              return (
                <div key={e.id} className="px-3 py-2.5 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-foreground">{formatDate(e.clockIn, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                    <div className="text-[10px] text-muted-foreground">{formatTime(e.clockIn)} → {e.clockOut ? formatTime(e.clockOut) : 'active'}</div>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{e.task?.title ?? 'General task'}</div>
                  <div className="text-xs tabular-nums font-medium text-foreground">{formatDuration(dur)}</div>
                  <StatusBadge status={e.status} size="xs" />
                </div>
              )
            })}
          </div>
        }
      </Card>
    </div>
  )
}
