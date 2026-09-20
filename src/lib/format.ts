/**
 * The AVAS — Shared utilities
 */

/** Format milliseconds as "8h 02m" or "0h 45m" */
export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '0h 00m'
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

/** Format milliseconds as HH:MM:SS for live timers */
export function formatTimer(ms: number): string {
  if (!ms || ms < 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Format a date for display in user's timezone-aware way */
export function formatDate(d: Date | string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('en-US', opts ?? { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export function formatTime(d: Date | string | null): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
}

export function formatDateTime(d: Date | string | null): string {
  if (!d) return '—'
  return `${formatDate(d)} ${formatTime(d)}`
}

export function formatRelative(d: Date | string | null): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function hoursFromMs(ms: number): number {
  return Math.round((ms / 3600000) * 100) / 100
}

/** Get initials from a name */
export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Status → color mapping */
export const STATUS_COLORS: Record<string, string> = {
  // VA status
  Working: 'bg-emerald-500',
  Online: 'bg-emerald-500',
  Break: 'bg-amber-500',
  Meeting: 'bg-violet-500',
  Training: 'bg-sky-500',
  Offline: 'bg-slate-300',
  Disconnected: 'bg-rose-400',
  // Task status
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
  'In Progress': 'bg-blue-500',
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
  // Contract
  Active: 'bg-emerald-500',
  Trial: 'bg-blue-500',
  'On Hold': 'bg-amber-500',
  Ended: 'bg-slate-400',
}

export function statusDot(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-slate-400'
}

export function priorityRank(p: string): number {
  return { Urgent: 0, High: 1, Medium: 2, Low: 3 }[p] ?? 4
}
