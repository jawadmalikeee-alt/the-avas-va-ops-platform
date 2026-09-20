'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge, EmptyState, LoadingSkeleton, Pill, MiniProgress } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { useViewStore } from '@/stores/view'
import { formatDate, formatDuration } from '@/lib/format'
import { Plus, ListTodo } from 'lucide-react'

export function ClientTasks() {
  const { setView } = useViewStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data/client-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  // Fetch client's tasks
  const [tasks, setTasks] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/tasks/list', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setTasks(d.items ?? []))
      .catch(() => {})
  }, [])

  const visible = data?.visibility?.canSeeTaskDetails
  const taskStatuses = ['To Do', 'In Progress', 'Review', 'Completed', 'Rejected']

  if (loading) return <Card className="shadow-none"><LoadingSkeleton rows={6} /></Card>

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Tasks" subtitle="Work being done for your account" action={<Button size="sm" className="h-8" onClick={() => setView('requests')}><Plus className="h-3.5 w-3.5 mr-1" />Request Task</Button>} />

      {/* Kanban-style board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {taskStatuses.map((s) => {
          const colTasks = tasks.filter((t) => t.status === s)
          return (
            <Card key={s} className="border-border/70 shadow-none p-3 min-h-[200px]">
              <div className="flex items-center justify-between mb-2">
                <StatusBadge status={s} size="xs" />
                <span className="text-[10px] text-muted-foreground tabular-nums">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="rounded-md border border-border/60 p-2 hover:bg-muted/30 cursor-pointer">
                    <div className="text-xs font-medium text-foreground truncate">{t.title}</div>
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">{t.service}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <StatusBadge status={t.priority} size="xs" />
                      <span className="text-[10px] text-muted-foreground">{formatDuration(t.timeSpentMs)}</span>
                    </div>
                    {t.progress > 0 && t.progress < 100 && (
                      <div className="mt-1.5"><MiniProgress value={t.progress} /></div>
                    )}
                  </div>
                ))}
                {colTasks.length === 0 && <div className="text-[10px] text-muted-foreground/60 text-center py-4">No tasks</div>}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
