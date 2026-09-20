'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState, LoadingSkeleton } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { formatRelative } from '@/lib/format'
import { Bell, CheckCircle2, AlertTriangle, Info, ShieldCheck } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'

export function AdminNotifications() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const markAll = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
    toast('All notifications marked as read', 'success')
    load()
  }

  const groups: Record<string, any[]> = { Today: [], Yesterday: [], Earlier: [] }
  items.forEach((i) => {
    const d = new Date(i.createdAt)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const yest = new Date(today); yest.setDate(yest.getDate() - 1)
    if (d >= today) groups.Today.push(i)
    else if (d >= yest) groups.Yesterday.push(i)
    else groups.Earlier.push(i)
  })

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Notifications" subtitle={`${items.filter((i) => !i.read).length} unread`} action={<Button size="sm" variant="outline" className="h-8" onClick={markAll}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Mark all read</Button>} />
      {loading ? <Card className="shadow-none"><LoadingSkeleton rows={6} /></Card> :
        items.length === 0 ? <Card className="shadow-none"><EmptyState icon={Bell} title="No notifications" description="You're all caught up." /></Card> :
        <div className="space-y-4">
          {Object.entries(groups).map(([k, v]) => v.length === 0 ? null : (
            <div key={k}>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2 px-1">{k}</div>
              <Card className="border-border/70 shadow-none">
                <div className="divide-y divide-border/50">
                  {v.map((n) => (
                    <div key={n.id} className={`px-3 py-3 flex items-start gap-2.5 ${!n.read ? 'bg-blue-50/30' : ''}`}>
                      <NotifIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{n.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                        <div className="text-[10px] text-muted-foreground/70 mt-1">{formatRelative(n.createdAt)}</div>
                      </div>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      }
    </div>
  )
}

function NotifIcon({ type }: { type: string }) {
  const Icon = type.includes('qa') ? ShieldCheck : type.includes('urgent') || type.includes('late') ? AlertTriangle : type.includes('completed') ? CheckCircle2 : Info
  const color = type.includes('urgent') || type.includes('late') ? 'text-rose-500' : type.includes('completed') ? 'text-emerald-500' : 'text-blue-500'
  return <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0"><Icon className={`h-3.5 w-3.5 ${color}`} /></div>
}
