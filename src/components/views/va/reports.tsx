'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SectionHeader, EmptyState, Pill } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { Download, FileBarChart, Calendar } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'

export function VAReports() {
  const reports = [
    { name: 'Weekly Timesheet — Sept 14-20', period: 'Sept 14-20, 2026', hours: '38h 42m', status: 'Generated' },
    { name: 'Weekly Timesheet — Sept 7-13', period: 'Sept 7-13, 2026', hours: '40h 15m', status: 'Generated' },
    { name: 'Monthly Summary — August 2026', period: 'August 2026', hours: '162h 30m', status: 'Generated' },
    { name: 'Monthly Summary — July 2026', period: 'July 2026', hours: '168h 12m', status: 'Generated' },
  ]
  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Reports" subtitle="Your personal timesheets and performance summaries" />
      <Card className="border-border/70 shadow-none">
        <div className="divide-y divide-border/50">
          {reports.map((r) => (
            <div key={r.name} className="px-3 py-3 flex items-center gap-3 hover:bg-muted/30">
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">{r.name}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                  <Calendar className="h-3 w-3" />{r.period} · {r.hours}
                </div>
              </div>
              <Pill tone="success">{r.status}</Pill>
              <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => toast('Downloading timesheet…', 'success')}><Download className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
