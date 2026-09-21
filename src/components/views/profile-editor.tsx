'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, SectionHeader } from '@/components/ui-primitives'
import { useAuth } from '@/stores/auth'
import { Camera, Mail, Phone, Globe, Clock, Briefcase, User, Save, Upload, Shield, Building2, Check, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import { cn } from '@/lib/utils'

export function ProfileEditor() {
  const { user, fetchUser } = useAuth()
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [showPwForm, setShowPwForm] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPasswords, setShowPasswords] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        jobTitle: user.jobTitle ?? '',
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
        companyName: user.client?.companyName ?? '',
        contactPerson: user.client?.contactPerson ?? '',
        bio: '',
      })
      setDirty(false)
    }
  }, [user])

  const update = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }))
    setDirty(true)
  }

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
      // Update form immediately for visual feedback
      update('avatarUrl', d.url)
      toast('Profile picture updated', 'success')
      // Refresh the session so the new avatar appears everywhere
      await fetchUser()
    } catch (e: any) {
      toast('Upload failed: ' + e.message, 'error')
    } finally { setUploading(false) }
  }

  const save = async () => {
    if (!form.name || !form.name.trim()) {
      toast('Name is required', 'error')
      return
    }
    setSaving(true)
    try {
      const payload: any = {
        name: form.name.trim(),
        phone: form.phone,
        jobTitle: form.jobTitle,
        timezone: form.timezone,
      }

      // If email changed, update via separate endpoint
      if (form.email && form.email !== user?.email) {
        const emailRes = await fetch('/api/auth/update-email', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newEmail: form.email, confirmEmail: form.email }),
        })
        const emailData = await emailRes.json()
        if (!emailRes.ok) { toast(emailData.error ?? 'Failed to update email', 'error'); setSaving(false); return }
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
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed to save', 'error'); return }
      toast('Profile saved successfully', 'success')
      setDirty(false)
      await fetchUser()
    } catch {
      toast('Failed to save', 'error')
    } finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast('Please fill in all password fields', 'error')
      return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast('New passwords do not match', 'error')
      return
    }
    if (pwForm.newPassword.length < 6) {
      toast('Password must be at least 6 characters', 'error')
      return
    }
    setChangingPw(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed to change password', 'error'); return }
      toast('Password changed successfully', 'success')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPwForm(false)
    } catch {
      toast('Failed to change password', 'error')
    } finally { setChangingPw(false) }
  }

  if (!user) return null

  const isClient = user.role === 'CLIENT'
  const isVA = user.role === 'VA'
  const isAvatarUploaded = !!form.avatarUrl

  return (
    <div className="space-y-5 pb-20 md:pb-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-sm text-foreground/70 mt-1.5 font-medium">Update your personal information and profile picture.</p>
      </div>

      {/* Profile Picture */}
      <Card className="rounded-2xl border-border shadow-apple p-6">
        <SectionHeader title="Profile Picture" />
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar
              name={form.name ?? user.name}
              src={form.avatarUrl ?? user.avatarUrl}
              size="lg"
              className="h-24 w-24 text-3xl"
            />
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="h-6 w-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-avas-blue text-white flex items-center justify-center shadow-apple-lg hover:bg-avas-blue-light transition-colors disabled:opacity-50"
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
            <p className="text-base font-display font-bold text-foreground">{form.name ?? user.name}</p>
            <p className="text-sm text-foreground/70 mt-0.5 font-medium">{form.jobTitle ?? user.jobTitle ?? 'Team Member'}</p>
            <div className="flex items-center gap-2 mt-3">
              <Button variant="outline" size="sm" className="rounded-full h-8" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {uploading ? 'Uploading…' : isAvatarUploaded ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {isAvatarUploaded && (
                <Button variant="ghost" size="sm" className="rounded-full h-8 text-rose-600 hover:bg-rose-50" onClick={async () => {
                  // Clear avatar
                  await fetch('/api/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatarUrl: null }),
                  })
                  update('avatarUrl', '')
                  await fetchUser()
                  toast('Profile picture removed', 'success')
                }}>
                  Remove
                </Button>
              )}
            </div>
            <p className="text-[11px] text-foreground/60 mt-2 font-medium">JPG, PNG, or GIF · Max 5MB · Square images work best</p>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="rounded-2xl border-border shadow-apple p-6">
        <SectionHeader title="Personal Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Full Name"
            icon={User}
            value={form.name ?? ''}
            onChange={(v) => update('name', v)}
            placeholder="Your full name"
          />
          <Field
            label="Email"
            icon={Mail}
            value={form.email ?? user.email}
            onChange={(v) => update('email', v)}
            placeholder="Email address"
          />
          <Field
            label="Phone"
            icon={Phone}
            value={form.phone ?? ''}
            onChange={(v) => update('phone', v)}
            placeholder="+1 555 0000"
          />
          <Field
            label="Job Title"
            icon={Briefcase}
            value={form.jobTitle ?? ''}
            onChange={(v) => update('jobTitle', v)}
            placeholder="Your role"
          />
          <Field
            label="Timezone"
            icon={Globe}
            value={form.timezone ?? ''}
            onChange={(v) => update('timezone', v)}
            placeholder="America/New_York"
          />
          <div>
            <Label className="text-[11px] text-foreground/60 font-bold flex items-center gap-1.5"><Clock className="h-3 w-3" />Role</Label>
            <Input value={user.role} readOnly className="mt-1.5 h-10 text-sm bg-muted/40 text-foreground/60 font-semibold capitalize" />
          </div>
        </div>
      </Card>

      {/* Client-specific */}
      {isClient && user.client && (
        <Card className="rounded-2xl border-border shadow-apple p-6">
          <SectionHeader title="Company Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Company Name"
              icon={Building2}
              value={form.companyName ?? ''}
              onChange={(v) => update('companyName', v)}
              placeholder="Company name"
            />
            <Field
              label="Contact Person"
              icon={User}
              value={form.contactPerson ?? ''}
              onChange={(v) => update('contactPerson', v)}
              placeholder="Contact person"
            />
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
            <Stat label="Attendance" value={`${user.va.attendanceScore}%`} />
          </div>
        </Card>
      )}

      {/* Security */}
      <Card className="rounded-2xl border-border shadow-apple p-6">
        <SectionHeader title="Security" />
        <div className="space-y-3">
          {/* Change Password */}
          <div className="py-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">Change Password</div>
                <div className="text-xs text-foreground/70 mt-0.5 font-medium">Update your account password</div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full h-8" onClick={() => setShowPwForm(!showPwForm)}>
                <Lock className="h-3.5 w-3.5 mr-1.5" />{showPwForm ? 'Cancel' : 'Change'}
              </Button>
            </div>
            {showPwForm && (
              <div className="mt-4 space-y-3 p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <Label className="text-[11px] text-foreground/60 font-bold">Current Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      type={showPasswords ? 'text' : 'password'}
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="h-10 text-sm pr-10"
                    />
                    <button onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground">
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-foreground/60 font-bold">New Password</Label>
                    <Input
                      type={showPasswords ? 'text' : 'password'}
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      placeholder="At least 6 characters"
                      className="mt-1.5 h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-foreground/60 font-bold">Confirm New Password</Label>
                    <Input
                      type={showPasswords ? 'text' : 'password'}
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="mt-1.5 h-10 text-sm"
                    />
                  </div>
                </div>
                <Button size="sm" onClick={changePassword} disabled={changingPw} className="w-full h-9 bg-avas-blue hover:bg-avas-blue-light">
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  {changingPw ? 'Changing…' : 'Change Password'}
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <div className="text-sm font-bold text-foreground">Two-Factor Authentication</div>
              <div className="text-xs text-foreground/70 mt-0.5 font-medium">Add extra security to your account</div>
            </div>
            <input type="checkbox" className="ios-switch" defaultChecked={false} onChange={(e) => toast(e.target.checked ? '2FA enabled' : '2FA disabled', e.target.checked ? 'success' : 'info')} />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <div className="text-sm font-bold text-foreground">Login Alerts</div>
              <div className="text-xs text-foreground/70 mt-0.5 font-medium">Get notified of new sign-ins</div>
            </div>
            <input type="checkbox" className="ios-switch" defaultChecked={true} onChange={(e) => toast(e.target.checked ? 'Login alerts enabled' : 'Login alerts disabled', 'info')} />
          </div>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="rounded-2xl border-border shadow-apple p-6">
        <SectionHeader title="Notification Preferences" />
        <div className="space-y-3">
          {[
            { label: 'Task assignments', desc: 'When a new task is assigned to you', default: true },
            { label: 'QA feedback received', desc: 'When your work is reviewed', default: true },
            { label: 'Schedule changes', desc: 'When your schedule is updated', default: true },
            { label: 'New messages', desc: 'When you receive a new message', default: true },
            { label: 'Incoming calls', desc: 'When someone calls you', default: true },
            { label: 'Email notifications', desc: 'Daily summary of activity', default: false },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
              <div>
                <div className="text-sm font-bold text-foreground">{s.label}</div>
                <div className="text-xs text-foreground/70 mt-0.5 font-medium">{s.desc}</div>
              </div>
              <input type="checkbox" className="ios-switch" defaultChecked={s.default} onChange={(e) => toast(`${s.label} ${e.target.checked ? 'enabled' : 'disabled'}`, 'info')} />
            </div>
          ))}
        </div>
      </Card>

      {/* Sticky save bar */}
      <div className={cn(
        'flex items-center justify-end gap-2 sticky bottom-4 transition-all',
        dirty ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        <div className="bg-card border border-border rounded-full shadow-apple-lg px-3 py-2 flex items-center gap-3">
          <span className="text-xs text-foreground/70 font-medium">You have unsaved changes</span>
          <Button variant="ghost" size="sm" className="rounded-full h-8" onClick={() => {
            setForm({
              name: user.name,
              phone: user.phone ?? '',
              jobTitle: user.jobTitle ?? '',
              timezone: user.timezone,
              avatarUrl: user.avatarUrl,
              companyName: user.client?.companyName ?? '',
              contactPerson: user.client?.contactPerson ?? '',
            })
            setDirty(false)
          }}>
            Discard
          </Button>
          <Button size="sm" onClick={save} disabled={saving} className="rounded-full h-8 bg-avas-blue hover:bg-avas-blue-light">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Saved indicator when not dirty */}
      {!dirty && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-foreground/50 font-medium">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          All changes saved
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
      <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-foreground/60">{label}</div>
      <div className="text-xl font-display font-bold text-foreground mt-1.5 tabular-nums">{value}</div>
    </div>
  )
}

function Field({ label, icon: Icon, value, onChange, placeholder, readOnly }: { label: string; icon: React.ComponentType<{ className?: string }>; value: string; onChange?: (v: string) => void; placeholder?: string; readOnly?: boolean }) {
  return (
    <div>
      <Label className="text-[11px] text-foreground/60 font-bold flex items-center gap-1.5"><Icon className="h-3 w-3" />{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="mt-1.5 h-10 text-sm font-medium"
      />
    </div>
  )
}
