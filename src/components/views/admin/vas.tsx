'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, Avatar, EmptyState, LoadingSkeleton, Pill } from '@/components/ui-primitives'
import { Header, FilterBar, DataTable } from '@/components/views/admin/clients'
import { useViewStore } from '@/stores/view'
import { formatDate, formatRelative, formatDuration } from '@/lib/format'
import { Plus, UserCog, Search } from 'lucide-react'

export function AdminVAs() {
  const { setView } = useViewStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/data/admin-list?type=vas&q=${encodeURIComponent(q)}&status=${status}`, { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [q, status])

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="VAs & Agents" subtitle={`${items.length} virtual assistants`} action={<Button size="sm" className="h-8"><Plus className="h-3.5 w-3.5 mr-1" />Add VA</Button>} />
      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} options={['Active', 'On Leave', 'Suspended', 'Terminated']} placeholder="Search by name, specialization…" />
      <Card className="border-border/70 shadow-none">
        {loading ? <LoadingSkeleton /> :
          items.length === 0 ? <EmptyState icon={UserCog} title="No VAs found" /> :
          <DataTable
            columns={[
              { key: 'name', header: 'VA', render: (r) => (
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={r.name} src={r.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{r.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{r.specialization}</div>
                  </div>
                </div>
              ) },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.currentStatus} size="xs" /> },
              { key: 'assignments', header: 'Assignments', render: (r) => (
                <div className="text-xs">
                  {r.assignments.length === 0 ? <span className="text-muted-foreground">No assignments</span> :
                    r.assignments.slice(0, 2).map((a: any, i: number) => (
                      <div key={i} className="truncate">{a.client} <span className="text-muted-foreground">· {r.role}</span></div>
                    ))
                  }
                  {r.assignments.length > 2 && <div className="text-[10px] text-muted-foreground">+{r.assignments.length - 2} more</div>}
                </div>
              ) },
              { key: 'perf', header: 'Performance', render: (r) => (
                <div className="text-xs tabular-nums">
                  <div className="text-foreground font-medium">{r.performanceScore}%</div>
                  <div className="text-[10px] text-muted-foreground">QA {r.qualityScore}%</div>
                </div>
              ) },
              { key: 'hire', header: 'Hired', render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.hireDate, { month: 'short', year: 'numeric' })}</span> },
              { key: 'employment', header: 'Type', render: (r) => <Pill tone="muted">{r.employmentType ?? 'Full-Time'}</Pill> },
            ]}
            rows={items}
            onRowClick={() => setView('vas')}
          />
        }
      </Card>
    </div>
  )
}
