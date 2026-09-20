'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, SectionHeader, Pill } from '@/components/ui-primitives'
import { useAuth } from '@/stores/auth'
import { formatDate } from '@/lib/format'
import { Camera, Mail, Phone, Globe, Clock, Briefcase, User, Save, Upload, Shield } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'

export function ProfileEditor() {
  const { user, fetchUser } = useAuth()
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        phone: user.phone ?? '',
        jobTitle: user.jobTitle ?? '',
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
        companyName: user.client?.companyName ?? '',
        contactPerson: user.client?.contactPerson ?? '',
      })
    }
  }, [user])

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Upload failed', 'error'); return }
      // Save the URL to the user's profile
      const patchRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: d.url }),
      })
      if (!patchRes.ok) { toast('Failed to update profile', 'error'); return }
      toast('Profile picture updated', 'success')
      await fetchUser()
    } catch (e: any) {
      toast('Upload failed: ' + e.message, 'error')
    } finally { setUploading(false) }
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload: any = {
        name: form.name,
        phone: form.phone,
        jobTitle: form.jobTitle,
        timezone: form.timezone,
      }
      if (user?.role === 'CLIENT') {
        payload.client = {
          contactPerson: form.contactPerson,
          companyName: form.companyName,
        }
      }
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const d = await res.json(); toast(d.error ?? 'Failed', 'error'); return }
      toast('Profile updated', 'success')
      await fetchUser()
    } catch {
      toast('Failed', 'error')
    } finally { setSaving(false) }
  }

  if (!user) return null

  const isClient = user.role === 'CLIENT'
  const isVA = user.role === 'VA'

  return (
    <div className="space-y-5 pb-16 md:pb-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-display tracking-tight text-navy">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your personal information and profile picture.</p>
      </div>

      {/* Profile Picture */}
      <Card className="rounded-2xl border-border shadow-apple p-6">
        <SectionHeader title="Profile Picture" />
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar name={form.name ?? user.name} src={form.avatarUrl ?? user.avatarUrl} size="lg" className="h-24 w-24 text-3xl" />
            {uploading && <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"><div className="h-6 w-6 border-2 border-white/40 border-t-white rounded-full animate-spin" /></div>}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-navy text-white flex items-center justify-center shadow-apple-lg hover:bg-navy-light transition-colors"
              title="Change profile picture"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = '' }}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-navy">{form.name ?? user.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{form.jobTitle ?? user.jobTitle}</p>
            <Button variant="outline" size="sm" className="mt-3 h-8 rounded-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {uploading ? 'Uploading…' : 'Upload New'}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-2">JPG, PNG, or GIF · Max 5MB · Square images work best</p>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="rounded-2xl border-border shadow-apple p-6">
        <SectionHeader title="Personal Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5"><User className="h-3 w-3" />Full Name</Label>
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" />Email</Label>
            <Input value={user.email} readOnly className="mt-1 h-10 text-sm bg-muted/40 text-muted-foreground" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" />Phone</Label>
            <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555 0000" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Briefcase className="h-3 w-3" />Job Title</Label>
            <Input value={form.jobTitle ?? ''} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Globe className="h-3 w-3" />Timezone</Label>
            <Input value={form.timezone ?? ''} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" />Role</Label>
            <Input value={user.role} readOnly className="mt-1 h-10 text-sm bg-muted/40 text-muted-foreground capitalize" />
          </div>
        </div>
      </Card>

      {/* Client-specific */}
      {isClient && user.client && (
        <Card className="rounded-2xl border-border shadow-apple p-6">
          <SectionHeader title="Company Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-[11px] text-muted-foreground">Company Name</Label>
              <Input value={form.companyName ?? ''} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="mt-1 h-10 text-sm" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Contact Person</Label>
              <Input value={form.contactPerson ?? ''} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="mt-1 h-10 text-sm" />
            </div>
          </div>
        </Card>
      )}

      {/* VA Performance Snapshot */}
      {isVA && user.va && (
        <Card className="rounded-2xl border-border shadow-apple p-6">
          <SectionHeader title="Performance Snapshot" />
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Performance" value={`${user.va.performanceScore}%`} />
            <Stat label="Quality" value={`${user.va.qualityScore}%`} />
            <Stat label="Status" value={user.va.currentStatus} />
          </div>
        </Card>
      )}

      {/* Security */}
      <Card className="rounded-2xl border-border shadow-apple p-6">
        <SectionHeader title="Security" />
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium text-navy">Change Password</div>
              <div className="text-[11px] text-muted-foreground">Update your account password</div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => toast('Password change link sent to your email', 'success')}>
              <Shield className="h-3.5 w-3.5 mr-1.5" />Change
            </Button>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <div className="text-sm font-medium text-navy">Two-Factor Authentication</div>
              <div className="text-[11px] text-muted-foreground">Add extra security</div>
            </div>
            <input type="checkbox" className="ios-switch" />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2 sticky bottom-4">
        <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
        <Button onClick={save} disabled={saving} className="rounded-full">
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</div>
      <div className="text-base font-display text-navy mt-1">{value}</div>
    </div>
  )
}
