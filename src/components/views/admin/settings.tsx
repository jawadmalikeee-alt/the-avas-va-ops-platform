'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SectionHeader, Pill, Avatar, EmptyState, LoadingSkeleton } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/shared'
import { Settings as SettingsIcon, Building2, Users, Shield, Bell, Palette, Plug, KeyRound, Lock, RotateCcw, Plus, Search, Trash2, Edit, Eye, UserCog, X, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { formatRelative, formatDate } from '@/lib/format'

const DESIGNATIONS = ['VA', 'Manager', 'Account Manager', 'QA', 'Team Leader', 'Caller', 'Lead Generation Specialist', 'Customer Support', 'Sales', 'Operations', 'HR', 'Other']

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('users')
  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Settings" subtitle="Configure The AVAS platform" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border shadow-apple p-2 lg:col-span-1 h-fit">
          <div className="space-y-1">
            {[
              { id: 'users', label: 'Users & Roles', icon: Users },
              { id: 'company', label: 'Company', icon: Building2 },
              { id: 'permissions', label: 'Permissions', icon: KeyRound },
              { id: 'services', label: 'Services & KPIs', icon: SettingsIcon },
            ].map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn('w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all', activeTab === t.id ? 'bg-avas-blue text-white shadow-apple' : 'text-foreground/70 hover:bg-muted')}>
                <t.icon className="h-[18px] w-[18px]" />{t.label}
              </button>
            ))}
          </div>
        </Card>
        <div className="lg:col-span-3 space-y-4">
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'company' && <div className="p-5 text-sm text-foreground/60">Company settings available in full build.</div>}
          {activeTab === 'permissions' && <div className="p-5 text-sm text-foreground/60">Permission matrix available in full build.</div>}
          {activeTab === 'services' && <div className="p-5 text-sm text-foreground/60">Services config available in full build.</div>}
        </div>
      </div>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [detailUser, setDetailUser] = useState<any>(null)
  const [confirmAction, setConfirmAction] = useState<{ user: any; action: string } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      const data = await res.json()
      setUsers(data.items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = users.filter((u) => {
    const matchesSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.phone || '').includes(search)
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAction = async () => {
    if (!confirmAction) return
    const { user, action } = confirmAction
    try {
      const res = await fetch('/api/admin/user-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      const msgs: Record<string, string> = { disable: 'Account disabled', activate: 'Account activated', remove: 'Account removed', delete: 'Account permanently deleted' }
      toast(msgs[action] || 'Done', 'success')
      setConfirmAction(null)
      setDetailUser(null)
      load()
    } catch { toast('Failed', 'error') }
  }

  const resetPassword = async (userId: string, userName: string) => {
    const pw = prompt(`Enter new temporary password for ${userName}:`)
    if (!pw) return
    if (pw.length < 6) { toast('Password must be at least 6 characters', 'error'); return }
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: pw }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      toast(`Password reset for ${userName}`, 'success')
    } catch { toast('Failed', 'error') }
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    INACTIVE: 'bg-amber-50 text-amber-700 ring-amber-200',
    REMOVED: 'bg-rose-50 text-rose-700 ring-rose-200',
  }
  const roleColors: Record<string, string> = {
    ADMIN: 'bg-avas-blue/10 text-avas-blue ring-avas-blue/30',
    CLIENT: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    VA: 'bg-amber-50 text-amber-700 ring-amber-200',
  }

  return (
    <>
      {/* Header + Create */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground">User Management</h2>
          <p className="text-sm text-foreground/60 mt-0.5 font-medium">Create, edit, and manage all accounts</p>
        </div>
        <Button size="sm" className="bg-avas-blue hover:bg-avas-blue-light" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />Create Account
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, phone…" className="pl-9 h-9 text-xs" />
        </div>
        <div className="flex items-center gap-1">
          {['ALL', 'ACTIVE', 'INACTIVE', 'REMOVED'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn('px-2.5 py-1 rounded-full text-[11px] font-semibold', statusFilter === s ? 'bg-avas-blue text-white' : 'bg-muted text-foreground/70 hover:bg-muted/70')}>{s}</button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card className="rounded-2xl border-border shadow-apple p-0 overflow-hidden">
        {loading ? <div className="p-4"><LoadingSkeleton rows={6} /></div> :
          filtered.length === 0 ? <EmptyState icon={Users} title="No users found" /> :
          <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
            {filtered.map((u) => (
              <div key={u.id} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 group">
                <Avatar name={u.name} src={u.avatarUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{u.name}</div>
                  <div className="text-xs text-foreground/60 truncate font-medium">{u.email}</div>
                  <div className="text-[11px] text-foreground/50 mt-0.5">
                    {u.designation === 'Other' ? u.customDesignation : u.designation || u.clientCompany || u.vaSpecialization || u.role}
                    {u.lastLogin && ` · Last login ${formatRelative(u.lastLogin)}`}
                  </div>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset', statusColors[u.status] || statusColors.ACTIVE)}>{u.status}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset', roleColors[u.role] || 'bg-muted text-foreground/60 ring-border')}>{u.role}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-avas-blue/10" onClick={() => setDetailUser(u)} title="View"><Eye className="h-4 w-4 text-avas-blue" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-avas-blue/10" onClick={() => setEditUser(u)} title="Edit"><Edit className="h-4 w-4 text-avas-blue" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-amber-50" onClick={() => resetPassword(u.id, u.name)} title="Reset Password"><RotateCcw className="h-4 w-4 text-amber-600" /></Button>
                </div>
              </div>
            ))}
          </div>
        }
      </Card>

      {/* Create Account Dialog */}
      {createOpen && <CreateAccountDialog onClose={() => { setCreateOpen(false); load() }} />}

      {/* Edit User Dialog */}
      {editUser && <EditUserDialog user={editUser} onClose={() => { setEditUser(null); load() }} />}

      {/* User Detail Drawer */}
      {detailUser && <UserDetailDrawer user={detailUser} onClose={() => setDetailUser(null)} onEdit={() => { setEditUser(detailUser); setDetailUser(null) }} onAction={(action) => setConfirmAction({ user: detailUser, action })} onResetPw={() => resetPassword(detailUser.id, detailUser.name)} />}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <AlertDialog open={!!confirmAction} onOpenChange={(v) => !v && setConfirmAction(null)}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-rose-500" />
                {confirmAction.action === 'delete' ? 'Permanently Delete Account?' : confirmAction.action === 'remove' ? 'Remove User?' : confirmAction.action === 'disable' ? 'Disable Account?' : 'Activate Account?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction.action === 'delete'
                  ? `This will permanently delete ${confirmAction.user.name} and all associated records (tasks, messages, assignments). This cannot be undone.`
                  : confirmAction.action === 'remove'
                    ? `${confirmAction.user.name} will be marked as removed. They won't be able to log in. Historical records are preserved.`
                    : confirmAction.action === 'disable'
                      ? `${confirmAction.user.name} won't be able to log in until reactivated.`
                      : `${confirmAction.user.name} will be able to log in again.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAction} className={cn(confirmAction.action === 'delete' || confirmAction.action === 'remove' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-avas-blue hover:bg-avas-blue-light')}>
                {confirmAction.action === 'delete' ? 'Delete Permanently' : confirmAction.action === 'remove' ? 'Remove User' : confirmAction.action === 'disable' ? 'Disable' : 'Activate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

// ============================================================
// Create Account Dialog — Client vs Employee/Agent with designations
// ============================================================
function CreateAccountDialog({ onClose }: { onClose: () => void }) {
  const [accountType, setAccountType] = useState<'CLIENT' | 'EMPLOYEE' | null>(null)
  const [form, setForm] = useState<any>({ name: '', email: '', password: '', phone: '', timezone: 'America/New_York', designation: 'VA', customDesignation: '', description: '', companyName: '', specialization: '' })
  const [creating, setCreating] = useState(false)

  const submit = async () => {
    if (!form.name || !form.email || !form.password) { toast('Name, email, and password are required', 'error'); return }
    if (form.password.length < 6) { toast('Password must be at least 6 characters', 'error'); return }
    if (accountType === 'CLIENT' && !form.companyName) { toast('Company name is required for clients', 'error'); return }
    if (form.designation === 'Other' && !form.customDesignation) { toast('Custom designation is required', 'error'); return }

    setCreating(true)
    try {
      const role = accountType === 'CLIENT' ? 'CLIENT' : 'VA'
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      toast(`${accountType === 'CLIENT' ? 'Client' : 'Employee'} account created for ${form.name}`, 'success')
      onClose()
    } catch { toast('Failed', 'error') }
    finally { setCreating(false) }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-avas-blue" />Create New Account</DialogTitle>
          <DialogDescription>Admin creates accounts for clients and employees.</DialogDescription>
        </DialogHeader>

        {!accountType ? (
          <div className="space-y-3 py-4">
            <div className="text-sm font-bold text-foreground/60 mb-2">Select Account Type:</div>
            <button onClick={() => setAccountType('CLIENT')} className="w-full rounded-2xl border border-border p-5 text-left hover:border-avas-blue/40 hover:shadow-apple-md transition-all">
              <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-xl bg-avas-blue/10 flex items-center justify-center"><Building2 className="h-6 w-6 text-avas-blue" /></div><div><div className="text-base font-bold text-foreground">Client / Realtor</div><div className="text-xs text-foreground/60">Create a client account</div></div></div>
            </button>
            <button onClick={() => setAccountType('EMPLOYEE')} className="w-full rounded-2xl border border-border p-5 text-left hover:border-avas-blue/40 hover:shadow-apple-md transition-all">
              <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-xl bg-avas-blue/10 flex items-center justify-center"><UserCog className="h-6 w-6 text-avas-blue" /></div><div><div className="text-base font-bold text-foreground">Employee / Agent</div><div className="text-xs text-foreground/60">VA, Manager, QA, Caller, etc.</div></div></div>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={() => setAccountType(null)} className="text-xs text-foreground/60 hover:text-foreground font-medium">← Back</button>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px] font-bold text-foreground/60">Full Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="mt-1.5 h-10 text-sm" /></div>
              <div><Label className="text-[11px] font-bold text-foreground/60">Email *</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@email.com" type="email" className="mt-1.5 h-10 text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px] font-bold text-foreground/60">Password *</Label><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" className="mt-1.5 h-10 text-sm" /></div>
              <div><Label className="text-[11px] font-bold text-foreground/60">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 0000" className="mt-1.5 h-10 text-sm" /></div>
            </div>

            {accountType === 'CLIENT' ? (
              <div><Label className="text-[11px] font-bold text-foreground/60">Company Name *</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="ABC Realty" className="mt-1.5 h-10 text-sm" /></div>
            ) : (
              <>
                <div><Label className="text-[11px] font-bold text-foreground/60">Designation</Label>
                  <Select value={form.designation} onValueChange={(v) => setForm({ ...form, designation: v })}>
                    <SelectTrigger className="mt-1.5 h-10 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {form.designation === 'Other' && (
                  <>
                    <div><Label className="text-[11px] font-bold text-foreground/60">Custom Designation *</Label><Input value={form.customDesignation} onChange={(e) => setForm({ ...form, customDesignation: e.target.value })} placeholder="e.g. Social Media Coordinator" className="mt-1.5 h-10 text-sm" /></div>
                    <div><Label className="text-[11px] font-bold text-foreground/60">Description / Responsibilities</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Manages social media accounts…" className="mt-1.5 h-10 text-sm" /></div>
                  </>
                )}
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={submit} disabled={creating} className="bg-avas-blue hover:bg-avas-blue-light"><Plus className="h-4 w-4 mr-1.5" />{creating ? 'Creating…' : `Create ${accountType === 'CLIENT' ? 'Client' : 'Employee'} Account`}</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Edit User Dialog
// ============================================================
function EditUserDialog({ user, onClose }: { user: any; onClose: () => void }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || '', designation: user.designation || 'VA', customDesignation: user.customDesignation || '', description: user.description || '', timezone: user.timezone, jobTitle: user.jobTitle || '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...form }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      toast('User updated successfully', 'success')
      onClose()
    } catch { toast('Failed', 'error') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5 text-avas-blue" />Edit User</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-[11px] font-bold text-foreground/60">Full Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-bold text-foreground/60">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 h-10 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-[11px] font-bold text-foreground/60">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 h-10 text-sm" /></div>
            <div><Label className="text-[11px] font-bold text-foreground/60">Timezone</Label><Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="mt-1.5 h-10 text-sm" /></div>
          </div>
          {user.role === 'VA' && (
            <>
              <div><Label className="text-[11px] font-bold text-foreground/60">Designation</Label>
                <Select value={form.designation} onValueChange={(v) => setForm({ ...form, designation: v })}>
                  <SelectTrigger className="mt-1.5 h-10 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.designation === 'Other' && (
                <>
                  <div><Label className="text-[11px] font-bold text-foreground/60">Custom Designation</Label><Input value={form.customDesignation} onChange={(e) => setForm({ ...form, customDesignation: e.target.value })} className="mt-1.5 h-10 text-sm" /></div>
                  <div><Label className="text-[11px] font-bold text-foreground/60">Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5 h-10 text-sm" /></div>
                </>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-avas-blue hover:bg-avas-blue-light">{saving ? 'Saving…' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// User Detail Drawer
// ============================================================
function UserDetailDrawer({ user, onClose, onEdit, onAction, onResetPw }: { user: any; onClose: () => void; onEdit: () => void; onAction: (action: string) => void; onResetPw: () => void }) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar name={user.name} src={user.avatarUrl} size="md" />
            <div><div className="text-base">{user.name}</div><div className="text-xs text-foreground/60 font-normal">{user.email}</div></div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profile */}
          <div className="rounded-xl bg-muted/30 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-foreground/50">Role:</span> <span className="font-bold">{user.role}</span></div>
              <div><span className="text-foreground/50">Status:</span> <span className="font-bold">{user.status}</span></div>
              <div><span className="text-foreground/50">Phone:</span> <span className="font-bold">{user.phone || '—'}</span></div>
              <div><span className="text-foreground/50">Designation:</span> <span className="font-bold">{user.designation === 'Other' ? user.customDesignation : user.designation || '—'}</span></div>
              {user.clientCompany && <div><span className="text-foreground/50">Company:</span> <span className="font-bold">{user.clientCompany}</span></div>}
              <div><span className="text-foreground/50">Created:</span> <span className="font-bold">{formatDate(user.createdAt)}</span></div>
              {user.lastLogin && <div><span className="text-foreground/50">Last Login:</span> <span className="font-bold">{formatRelative(user.lastLogin)}</span></div>}
            </div>
            {user.description && <div className="text-xs text-foreground/70 pt-2 border-t border-border"><span className="font-bold">Description:</span> {user.description}</div>}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="rounded-xl h-9" onClick={onEdit}><Edit className="h-3.5 w-3.5 mr-1.5" />Edit User</Button>
            <Button size="sm" variant="outline" className="rounded-xl h-9" onClick={onResetPw}><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset Password</Button>
            {user.status === 'ACTIVE' ? (
              <Button size="sm" variant="outline" className="rounded-xl h-9 text-amber-600 hover:bg-amber-50" onClick={() => onAction('disable')}>Disable Account</Button>
            ) : (
              <Button size="sm" variant="outline" className="rounded-xl h-9 text-emerald-600 hover:bg-emerald-50" onClick={() => onAction('activate')}>Activate Account</Button>
            )}
            <Button size="sm" variant="outline" className="rounded-xl h-9 text-rose-600 hover:bg-rose-50" onClick={() => onAction('remove')}>Remove Account</Button>
            <Button size="sm" variant="outline" className="rounded-xl h-9 text-rose-700 hover:bg-rose-50 col-span-2" onClick={() => onAction('delete')}><Trash2 className="h-3.5 w-3.5 mr-1.5" />Permanently Delete</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
