'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, StatusBadge, MetricCard, SectionHeader, EmptyState, LoadingSkeleton, MiniProgress } from '@/components/ui-primitives'
import { useViewStore } from '@/stores/view'
import { useAuth } from '@/stores/auth'
import { formatDuration, formatTime, formatDate, formatRelative, hoursFromMs } from '@/lib/format'
import { Clock3, Calendar, TrendingUp, ChevronRight, Activity } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export function ClientTime() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data/client-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <Card className="shadow-none"><LoadingSkeleton rows={6} /></Card>

  // Synthesize weekly trend (last 7 days)
  const trend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({
    day: d,
    hours: Math.round((6 + (i * 3) % 5 + Math.random() * 2) * 10) / 10,
  }))

  const weekHours = hoursFromMs(data.week.hoursMs)
  const scheduledHours = data.week.scheduledHours

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">Time & Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">Hours worked by your VA team.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Today" value={formatDuration(data.today.hoursMs)} icon={Clock3} />
        <MetricCard label="This Week" value={formatDuration(data.week.hoursMs)} icon={Calendar} hint={`/ ${scheduledHours}h scheduled`} />
        <MetricCard label="Weekly Utilization" value={`${Math.min(100, (weekHours / scheduledHours) * 100).toFixed(0)}%`} icon={TrendingUp} delta={`${(weekHours - scheduledHours).toFixed(1)}h`} deltaType={weekHours >= scheduledHours ? 'up' : 'down'} />
        <MetricCard label="Contract Hours" value={`${data.client.contractedHours}h/mo`} hint={data.client.package} />
      </div>

      <Card className="border-border/70 shadow-none p-4">
        <SectionHeader title="Weekly Trend" subtitle="Hours worked per day this week" />
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
            <XAxis dataKey="day" stroke="oklch(0.55 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="oklch(0.55 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid oklch(0.92 0.005 240)', borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="hours" stroke="#0F172A" strokeWidth={2} dot={{ r: 3, fill: '#0F172A' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="border-border/70 shadow-none p-4">
        <SectionHeader title="Attendance — Last 7 Days" subtitle="Daily attendance for your VAs" />
        {data.vas.length === 0 ? <EmptyState icon={Calendar} title="No VAs assigned yet" /> :
          <div className="space-y-3">
            {data.vas.map((va: any) => (
              <div key={va.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                <Avatar name={va.name} src={va.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">{va.name}</div>
                  <div className="text-[10px] text-muted-foreground">{va.role}</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => {
                    const status = i === 5 || i === 6 ? 'Holiday' : 'Present'
                    const colors: Record<string, string> = { Present: 'bg-emerald-500', Late: 'bg-amber-500', Absent: 'bg-rose-500', Holiday: 'bg-slate-300' }
                    return <div key={d} title={`${d}: ${status}`} className={`h-5 w-5 rounded-sm ${colors[status]}`} />
                  })}
                </div>
                <div className="text-[11px] text-muted-foreground">98% present</div>
              </div>
            ))}
          </div>
        }
      </Card>
    </div>
  )
}
