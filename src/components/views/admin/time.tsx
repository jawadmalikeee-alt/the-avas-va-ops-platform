'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { StatusBadge, EmptyState, LoadingSkeleton, MetricCard } from '@/components/ui-primitives'
import { Header, FilterBar, DataTable } from '@/components/views/admin/clients'
import { formatDate, formatDuration } from '@/lib/format'
import { Clock3, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'

export function AdminTimeAttendance() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/data/admin-list?type=attendance&q=${encodeURIComponent(q)}&status=${status}`, { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [q, status])

  // Stats
  const present = items.filter((i) => i.status === 'Present').length
  const late = items.filter((i) => i.status === 'Late').length
  const absent = items.filter((i) => i.status === 'Absent').length
  const totalHours = items.reduce((s, i) => s + (i.workedMs || 0), 0)

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Time & Attendance" subtitle="Last 7 days across all VAs" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Present" value={present} icon={CheckCircle2} hint="today" />
        <MetricCard label="Late" value={late} icon={AlertCircle} hint="this week" />
        <MetricCard label="Absent" value={absent} icon={AlertCircle} hint="this week" />
        <MetricCard label="Total Hours" value={formatDuration(totalHours)} icon={Clock3} hint="this week" />
      </div>
      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} options={['Present', 'Late', 'Absent', 'Half Day', 'Leave', 'Holiday', 'Incomplete']} placeholder="Search VA…" />
      <Card className="border-border/70 shadow-none">
        {loading ? <LoadingSkeleton /> :
          items.length === 0 ? <EmptyState icon={Calendar} title="No attendance records" /> :
          <DataTable
            columns={[
              { key: 'va', header: 'VA', render: (r) => <div className="text-xs font-medium text-foreground">{r.vaName}</div> },
              { key: 'date', header: 'Date', render: (r) => <div className="text-xs">{formatDate(r.date, { weekday: 'short', month: 'short', day: 'numeric' })}</div> },
              { key: 'scheduled', header: 'Scheduled', render: (r) => <div className="text-[11px] text-muted-foreground">{r.scheduled}</div> },
              { key: 'in', header: 'Clock In', render: (r) => <div className="text-xs tabular-nums">{r.clockIn ? formatDate(r.clockIn, { hour: 'numeric', minute: '2-digit' }) : '—'}</div> },
              { key: 'out', header: 'Clock Out', render: (r) => <div className="text-xs tabular-nums">{r.clockOut ? formatDate(r.clockOut, { hour: 'numeric', minute: '2-digit' }) : '—'}</div> },
              { key: 'break', header: 'Break', render: (r) => <div className="text-[11px] text-muted-foreground tabular-nums">{r.breakMs ? formatDuration(r.breakMs) : '—'}</div> },
              { key: 'worked', header: 'Worked', render: (r) => <div className="text-xs tabular-nums font-medium">{formatDuration(r.workedMs)}</div> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} size="xs" /> },
            ]}
            rows={items}
          />
        }
      </Card>
    </div>
  )
}
