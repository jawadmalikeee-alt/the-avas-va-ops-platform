'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge, Pill, EmptyState, LoadingSkeleton, MetricCard } from '@/components/ui-primitives'
import { Header, FilterBar } from '@/components/views/admin/shared'
import { formatDate, formatRelative } from '@/lib/format'
import { Send, CheckCircle2, X, UserCog, Clock, AlertCircle, FileText } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'

const STATUS_FILTERS = ['Open', 'In Progress', 'Waiting', 'Resolved', 'Closed']

export function AdminRequests() {
  const [items, setItems] = useState<any[]>([])
  const [vas, setVAs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('Open')
  const [assignDialog, setAssignDialog] = useState<any>(null)
  const [selectedVA, setSelectedVA] = useState('')
  const [assigning, setAssigning] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/tickets/list', { cache: 'no-store' }),
        fetch('/api/vas', { cache: 'no-store' }),
      ])
      const [d1, d2] = await Promise.all([r1.json(), r2.json()])
      let filtered = d1.items ?? []
      if (q) filtered = filtered.filter((t: any) => t.title.toLowerCase().includes(q.toLowerCase()) || t.client.toLowerCase().includes(q.toLowerCase()))
      if (status) filtered = filtered.filter((t: any) => t.status === status)
      setItems(filtered)
      setVAs(d2.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [q, status])

  const acceptAndAssign = async () => {
    if (!assignDialog || !selectedVA) { toast('Select a VA to assign', 'error'); return }
    setAssigning(true)
    try {
      // Update ticket status to In Progress
      await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignDialog.id, status: 'In Progress' }),
      })

      // Create a task from the ticket and assign to VA
      const va = vas.find((v) => v.id === selectedVA)
      const ticket = assignDialog
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          title: ticket.title,
          description: ticket.description || `Task from ${ticket.ticketId}`,
          clientId: ticket.clientId,
          vaId: selectedVA,
          service: ticket.type === 'Urgent Request' ? 'Lead Management' : 'Administrative Support',
          priority: ticket.priority,
          dueDate: ticket.dueDate,
        }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed to create task', 'error'); return }

      toast(`Request accepted and assigned to ${va?.name}`, 'success')
      setAssignDialog(null)
      setSelectedVA('')
      load()
    } catch {
      toast('Failed to assign', 'error')
    } finally { setAssigning(false) }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      toast(`Request marked as ${newStatus}`, 'success')
      load()
    } catch {
      toast('Failed', 'error')
    }
  }

  const stats = {
    total: items.length,
    open: items.filter((t) => t.status === 'Open').length,
    inProgress: items.filter((t) => t.status === 'In Progress').length,
    resolved: items.filter((t) => t.status === 'Resolved').length,
  }

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Client Requests" subtitle="Accept and assign client requests to VAs" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total" value={stats.total} icon={Send} />
        <MetricCard label="Open" value={stats.open} icon={AlertCircle} hint="needs action" />
        <MetricCard label="In Progress" value={stats.inProgress} icon={Clock} hint="assigned" />
        <MetricCard label="Resolved" value={stats.resolved} icon={CheckCircle2} hint="completed" />
      </div>

      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} options={STATUS_FILTERS} placeholder="Search requests…" />

      <Card className="rounded-2xl border-border shadow-apple p-0 overflow-hidden">
        {loading ? <div className="p-4"><LoadingSkeleton rows={4} /></div> :
          items.length === 0 ? <EmptyState icon={Send} title="No requests" description="Client requests will appear here." /> :
          <div className="divide-y divide-border/50">
            {items.map((t) => (
              <div key={t.id} className="px-4 py-3 hover:bg-muted/30 group">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill tone="muted">{t.ticketId}</Pill>
                      <StatusBadge status={t.priority} size="xs" />
                      <StatusBadge status={t.status} size="xs" />
                    </div>
                    <div className="text-sm font-bold text-foreground">{t.title}</div>
                    <div className="text-xs text-foreground/60 mt-0.5 font-medium">
                      {t.client} · {t.type} · {formatRelative(t.createdAt)}
                    </div>
                    {t.description && (
                      <div className="text-xs text-foreground/70 mt-1 line-clamp-2">{t.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {t.status === 'Open' && (
                      <Button size="sm" className="h-8 rounded-full bg-avas-blue hover:bg-avas-blue-light text-xs" onClick={() => { setAssignDialog(t); setSelectedVA('') }}>
                        <UserCog className="h-3.5 w-3.5 mr-1" />Accept & Assign
                      </Button>
                    )}
                    {t.status === 'In Progress' && (
                      <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={() => updateStatus(t.id, 'Resolved')}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Resolve
                      </Button>
                    )}
                    {t.status === 'Resolved' && (
                      <Button size="sm" variant="ghost" className="h-8 rounded-full text-xs" onClick={() => updateStatus(t.id, 'Closed')}>
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      </Card>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={(v) => !v && setAssignDialog(null)}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCog className="h-5 w-5 text-avas-blue" />Accept & Assign Request</DialogTitle>
            <DialogDescription>
              Accept this request from <strong>{assignDialog?.client}</strong> and assign it to a VA. A task will be created automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl bg-muted/30 p-3">
              <div className="text-sm font-bold text-foreground">{assignDialog?.title}</div>
              <div className="text-xs text-foreground/60 mt-1">{assignDialog?.description}</div>
              <div className="flex items-center gap-2 mt-2">
                <Pill tone="muted">{assignDialog?.ticketId}</Pill>
                <StatusBadge status={assignDialog?.priority ?? 'Medium'} size="xs" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-foreground/60 mb-1.5 block">Assign to VA *</label>
              <Select value={selectedVA} onValueChange={setSelectedVA}>
                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select a VA…" /></SelectTrigger>
                <SelectContent>
                  {vas.filter((v) => v.status === 'Active').map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name} — {v.specialization}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>Cancel</Button>
            <Button onClick={acceptAndAssign} disabled={assigning || !selectedVA} className="bg-avas-blue hover:bg-avas-blue-light">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {assigning ? 'Assigning…' : 'Accept & Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
