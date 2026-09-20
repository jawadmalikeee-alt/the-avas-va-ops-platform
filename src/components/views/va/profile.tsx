'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SectionHeader, Pill, Avatar } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { useAuth } from '@/stores/auth'
import { User, Globe, Clock, Bell, Shield } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'

export function VAProfile() {
  const { user } = useAuth()
  const va = user?.va

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Profile" subtitle="Your VA profile and preferences" />

      <Card className="border-border/70 shadow-none p-5">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={user?.name ?? ''} src={user?.avatarUrl} size="lg" />
          <div>
            <div className="text-lg font-display font-semibold text-foreground">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{va?.specialization}</div>
            <div className="flex items-center gap-2 mt-1">
              <Pill tone="success">Active</Pill>
              <span className="text-[11px] text-muted-foreground">Hired {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>

        <SectionHeader title="Personal Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Full Name" value={user?.name ?? ''} icon={User} />
          <Field label="Email" value={user?.email ?? ''} icon={User} />
          <Field label="Phone" value={user?.phone ?? '+92 300 0000000'} icon={User} />
          <Field label="Job Title" value={user?.jobTitle ?? ''} icon={User} />
          <Field label="Timezone" value={user?.timezone ?? 'Asia/Karachi'} icon={Clock} />
          <Field label="Specialization" value={va?.specialization ?? ''} icon={Globe} />
        </div>
      </Card>

      <Card className="border-border/70 shadow-none p-5">
        <SectionHeader title="Performance Snapshot" subtitle="Your current scores" />
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-border/60 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Performance</div>
            <div className="text-xl font-semibold text-foreground mt-1">{va?.performanceScore}%</div>
          </div>
          <div className="rounded-md border border-border/60 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quality</div>
            <div className="text-xl font-semibold text-foreground mt-1">{va?.qualityScore}%</div>
          </div>
          <div className="rounded-md border border-border/60 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Attendance</div>
            <div className="text-xl font-semibold text-foreground mt-1">95%</div>
          </div>
        </div>
      </Card>

      <Card className="border-border/70 shadow-none p-5">
        <SectionHeader title="Notification Preferences" />
        <div className="space-y-2">
          {[
            { label: 'Task assignments', v: true },
            { label: 'QA feedback received', v: true },
            { label: 'Schedule changes', v: true },
            { label: 'New messages', v: true },
            { label: 'Announcements', v: true },
            { label: 'Daily summary email', v: false },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <Label className="text-xs text-foreground">{s.label}</Label>
              <Switch defaultChecked={s.v} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-border/70 shadow-none p-5">
        <SectionHeader title="Security" />
        <Button variant="outline" size="sm" className="h-8" onClick={() => toast('Password change link sent to your email', 'success')}>
          <Shield className="h-3.5 w-3.5 mr-1" />Change password
        </Button>
      </Card>
    </div>
  )
}

function Field({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5">{Icon && <Icon className="h-3 w-3" />}{label}</Label>
      <Input defaultValue={value} className="mt-1 h-9 text-sm" readOnly />
    </div>
  )
}
