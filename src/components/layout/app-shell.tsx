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
  CheckCircle2, AlertTriangle, Info, Radio, Building2, Phone
} from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'

// ============================================================
// NAV DEFINITIONS — per role
// ============================================================

type NavItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number; group?: string }

const ADMIN_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { id: 'live', label: 'Live Operations', icon: Radio, group: 'Overview' },
  { id: 'clients', label: 'Clients', icon: Users, group: 'Workforce' },
  { id: 'vas', label: 'VAs & Agents', icon: UserCog, group: 'Workforce' },
  { id: 'assignments', label: 'Assignments', icon: GitBranch, group: 'Workforce' },
  { id: 'time', label: 'Time & Attendance', icon: Clock3, group: 'Operations' },
  { id: 'tasks', label: 'Tasks & Projects', icon: ListTodo, group: 'Operations' },
  { id: 'services', label: 'Service Delivery', icon: Package, group: 'Operations' },
  { id: 'qa', label: 'QA & Quality', icon: ShieldCheck, group: 'Operations' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'Insights' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'Insights' },
  { id: 'communication', label: 'Communication', icon: MessageSquare, group: 'Workspace' },
  { id: 'documents', label: 'Documents', icon: FolderOpen, group: 'Workspace' },
  { id: 'billing', label: 'Billing & Hours', icon: Receipt, group: 'Workspace' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'System' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'System' },
  { id: 'audit', label: 'Audit Logs', icon: ScrollText, group: 'System' },
]

const CLIENT_NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'Main' },
  { id: 'my-vas', label: 'My VAs', icon: UserCog, group: 'Main' },
  { id: 'time', label: 'Time & Attendance', icon: Clock3, group: 'Main' },
  { id: 'tasks', label: 'Tasks', icon: ListTodo, group: 'Work' },
  { id: 'services', label: 'Service Delivery', icon: Package, group: 'Work' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'Work' },
  { id: 'quality', label: 'Quality', icon: ShieldCheck, group: 'Work' },
  { id: 'documents', label: 'Documents', icon: FolderOpen, group: 'Workspace' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, group: 'Workspace' },
  { id: 'requests', label: 'Requests', icon: Send, group: 'Workspace' },
  { id: 'account', label: 'Account', icon: Settings, group: 'System' },
]

