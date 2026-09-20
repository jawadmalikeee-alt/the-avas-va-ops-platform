'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, MetricCard, SectionHeader, EmptyState, LoadingSkeleton, Pill } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts'
import { Download, FileText, Calendar, Printer } from 'lucide-react'
import { formatDuration, formatDate } from '@/lib/format'
import { toast } from '@/components/ui-primitives/toast'

export function ClientReports() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  useEffect(() => {
    fetch('/api/data/client-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <Card className="shadow-none"><LoadingSkeleton rows={6} /></Card>

  // Generate weekly trend data
  const weekly = ['W34', 'W35', 'W36', 'W37', 'W38'].map((w, i) => ({
    week: w,
    hours: 35 + (i * 2 + 1) % 8,
    tasks: 70 + (i * 5 + 3) % 25,
    qa: 90 + (i * 2) % 7,
  }))

  const handleDownload = (type: 'pdf' | 'csv') => {
    toast(`${type.toUpperCase()} report is being prepared.`, 'success')
  }

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Reports" subtitle="Your VA performance reports" action={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8" onClick={() => handleDownload('pdf')}><Download className="h-3.5 w-3.5 mr-1" />PDF</Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => handleDownload('csv')}><Download className="h-3.5 w-3.5 mr-1" />CSV</Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => toast('Opening print dialog…', 'info')}><Printer className="h-3.5 w-3.5 mr-1" />Print</Button>
        </div>
      } />

      {/* Range selector */}
      <div className="flex items-center gap-2">
        {(['daily', 'weekly', 'monthly'] as const).map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${range === r ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{r}</button>
        ))}
      </div>

      {/* Report preview — mimics a premium weekly client report */}
      <Card className="border-border/70 shadow-none overflow-hidden">
        {/* Premium header */}
        <div className="bg-slate-950 px-6 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/60">The AVAS</div>
              <h2 className="text-xl font-display font-semibold mt-1">Weekly VA Performance Report</h2>
              <p className="text-xs text-white/70 mt-1">{data.client.companyName} · {formatDate(new Date(), { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-white/60">Period</div>
              <div className="text-sm font-medium mt-1">Week of {formatDate(new Date(Date.now() - 7 * 86400000))}</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Hours Worked" value={formatDuration(data.week.hoursMs)} hint={`/ ${data.week.scheduledHours}h scheduled`} />
            <MetricCard label="Tasks Completed" value={data.week.tasksCompleted} />
            <MetricCard label="Deliverables" value={data.recentDeliverables.length} />
            {data.qa && <MetricCard label="QA Score" value={`${data.qa.score}%`} delta={`${data.qa.trend > 0 ? '+' : ''}${data.qa.trend}%`} deltaType={data.qa.trend >= 0 ? 'up' : 'down'} />}
          </div>

          {/* Service KPI summary */}
          <SectionHeader title="Service Delivery Summary" />
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 grid grid-cols-3 gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <div>Service</div><div className="text-center">KPIs</div><div className="text-right">Performance</div>
            </div>
            {Object.entries(data.week.kpisByService).map(([svc, kpis]: any) => {
              const avg = kpis.length ? kpis.reduce((s: number, k: any) => s + (k.target ? Math.min(100, (k.value / k.target) * 100) : 0), 0) / kpis.length : 0
              return (
                <div key={svc} className="px-3 py-2 grid grid-cols-3 gap-2 border-t border-border items-center">
                  <div className="text-xs font-medium text-foreground">{svc}</div>
                  <div className="text-xs text-center text-muted-foreground">{kpis.length}</div>
                  <div className="text-right">
                    <Pill tone={avg >= 90 ? 'success' : avg >= 70 ? 'info' : 'warning'}>{avg.toFixed(0)}%</Pill>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Trends chart */}
          <SectionHeader title="Performance Trend" subtitle="Last 5 weeks" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weekly} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
              <XAxis dataKey="week" stroke="oklch(0.55 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.55 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid oklch(0.92 0.005 240)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="qa" stroke="#10b981" strokeWidth={2} name="QA Score" />
              <Line type="monotone" dataKey="tasks" stroke="#0F172A" strokeWidth={2} name="Tasks" />
            </LineChart>
          </ResponsiveContainer>

          {/* Recent deliverables */}
          <SectionHeader title="Deliverables This Week" />
          {data.recentDeliverables.length === 0 ? <EmptyState icon={FileText} title="No deliverables" /> :
            <div className="space-y-2">
              {data.recentDeliverables.slice(0, 4).map((d: any) => (
                <div key={d.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{d.title}</div>
                    <div className="text-[10px] text-muted-foreground">{d.vaName} · {formatDate(d.date)}</div>
                  </div>
                  <Pill tone={d.status === 'Approved' ? 'success' : d.status === 'Under Review' ? 'info' : 'default'}>{d.status}</Pill>
                </div>
              ))}
            </div>
          }

          <div className="pt-4 border-t border-border text-[10px] text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Open items: {data.openTickets.length}</span>
              <span>Generated by The AVAS Operations Platform</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
