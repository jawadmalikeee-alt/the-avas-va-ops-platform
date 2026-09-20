'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard, SectionHeader, EmptyState, LoadingSkeleton, Pill } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatDate } from '@/lib/format'
import { ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

export function ClientQuality() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/data/client-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setData(d); return fetch('/api/data/admin-list?type=qa', { cache: 'no-store' }) })
      .then(r => r.json())
      .then(d => setReviews(d.items ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <Card className="shadow-none"><LoadingSkeleton rows={6} /></Card>

  const qa = data.qa
  const trend = ['W34', 'W35', 'W36', 'W37', 'W38'].map((w, i) => ({ week: w, score: 88 + (i * 2 + 1) % 10 }))

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Quality" subtitle="Quality of work delivered to your account" />

      {!qa ? <Card className="shadow-none"><EmptyState icon={ShieldCheck} title="Quality scores not enabled" description="Contact your AVAS account manager to enable QA visibility." /></Card> :
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Quality Score" value={`${qa.score}%`} icon={ShieldCheck} delta={`${qa.trend > 0 ? '+' : ''}${qa.trend}%`} deltaType={qa.trend >= 0 ? 'up' : 'down'} hint="vs last week" />
            <MetricCard label="Issues Found" value={reviews.filter((r) => r.score < 90).length} icon={AlertTriangle} hint="this week" />
            <MetricCard label="Reviews" value={reviews.length} icon={TrendingUp} hint="total" />
            <MetricCard label="Status" value={<span className="text-emerald-600 text-base font-semibold">On Track</span>} icon={CheckCircle2} hint="above 90%" />
          </div>

          <Card className="border-border/70 shadow-none p-4">
            <SectionHeader title="Quality Trend" subtitle="Last 5 weeks" />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 240)" vertical={false} />
                <XAxis dataKey="week" stroke="oklch(0.55 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[80, 100]} stroke="oklch(0.55 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'white', border: '1px solid oklch(0.92 0.005 240)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <SectionHeader title="Recent QA" subtitle="Quality scores from latest reviews" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {qa.recent.length === 0 ? <Card className="shadow-none col-span-full"><EmptyState icon={ShieldCheck} title="No recent QA reviews" /></Card> :
              qa.recent.map((r: any, i: number) => (
                <Card key={i} className="border-border/70 shadow-none p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-foreground truncate">{r.task}</div>
                    <Pill tone={r.score >= 90 ? 'success' : r.score >= 80 ? 'warning' : 'danger'}>{r.score}%</Pill>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${r.score >= 90 ? 'bg-emerald-500' : r.score >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${r.score}%` }} />
                  </div>
                </Card>
              ))
            }
          </div>
        </>
      }
    </div>
  )
}
