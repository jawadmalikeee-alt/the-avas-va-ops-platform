'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, EmptyState, LoadingSkeleton, Pill, MetricCard } from '@/components/ui-primitives'
import { Header, FilterBar, DataTable } from '@/components/views/admin/clients'
import { formatDate } from '@/lib/format'
import { ShieldCheck, Plus, TrendingUp, AlertTriangle } from 'lucide-react'

export function AdminQA() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/data/admin-list?type=qa`, { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const avgScore = items.length ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length * 10) / 10 : 0
  const passing = items.filter((i) => i.score >= 90).length
  const failing = items.filter((i) => i.score < 85).length

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="QA & Quality" subtitle="Quality assurance reviews across all VAs" action={<Button size="sm" className="h-8"><Plus className="h-3.5 w-3.5 mr-1" />New QA Review</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Reviews" value={items.length} icon={ShieldCheck} />
        <MetricCard label="Avg Score" value={`${avgScore}%`} icon={TrendingUp} deltaType={avgScore >= 90 ? 'up' : 'neutral'} delta={avgScore >= 90 ? 'on target' : 'watch'} />
        <MetricCard label="Passing (90%+)" value={passing} icon={ShieldCheck} hint="this period" />
        <MetricCard label="Issues (<85%)" value={failing} icon={AlertTriangle} hint="needs attention" />
      </div>

      <Card className="border-border/70 shadow-none">
        {loading ? <LoadingSkeleton /> :
          items.length === 0 ? <EmptyState icon={ShieldCheck} title="No QA reviews" /> :
          <DataTable
            columns={[
              { key: 'va', header: 'VA', render: (r) => <div className="text-xs font-medium text-foreground">{r.vaName}</div> },
              { key: 'client', header: 'Client', render: (r) => <div className="text-xs">{r.client}</div> },
              { key: 'task', header: 'Task', render: (r) => <div className="text-xs truncate max-w-[180px]">{r.task}</div> },
              { key: 'score', header: 'Score', render: (r) => (
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold tabular-nums ${r.score >= 90 ? 'text-emerald-600' : r.score >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>{r.score}%</span>
                  <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${r.score >= 90 ? 'bg-emerald-500' : r.score >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${r.score}%` }} />
                  </div>
                </div>
              ) },
              { key: 'date', header: 'Date', render: (r) => <div className="text-[11px] text-muted-foreground">{formatDate(r.date, { month: 'short', day: 'numeric' })}</div> },
              { key: 'evaluator', header: 'Evaluator', render: (r) => <div className="text-[11px] text-muted-foreground">{r.evaluator}</div> },
              { key: 'feedback', header: 'Feedback', render: (r) => <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{r.feedback ?? '—'}</div> },
            ]}
            rows={items}
          />
        }
      </Card>
    </div>
  )
}
