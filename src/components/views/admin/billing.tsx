'use client'

import { Card } from '@/components/ui/card'
import { Pill, MetricCard, SectionHeader, EmptyState } from '@/components/ui-primitives'
import { Header, DataTable } from '@/components/views/admin/clients'
import { Receipt, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

export function AdminBilling() {
  // Synthetic billing data
  const rows = [
    { id: '1', client: 'ABC Realty', contracted: 160, worked: 154.3, approved: 153.7, billable: 153.7, overtime: 0, variance: -5.7, status: 'On Track' },
    { id: '2', client: 'Sunset Properties', contracted: 160, worked: 158.5, approved: 156.2, billable: 156.2, overtime: 0, variance: -1.5, status: 'On Track' },
    { id: '3', client: 'Metro Homes Group', contracted: 80, worked: 76.8, approved: 76.5, billable: 76.5, overtime: 0, variance: -3.2, status: 'Under Target' },
    { id: '4', client: 'Coastal Realty', contracted: 240, worked: 232.4, approved: 230.1, billable: 230.1, overtime: 4, variance: -7.6, status: 'On Track' },
  ]

  const totalContracted = rows.reduce((s, r) => s + r.contracted, 0)
  const totalWorked = rows.reduce((s, r) => s + r.worked, 0)
  const totalApproved = rows.reduce((s, r) => s + r.approved, 0)
  const underTarget = rows.filter((r) => r.status === 'Under Target').length

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Billing & Hours Reconciliation" subtitle="Internal — track contracted vs actual hours per client" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Contracted (mo)" value={`${totalContracted}h`} icon={Receipt} hint="across all clients" />
        <MetricCard label="Worked (mo)" value={`${totalWorked.toFixed(1)}h`} icon={Clock} delta={`${((totalWorked / totalContracted) * 100).toFixed(1)}%`} deltaType="neutral" />
        <MetricCard label="Approved" value={`${totalApproved.toFixed(1)}h`} icon={CheckCircle2} hint="this period" />
        <MetricCard label="Under Target" value={underTarget} icon={AlertTriangle} hint="clients below hours" />
      </div>

      <Card className="border-border/70 shadow-none">
        <DataTable
          columns={[
            { key: 'client', header: 'Client', render: (r) => <div className="text-xs font-medium text-foreground">{r.client}</div> },
            { key: 'contracted', header: 'Contracted', render: (r) => <div className="text-xs tabular-nums">{r.contracted}h</div> },
            { key: 'worked', header: 'Worked', render: (r) => <div className="text-xs tabular-nums">{r.worked.toFixed(1)}h</div> },
            { key: 'approved', header: 'Approved', render: (r) => <div className="text-xs tabular-nums text-emerald-600">{r.approved.toFixed(1)}h</div> },
            { key: 'billable', header: 'Billable', render: (r) => <div className="text-xs tabular-nums font-medium">{r.billable.toFixed(1)}h</div> },
            { key: 'overtime', header: 'Overtime', render: (r) => <div className="text-xs tabular-nums">{r.overtime > 0 ? `+${r.overtime}h` : '—'}</div> },
            { key: 'variance', header: 'Variance', render: (r) => (
              <span className={`text-xs tabular-nums ${r.variance < -5 ? 'text-rose-600' : r.variance < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {r.variance > 0 ? '+' : ''}{r.variance.toFixed(1)}h
              </span>
            ) },
            { key: 'status', header: 'Status', render: (r) => <Pill tone={r.status === 'On Track' ? 'success' : 'warning'}>{r.status}</Pill> },
          ]}
          rows={rows}
        />
      </Card>

      <SectionHeader title="Hour Reconciliation" subtitle="Approved vs unapproved hours" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((r) => (
          <Card key={r.id} className="border-border/70 shadow-none p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">{r.client}</span>
              <Pill tone={r.status === 'On Track' ? 'success' : 'warning'}>{r.status}</Pill>
            </div>
            <div className="space-y-1.5 text-xs">
              <ReconRow label="Contracted" value={`${r.contracted}h`} pct={100} />
              <ReconRow label="Worked" value={`${r.worked.toFixed(1)}h`} pct={(r.worked / r.contracted) * 100} tone="default" />
              <ReconRow label="Approved" value={`${r.approved.toFixed(1)}h`} pct={(r.approved / r.contracted) * 100} tone="success" />
              <ReconRow label="Unapproved" value={`${(r.worked - r.approved).toFixed(1)}h`} pct={((r.worked - r.approved) / r.contracted) * 100} tone="warning" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ReconRow({ label, value, pct, tone = 'default' }: { label: string; value: string; pct: number; tone?: 'default' | 'success' | 'warning' }) {
  const color = tone === 'success' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-foreground'
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-20 text-[11px]">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <span className="text-foreground tabular-nums w-16 text-right text-[11px]">{value}</span>
    </div>
  )
}
