'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, EmptyState, LoadingSkeleton, Pill } from '@/components/ui-primitives'
import { Header, FilterBar, DataTable } from '@/components/views/admin/clients'
import { formatDate } from '@/lib/format'
import { Plus, GitBranch } from 'lucide-react'

export function AdminAssignments() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/data/admin-list?type=clients&q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      const data = await res.json()
      // For demo: derive assignments from clients
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [q, status])

  // Build a synthetic assignments list from clients
  const assignmentRows = items.flatMap((c: any) => [
    { id: `${c.id}-1`, client: c.companyName, va: 'Sarah Johnson', role: 'Lead Management VA', hours: 40, status: 'Active', schedule: 'Mon-Fri 9-6 PKT', startDate: c.startDate },
    { id: `${c.id}-2`, client: c.companyName, va: 'Ahmed Raza', role: 'Follow-Up VA', hours: 20, status: 'Active', schedule: 'Mon-Fri 2-6 PKT', startDate: c.startDate },
  ])

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Assignments" subtitle={`${assignmentRows.length} active assignments`} action={<Button size="sm" className="h-8"><Plus className="h-3.5 w-3.5 mr-1" />Assign VA</Button>} />
      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} options={['Active', 'Paused', 'Ended']} placeholder="Search assignments…" />
      <Card className="border-border/70 shadow-none">
        {loading ? <LoadingSkeleton /> :
          assignmentRows.length === 0 ? <EmptyState icon={GitBranch} title="No assignments yet" /> :
          <DataTable
            columns={[
              { key: 'client', header: 'Client', render: (r) => <div className="text-xs font-medium text-foreground">{r.client}</div> },
              { key: 'va', header: 'VA', render: (r) => <div className="text-xs">{r.va}</div> },
              { key: 'role', header: 'Role', render: (r) => <div className="text-xs">{r.role}</div> },
              { key: 'hours', header: 'Hrs/wk', render: (r) => <div className="text-xs tabular-nums">{r.hours}h</div> },
              { key: 'schedule', header: 'Schedule', render: (r) => <div className="text-[11px] text-muted-foreground">{r.schedule}</div> },
              { key: 'start', header: 'Start', render: (r) => <div className="text-[11px] text-muted-foreground">{formatDate(r.startDate)}</div> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="xs" /> },
            ]}
            rows={assignmentRows}
          />
        }
      </Card>
    </div>
  )
}
