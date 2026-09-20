'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge, EmptyState, LoadingSkeleton, Pill, MiniProgress, MetricCard } from '@/components/ui-primitives'
import { Header, FilterBar } from '@/components/views/admin/shared'
import { formatDate, formatDuration, priorityRank } from '@/lib/format'
import { Plus, ListTodo, MoreHorizontal, Edit, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AdminTasks() {
  const [items, setItems] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [vas, setVAs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  const load = async () => {
    setLoading(true)
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch('/api/data/admin-list?type=tasks', { cache: 'no-store' }),
        fetch('/api/clients', { cache: 'no-store' }),
        fetch('/api/vas', { cache: 'no-store' }),
      ])
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()])
      setItems(d1.items ?? [])
      setClients(d2.items ?? [])
      setVAs(d3.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = items.filter((t) => {
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false
    if (status && t.status !== status) return false
    return true
  }).sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))

  const openCreate = () => {
    setEditItem(null)
    setForm({
      title: '', description: '', clientId: '', vaId: '',
      service: 'Lead Management', priority: 'Medium', dueDate: '',
    })
    setOpen(true)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({
      id: item.id, title: item.title, description: item.description ?? '',
      clientId: item.clientId ?? '', vaId: item.vaId ?? '',
      service: item.service ?? 'Lead Management', priority: item.priority,
      status: item.status, dueDate: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : '',
    })
    setOpen(true)
  }

  const submit = async () => {
    if (!form.title) { toast('Title is required', 'error'); return }
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editItem
          ? { action: 'update', taskId: editItem.id, status: form.status }
          : { action: 'create', ...form, dueDate: form.dueDate || undefined }
        ),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      toast(editItem ? 'Task updated' : 'Task created & VA notified', 'success')
      setOpen(false)
      load()
    } catch {
      toast('Something went wrong', 'error')
    }
  }

  const updateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', taskId, status: newStatus }),
      })
      if (!res.ok) { toast('Failed', 'error'); return }
      toast(`Task marked as ${newStatus}`, 'success')
      load()
    } catch {
      toast('Failed', 'error')
    }
  }

  const stats = {
    total: items.length,
    todo: items.filter((t) => t.status === 'To Do').length,
    inProgress: items.filter((t) => t.status === 'In Progress').length,
    completed: items.filter((t) => t.status === 'Completed').length,
  }

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header
        title="Tasks & Projects"
        subtitle={`${items.length} tasks across all clients`}
        action={<Button size="sm" className="h-8 bg-navy hover:bg-navy-light" onClick={openCreate}><Plus className="h-3.5 w-3.5 mr-1" />Create Task</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Tasks" value={stats.total} icon={ListTodo} />
        <MetricCard label="To Do" value={stats.todo} icon={Clock} hint="queued" />
        <MetricCard label="In Progress" value={stats.inProgress} icon={Loader2} hint="active" />
        <MetricCard label="Completed" value={stats.completed} icon={CheckCircle2} hint="this period" />
      </div>

      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} options={['To Do', 'In Progress', 'Review', 'Completed', 'Rejected']} placeholder="Search tasks…" />

      <Card className="card-corporate">
        {loading ? <div className="p-4"><LoadingSkeleton /></div> :
          filtered.length === 0 ? <EmptyState icon={ListTodo} title="No tasks" description="Create a task to assign work to a VA." action={<Button size="sm" className="h-8 bg-navy hover:bg-navy-light" onClick={openCreate}><Plus className="h-3.5 w-3.5 mr-1" />Create Task</Button>} /> :
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              <div className="px-4 py-2.5 border-b border-border grid gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]"
                style={{ gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 1fr 1.2fr 1fr 1fr 0.5fr' }}>
                <div>Task</div><div>Client / VA</div><div>Priority</div><div>Status</div><div>Progress</div><div>Time</div><div>Due</div><div>QA</div><div></div>
              </div>
              <div className="divide-y divide-border/50">
                {filtered.map((t) => (
                  <div key={t.id} className="px-4 py-3 grid gap-3 items-center hover:bg-muted/30 transition-colors group"
                    style={{ gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 1fr 1.2fr 1fr 1fr 0.5fr' }}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-navy truncate">{t.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{t.service ?? 'General'}</div>
                    </div>
                    <div className="text-xs min-w-0">
                      <div className="text-navy truncate">{t.client}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{t.va}</div>
                    </div>
                    <div><StatusBadge status={t.priority} size="xs" /></div>
                    <div><StatusBadge status={t.status} size="xs" /></div>
                    <div className="w-20">
                      <div className="text-[10px] text-muted-foreground mb-0.5 tabular-nums">{t.progress}%</div>
                      <MiniProgress value={t.progress} tone={t.progress === 100 ? 'success' : 'default'} />
                    </div>
                    <div className="text-[11px] tabular-nums text-muted-foreground">{formatDuration(t.timeSpentMs)}</div>
                    <div className="text-[11px] text-muted-foreground">{t.dueDate ? formatDate(t.dueDate, { month: 'short', day: 'numeric' }) : '—'}</div>
                    <div>{t.qaStatus ? <Pill tone={t.qaStatus === 'Pass' ? 'success' : t.qaStatus === 'Fail' ? 'danger' : 'warning'}>{t.qaStatus}</Pill> : <span className="text-[10px] text-muted-foreground">—</span>}</div>
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(t)}><Edit className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                          {t.status !== 'In Progress' && <DropdownMenuItem onClick={() => updateStatus(t.id, 'In Progress')}>Mark In Progress</DropdownMenuItem>}
                          {t.status !== 'Review' && <DropdownMenuItem onClick={() => updateStatus(t.id, 'Review')}>Mark for Review</DropdownMenuItem>}
                          {t.status !== 'Completed' && <DropdownMenuItem onClick={() => updateStatus(t.id, 'Completed')}><CheckCircle2 className="h-3.5 w-3.5 mr-2" />Mark Completed</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>{editItem ? 'Update task status and details.' : 'Create a task and assign it to a VA. They will be notified instantly.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Task Title *</Label>
              <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 h-9 text-sm" placeholder="e.g. Update CRM with today's new leads" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Description</Label>
              <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 text-sm" rows={3} placeholder="Provide details, scope, and any instructions…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">Client</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select client…" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Assign VA</Label>
                <Select value={form.vaId} onValueChange={(v) => setForm({ ...form, vaId: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select VA…" /></SelectTrigger>
                  <SelectContent>
                    {vas.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Service</Label>
                <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Lead Management', 'Lead Follow-Up', 'CRM Management', 'MLS Data Entry', 'Social Media Management', 'CMA Preparation', 'Email Management', 'Cold Calling', 'Appointment Setting', 'Transaction Coordination', 'Data Entry', 'Research'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Urgent', 'High', 'Medium', 'Low'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {editItem && <div>
                <Label className="text-[11px] text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['To Do', 'In Progress', 'Review', 'Completed', 'Rejected'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}
              <div>
                <Label className="text-[11px] text-muted-foreground">Due Date</Label>
                <Input type="date" value={form.dueDate ?? ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="mt-1 h-9 text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} className="bg-navy hover:bg-navy-light">{editItem ? 'Save Changes' : 'Create & Assign'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
