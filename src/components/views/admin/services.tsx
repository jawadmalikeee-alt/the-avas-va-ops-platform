'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pill, SectionHeader, EmptyState } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { Package, Check, Plus } from 'lucide-react'

const SERVICES = [
  { name: 'Lead Management', category: 'Real Estate', clients: 4, kpis: 5, enabled: true },
  { name: 'Lead Follow-Up', category: 'Real Estate', clients: 3, kpis: 4, enabled: true },
  { name: 'CRM Management', category: 'Real Estate', clients: 4, kpis: 4, enabled: true },
  { name: 'MLS Data Entry', category: 'Real Estate', clients: 2, kpis: 3, enabled: true },
  { name: 'Social Media Management', category: 'Marketing', clients: 3, kpis: 4, enabled: true },
  { name: 'CMA Preparation', category: 'Real Estate', clients: 2, kpis: 4, enabled: true },
  { name: 'Email Management', category: 'Administrative', clients: 4, kpis: 4, enabled: true },
  { name: 'Cold Calling', category: 'Sales', clients: 1, kpis: 6, enabled: true },
  { name: 'Appointment Setting', category: 'Sales', clients: 2, kpis: 3, enabled: true },
  { name: 'Transaction Coordination', category: 'Real Estate', clients: 1, kpis: 5, enabled: true },
  { name: 'Data Entry', category: 'Administrative', clients: 3, kpis: 2, enabled: true },
  { name: 'Research', category: 'Administrative', clients: 2, kpis: 2, enabled: true },
]

export function AdminServices() {
  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Service Delivery" subtitle={`${SERVICES.length} configurable services`} action={<Button size="sm" className="h-8"><Plus className="h-3.5 w-3.5 mr-1" />New Service</Button>} />
      <Card className="border-border/70 shadow-none p-0">
        <div className="divide-y divide-border/50">
          {SERVICES.map((s) => (
            <div key={s.name} className="px-3 py-2.5 flex items-center gap-3 hover:bg-muted/30">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                  <Pill tone="muted">{s.category}</Pill>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.kpis} KPIs tracked · {s.clients} clients subscribed</div>
              </div>
              <div className="flex items-center gap-1.5">
                {s.enabled && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                <span className="text-[11px] text-muted-foreground">{s.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* KPI Templates */}
      <SectionHeader title="KPI Templates" subtitle="Configurable per service" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { svc: 'Lead Management', kpis: ['Leads Processed', 'Leads Verified', 'Leads Assigned', 'Leads Followed Up', 'Response Rate'] },
          { svc: 'Cold Calling', kpis: ['Calls Made', 'Connected Calls', 'Talk Time', 'Conversations', 'Appointments', 'Follow-Ups'] },
          { svc: 'CRM Management', kpis: ['Records Updated', 'Records Added', 'Records Cleaned', 'Duplicates Removed'] },
          { svc: 'Social Media', kpis: ['Posts Created', 'Posts Published', 'Engagement', 'Content Calendar Completion'] },
          { svc: 'Email Management', kpis: ['Emails Processed', 'Emails Replied', 'Emails Forwarded', 'Response Time'] },
          { svc: 'Appointment Setting', kpis: ['Appointments Set', 'Confirmations', 'Cancellations', 'Show-up Rate'] },
        ].map((t) => (
          <Card key={t.svc} className="border-border/70 shadow-none p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">{t.svc}</h3>
              <Pill tone="muted">{t.kpis.length} KPIs</Pill>
            </div>
            <ul className="space-y-1">
              {t.kpis.map((k) => (
                <li key={k} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />{k}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}
