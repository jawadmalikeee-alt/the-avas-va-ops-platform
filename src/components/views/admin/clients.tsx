'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge, Avatar, SectionHeader, EmptyState, LoadingSkeleton, Pill } from '@/components/ui-primitives'
import { useViewStore } from '@/stores/view'
import { formatDate, formatRelative } from '@/lib/format'
import { Search, Plus, Filter, ChevronRight, Users, MoreHorizontal } from 'lucide-react'

export function AdminClients() {
  const { setView } = useViewStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/data/admin-list?type=clients&q=${encodeURIComponent(q)}&status=${status}`, { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [q, status])

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header
        title="Clients"
        subtitle={`${items.length} clients total`}
        action={<Button size="sm" className="h-8"><Plus className="h-3.5 w-3.5 mr-1" />Add Client</Button>}
      />
      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} options={['Active', 'Trial', 'On Hold', 'Ended']} />

      <Card className="border-border/70 shadow-none">
        {loading ? <LoadingSkeleton /> :
          items.length === 0 ? <EmptyState icon={Users} title="No clients found" description="Add your first client to begin operations." /> :
          <DataTable
            columns={[
              { key: 'company', header: 'Client', render: (r) => (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-medium text-white shrink-0" style={{ background: '#0F172A' }}>
                    {r.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{r.companyName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{r.contactPerson} · {r.email}</div>
                  </div>
                </div>
              ) },
              { key: 'country', header: 'Location', render: (r) => <div className="text-xs"><div className="text-foreground">{r.country}</div><div className="text-[10px] text-muted-foreground">{r.timezone}</div></div> },
              { key: 'package', header: 'Package', render: (r) => <div className="text-xs text-foreground truncate max-w-[180px]">{r.package}</div> },
              { key: 'hours', header: 'Hours/mo', render: (r) => <div className="text-xs tabular-nums">{r.contractedHours}h</div> },
              { key: 'assigned', header: 'VAs', render: (r) => <Pill tone="muted">{r.assignedVAs} assigned</Pill> },
              { key: 'tickets', header: 'Tickets', render: (r) => r.openTickets > 0 ? <Pill tone="warning">{r.openTickets} open</Pill> : <span className="text-[10px] text-muted-foreground">—</span> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.contractStatus} size="xs" /> },
            ]}
            rows={items}
            onRowClick={() => setView('clients')}
          />
        }
      </Card>
    </div>
  )
}

// ============================================================
// Shared list view components
// ============================================================

export function Header({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function FilterBar({ q, setQ, status, setStatus, options, placeholder = 'Search…' }: {
  q: string; setQ: (s: string) => void; status: string; setStatus: (s: string) => void; options: string[]; placeholder?: string
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[180px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="pl-8 h-8 text-xs" />
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => setStatus('')} className={`px-2 py-1 rounded-md text-[11px] font-medium ${!status ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>All</button>
        {options.map((o) => (
          <button key={o} onClick={() => setStatus(o)} className={`px-2 py-1 rounded-md text-[11px] font-medium ${status === o ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{o}</button>
        ))}
      </div>
    </div>
  )
}

export function DataTable({ columns, rows, onRowClick }: {
  columns: Array<{ key: string; header: string; render?: (r: any) => React.ReactNode }>
  rows: any[]
  onRowClick?: (r: any) => void
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="px-3 py-2 border-b border-border grid gap-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((c) => <div key={c.key}>{c.header}</div>)}
        </div>
        <div className="divide-y divide-border/50">
          {rows.map((r, i) => (
            <button
              key={r.id ?? i}
              onClick={() => onRowClick?.(r)}
              className="w-full px-3 py-2.5 grid gap-3 items-center text-left hover:bg-muted/40 transition-colors"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
            >
              {columns.map((c) => <div key={c.key}>{c.render ? c.render(r) : r[c.key]}</div>)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
