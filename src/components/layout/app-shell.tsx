'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/stores/auth'
import { Brand } from '@/components/brand'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui-primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard, Users, UserCog, GitBranch, Clock3, ListTodo, Package,
  ShieldCheck, FileText, MessageSquare, FolderOpen, Receipt, BarChart3,
  Bell, Settings, ScrollText, Search, Plus, LogOut, ChevronLeft, ChevronRight,
  Menu, X, Command, User, Send, Calendar, FileCheck, ClipboardList, FileBarChart,
  CheckCircle2, AlertTriangle, Info
} from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'

// ============================================================
// NAV DEFINITIONS — per role
// ============================================================

type NavItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }

const ADMIN_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'live', label: 'Live Operations', icon: Radio },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'vas', label: 'VAs & Agents', icon: UserCog },
  { id: 'assignments', label: 'Assignments', icon: GitBranch },
  { id: 'time', label: 'Time & Attendance', icon: Clock3 },
  { id: 'tasks', label: 'Tasks & Projects', icon: ListTodo },
  { id: 'services', label: 'Service Delivery', icon: Package },
  { id: 'qa', label: 'QA & Quality', icon: ShieldCheck },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'billing', label: 'Billing & Hours', icon: Receipt },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'audit', label: 'Audit Logs', icon: ScrollText },
]

const CLIENT_NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'my-vas', label: 'My VAs', icon: UserCog },
  { id: 'time', label: 'Time & Attendance', icon: Clock3 },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'services', label: 'Service Delivery', icon: Package },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'quality', label: 'Quality', icon: ShieldCheck },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'requests', label: 'Requests', icon: Send },
  { id: 'account', label: 'Account', icon: Settings },
]

const VA_NAV: NavItem[] = [
  { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'My Tasks', icon: ListTodo },
  { id: 'schedule', label: 'My Schedule', icon: Calendar },
  { id: 'tracker', label: 'Time Tracker', icon: Clock3 },
  { id: 'submission', label: 'Work Submission', icon: FileCheck },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'feedback', label: 'QA & Feedback', icon: ShieldCheck },
  { id: 'documents', label: 'Documents & SOPs', icon: ClipboardList },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
]

// Import Radio here to avoid circular issues
import { Radio } from 'lucide-react'

interface AppShellProps {
  activeView: string
  setActiveView: (v: string) => void
  children: React.ReactNode
}

