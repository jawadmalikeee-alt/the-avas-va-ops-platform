'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Pill, EmptyState, LoadingSkeleton, MetricCard } from '@/components/ui-primitives'
import { Header, DataTable } from '@/components/views/admin/clients'
import { formatDateTime } from '@/lib/format'
import { ScrollText, Shield, User, Clock, Edit, AlertCircle } from 'lucide-react'

export function AdminAudit() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/data/admin-list?type=audit', { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Audit Logs" subtitle="Immutable record of administrative actions" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard label="Total Events" value={items.length} icon={ScrollText} hint="last 30 days" />
        <MetricCard label="Security Events" value={items.filter((i) => i.action.includes('PERMISSION') || i.action.includes('SECURITY')).length} icon={Shield} />
        <MetricCard label="Time Adjustments" value={items.filter((i) => i.action.includes('TIME')).length} icon={Clock} />
      </div>
      <Card className="border-border/70 shadow-none">
        {loading ? <LoadingSkeleton /> :
          items.length === 0 ? <EmptyState icon={ScrollText} title="No audit entries" /> :
          <DataTable
            columns={[
              { key: 'action', header: 'Action', render: (r) => (
                <div className="flex items-center gap-2">
                  <ActionIcon action={r.action} />
                  <div>
                    <div className="text-xs font-medium text-foreground">{r.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</div>
                    <div className="text-[10px] text-muted-foreground">{r.entityType}</div>
                  </div>
                </div>
              ) },
              { key: 'actor', header: 'Actor', render: (r) => <div className="text-xs">{r.actor}</div> },
              { key: 'before', header: 'Before', render: (r) => <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">{r.before ?? '—'}</div> },
              { key: 'after', header: 'After', render: (r) => <div className="text-[11px] text-foreground truncate max-w-[180px]">{r.after ?? '—'}</div> },
              { key: 'time', header: 'Time', render: (r) => <div className="text-[11px] text-muted-foreground">{formatDateTime(r.createdAt)}</div> },
            ]}
            rows={items}
          />
        }
      </Card>
      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
        <Shield className="h-3 w-3" />
        Audit logs are immutable and retained indefinitely for compliance.
      </div>
    </div>
  )
}

function ActionIcon({ action }: { action: string }) {
  const Icon = action.includes('TIME') ? Clock : action.includes('PERMISSION') ? Shield : action.includes('CREATE') ? User : action.includes('UPDATE') ? Edit : ScrollText
  return <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
}
