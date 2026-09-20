'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SectionHeader, Pill, EmptyState } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { FileText, Download, Plus, FileBarChart, Calendar } from 'lucide-react'

export function AdminReports() {
  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Reports" subtitle="Generate, schedule, and download operational reports" action={<Button size="sm" className="h-8"><Plus className="h-3.5 w-3.5 mr-1" />Generate Report</Button>} />

      <SectionHeader title="Saved Templates" subtitle="Reusable report configurations" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { name: 'Weekly Client Performance', type: 'client_weekly', desc: 'Hours, tasks, KPIs, QA summary per client', lastRun: '2 hours ago' },
          { name: 'VA Productivity Report', type: 'va_performance', desc: 'Attendance, performance, QA trends per VA', lastRun: '5 hours ago' },
          { name: 'Monthly Operations Summary', type: 'ops_monthly', desc: 'All clients, hours reconciliation, billing', lastRun: '1 day ago' },
          { name: 'Service Delivery Report', type: 'service_delivery', desc: 'Per-service KPI roll-up across clients', lastRun: '3 days ago' },
          { name: 'QA Insights', type: 'qa_insights', desc: 'Quality trends, common issues, top performers', lastRun: '4 days ago' },
          { name: 'Time & Attendance Audit', type: 'time_audit', desc: 'Detailed time entries with adjustments', lastRun: '6 days ago' },
        ].map((r) => (
          <Card key={r.name} className="border-border/70 shadow-none p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-2">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <Pill tone="muted">{r.type}</Pill>
            </div>
            <h3 className="text-sm font-medium text-foreground">{r.name}</h3>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{r.desc}</p>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Last run {r.lastRun}</span>
              <Button size="sm" variant="ghost" className="h-6 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="h-3 w-3 mr-1" />Generate
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <SectionHeader title="Recent Reports" subtitle="Recently generated report files" />
      <Card className="border-border/70 shadow-none">
        <div className="divide-y divide-border/50">
          {[
            { name: 'ABC Realty — Weekly Performance (Sept 14-20)', client: 'ABC Realty', date: 'Sept 20, 2026', size: '248 KB' },
            { name: 'Sunset Properties — Weekly Performance', client: 'Sunset Properties', date: 'Sept 20, 2026', size: '212 KB' },
            { name: 'VA Productivity — September', client: 'Internal', date: 'Sept 19, 2026', size: '356 KB' },
            { name: 'Coastal Realty — Service Delivery', client: 'Coastal Realty', date: 'Sept 18, 2026', size: '184 KB' },
          ].map((r) => (
            <div key={r.name} className="px-3 py-2.5 flex items-center gap-3 hover:bg-muted/30">
              <FileBarChart className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{r.name}</div>
                <div className="text-[11px] text-muted-foreground">{r.client} · {r.date} · {r.size}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 text-[11px]"><Download className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
