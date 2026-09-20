'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, EmptyState, LoadingSkeleton, Pill, MiniProgress } from '@/components/ui-primitives'
import { Header, FilterBar, DataTable } from '@/components/views/admin/clients'
import { formatDate, formatDuration, priorityRank } from '@/lib/format'
import { Plus, ListTodo } from 'lucide-react'

export function AdminTasks() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/data/admin-list?type=tasks&q=${encodeURIComponent(q)}&status=${status}`, { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [q, status])

  const sorted = [...items].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Tasks & Projects" subtitle={`${items.length} tasks`} action={<Button size="sm" className="h-8"><Plus className="h-3.5 w-3.5 mr-1" />Create Task</Button>} />
      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} options={['To Do', 'In Progress', 'Review', 'Completed', 'Rejected']} placeholder="Search tasks…" />
      <Card className="border-border/70 shadow-none">
        {loading ? <LoadingSkeleton /> :
          sorted.length === 0 ? <EmptyState icon={ListTodo} title="No tasks" /> :
          <DataTable
            columns={[
              { key: 'title', header: 'Task', render: (r) => (
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{r.title}</div>
                  <div className="text-[10px] text-muted-foreground">{r.service ?? 'General'} · {r.client}</div>
                </div>
              ) },
              { key: 'va', header: 'Assigned VA', render: (r) => <div className="text-xs">{r.va}</div> },
              { key: 'priority', header: 'Priority', render: (r) => <StatusBadge status={r.priority} size="xs" /> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="xs" /> },
              { key: 'progress', header: 'Progress', render: (r) => (
                <div className="w-20">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                    <span>{r.progress}%</span>
                  </div>
                  <MiniProgress value={r.progress} tone={r.progress === 100 ? 'success' : 'default'} />
                </div>
              ) },
              { key: 'time', header: 'Time Spent', render: (r) => <div className="text-[11px] tabular-nums text-muted-foreground">{formatDuration(r.timeSpentMs)}</div> },
              { key: 'due', header: 'Due', render: (r) => <div className="text-[11px] text-muted-foreground">{r.dueDate ? formatDate(r.dueDate, { month: 'short', day: 'numeric' }) : '—'}</div> },
              { key: 'qa', header: 'QA', render: (r) => r.qaStatus ? <Pill tone={r.qaStatus === 'Pass' ? 'success' : r.qaStatus === 'Fail' ? 'danger' : 'warning'}>{r.qaStatus}</Pill> : <span className="text-[10px] text-muted-foreground">—</span> },
            ]}
            rows={sorted}
          />
        }
      </Card>
    </div>
  )
}
