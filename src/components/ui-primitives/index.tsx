'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

/** Compact metric card — minimal, premium feel */
export function MetricCard({
  label,
  value,
  delta,
  deltaType = 'neutral',
  hint,
  icon: Icon,
  className,
}: {
  label: string
  value: React.ReactNode
  delta?: string
  deltaType?: 'up' | 'down' | 'neutral'
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <Card className={cn('p-4 gap-0 border-border/70 shadow-none', className)}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />}
      </div>
      <div className="text-2xl font-display font-semibold tabular-nums tracking-tight text-foreground">{value}</div>
      {(delta || hint) && (
        <div className="mt-1 flex items-center gap-2 text-[11px]">
          {delta && (
            <span
              className={cn(
                'font-medium',
                deltaType === 'up' && 'text-emerald-600',
                deltaType === 'down' && 'text-rose-600',
                deltaType === 'neutral' && 'text-muted-foreground'
              )}
            >
              {deltaType === 'up' && '↑ '}
              {deltaType === 'down' && '↓ '}
              {delta}
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </Card>
  )
}

/** Status dot — colored dot + label */
export function StatusBadge({ status, size = 'sm', label, className }: { status: string; size?: 'xs' | 'sm' | 'md'; label?: string; className?: string }) {
  const colors: Record<string, string> = {
    // VA status
    Working: 'bg-emerald-500',
    Online: 'bg-emerald-500',
    Break: 'bg-amber-500',
    Meeting: 'bg-violet-500',
    Training: 'bg-sky-500',
    Offline: 'bg-slate-300',
    Disconnected: 'bg-rose-400',
    // Task
    'To Do': 'bg-slate-400',
    'In Progress': 'bg-blue-500',
    Review: 'bg-amber-500',
    Completed: 'bg-emerald-500',
    Rejected: 'bg-rose-500',
    // Attendance
    Present: 'bg-emerald-500',
    Late: 'bg-amber-500',
    Absent: 'bg-rose-500',
    'Half Day': 'bg-amber-400',
    Leave: 'bg-violet-400',
    Holiday: 'bg-slate-300',
    Incomplete: 'bg-rose-400',
    // Tickets
    Open: 'bg-blue-500',
    Waiting: 'bg-amber-500',
    Resolved: 'bg-emerald-500',
    Closed: 'bg-slate-400',
    // Deliverables
    Submitted: 'bg-blue-500',
    'Under Review': 'bg-amber-500',
    Approved: 'bg-emerald-500',
    'Revision Requested': 'bg-rose-500',
    // Priority
    Urgent: 'bg-rose-500',
    High: 'bg-amber-500',
    Medium: 'bg-blue-400',
    Low: 'bg-slate-400',
    // Contract / generic
    Active: 'bg-emerald-500',
    Trial: 'bg-blue-500',
    'On Hold': 'bg-amber-500',
    Ended: 'bg-slate-400',
    // QA
    Good: 'bg-emerald-500',
    Watch: 'bg-amber-500',
    Issue: 'bg-rose-500',
    Pass: 'bg-emerald-500',
    Fail: 'bg-rose-500',
    Pending: 'bg-amber-400',
  }
  const dot = colors[status] ?? 'bg-slate-400'
  const dotSize = size === 'xs' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-2.5 w-2.5' : 'h-2 w-2'
  const labelSize = size === 'xs' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-[11px]'
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('rounded-full inline-block shrink-0', dotSize, dot, status === 'Working' && 'live-pulse')} />
      <span className={cn('font-medium text-muted-foreground', labelSize)}>{label ?? status}</span>
    </span>
  )
}

/** Subtle pill */
export function Pill({ children, tone = 'default', className }: { children: React.ReactNode; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'; className?: string }) {
  const tones: Record<string, string> = {
    default: 'bg-muted text-foreground',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
    danger: 'bg-rose-50 text-rose-700 ring-rose-200',
    info: 'bg-blue-50 text-blue-700 ring-blue-200',
    muted: 'bg-slate-100 text-slate-600 ring-slate-200',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset', tones[tone], className)}>{children}</span>
}

/** Section header for view sections */
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/** Empty state */
export function EmptyState({ title, description, action, icon: Icon }: { title: string; description?: string; action?: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {Icon && <Icon className="h-8 w-8 text-muted-foreground/40 mb-3" />}
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Loading skeleton */
export function LoadingSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 shimmer rounded-md" />
      ))}
    </div>
  )
}

/** Inline progress bar */
export function MiniProgress({ value, className, tone = 'default' }: { value: number; className?: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const toneColor = tone === 'success' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-500' : tone === 'danger' ? 'bg-rose-500' : 'bg-foreground'
  return (
    <div className={cn('h-1.5 w-full rounded-full bg-muted overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all duration-500', toneColor)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

/** Avatar with initials fallback */
export function Avatar({ name, src, size = 'md', className }: { name: string; src?: string | null; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const dim = size === 'xs' ? 'h-6 w-6 text-[10px]' : size === 'sm' ? 'h-7 w-7 text-[11px]' : size === 'lg' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs'
  if (src) return <img src={src} alt={name} className={cn('rounded-full object-cover', dim, className)} />
  return (
    <div className={cn('rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 font-medium flex items-center justify-center shrink-0', dim, className)}>
      {initials}
    </div>
  )
}
