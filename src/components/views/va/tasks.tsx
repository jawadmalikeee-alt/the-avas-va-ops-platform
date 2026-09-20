'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, EmptyState, LoadingSkeleton, Pill, MiniProgress } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { formatDuration, formatDate, formatTime } from '@/lib/format'
import { toast } from '@/components/ui-primitives/toast'
import { Play, Pause, CheckCircle2, FileCheck, ChevronRight } from 'lucide-react'
import { useViewStore } from '@/stores/view'

export function VATasks() {
  const { setView } = useViewStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/data/va-dashboard', { cache: 'no-store' })
      const d = await res.json()
      setData(d)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const updateTask = async (taskId: string, status: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', taskId, status }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      toast(`Task marked as ${status}`, 'success')
      load()
    } catch { toast('Failed to update task', 'error') }
  }

  if (loading || !data) return <Card className="shadow-none"><LoadingSkeleton rows={6} /></Card>

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="My Tasks" subtitle={`${data.tasks.length} active tasks`} action={<Button size="sm" variant="outline" className="h-8" onClick={() => setView('submission')}><FileCheck className="h-3.5 w-3.5 mr-1" />Submit Work</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {['To Do', 'In Progress', 'Review'].map((s) => {
          const col = data.tasks.filter((t: any) => t.status === s)
          return (
            <Card key={s} className="border-border/70 shadow-none p-3 min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <StatusBadge status={s} size="xs" />
                <span className="text-[10px] text-muted-foreground tabular-nums">{col.length}</span>
              </div>
              <div className="space-y-2">
                {col.length === 0 ? <div className="text-[10px] text-muted-foreground/60 text-center py-6">No tasks</div> :
                  col.map((t: any) => (
                    <div key={t.id} className="rounded-md border border-border/60 p-2.5 hover:bg-muted/30">
                      <div className="text-xs font-medium text-foreground">{t.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{t.client} · {t.service ?? 'General'}</div>
                      <div className="flex items-center justify-between mt-1.5">
                        <StatusBadge status={t.priority} size="xs" />
                        <span className="text-[10px] text-muted-foreground">{formatDuration(t.timeSpentMs)}</span>
                      </div>
                      {t.dueDate && <div className="text-[10px] text-muted-foreground mt-1">Due {formatDate(t.dueDate, { month: 'short', day: 'numeric' })}</div>}
                      {t.progress > 0 && t.progress < 100 && <div className="mt-1.5"><MiniProgress value={t.progress} /></div>}
                      <div className="mt-2 flex items-center gap-1">
                        {s === 'To Do' && (
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => updateTask(t.id, 'In Progress')}><Play className="h-3 w-3 mr-1" />Start</Button>
                        )}
                        {s === 'In Progress' && (
                          <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => updateTask(t.id, 'Review')}><CheckCircle2 className="h-3 w-3 mr-1" />Mark Done</Button>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
