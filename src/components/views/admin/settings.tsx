'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SectionHeader, Pill, Avatar } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { Settings as SettingsIcon, Building2, Users, Shield, Bell, Palette, Plug, KeyRound } from 'lucide-react'

const TABS = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'permissions', label: 'Permissions', icon: KeyRound },
  { id: 'services', label: 'Services & KPIs', icon: SettingsIcon },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
]

export function AdminSettings() {
  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Settings" subtitle="Configure The AVAS platform" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar tabs */}
        <Card className="border-border/70 shadow-none p-2 lg:col-span-1 h-fit">
          <div className="space-y-0.5">
            {TABS.map((t, i) => (
              <button key={t.id} className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs ${i === 0 ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50'}`}>
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border/70 shadow-none p-5">
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
                  <div className="h-8 w-8 rounded-md bg-slate-950 ring-2 ring-offset-2 ring-foreground" />
                  <Input defaultValue="#0F172A" className="h-8 w-32 text-xs" />
                  <span className="text-[11px] text-muted-foreground">Used in client portal branding</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-border/70 shadow-none p-5">
            <SectionHeader title="Default Working Schedule" subtitle="Applied to new VA assignments" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Working Days" value="Mon–Fri" />
              <Field label="Start Time" value="9:00 AM PKT" />
              <Field label="End Time" value="6:00 PM PKT" />
              <Field label="Break" value="1 hour" />
              <Field label="Weekly Hours" value="40" />
              <Field label="Grace Period" value="10 min" />
              <Field label="Overtime Threshold" value="8h/day" />
              <Field label="Late Tolerance" value="15 min" />
            </div>
          </Card>

          <Card className="border-border/70 shadow-none p-5">
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
                  <Label className="text-xs w-32 text-muted-foreground">{q.name}</Label>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-foreground" style={{ width: `${q.weight * 4}%` }} />
                  </div>
                  <Input defaultValue={q.weight} className="h-8 w-14 text-xs text-center" />
                  <span className="text-[11px] text-muted-foreground w-4">%</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Total weight must equal 100%</span>
              <div className="flex items-center gap-2">
                <Pill tone="success">Total: 100%</Pill>
                <Button size="sm" className="h-7 text-xs">Save changes</Button>
              </div>
            </div>
          </Card>

          <Card className="border-border/70 shadow-none p-5">
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
                  <Label className="text-xs text-foreground">{v.label}</Label>
                  <Switch defaultChecked={v.default} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      <Input defaultValue={value} className="h-8 text-xs mt-1" />
    </div>
  )
}
