'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function Header({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-navy">{title}</h1>
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
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="pl-8 h-9 text-xs" />
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => setStatus('')} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${!status ? 'bg-navy text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>All</button>
        {options.map((o) => (
          <button key={o} onClick={() => setStatus(o)} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${status === o ? 'bg-navy text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{o}</button>
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
        <div className="px-4 py-2.5 border-b border-border grid gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((c) => <div key={c.key}>{c.header}</div>)}
        </div>
        <div className="divide-y divide-border/50">
          {rows.map((r, i) => (
            <button
              key={r.id ?? i}
              onClick={() => onRowClick?.(r)}
              className="w-full px-4 py-3 grid gap-3 items-center text-left hover:bg-muted/30 transition-colors"
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
