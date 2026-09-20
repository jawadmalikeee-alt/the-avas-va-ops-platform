'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge, Avatar, EmptyState, LoadingSkeleton, Pill, MiniProgress, MetricCard } from '@/components/ui-primitives'
import { Header, FilterBar } from '@/components/views/admin/shared'
import { useViewStore } from '@/stores/view'
import { formatDate } from '@/lib/format'
import { Plus, UserCog, MoreHorizontal, Edit, Trash2, Mail, Phone, Calendar, Briefcase, Star, Clock, ShieldCheck } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AdminVAs() {
  const { setView } = useViewStore()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [detailItem, setDetailItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vas`, { cache: 'no-store' })
      const data = await res.json()
      let filtered = data.items ?? []
      if (q) filtered = filtered.filter((v: any) => v.name.toLowerCase().includes(q.toLowerCase()) || v.email.toLowerCase().includes(q.toLowerCase()) || v.specialization.toLowerCase().includes(q.toLowerCase()))
      if (status) filtered = filtered.filter((v: any) => v.status === status)
      setItems(filtered)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [q, status])

  const openCreate = () => {
    setEditItem(null)
    setForm({
      name: '', email: '', phone: '', password: '',
      specialization: 'Real Estate Virtual Assistant', skills: 'CRM, Lead Gen, Cold Calling',
      employmentType: 'Full-Time', monthlySalary: 1200,
    })
    setOpen(true)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({
      specialization: item.specialization,
      employmentType: item.employmentType ?? 'Full-Time',
      monthlySalary: 1200,
      status: item.status,
      currentStatus: item.currentStatus,
      performanceScore: item.performanceScore,
      qualityScore: item.qualityScore,
    })
    setOpen(true)
  }

  const submit = async () => {
    if (!editItem && (!form.name || !form.email || !form.password)) {
      toast('Please fill all required fields', 'error')
      return
    }
    try {
      const res = await fetch('/api/vas', {
        method: editItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editItem ? { id: editItem.id, ...form } : form),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      toast(editItem ? 'VA updated' : 'VA created', 'success')
      setOpen(false)
      load()
    } catch {
      toast('Something went wrong', 'error')
    }
  }

  const stats = {
    total: items.length,
    working: items.filter((v) => v.currentStatus === 'Working').length,
    onBreak: items.filter((v) => v.currentStatus === 'Break').length,
    offline: items.filter((v) => v.currentStatus === 'Offline').length,
    avgPerf: items.length ? Math.round(items.reduce((s, v) => s + v.performanceScore, 0) / items.length) : 0,
  }

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header
        title="VAs & Agents"
        subtitle={`${items.length} virtual assistants`}
        action={<Button size="sm" className="h-8 bg-navy hover:bg-navy-light" onClick={openCreate}><Plus className="h-3.5 w-3.5 mr-1" />Add VA</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Total VAs" value={stats.total} icon={UserCog} />
        <MetricCard label="Working Now" value={stats.working} icon={Clock} hint="active" />
        <MetricCard label="On Break" value={stats.onBreak} icon={Clock} />
        <MetricCard label="Offline" value={stats.offline} icon={Clock} />
        <MetricCard label="Avg Performance" value={`${stats.avgPerf}%`} icon={Star} />
      </div>

      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} options={['Active', 'On Leave', 'Suspended', 'Terminated']} placeholder="Search by name, specialization, email…" />

      <Card className="card-corporate">
        {loading ? <div className="p-4"><LoadingSkeleton /></div> :
          items.length === 0 ? <EmptyState icon={UserCog} title="No VAs found" description="Add your first VA to get started." action={<Button size="sm" className="h-8 bg-navy hover:bg-navy-light" onClick={openCreate}><Plus className="h-3.5 w-3.5 mr-1" />Add VA</Button>} /> :
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="px-4 py-2.5 border-b border-border grid gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]"
                style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1.2fr 0.8fr 0.5fr' }}>
                <div>VA</div><div>Status</div><div>Assignments</div><div>Performance</div><div>QA Score</div><div>Hired</div><div></div>
              </div>
              <div className="divide-y divide-border/50">
                {items.map((v) => (
                  <div key={v.id} className="px-4 py-3 grid gap-3 items-center hover:bg-muted/30 transition-colors cursor-pointer group"
                    style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1fr 1.2fr 0.8fr 0.5fr' }}
                    onClick={() => setDetailItem(v)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={v.name} src={v.avatarUrl} size="md" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-navy truncate">{v.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{v.specialization}</div>
                      </div>
                    </div>
                    <div><StatusBadge status={v.currentStatus} size="xs" /></div>
                    <div className="text-xs">
                      {v.assignments.length === 0 ? <span className="text-muted-foreground">No assignments</span> :
                        <div className="space-y-0.5">
                          {v.assignments.slice(0, 2).map((a: any, i: number) => (
                            <div key={i} className="truncate">
                              <span className="text-navy">{a.client}</span>
                              <span className="text-muted-foreground"> · {a.role}</span>
                            </div>
                          ))}
                          {v.assignments.length > 2 && <div className="text-[10px] text-muted-foreground">+{v.assignments.length - 2} more</div>}
                        </div>
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tabular-nums text-navy">{v.performanceScore}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-navy" style={{ width: `${v.performanceScore}%` }} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold tabular-nums ${v.qualityScore >= 90 ? 'text-emerald-600' : v.qualityScore >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>{v.qualityScore}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full ${v.qualityScore >= 90 ? 'bg-emerald-500' : v.qualityScore >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${v.qualityScore}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{formatDate(v.hireDate, { month: 'short', year: 'numeric' })}</div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailItem(v)}>View Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(v)}><Edit className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
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

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit VA' : 'Add New VA'}</DialogTitle>
            <DialogDescription>{editItem ? 'Update VA profile and performance metrics.' : 'Onboard a new virtual assistant and create their account.'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {!editItem && <>
              <Field label="Full Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Email *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Password *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />
            </>}
            <div className="col-span-2">
              <Label className="text-[11px] text-muted-foreground">Specialization *</Label>
              <Select value={form.specialization} onValueChange={(v) => setForm({ ...form, specialization: v })}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Real Estate Virtual Assistant', 'Lead Management Specialist', 'CRM & Data Entry Specialist', 'Cold Calling & ISA', 'Social Media & Content', 'Transaction Coordinator', 'Email & Calendar Management', 'CMA & Research Specialist'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!editItem && <div className="col-span-2">
              <Field label="Skills (comma-separated)" value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} />
            </div>}
            <div>
              <Label className="text-[11px] text-muted-foreground">Employment Type</Label>
              <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v })}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Full-Time', 'Part-Time', 'Contract'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Field label="Monthly Salary (USD)" value={String(form.monthlySalary ?? 0)} onChange={(v) => setForm({ ...form, monthlySalary: parseInt(v) || 0 })} type="number" />
            {editItem && <>
              <div>
                <Label className="text-[11px] text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Active', 'On Leave', 'Suspended', 'Terminated'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Current Status</Label>
                <Select value={form.currentStatus} onValueChange={(v) => setForm({ ...form, currentStatus: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Working', 'Break', 'Meeting', 'Training', 'Offline', 'Disconnected'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Performance Score" value={String(form.performanceScore ?? 85)} onChange={(v) => setForm({ ...form, performanceScore: parseFloat(v) || 85 })} type="number" />
              <Field label="Quality Score" value={String(form.qualityScore ?? 90)} onChange={(v) => setForm({ ...form, qualityScore: parseFloat(v) || 90 })} type="number" />
            </>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} className="bg-navy hover:bg-navy-light">{editItem ? 'Save Changes' : 'Create VA'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <VADetailDrawer item={detailItem} onClose={() => setDetailItem(null)} onEdit={(v) => { setDetailItem(null); openEdit(v) }} />
    </div>
  )
}

function VADetailDrawer({ item, onClose, onEdit }: { item: any; onClose: () => void; onEdit: (v: any) => void }) {
  if (!item) return null
  return (
    <Sheet open={!!item} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <Avatar name={item.name} src={item.avatarUrl} size="lg" />
            <div>
              <div className="text-base font-semibold text-navy">{item.name}</div>
              <div className="text-xs text-muted-foreground font-normal">{item.specialization}</div>
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={item.currentStatus} size="sm" />
            <Pill tone="muted">{item.employmentType ?? 'Full-Time'}</Pill>
            <Pill tone="gold">Hired {formatDate(item.hireDate, { month: 'short', year: 'numeric' })}</Pill>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <DetailStat label="Performance" value={`${item.performanceScore}%`} tone="default" />
            <DetailStat label="Quality" value={`${item.qualityScore}%`} tone={item.qualityScore >= 90 ? 'success' : 'warning'} />
            <DetailStat label="Attendance" value={`${item.attendanceScore}%`} tone="default" />
          </div>

          {item.assignments.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Client Assignments</div>
              <div className="space-y-2">
                {item.assignments.map((a: any, i: number) => (
                  <div key={i} className="rounded-md border border-border bg-muted/20 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-navy">{a.client}</span>
                      <Pill tone="muted">{a.weeklyHours}h/wk</Pill>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{a.role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(item)}><Edit className="h-3.5 w-3.5 mr-1.5" />Edit VA</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailStat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' }) {
  const color = tone === 'success' ? 'text-emerald-600' : tone === 'warning' ? 'text-amber-600' : 'text-navy'
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</div>
      <div className={`text-base font-bold mt-1 tabular-nums ${color}`}>{value}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-9 text-sm" />
    </div>
  )
}
