'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pill, EmptyState, LoadingSkeleton, SectionHeader } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { formatRelative, formatDate } from '@/lib/format'
import { FolderOpen, FileText, BookOpen, Download } from 'lucide-react'

export function VADocuments() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data/va-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <Card className="shadow-none"><LoadingSkeleton rows={5} /></Card>

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Documents & SOPs" subtitle="Operating procedures and reference materials" />

      <SectionHeader title="SOPs Assigned to You" subtitle={`${data.sops.length} standard operating procedures`} />
      {data.sops.length === 0 ? <Card className="shadow-none"><EmptyState icon={BookOpen} title="No SOPs assigned" /></Card> :
        <Card className="border-border/70 shadow-none">
          <div className="divide-y divide-border/50">
            {data.sops.map((s: any) => (
              <div key={s.id} className="px-3 py-3 flex items-center gap-3 hover:bg-muted/30">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0"><BookOpen className="h-4 w-4 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{s.title}</div>
                  <div className="text-[10px] text-muted-foreground">{s.category} · Updated {formatDate(s.lastUpdated)}</div>
                </div>
                <Pill tone="muted">{s.version}</Pill>
                <Button size="sm" variant="ghost" className="h-7 text-[11px]">View</Button>
              </div>
            ))}
          </div>
        </Card>
      }

      <SectionHeader title="Reference Documents" subtitle="Files shared by your AVAS team" />
      <Card className="border-border/70 shadow-none">
        <EmptyState icon={FolderOpen} title="No reference documents" description="Documents will appear here when uploaded." />
      </Card>
    </div>
  )
}
