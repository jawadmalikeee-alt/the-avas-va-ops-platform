'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SectionHeader, Pill, Avatar, EmptyState, LoadingSkeleton } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/shared'
import { Settings as SettingsIcon, Building2, Users, Shield, Bell, Palette, Plug, KeyRound, Lock, RotateCcw } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/lib/format'

const TABS = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'permissions', label: 'Permissions', icon: KeyRound },
  { id: 'services', label: 'Services & KPIs', icon: SettingsIcon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
]

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('company')

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Settings" subtitle="Configure The AVAS platform" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar tabs */}
        <Card className="rounded-2xl border-border shadow-apple p-2 lg:col-span-1 h-fit">
          <div className="space-y-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all',
                  activeTab === t.id
                    ? 'bg-avas-blue text-white shadow-apple'
                    : 'text-foreground/70 hover:bg-muted'
                )}
              >
                <t.icon className="h-[18px] w-[18px]" />
                {t.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          {activeTab === 'company' && <CompanyTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'permissions' && <PermissionsTab />}
          {activeTab === 'services' && <ServicesTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
        </div>
      </div>
    </div>
  )
}

function CompanyTab() {
  return (
    <Card className="rounded-2xl border-border shadow-apple p-5">
      <SectionHeader title="Company Profile" subtitle="The AVAS branding and contact info" />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company Name" value="The AVAS" />
          <Field label="Industry" value="Real Estate VA Services" />
          <Field label="Contact Email" value="hello@theavas.com" />
          <Field label="Phone" value="+92 300 1234567" />
          <Field label="Address" value="Lahore, Pakistan" />
          <Field label="Timezone" value="Asia/Karachi (PKT)" />
        </div>
        <div>
          <Label className="text-xs">Brand Color</Label>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="h-8 w-8 rounded-md bg-avas-blue ring-2 ring-offset-2 ring-avas-blue" />
            <Input defaultValue="#2d4ed8" className="h-8 w-32 text-xs font-mono" />
            <span className="text-[11px] text-foreground/60">Used in client portal branding</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resetUser, setResetUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' })
      const data = await res.json()
      setUsers(data.items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const resetPassword = async () => {
    if (!resetUser || !newPassword) { toast('Enter a new password', 'error'); return }
    if (newPassword.length < 6) { toast('Password must be at least 6 characters', 'error'); return }
    setResetting(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetUser.id, newPassword }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      toast(`Password reset for ${resetUser.name}`, 'success')
      setResetUser(null)
      setNewPassword('')
    } catch {
      toast('Failed', 'error')
    } finally { setResetting(false) }
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-avas-blue/10 text-avas-blue ring-avas-blue/30',
    CLIENT: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    VA: 'bg-amber-50 text-amber-700 ring-amber-200',
    QA_MANAGER: 'bg-violet-50 text-violet-700 ring-violet-200',
    TEAM_LEAD: 'bg-blue-50 text-blue-700 ring-blue-200',
    OPERATIONS_MANAGER: 'bg-sky-50 text-sky-700 ring-sky-200',
  }

  return (
    <>
      <Card className="rounded-2xl border-border shadow-apple p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Users & Roles</h2>
            <p className="text-sm text-foreground/60 mt-0.5 font-medium">Manage all portal accounts and reset passwords</p>
          </div>
          <Pill tone="info">{users.length} users</Pill>
        </div>
        {loading ? <div className="p-4"><LoadingSkeleton rows={5} /></div> :
          users.length === 0 ? <EmptyState icon={Users} title="No users found" /> :
          <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
            {users.map((u) => (
              <div key={u.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 group">
                <Avatar name={u.name} src={u.avatarUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{u.name}</div>
                  <div className="text-xs text-foreground/60 truncate font-medium">{u.email}</div>
                  <div className="text-[11px] text-foreground/50 mt-0.5">
                    {u.clientCompany ?? u.vaSpecialization ?? u.jobTitle ?? 'Administrator'}
                    {u.lastActiveAt && ` · Last active ${formatRelative(u.lastActiveAt)}`}
                  </div>
                </div>
                <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset', roleColors[u.role] ?? 'bg-muted text-foreground/60 ring-border')}>
                  {u.role.replace(/_/g, ' ')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => { setResetUser(u); setNewPassword('') }}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset Password
                </Button>
              </div>
            ))}
          </div>
        }
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={(v) => !v && setResetUser(null)}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-avas-blue" />Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetUser?.name}</strong> ({resetUser?.email}). They will use this password to sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] text-foreground/60 font-bold">New Password</Label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="mt-1.5 h-10 text-sm font-mono"
                autoFocus
              />
            </div>
            <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={() => {
              const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
              let pw = ''
              for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)]
              setNewPassword(pw)
            }}>
              Generate Random Password
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetUser(null)}>Cancel</Button>
            <Button onClick={resetPassword} disabled={resetting} className="bg-avas-blue hover:bg-avas-blue-light">
              <Lock className="h-4 w-4 mr-1.5" />
              {resetting ? 'Resetting…' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PermissionsTab() {
  return (
    <Card className="rounded-2xl border-border shadow-apple p-5">
      <SectionHeader title="Permission Matrix" subtitle="Role-based access control" />
      <div className="space-y-2">
        {[
          { label: 'manage_clients', roles: 'ADMIN, OPERATIONS_MANAGER' },
          { label: 'manage_vas', roles: 'ADMIN, OPERATIONS_MANAGER, TEAM_LEAD' },
          { label: 'manage_assignments', roles: 'ADMIN, OPERATIONS_MANAGER' },
          { label: 'manage_time', roles: 'ADMIN, OPERATIONS_MANAGER' },
          { label: 'manage_tasks', roles: 'ADMIN, OPERATIONS_MANAGER, TEAM_LEAD' },
          { label: 'manage_qa', roles: 'ADMIN, QA_MANAGER' },
          { label: 'view_reports', roles: 'ADMIN, OPERATIONS_MANAGER, QA_MANAGER' },
          { label: 'manage_billing', roles: 'ADMIN' },
          { label: 'view_audit_logs', roles: 'ADMIN' },
        ].map((p) => (
          <div key={p.label} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
            <code className="text-xs font-mono text-foreground font-semibold">{p.label}</code>
            <div className="flex gap-1">
              {p.roles.split(', ').map((r) => (
                <span key={r} className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-avas-blue/10 text-avas-blue">{r}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ServicesTab() {
  return (
    <Card className="rounded-2xl border-border shadow-apple p-5">
      <SectionHeader title="QA Template Configuration" subtitle="Default weights for QA scoring" />
      <div className="space-y-3">
        {[
          { name: 'Accuracy', weight: 25 },
          { name: 'Completeness', weight: 20 },
          { name: 'Following SOP', weight: 20 },
          { name: 'Communication', weight: 15 },
          { name: 'Timeliness', weight: 10 },
          { name: 'Professionalism', weight: 10 },
        ].map((q) => (
          <div key={q.name} className="flex items-center gap-3">
            <Label className="text-xs w-32 text-foreground/60 font-bold">{q.name}</Label>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-avas-blue" style={{ width: `${q.weight * 4}%` }} />
            </div>
            <Input defaultValue={q.weight} className="h-8 w-14 text-xs text-center" />
            <span className="text-[11px] text-foreground/60 w-4">%</span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-foreground/60">Total weight must equal 100%</span>
        <div className="flex items-center gap-2">
          <Pill tone="success">Total: 100%</Pill>
          <Button size="sm" className="h-7 text-xs">Save</Button>
        </div>
      </div>
    </Card>
  )
}

function NotificationsTab() {
  return (
    <Card className="rounded-2xl border-border shadow-apple p-5">
      <SectionHeader title="Default Client Visibility" subtitle="Applied to new clients — configurable per client" />
      <div className="space-y-2.5">
        {[
          { label: 'Hours worked', default: true },
          { label: 'QA score', default: true },
          { label: 'Activity feed', default: true },
          { label: 'Task details', default: true },
          { label: 'Message VA directly', default: true },
          { label: 'Approve deliverables', default: true },
          { label: 'Performance score', default: true },
          { label: 'Billing details', default: false },
        ].map((v) => (
          <div key={v.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
            <Label className="text-xs font-bold text-foreground">{v.label}</Label>
            <input type="checkbox" className="ios-switch" defaultChecked={v.default} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function IntegrationsTab() {
  return (
    <Card className="rounded-2xl border-border shadow-apple p-5">
      <SectionHeader title="Integrations" subtitle="Connect external tools and services" />
      <div className="grid grid-cols-2 gap-3">
        {['CRM (Follow Up Boss)', 'CRM (kvCORE)', 'CRM (Salesforce)', 'Google Workspace', 'Slack', 'Zoom', 'Telnyx (VoIP)', 'Google Calendar'].map((name) => (
          <div key={name} className="rounded-xl border border-border p-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">{name}</span>
            <Pill tone="muted">Not Connected</Pill>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-[11px] text-foreground/60 font-bold">{label}</Label>
      <Input defaultValue={value} className="mt-1.5 h-9 text-sm" readOnly />
    </div>
  )
}
