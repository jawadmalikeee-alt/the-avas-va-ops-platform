'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SectionHeader, Pill } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { useAuth } from '@/stores/auth'
import { Building2, User, Globe, Clock, Shield } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'

export function ClientAccount() {
  const { user } = useAuth()
  const c = user?.client

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Account" subtitle="Your client profile and configuration" />

      <Card className="border-border/70 shadow-none p-5">
        <SectionHeader title="Company Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Company Name" value={c?.companyName ?? ''} icon={Building2} />
          <Field label="Contact Person" value={user?.name ?? ''} icon={User} />
          <Field label="Email" value={user?.email ?? ''} icon={User} />
          <Field label="Phone" value={user?.phone ?? '+1 555 0100'} icon={User} />
          <Field label="Country" value="United States" icon={Globe} />
          <Field label="Timezone" value={c?.timezone ?? 'America/New_York'} icon={Clock} />
          <Field label="Industry" value="Real Estate Brokerage" icon={Building2} />
          <Field label="Package" value={c?.package ?? ''} icon={Building2} />
        </div>
      </Card>

      <Card className="border-border/70 shadow-none p-5">
        <SectionHeader title="Visibility Settings" subtitle="What your account can see — managed by AVAS Admin" />
        <div className="space-y-2">
          {[
            { label: 'Hours worked', v: c?.canSeeHours },
            { label: 'QA score', v: c?.canSeeQA },
            { label: 'Activity feed', v: c?.canSeeActivity },
            { label: 'Task details', v: c?.canSeeTaskDetails },
            { label: 'Message VA directly', v: c?.canMessageVA },
            { label: 'Approve deliverables', v: c?.canApproveDeliverable },
            { label: 'Performance score', v: c?.canSeePerformance },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <Label className="text-xs text-foreground">{s.label}</Label>
              <div className="flex items-center gap-2">
                {s.v ? <Pill tone="success">Enabled</Pill> : <Pill tone="muted">Disabled</Pill>}
                <Switch checked={!!s.v} disabled />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-border/70 shadow-none p-5">
        <SectionHeader title="Security" subtitle="Account security settings" />
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium text-foreground">Two-factor authentication</div>
              <div className="text-[11px] text-muted-foreground">Add an extra layer of security to your account.</div>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/30">
            <div>
              <div className="text-sm font-medium text-foreground">Session timeout</div>
              <div className="text-[11px] text-muted-foreground">Automatically log out after inactivity.</div>
            </div>
            <Pill tone="muted">7 days</Pill>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border/30">
            <div>
              <div className="text-sm font-medium text-foreground">Login alerts</div>
              <div className="text-[11px] text-muted-foreground">Get notified of new sign-ins.</div>
            </div>
            <Switch defaultChecked />
          </div>
          <Button variant="outline" size="sm" className="h-8 mt-2" onClick={() => toast('Password change link sent to your email', 'success')}>
            <Shield className="h-3.5 w-3.5 mr-1" />Change password
          </Button>
        </div>
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
