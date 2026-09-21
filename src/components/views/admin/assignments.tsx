'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge, Avatar, EmptyState, LoadingSkeleton, Pill, MetricCard } from '@/components/ui-primitives'
import { Header, FilterBar } from '@/components/views/admin/shared'
import { formatDate } from '@/lib/format'
import { Plus, GitBranch, MoreHorizontal, Edit, Trash2, Clock, User } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AdminAssignments() {
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
        fetch('/api/assignments', { cache: 'no-store' }),
        fetch('/api/clients', { cache: 'no-store' }),
        fetch('/api/vas', { cache: 'no-store' }),
      ])
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()])
      let filtered = d1.items ?? []
      if (q) filtered = filtered.filter((a: any) => a.client.toLowerCase().includes(q.toLowerCase()) || a.va.toLowerCase().includes(q.toLowerCase()) || a.role.toLowerCase().includes(q.toLowerCase()))
      if (status) filtered = filtered.filter((a: any) => a.status === status)
      setItems(filtered)
      setClients(d2.items ?? [])
      setVAs(d3.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [q, status])

  const openCreate = () => {
    setEditItem(null)
    setForm({ clientId: '', vaId: '', role: 'Lead Management VA', weeklyHours: 40, schedule: 'Mon-Fri 9:00 AM - 6:00 PM PKT' })
    setOpen(true)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({ id: item.id, role: item.role, weeklyHours: item.weeklyHours, schedule: item.schedule, status: item.status })
    setOpen(true)
  }

  const submit = async () => {
    if (!editItem && (!form.clientId || !form.vaId || !form.role)) {
      toast('Please select client, VA, and role', 'error')
      return
    }
    try {
      const res = await fetch('/api/assignments', {
        method: editItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editItem ? form : form),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      toast(editItem ? 'Assignment updated' : 'VA assigned successfully', 'success')
      setOpen(false)
      load()
    } catch {
      toast('Something went wrong', 'error')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('End this assignment? The VA will no longer be assigned to this client.')) return
    try {
      const res = await fetch(`/api/assignments?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Failed', 'error'); return }
      toast('Assignment ended', 'success')
      load()
    } catch {
      toast('Failed', 'error')
    }
  }

  const stats = {
    total: items.length,
    active: items.filter((a) => a.status === 'Active').length,
    totalHours: items.filter((a) => a.status === 'Active').reduce((s, a) => s + a.weeklyHours, 0),
    multiClientVAs: new Set(items.filter((a) => a.status === 'Active').map((a) => a.vaId)).size,
  }

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header
        title="Assignments"
        subtitle="Assign VAs to clients with custom schedules"
        action={<Button size="sm" className="h-8 bg-navy hover:bg-navy-light" onClick={openCreate}><Plus className="h-3.5 w-3.5 mr-1" />Assign VA</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Assignments" value={stats.total} icon={GitBranch} />
        <MetricCard label="Active" value={stats.active} icon={GitBranch} hint="in progress" />
        <MetricCard label="Weekly Hours" value={`${stats.totalHours}h`} icon={Clock} hint="across all VAs" />
        <MetricCard label="Active VAs" value={stats.multiClientVAs} icon={User} hint="working" />
      </div>

      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} options={['Active', 'Paused', 'Ended']} placeholder="Search assignments…" />

      <Card className="card-corporate">
        {loading ? <div className="p-4"><LoadingSkeleton /></div> :
          items.length === 0 ? <EmptyState icon={GitBranch} title="No assignments yet" description="Assign a VA to a client to begin operations." action={<Button size="sm" className="h-8 bg-navy hover:bg-navy-light" onClick={openCreate}><Plus className="h-3.5 w-3.5 mr-1" />Assign VA</Button>} /> :
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="px-4 py-2.5 border-b border-border grid gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]"
                style={{ gridTemplateColumns: '1.5fr 1.5fr 1.5fr 0.8fr 1.2fr 1fr 0.5fr' }}>
                <div>Client</div><div>VA</div><div>Role</div><div>Hours/wk</div><div>Schedule</div><div>Status</div><div></div>
              </div>
              <div className="divide-y divide-border/50">
                {items.map((a) => (
                  <div key={a.id} className="px-4 py-3 grid gap-3 items-center hover:bg-muted/30 transition-colors group"
                    style={{ gridTemplateColumns: '1.5fr 1.5fr 1.5fr 0.8fr 1.2fr 1fr 0.5fr' }}
                  >
                    <div className="text-sm font-semibold text-navy truncate">{a.client}</div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={a.va} src={a.vaAvatar} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-navy truncate">{a.va}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{a.vaSpecialization}</div>
                      </div>
                    </div>
                    <div className="text-xs text-foreground truncate">{a.role}</div>
                    <div className="text-xs tabular-nums font-medium text-navy">{a.weeklyHours}h</div>
                    <div className="text-[11px] text-muted-foreground truncate">{a.schedule}</div>
                    <div><StatusBadge status={a.status} size="xs" /></div>
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(a)}><Edit className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => remove(a.id)} className="text-rose-600"><Trash2 className="h-3.5 w-3.5 mr-2" />End Assignment</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Assignment' : 'Assign VA to Client'}</DialogTitle>
            <DialogDescription>{editItem ? 'Update assignment details.' : 'Create a new VA assignment. The VA will be notified immediately.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {!editItem && <>
              <div>
                <Label className="text-[11px] text-muted-foreground">Client *</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select client…" /></SelectTrigger>
                  <SelectContent>
                    {clients.filter((c) => c.contractStatus === 'Active').map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Virtual Assistant *</Label>
                <Select value={form.vaId} onValueChange={(v) => setForm({ ...form, vaId: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select VA…" /></SelectTrigger>
                  <SelectContent>
                    {vas.filter((v) => v.status === 'Active').map((v) => <SelectItem key={v.id} value={v.id}>{v.name} — {v.specialization}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>}
            <div>
              <Label className="text-[11px] text-muted-foreground">Role / Title *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Lead Management VA', 'Lead Follow-Up VA', 'CRM Management VA', 'Cold Calling VA', 'Social Media VA', 'Transaction Coordinator', 'Email & Calendar VA', 'CMA & Research VA', 'Appointment Setter', 'ISA (Inside Sales Agent)', 'Account Manager', 'Account Lead', 'Other'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {form.role === 'Other' && (
                <div className="mt-2">
                  <Label className="text-[11px] text-muted-foreground">Custom Role Name</Label>
                  <Input value={form.customRole ?? ''} onChange={(e) => setForm({ ...form, customRole: e.target.value, role: e.target.value })} placeholder="Enter custom role name" className="mt-1 h-9 text-sm" />
                </div>
              )}
              {form.role === 'Other' && (
                <div className="mt-2">
                  <Label className="text-[11px] text-muted-foreground">Role Description</Label>
                  <Input value={form.roleDescription ?? ''} onChange={(e) => setForm({ ...form, roleDescription: e.target.value })} placeholder="Describe this role's responsibilities" className="mt-1 h-9 text-sm" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">Weekly Hours</Label>
                <Input type="number" value={String(form.weeklyHours ?? 40)} onChange={(e) => setForm({ ...form, weeklyHours: parseInt(e.target.value) || 40 })} className="mt-1 h-9 text-sm" />
              </div>
              {editItem && <div>
                <Label className="text-[11px] text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Active', 'Paused', 'Ended'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Schedule</Label>
              <Input value={form.schedule ?? ''} onChange={(e) => setForm({ ...form, schedule: e.target.value })} className="mt-1 h-9 text-sm" placeholder="Mon-Fri 9:00 AM - 6:00 PM PKT" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} className="bg-navy hover:bg-navy-light">{editItem ? 'Save Changes' : 'Assign VA'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
