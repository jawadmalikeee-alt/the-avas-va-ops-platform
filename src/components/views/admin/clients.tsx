'use client'

// Re-export shared components for backward compat
export { Header, FilterBar, DataTable } from '@/components/views/admin/shared'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge, Avatar, SectionHeader, EmptyState, LoadingSkeleton, Pill } from '@/components/ui-primitives'
import { Header, FilterBar } from '@/components/views/admin/clients'
import { formatDate } from '@/lib/format'
import { Plus, Users, MoreHorizontal, ChevronRight, Building2, Mail, Phone, Globe, Calendar, Package, Trash2, Edit, X } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AdminClients() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('Active')
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [detailItem, setDetailItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clients`, { cache: 'no-store' })
      const data = await res.json()
      let filtered = data.items ?? []
      if (q) filtered = filtered.filter((c: any) => c.companyName.toLowerCase().includes(q.toLowerCase()) || c.contactPerson.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase()))
      if (status) filtered = filtered.filter((c: any) => c.contractStatus === status)
      setItems(filtered)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [q, status])

  const openCreate = () => {
    setEditItem(null)
    setForm({
      companyName: '', contactPerson: '', email: '', phone: '', password: '',
      country: 'United States', timezone: 'America/New_York', industry: 'Real Estate',
      pkg: 'Real Estate VA — 40 Hours/Week', contractedHours: 160, billingCycle: 'Monthly',
      brandColor: '#1a1f3d',
    })
    setOpen(true)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({
      companyName: item.companyName, contactPerson: item.contactPerson, email: item.email, phone: item.phone ?? '',
      country: item.country, timezone: item.timezone, industry: item.industry,
      pkg: item.package, contractedHours: item.contractedHours, billingCycle: item.billingCycle,
      brandColor: item.brandColor, contractStatus: item.contractStatus,
    })
    setOpen(true)
  }

  const submit = async () => {
    if (!form.companyName || !form.contactPerson || !form.email || (!editItem && !form.password)) {
      toast('Please fill all required fields', 'error')
      return
    }
    try {
      const res = await fetch('/api/clients', {
        method: editItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editItem ? { id: editItem.id, ...form } : form),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      toast(editItem ? 'Client updated' : 'Client created', 'success')
      setOpen(false)
      load()
    } catch {
      toast('Something went wrong', 'error')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('End this client contract? This will mark them as Ended (soft delete).')) return
    try {
      const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Failed', 'error'); return }
      toast('Client contract ended', 'success')
      load()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header
        title="Clients"
        subtitle={`${items.length} clients`}
        action={<Button size="sm" className="h-8 bg-navy hover:bg-navy-light" onClick={openCreate}><Plus className="h-3.5 w-3.5 mr-1" />Add Client</Button>}
      />
      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} options={['Active', 'Trial', 'On Hold', 'Ended']} />

      <Card className="card-corporate">
        {loading ? <div className="p-4"><LoadingSkeleton /></div> :
          items.length === 0 ? <EmptyState icon={Users} title="No clients found" description="Add your first client to begin operations." action={<Button size="sm" className="h-8 bg-navy hover:bg-navy-light" onClick={openCreate}><Plus className="h-3.5 w-3.5 mr-1" />Add Client</Button>} /> :
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="px-4 py-2.5 border-b border-border grid gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]"
                style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.5fr' }}>
                <div>Client</div><div>Location</div><div>Package</div><div>Hours/mo</div><div>VAs</div><div>Tickets</div><div>Status</div><div></div>
              </div>
              <div className="divide-y divide-border/50">
                {items.map((c) => (
                  <div key={c.id} className="px-4 py-3 grid gap-3 items-center hover:bg-muted/30 transition-colors cursor-pointer group"
                    style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.5fr' }}
                    onClick={() => setDetailItem(c)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: c.brandColor ?? '#1a1f3d' }}>
                        {c.companyName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-navy truncate">{c.companyName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{c.contactPerson} · {c.email}</div>
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="text-navy">{c.country}</div>
                      <div className="text-[10px] text-muted-foreground">{c.timezone}</div>
                    </div>
                    <div className="text-xs text-foreground truncate">{c.package}</div>
                    <div className="text-xs tabular-nums font-medium text-navy">{c.contractedHours}h</div>
                    <div className="text-xs"><Pill tone={c.assignedVAs > 0 ? 'gold' : 'muted'}>{c.assignedVAs} VA{c.assignedVAs !== 1 ? 's' : ''}</Pill></div>
                    <div className="text-xs">{c.openTickets > 0 ? <Pill tone="warning">{c.openTickets} open</Pill> : <span className="text-[10px] text-muted-foreground">—</span>}</div>
                    <div><StatusBadge status={c.contractStatus} size="xs" /></div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailItem(c)}><ChevronRight className="h-3.5 w-3.5 mr-2" />View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => remove(c.id)} className="text-rose-600"><Trash2 className="h-3.5 w-3.5 mr-2" />End Contract</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>{editItem ? 'Update client information.' : 'Onboard a new client and create their portal account.'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
            <Field label="Company Name *" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} />
            <Field label="Contact Person *" value={form.contactPerson} onChange={(v) => setForm({ ...form, contactPerson: v })} />
            <Field label="Email *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            {!editItem && <Field label="Password *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" />}
            <FieldSelect label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} options={['United States', 'Canada', 'United Kingdom', 'Australia', 'United Arab Emirates']} />
            <FieldSelect label="Timezone" value={form.timezone} onChange={(v) => setForm({ ...form, timezone: v })} options={['America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Denver', 'America/Toronto', 'Europe/London']} />
            <FieldSelect label="Industry" value={form.industry} onChange={(v) => setForm({ ...form, industry: v })} options={['Real Estate', 'Real Estate Brokerage', 'Luxury Real Estate', 'Property Management', 'Vacation Rentals', 'Mortgage Brokerage']} />
            <FieldSelect label="Package" value={form.pkg} onChange={(v) => setForm({ ...form, pkg: v })} options={['Real Estate VA — 40 Hours/Week', 'Real Estate VA — 20 Hours/Week', 'Premium VA — 60 Hours/Week', 'Cold Calling — 40 Hours/Week', 'Custom Plan']} />
            <Field label="Contracted Hours/mo" value={String(form.contractedHours ?? 160)} onChange={(v) => setForm({ ...form, contractedHours: parseInt(v) || 160 })} type="number" />
            <FieldSelect label="Billing Cycle" value={form.billingCycle} onChange={(v) => setForm({ ...form, billingCycle: v })} options={['Monthly', 'Quarterly', 'Annual']} />
            <FieldSelect label="Contract Status" value={form.contractStatus ?? 'Active'} onChange={(v) => setForm({ ...form, contractStatus: v })} options={['Active', 'Trial', 'On Hold', 'Ended']} />
            <div>
              <Label className="text-[11px] text-muted-foreground">Brand Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.brandColor ?? '#1a1f3d'} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} className="h-8 w-12 rounded border border-border cursor-pointer" />
                <Input value={form.brandColor ?? ''} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} className="h-8 flex-1 text-xs font-mono" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} className="bg-navy hover:bg-navy-light">{editItem ? 'Save Changes' : 'Create Client'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <ClientDetailDrawer item={detailItem} onClose={() => setDetailItem(null)} onEdit={(c) => { setDetailItem(null); openEdit(c) }} />
    </div>
  )
}

function ClientDetailDrawer({ item, onClose, onEdit }: { item: any; onClose: () => void; onEdit: (c: any) => void }) {
  if (!item) return null
  return (
    <Sheet open={!!item} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md flex items-center justify-center text-sm font-bold text-white" style={{ background: item.brandColor ?? '#1a1f3d' }}>
              {item.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-base font-semibold text-navy">{item.companyName}</div>
              <div className="text-xs text-muted-foreground font-normal">{item.contactPerson}</div>
            </div>
          </SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8 space-y-5">
          <div className="flex items-center gap-2">
            <StatusBadge status={item.contractStatus} size="sm" />
            <Pill tone="gold">{item.package}</Pill>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailCard label="Contracted Hours" value={`${item.contractedHours}h / mo`} />
            <DetailCard label="Billing Cycle" value={item.billingCycle} />
            <DetailCard label="Assigned VAs" value={item.assignedVAs} />
            <DetailCard label="Open Tickets" value={item.openTickets} />
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Contact</div>
            <div className="space-y-1.5">
              <DetailRow icon={Mail} label="Email" value={item.email} />
              <DetailRow icon={Phone} label="Phone" value={item.phone ?? '—'} />
              <DetailRow icon={Globe} label="Location" value={`${item.country} · ${item.timezone}`} />
              <DetailRow icon={Building2} label="Industry" value={item.industry} />
              <DetailRow icon={Calendar} label="Start Date" value={formatDate(item.startDate)} />
              <DetailRow icon={Package} label="Package" value={item.package} />
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(item)}><Edit className="h-3.5 w-3.5 mr-1.5" />Edit Client</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DetailCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-navy mt-1 tabular-nums">{value}</div>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xs text-navy truncate">{value}</div>
      </div>
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

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
