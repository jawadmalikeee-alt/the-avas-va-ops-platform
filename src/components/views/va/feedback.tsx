'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { MetricCard, SectionHeader, EmptyState, LoadingSkeleton, Pill } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { formatDate } from '@/lib/format'
import { ShieldCheck, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react'

export function VAFeedback() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data/va-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <Card className="shadow-none"><LoadingSkeleton rows={5} /></Card>

  const avgScore = data.qaFeedback.length ? Math.round(data.qaFeedback.reduce((s: number, q: any) => s + q.score, 0) / data.qaFeedback.length * 10) / 10 : 0
  const passing = data.qaFeedback.filter((q: any) => q.score >= 90).length
  const watch = data.qaFeedback.filter((q: any) => q.score < 90).length

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="QA & Feedback" subtitle="Quality reviews and feedback from your QA team" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Current Score" value={`${data.va.qualityScore}%`} icon={ShieldCheck} />
        <MetricCard label="Avg Recent" value={`${avgScore}%`} icon={TrendingUp} hint={`${data.qaFeedback.length} reviews`} />
        <MetricCard label="Passing" value={passing} icon={ShieldCheck} hint="90%+" />
        <MetricCard label="Needs Work" value={watch} icon={AlertTriangle} hint="< 90%" />
      </div>

      <SectionHeader title="Recent Reviews" subtitle="Latest QA feedback on your work" />
      {data.qaFeedback.length === 0 ? <Card className="shadow-none"><EmptyState icon={ShieldCheck} title="No reviews yet" description="Your QA team will review submissions as they come in." /></Card> :
        <div className="space-y-3">
          {data.qaFeedback.map((q: any) => (
            <Card key={q.id} className="border-border/70 shadow-none p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{q.task}</div>
                  <div className="text-[11px] text-muted-foreground">Reviewed by {q.evaluator} · {formatDate(q.date, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-semibold tabular-nums ${q.score >= 90 ? 'text-emerald-600' : q.score >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>{q.score}%</span>
                </div>
              </div>
              <div className="rounded-md bg-muted/40 p-3 mt-2">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground leading-relaxed">{q.feedback}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }
    </div>
  )
}
