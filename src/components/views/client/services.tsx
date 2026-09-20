'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { SectionHeader, EmptyState, LoadingSkeleton, Pill, MiniProgress, MetricCard } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { Package, Check } from 'lucide-react'

export function ClientServices() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data/client-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Card className="shadow-none"><LoadingSkeleton rows={4} /></Card>

  const services = Object.entries(data?.week?.kpisByService ?? {})

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Service Delivery" subtitle="Services subscribed and KPI performance" />

      <Card className="border-border/70 shadow-none p-4">
        <SectionHeader title="Your Service Package" subtitle={data?.client?.package ?? ''} />
        <div className="flex items-center gap-2 flex-wrap">
          {services.length === 0 ? <span className="text-xs text-muted-foreground">No services configured yet.</span> :
            services.map(([s]) => (
              <Pill key={s} tone="success"><Check className="h-3 w-3" />{s}</Pill>
            ))
          }
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {services.length === 0 ? <Card className="shadow-none lg:col-span-2"><EmptyState icon={Package} title="No service KPIs yet" description="Your AVAS team will configure KPIs based on your package." /></Card> :
          services.map(([svc, kpis]: any) => (
            <Card key={svc} className="border-border/70 shadow-none p-4">
              <SectionHeader title={svc} subtitle={`${kpis.length} KPIs tracked`} />
              <div className="space-y-3">
                {kpis.map((k: any) => {
                  const pct = k.target ? Math.min(100, (k.value / k.target) * 100) : 0
                  return (
                    <div key={k.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground">{k.name}</span>
                        <span className="text-xs font-medium tabular-nums">{k.value}{k.unit === '%' ? '%' : ''}<span className="text-muted-foreground"> / {k.target}{k.unit === '%' ? '%' : ''}</span></span>
                      </div>
                      <MiniProgress value={pct} tone={pct >= 90 ? 'success' : pct >= 50 ? 'default' : 'warning'} />
                    </div>
                  )
                })}
              </div>
            </Card>
          ))
        }
      </div>
    </div>
  )
}
