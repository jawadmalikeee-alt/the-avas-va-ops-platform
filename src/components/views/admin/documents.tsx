'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pill, EmptyState, LoadingSkeleton, SectionHeader } from '@/components/ui-primitives'
import { Header, FilterBar, DataTable } from '@/components/views/admin/clients'
import { formatRelative } from '@/lib/format'
import { FolderOpen, Upload, Lock, FileText, FileImage, FileSpreadsheet } from 'lucide-react'

const CATS = ['All', 'Contracts', 'SOPs', 'Brand Assets', 'Credentials', 'Reports', 'Deliverables', 'Training']

export function AdminDocuments() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/data/admin-list?type=documents', { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = cat === 'All' ? items : items.filter((i) => i.category === cat)

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Documents" subtitle={`${items.length} documents across all clients`} action={<Button size="sm" className="h-8"><Upload className="h-3.5 w-3.5 mr-1" />Upload</Button>} />
      <div className="flex items-center gap-1.5 flex-wrap">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-2 py-1 rounded-md text-[11px] font-medium ${cat === c ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{c}</button>
        ))}
      </div>
      <Card className="border-border/70 shadow-none">
        {loading ? <LoadingSkeleton /> :
          filtered.length === 0 ? <EmptyState icon={FolderOpen} title="No documents" /> :
          <DataTable
            columns={[
              { key: 'name', header: 'Document', render: (r) => (
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon name={r.fileName} />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate flex items-center gap-1">
                      {r.title}
                      {r.isSensitive && <Lock className="h-3 w-3 text-amber-500" />}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{r.fileName} · {Math.round((r.fileSize ?? 0) / 1024)} KB</div>
                  </div>
                </div>
              ) },
              { key: 'category', header: 'Category', render: (r) => <Pill tone="muted">{r.category}</Pill> },
              { key: 'client', header: 'Client', render: (r) => <div className="text-xs">{r.client}</div> },
              { key: 'uploaded', header: 'Uploaded', render: (r) => <div className="text-[11px] text-muted-foreground">{formatRelative(r.uploadedAt)}</div> },
              { key: 'actions', header: '', render: () => <Button size="sm" variant="ghost" className="h-7 text-[11px]">View</Button> },
            ]}
            rows={filtered}
          />
        }
      </Card>
    </div>
  )
}

function FileIcon({ name }: { name: string }) {
  const ext = name?.split('.').pop()?.toLowerCase()
  const Icon = ext === 'pdf' ? FileText : ext === 'xls' || ext === 'xlsx' || ext === 'csv' ? FileSpreadsheet : ext === 'png' || ext === 'jpg' || ext === 'jpeg' ? FileImage : FileText
  return <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
}