const VA_NAV: NavItem[] = [
  { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard, group: 'Main' },
  { id: 'tasks', label: 'My Tasks', icon: ListTodo, group: 'Main' },
  { id: 'schedule', label: 'My Schedule', icon: Calendar, group: 'Main' },
  { id: 'tracker', label: 'Time Tracker', icon: Clock3, group: 'Work' },
  { id: 'submission', label: 'Work Submission', icon: FileCheck, group: 'Work' },
  { id: 'reports', label: 'Reports', icon: FileBarChart, group: 'Work' },
  { id: 'feedback', label: 'QA & Feedback', icon: ShieldCheck, group: 'Work' },
  { id: 'documents', label: 'Documents & SOPs', icon: ClipboardList, group: 'Workspace' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, group: 'Workspace' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'System' },
  { id: 'profile', label: 'Profile', icon: User, group: 'System' },
]

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

  // Group nav by group field
  const groupedNav: { group: string; items: NavItem[] }[] = []
  let currentGroup = ''
  nav.forEach((item) => {
    const g = item.group ?? ''
    if (g !== currentGroup) {
      groupedNav.push({ group: g, items: [] })
      currentGroup = g
    }
    groupedNav[groupedNav.length - 1].items.push(item)
  })

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

  const roleLabel = user?.role === 'ADMIN' ? 'Admin Console' : user?.role === 'CLIENT' ? 'Client Portal' : 'VA Workspace'
  const roleTagline = user?.role === 'ADMIN' ? 'Operations Command Center' : user?.role === 'CLIENT' ? 'Your VA Control Center' : 'Your Workspace'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop (corporate navy) */}
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 transition-all duration-200 sidebar-navy',
          collapsed ? 'w-[64px]' : 'w-[248px]'
        )}
      >
        {/* Brand header */}
        <div className={cn('flex items-center h-16 px-4 border-b border-white/10', collapsed && 'justify-center px-0')}>
          {collapsed ? (
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="7" fill="#ffffff" />
              <path d="M9 22L16 8L23 22M12 17H20" stroke="#5271ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <div className="flex items-center gap-2.5">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="7" fill="#ffffff" />
                <path d="M9 22L16 8L23 22M12 17H20" stroke="#5271ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="leading-none">
                <div className="text-sm font-display font-bold tracking-tight text-white">THE AVAS</div>
                <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/60 mt-0.5">VA Operations</div>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {groupedNav.map((g) => (
            <div key={g.group}>
              {!collapsed && (
                <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">{g.group}</div>
              )}
              <div className="space-y-1">
                {g.items.map((item) => {
                  const active = activeView === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm transition-all w-full btn-press',
                        collapsed && 'justify-center px-0',
                        active
                          ? 'bg-white text-avas-blue font-bold shadow-apple'
                          : 'text-white/85 hover:bg-white/10 hover:text-white font-medium'
                      )}
                    >
                      <item.icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-avas-blue' : 'text-white/80')} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <Badge className="ml-auto h-5 px-1.5 text-[10px] bg-gold text-navy">{item.badge}</Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-2 space-y-0.5">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-2 w-full rounded-md px-2.5 py-1.5 text-xs text-white/40 hover:bg-white/5 hover:text-white/80"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5 mx-auto" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[280px] sidebar-navy flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="7" fill="#ffffff" />
                  <path d="M9 22L16 8L23 22M12 17H20" stroke="#5271ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="leading-none">
                  <div className="text-sm font-display font-bold tracking-tight text-white">THE AVAS</div>
                  <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/60 mt-0.5">VA Operations</div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
              {groupedNav.map((g) => (
                <div key={g.group}>
                  <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">{g.group}</div>
                  <div className="space-y-1">
                    {g.items.map((item) => {
                      const active = activeView === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setActiveView(item.id); setMobileOpen(false) }}
                          className={cn(
                            'flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm w-full',
                            active ? 'bg-white text-avas-blue font-bold shadow-apple' : 'text-white/85 hover:bg-white/10 hover:text-white font-medium'
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border glass flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden text-navy" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium">{roleLabel}</div>
                <div className="text-sm font-display font-semibold text-navy leading-tight">{roleTagline}</div>
              </div>
              <div className="h-8 w-px bg-border mx-1" />
              <div className="text-xs text-muted-foreground capitalize">
                {activeView.replace(/-/g, ' ')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-full border border-border bg-card hover:bg-muted px-3 py-1.5 text-xs text-muted-foreground transition-colors w-64 focus-gold shadow-apple"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search or jump to…</span>
              <kbd className="ml-auto inline-flex items-center gap-0.5 rounded border border-border bg-background px-1 py-0.5 text-[10px]">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>

            {/* Quick action */}
            <QuickActionMenu open={quickActionOpen} setOpen={setQuickActionOpen} role={user?.role ?? ''} setActiveView={setActiveView} />

            {/* Notifications */}
            <NotificationBell open={notifOpen} setOpen={setNotifOpen} />

            {/* Profile */}
            <div className="relative ml-1">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md hover:bg-muted px-1.5 py-1 transition-colors"
              >
                <Avatar name={user?.name ?? 'User'} src={user?.avatarUrl} size="sm" />
                <div className="hidden lg:block text-left leading-tight">
                  <div className="text-xs font-semibold text-navy">{user?.name}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">{user?.role.toLowerCase()}</div>
                </div>
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-1 w-64 rounded-2xl border border-border bg-popover shadow-apple-lg z-50 py-1.5 overflow-hidden animate-scale-in">
                    <div className="px-3 py-2.5 border-b border-border">
                      <div className="text-sm font-semibold text-navy truncate">{user?.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-muted-foreground">Active now</span>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-foreground hover:bg-muted">
                      <User className="h-3.5 w-3.5 text-muted-foreground" /> Profile & preferences
                    </button>
                    <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-foreground hover:bg-muted">
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Account settings
                    </button>
                    <button className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-foreground hover:bg-muted">
                      <Bell className="h-3.5 w-3.5 text-muted-foreground" /> Notification settings
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
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6">
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
        className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-navy transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 min-w-4 px-1 rounded-full bg-gold text-navy text-[9px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-[360px] max-h-[480px] rounded-2xl border border-border bg-popover shadow-apple-lg z-50 flex flex-col overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-navy">Notifications</span>
                {unread > 0 && <Badge className="h-4 px-1 text-[10px] bg-gold text-navy">{unread} new</Badge>}
              </div>
              <button onClick={markAll} className="text-[11px] text-gold hover:text-gold-dark font-medium">Mark all read</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">Loading…</div>
              ) : items.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                  <Bell className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" />
                  No notifications yet.
                </div>
              ) : (
                items.map((n) => (
                  <div key={n.id} className={cn('px-3 py-2.5 border-b border-border/50 hover:bg-muted/40 cursor-pointer', !n.read && 'bg-gold/5')}>
                    <div className="flex items-start gap-2">
                      <NotifIcon type={n.type} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-navy truncate">{n.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>
                        <div className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</div>
                      </div>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-gold mt-1.5 shrink-0" />}
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
      { label: 'New QA Review', view: 'qa', icon: ShieldCheck },
      { label: 'Generate Report', view: 'reports', icon: FileText },
    ],
    CLIENT: [
      { label: 'New Task Request', view: 'requests', icon: Send },
      { label: 'Upload Document', view: 'documents', icon: FolderOpen },
      { label: 'Message AVAS', view: 'messages', icon: MessageSquare },
    ],
    VA: [
      { label: 'Start Shift', view: 'tracker', icon: Clock3 },
      { label: 'Submit Work', view: 'submission', icon: FileCheck },
    ],
  }
  const items = actions[role] ?? []
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-9 w-9 flex items-center justify-center rounded-full bg-navy text-white hover:bg-navy-light transition-colors shadow-apple btn-press"
        title="Quick actions"
      >
        <Plus className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-56 rounded-2xl border border-border bg-popover shadow-apple-lg z-50 py-1.5 animate-scale-in overflow-hidden">
            <div className="px-3 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Quick actions</div>
            {items.map((a) => (
              <button
                key={a.label}
                onClick={() => { if (a.view) setActiveView(a.view); setOpen(false); a.onClick?.() }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-navy hover:bg-muted font-medium"
              >
                <a.icon className="h-3.5 w-3.5 text-gold" />
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
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-popover shadow-2xl z-10 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150 overflow-hidden">
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
              <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Quick actions</div>
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => { setActiveView(a.view); setOpen(false) }}
                  className="flex items-center gap-2.5 w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted text-navy"
                >
                  <Command className="h-3.5 w-3.5 text-gold" />
                  {a.label}
                </button>
              ))}
            </>
          )}
          <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-2">Navigation</div>
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => { setActiveView(n.id); setOpen(false) }}
              className="flex items-center gap-2.5 w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted text-navy"
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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 flex items-center justify-around px-1 py-1">
      {top5.map((item) => {
        const active = activeView === item.id
        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn('flex flex-col items-center gap-0.5 px-2 py-1 rounded-md', active ? 'text-navy' : 'text-muted-foreground')}
          >
            <item.icon className={cn('h-4 w-4', active && 'text-gold')} />
            <span className="text-[9px] font-medium">{item.label.split(' ')[0]}</span>
          </button>
        )
      })}
    </nav>
  )
}
