'use client'

import { Card } from '@/components/ui/card'
import { SectionHeader, MetricCard, Pill } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, Cell } from 'recharts'
import { TrendingUp, Users, Clock, ShieldCheck, Activity, Award } from 'lucide-react'

const hoursTrend = [
  { day: 'Mon', hours: 280, target: 320 },
  { day: 'Tue', hours: 305, target: 320 },
  { day: 'Wed', hours: 295, target: 320 },
  { day: 'Thu', hours: 318, target: 320 },
  { day: 'Fri', hours: 312, target: 320 },
  { day: 'Sat', hours: 95, target: 80 },
  { day: 'Sun', hours: 0, target: 0 },
]

const taskCompletion = [
  { name: 'Lead Mgmt', completed: 184, pending: 12 },
  { name: 'CRM', completed: 156, pending: 8 },
  { name: 'Cold Call', completed: 92, pending: 5 },
  { name: 'Social', completed: 68, pending: 4 },
  { name: 'Email', completed: 124, pending: 6 },
  { name: 'CMA', completed: 42, pending: 3 },
]

const topPerformers = [
  { name: 'Sarah Johnson', score: 96, qa: 98 },
  { name: 'Maria Santos', score: 94, qa: 95 },
  { name: 'John Reyes', score: 93, qa: 94 },
  { name: 'Fatima Ali', score: 91, qa: 92 },
]

export function AdminAnalytics() {
  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Analytics" subtitle="Operational performance across the entire VA workforce" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Avg Utilization" value="87.5%" icon={Activity} delta="+2.1%" deltaType="up" hint="this week" />
        <MetricCard label="Avg Attendance" value="95.2%" icon={Clock} delta="+1.4%" deltaType="up" />
        <MetricCard label="Avg QA Score" value="93.4%" icon={ShieldCheck} delta="+0.8%" deltaType="up" />
        <MetricCard label="Task Completion" value="92.1%" icon={TrendingUp} delta="+3.2%" deltaType="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/70 shadow-none p-4">
          <SectionHeader title="Hours Trend" subtitle="Daily worked hours vs scheduled (this week)" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hoursTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
              <XAxis dataKey="day" stroke="oklch(0.55 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.55 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid oklch(0.92 0.005 240)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="hours" stroke="#0F172A" strokeWidth={2} dot={{ r: 3, fill: '#0F172A' }} />
              <Line type="monotone" dataKey="target" stroke="oklch(0.85 0.005 240)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="border-border/70 shadow-none p-4">
          <SectionHeader title="Tasks by Service" subtitle="Completed vs pending (this week)" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={taskCompletion} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
              <XAxis dataKey="name" stroke="oklch(0.55 0.012 240)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.55 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid oklch(0.92 0.005 240)', borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'oklch(0.97 0.003 240)' }} />
              <Bar dataKey="completed" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pending" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="border-border/70 shadow-none p-4">
        <SectionHeader title="Top Performers" subtitle="Based on performance score (this week)" action={<Award className="h-4 w-4 text-amber-500" />} />
        <div className="space-y-2">
          {topPerformers.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3 py-2">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">{i + 1}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{p.name}</div>
                <div className="text-[11px] text-muted-foreground">QA Score: {p.qa}%</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${p.score}%` }} />
                </div>
                <span className="text-xs tabular-nums font-medium text-foreground w-10 text-right">{p.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