export function AppShell({ activeView, setActiveView, children }: AppShellProps) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [quickActionOpen, setQuickActionOpen] = useState(false)

  const nav = user?.role === 'ADMIN' || user?.role === 'OPERATIONS_MANAGER' || user?.role === 'TEAM_LEAD' || user?.role === 'QA_MANAGER' ? ADMIN_NAV : user?.role === 'CLIENT' ? CLIENT_NAV : VA_NAV

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen((v) => !v)
      }
      if (e.key === 'Escape') {
        setCmdOpen(false)
        setNotifOpen(false)
        setProfileOpen(false)
        setQuickActionOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const roleLabel = user?.role === 'ADMIN' ? 'Admin Console' : user?.role === 'CLIENT' ? 'Client Portal' : 'VA Workspace'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-sidebar shrink-0 transition-all duration-200',
          collapsed ? 'w-[60px]' : 'w-[240px]'
        )}
      >
        <div className={cn('flex items-center h-14 px-4 border-b border-border', collapsed && 'justify-center px-0')}>
          {collapsed ? <Brand showText={false} /> : <Brand />}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {nav.map((item) => {
            const active = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors w-full',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-foreground')} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && item.badge && (
                  <Badge className="ml-auto h-4 px-1 text-[10px]">{item.badge}</Badge>
                )}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-border p-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-2 w-full rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5 mx-auto" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[260px] bg-sidebar border-r border-border flex flex-col">
            <div className="flex items-center justify-between h-14 px-4 border-b border-border">
              <Brand />
              <button onClick={() => setMobileOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
              {nav.map((item) => {
                const active = activeView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveView(item.id); setMobileOpen(false) }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm w-full',
                      active ? 'bg-sidebar-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{roleLabel}</span>
              <span className="text-border">/</span>
              <span className="capitalize">{activeView.replace(/-/g, ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search trigger (admin) */}
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-md border border-border bg-muted/30 hover:bg-muted px-2.5 py-1.5 text-xs text-muted-foreground transition-colors w-56"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search…</span>
              <kbd className="ml-auto inline-flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 text-[10px]">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>

            {/* Quick action (+) */}
            <QuickActionMenu open={quickActionOpen} setOpen={setQuickActionOpen} role={user?.role ?? ''} setActiveView={setActiveView} />

            {/* Notifications */}
            <NotificationBell open={notifOpen} setOpen={setNotifOpen} />

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md hover:bg-muted px-1.5 py-1 transition-colors"
              >
                <Avatar name={user?.name ?? 'User'} src={user?.avatarUrl} size="sm" />
                <div className="hidden lg:block text-left leading-tight">
                  <div className="text-xs font-medium text-foreground">{user?.name}</div>
                  <div className="text-[10px] text-muted-foreground">{user?.role.toLowerCase()}</div>
                </div>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-1 w-56 rounded-lg border border-border bg-popover shadow-lg z-50 py-1 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                    <div className="px-3 py-2 border-b border-border">
                      <div className="text-sm font-medium text-foreground truncate">{user?.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
                    </div>
                    <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-foreground hover:bg-muted">
                      <User className="h-3.5 w-3.5" /> Profile
                    </button>
                    <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-foreground hover:bg-muted">
                      <Settings className="h-3.5 w-3.5" /> Preferences
                    </button>
                    <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-foreground hover:bg-muted">
                      <Bell className="h-3.5 w-3.5" /> Notification settings
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => { logout(); toast('Signed out successfully', 'success') }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <MobileBottomNav nav={nav} activeView={activeView} setActiveView={setActiveView} />
      </div>

      {/* Command palette */}
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} setActiveView={setActiveView} nav={nav} />
    </div>
  )
}

// ============================================================
// Notification Bell
// ============================================================

function NotificationBell({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { user } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      const data = await res.json()
      setItems(data.items ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open])

  const unread = items.filter((i) => !i.read).length

  const markAll = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
    load()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-[340px] max-h-[460px] rounded-lg border border-border bg-popover shadow-lg z-50 flex flex-col animate-in fade-in-0 slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Notifications</span>
                {unread > 0 && <Badge className="h-4 px-1 text-[10px] bg-rose-500 text-white">{unread} new</Badge>}
              </div>
              <button onClick={markAll} className="text-[11px] text-muted-foreground hover:text-foreground">Mark all read</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">Loading…</div>
              ) : items.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">No notifications yet.</div>
              ) : (
                items.map((n) => (
                  <div key={n.id} className={cn('px-3 py-2.5 border-b border-border/50 hover:bg-muted/40 cursor-pointer', !n.read && 'bg-blue-50/40')}>
                    <div className="flex items-start gap-2">
                      <NotifIcon type={n.type} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground truncate">{n.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2">{n.body}</div>
                        <div className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function NotifIcon({ type }: { type: string }) {
  const Icon = type.includes('qa') ? ShieldCheck : type.includes('urgent') || type.includes('late') ? AlertTriangle : type.includes('completed') ? CheckCircle2 : Info
  const color = type.includes('urgent') || type.includes('late') ? 'text-rose-500' : type.includes('completed') ? 'text-emerald-500' : 'text-blue-500'
  return <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', color)} />
}

function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ============================================================
// Quick Action Menu
// ============================================================

function QuickActionMenu({ open, setOpen, role, setActiveView }: { open: boolean; setOpen: (v: boolean) => void; role: string; setActiveView: (v: string) => void }) {
  const actions: Record<string, Array<{ label: string; view?: string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void }>> = {
    ADMIN: [
      { label: 'Add Client', view: 'clients', icon: Users },
      { label: 'Add VA', view: 'vas', icon: UserCog },
      { label: 'Assign VA', view: 'assignments', icon: GitBranch },
      { label: 'Create Task', view: 'tasks', icon: ListTodo },
      { label: 'Create Service', view: 'services', icon: Package },
      { label: 'Create Report', view: 'reports', icon: FileText },
      { label: 'Add QA Review', view: 'qa', icon: ShieldCheck },
    ],
    CLIENT: [
      { label: 'Request Task', view: 'requests', icon: Send },
      { label: 'Upload File', view: 'documents', icon: FolderOpen },
      { label: 'Message AVAS', view: 'messages', icon: MessageSquare },
    ],
    VA: [
      { label: 'Start Shift', view: 'tracker', icon: Clock3 },
      { label: 'Create Work Submission', view: 'submission', icon: FileCheck },
    ],
  }
  const items = actions[role] ?? []
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-8 w-8 flex items-center justify-center rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-52 rounded-lg border border-border bg-popover shadow-lg z-50 py-1 animate-in fade-in-0 slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">Quick actions</div>
            {items.map((a) => (
              <button
                key={a.label}
                onClick={() => { if (a.view) setActiveView(a.view); setOpen(false); a.onClick?.() }}
                className="flex items-center gap-2.5 w-full px-3 py-1.5 text-xs text-foreground hover:bg-muted"
              >
                <a.icon className="h-3.5 w-3.5 text-muted-foreground" />
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// Command Palette
// ============================================================

function CommandPalette({ open, setOpen, setActiveView, nav }: { open: boolean; setOpen: (v: boolean) => void; setActiveView: (v: string) => void; nav: NavItem[] }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      queueMicrotask(() => setQuery(''))
    }
  }, [open])

  const filtered = nav.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
  const quickActions = [
    { label: 'Go to Dashboard', view: 'dashboard' },
    { label: 'Open Live Operations', view: 'live' },
    { label: 'View Clients', view: 'clients' },
    { label: 'View VAs', view: 'vas' },
    { label: 'Open Reports', view: 'reports' },
  ].filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-popover shadow-2xl z-10 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
        <div className="flex items-center border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or type a command…"
            className="flex-1 bg-transparent px-2.5 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-1.5">
          {quickActions.length > 0 && (
            <>
              <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wider">Quick actions</div>
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { setActiveView(a.view); setOpen(false) }}
                  className="flex items-center gap-2.5 w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted"
                >
                  <Command className="h-3.5 w-3.5 text-muted-foreground" />
                  {a.label}
                </button>
              ))}
            </>
          )}
          <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wider">Navigation</div>
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => { setActiveView(n.id); setOpen(false) }}
              className="flex items-center gap-2.5 w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted"
            >
              <n.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {n.label}
            </button>
          ))}
          {filtered.length === 0 && quickActions.length === 0 && (
            <div className="px-2 py-6 text-center text-xs text-muted-foreground">No results for "{query}"</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Mobile bottom nav
// ============================================================

function MobileBottomNav({ nav, activeView, setActiveView }: { nav: NavItem[]; activeView: string; setActiveView: (v: string) => void }) {
  const top5 = nav.slice(0, 5)
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex items-center justify-around px-1 py-1">
      {top5.map((item) => {
        const active = activeView === item.id
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn('flex flex-col items-center gap-0.5 px-2 py-1 rounded-md', active ? 'text-foreground' : 'text-muted-foreground')}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-[9px]">{item.label.split(' ')[0]}</span>
          </button>
        )
      })}
    </nav>
  )
}
