'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, Avatar, SectionHeader, EmptyState, LoadingSkeleton, MiniProgress, MetricCard } from '@/components/ui-primitives'
import { useViewStore } from '@/stores/view'
import { formatDuration, formatTimer, formatTime, formatRelative } from '@/lib/format'
import { Radio, Activity, Clock, Filter, Search } from 'lucide-react'

interface LiveVA {
  id: string
  name: string
  avatarUrl: string | null
  specialization: string
  status: string
  clockIn: string | null
  currentTask: string | null
  elapsedTime: number
  todayHours: number
  performanceScore: number
  qaStatus: string
  primaryClient: string
  primaryAssignment: string
}

export function AdminLiveOps() {
  const { setView } = useViewStore()
  const [vas, setVAs] = useState<LiveVA[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/data/admin-dashboard', { cache: 'no-store' })
        const d = await res.json()
        setVAs(d.liveOps ?? [])
      } finally {
        setLoading(false)
      }
    }
    load()
    const i = setInterval(load, 15000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const filtered = vas.filter((v) => filter === 'all' || v.status.toLowerCase() === filter)

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-display tracking-tight text-navy">Live Operations</h1>
          <span className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-500 px-3 py-1.5 rounded-full live-glow text-white shadow-apple">
            <span className="h-2 w-2 rounded-full bg-white live-pulse" />
            {filtered.filter((v) => v.status === 'Working').length} LIVE
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Real-time view of all active VAs and their current work.</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'working', 'break', 'meeting'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
        <div className="ml-auto text-xs text-muted-foreground">Updated {formatTime(new Date())}</div>
      </div>

      {loading ? (
        <Card className="shadow-none"><LoadingSkeleton rows={6} /></Card>
      ) : filtered.length === 0 ? (
        <Card className="shadow-none"><EmptyState icon={Activity} title="No active VAs" description="No virtual assistants are currently on shift." /></Card>
      ) : (
        <Card className="border-border/70 shadow-none">
          <div className="px-3 py-2 border-b border-border grid grid-cols-12 gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider hidden md:grid">
            <div className="col-span-3">VA</div>
            <div className="col-span-2">Client</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-3">Current Task</div>
            <div className="col-span-1">Elapsed</div>
            <div className="col-span-1">Today</div>
            <div className="col-span-1 text-right">QA</div>
          </div>
          <div className="divide-y divide-border/50">
            {filtered.map((va) => (
              <button
                key={va.id}
                onClick={() => setView('vas')}
                className="w-full px-3 py-3 grid grid-cols-2 md:grid-cols-12 gap-2 items-center text-left hover:bg-muted/40 transition-colors"
              >
                <div className="col-span-2 md:col-span-3 flex items-center gap-2 min-w-0">
                  <Avatar name={va.name} src={va.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{va.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{va.specialization}</div>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 text-xs">
                  <div className="font-medium text-foreground truncate">{va.primaryClient}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{va.primaryAssignment}</div>
                </div>
                <div className="col-span-1 hidden md:block"><StatusBadge status={va.status} size="xs" /></div>
                <div className="col-span-2 md:col-span-3 text-xs text-foreground truncate">{va.currentTask ?? '—'}</div>
                <div className="col-span-1 hidden md:block text-xs font-mono tabular-nums text-muted-foreground">{formatTimer(va.elapsedTime)}</div>
                <div className="col-span-1 hidden md:block text-xs tabular-nums text-muted-foreground">{formatDuration(va.todayHours)}</div>
                <div className="col-span-1 hidden md:block text-right">
                  <StatusBadge status={va.qaStatus === 'Good' ? 'Pass' : va.qaStatus === 'Watch' ? 'Pending' : 'Fail'} size="xs" label={va.qaStatus} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
