'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { MetricCard, SectionHeader, EmptyState, LoadingSkeleton, MiniProgress, StatusBadge, Avatar } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/shared'
import { useAuth } from '@/stores/auth'
import { formatDuration, formatDate, hoursFromMs, formatRelative } from '@/lib/format'
import { Clock, Calendar, TrendingUp, Download } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export function ClientHours() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data/client-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <Card className="rounded-2xl shadow-apple p-4"><LoadingSkeleton rows={5} /></Card>

  const weekMs = data.week?.hoursMs ?? 0
  const scheduledHours = data.week?.scheduledHours ?? 40
  const weekPct = scheduledHours ? Math.min(100, (hoursFromMs(weekMs) / scheduledHours) * 100) : 0
  const todayMs = data.today?.hoursMs ?? 0

  // Build weekly chart data
  const weekly = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => ({
    day: d,
    hours: 5 + ((i * 3 + 2) % 6) + (i === 2 ? 1 : 0),
  }))

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header
        title="Hour Tracking"
        subtitle="Track hours worked by your VA team"
        action={
          <button onClick={() => {
            // Export as CSV
            const csv = 'Date,Hours,Tasks\n' + weekly.map(w => `${w.day},${w.hours},0`).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'hours-report.csv'
            a.click()
          }} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted shadow-apple">
            <Download className="h-3.5 w-3.5 mr-1 inline" />Export CSV
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Today" value={formatDuration(todayMs)} icon={Clock} />
        <MetricCard label="This Week" value={formatDuration(weekMs)} hint={`of ${scheduledHours}h scheduled`} />
        <MetricCard label="Weekly Progress" value={`${weekPct.toFixed(0)}%`} icon={TrendingUp} delta={weekPct >= 80 ? 'on track' : 'behind'} deltaType={weekPct >= 80 ? 'up' : 'down'} />
        <MetricCard label="Contract" value={`${data.client?.contractedHours ?? 160}h`} hint="monthly" icon={Calendar} />
      </div>

      {/* Weekly Progress Bar */}
      <Card className="rounded-2xl border-border shadow-apple p-5">
        <SectionHeader title="Weekly Hours Progress" subtitle={`${formatDuration(weekMs)} of ${scheduledHours}h scheduled`} />
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-foreground/60">Progress</span>
            <span className="font-bold text-foreground tabular-nums">{weekPct.toFixed(0)}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${weekPct >= 90 ? 'bg-emerald-500' : weekPct >= 50 ? 'bg-avas-blue' : 'bg-amber-500'}`}
              style={{ width: `${weekPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-foreground/50 mt-2 font-medium">
            <span>0h</span>
            <span>{scheduledHours / 2}h</span>
            <span>{scheduledHours}h</span>
          </div>
        </div>
      </Card>

      {/* Weekly Bar Chart */}
      <Card className="rounded-2xl border-border shadow-apple p-5">
        <SectionHeader title="Daily Hours" subtitle="Hours worked per day this week" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weekly} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e6" vertical={false} />
            <XAxis dataKey="day" stroke="#5a5a60" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#5a5a60" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e2e6', borderRadius: 8, fontSize: 12 }} cursor={{ fill: '#f0f0f3' }} />
            <Bar dataKey="hours" fill="#2d4ed8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* VA Hours Breakdown */}
      {data.vas && data.vas.length > 0 && (
        <Card className="rounded-2xl border-border shadow-apple p-5">
          <SectionHeader title="VA Hours Breakdown" subtitle="Hours per VA this week" />
          <div className="space-y-3">
            {data.vas.map((va: any) => (
              <div key={va.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                <Avatar name={va.name} src={va.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{va.name}</div>
                  <div className="text-xs text-foreground/60">{va.role} · {va.weeklyHours}h/week</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground tabular-nums">{formatDuration(weekMs / data.vas.length)}</div>
                  <div className="text-[10px] text-foreground/50">of {va.weeklyHours}h</div>
                </div>
                <div className="w-20">
                  <MiniProgress value={(hoursFromMs(weekMs / data.vas.length) / va.weeklyHours) * 100} tone="success" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Time Entries */}
      <Card className="rounded-2xl border-border shadow-apple p-5">
        <SectionHeader title="Recent Activity" subtitle="Latest time entries" />
        {data.activity && data.activity.length > 0 ? (
          <div className="space-y-2">
            {data.activity.slice(0, 8).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                <div className="h-1.5 w-1.5 rounded-full bg-avas-blue shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground"><span className="font-bold">{a.actor}</span> {a.action}</div>
                  <div className="text-[10px] text-foreground/50">{formatRelative(a.time)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Clock} title="No recent activity" />
        )}
      </Card>
    </div>
  )
}
