'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/stores/auth'
import { AppShell } from '@/components/layout/app-shell'
import { LoginScreen } from '@/components/views/login'
import { ToastContainer, useHydrated } from '@/components/ui-primitives/toast'
import { useViewStore } from '@/stores/view'
import { Skeleton } from '@/components/ui/skeleton'

// View renderers
import { AdminDashboard } from '@/components/views/admin/dashboard'
import { AdminLiveOps } from '@/components/views/admin/live-ops'
import { AdminClients } from '@/components/views/admin/clients'
import { AdminVAs } from '@/components/views/admin/vas'
import { AdminAssignments } from '@/components/views/admin/assignments'
import { AdminTimeAttendance } from '@/components/views/admin/time'
import { AdminTasks } from '@/components/views/admin/tasks'
import { AdminServices } from '@/components/views/admin/services'
import { AdminQA } from '@/components/views/admin/qa'
import { AdminRequests } from '@/components/views/admin/requests'
import { AdminReports } from '@/components/views/admin/reports'
import { AdminCommunication } from '@/components/views/admin/communication'
import { AdminDocuments } from '@/components/views/admin/documents'
import { AdminBilling } from '@/components/views/admin/billing'
import { AdminAnalytics } from '@/components/views/admin/analytics'
import { AdminSettings } from '@/components/views/admin/settings'
import { AdminAudit } from '@/components/views/admin/audit'
import { AdminNotifications } from '@/components/views/admin/notifications'

import { ClientOverview } from '@/components/views/client/overview'
import { ClientMyVAs } from '@/components/views/client/my-vas'
import { ClientTime } from '@/components/views/client/time'
import { ClientHours } from '@/components/views/client/hours'
import { ClientTasks } from '@/components/views/client/tasks'
import { ClientServices } from '@/components/views/client/services'
import { ClientReports } from '@/components/views/client/reports'
import { ClientQuality } from '@/components/views/client/quality'
import { ClientDocuments } from '@/components/views/client/documents'
import { ClientRequests } from '@/components/views/client/requests'
import { ClientAccount } from '@/components/views/client/account'

import { VADashboard } from '@/components/views/va/dashboard'
import { VATasks } from '@/components/views/va/tasks'
import { VASchedule } from '@/components/views/va/schedule'
import { VATracker } from '@/components/views/va/tracker'
import { VASubmission } from '@/components/views/va/submission'
import { VAReports } from '@/components/views/va/reports'
import { VAFeedback } from '@/components/views/va/feedback'
import { VADocuments } from '@/components/views/va/documents'
import { VANotifications } from '@/components/views/va/notifications'
import { VAProfile } from '@/components/views/va/profile'

// Shared chat interface and profile editor for all roles
import { ChatInterface } from '@/components/views/chat-interface'
import { ProfileEditor } from '@/components/views/profile-editor'
import { IncomingCallListener } from '@/components/call-listener'

function AdminView({ view }: { view: string }) {
  switch (view) {
    case 'dashboard': return <AdminDashboard />
    case 'live': return <AdminLiveOps />
    case 'clients': return <AdminClients />
    case 'vas': return <AdminVAs />
    case 'assignments': return <AdminAssignments />
    case 'time': return <AdminTimeAttendance />
    case 'tasks': return <AdminTasks />
    case 'services': return <AdminServices />
    case 'qa': return <AdminQA />
    case 'requests': return <AdminRequests />
    case 'reports': return <AdminReports />
    case 'communication': return <ChatInterface />
    case 'documents': return <AdminDocuments />
    case 'billing': return <AdminBilling />
    case 'analytics': return <AdminAnalytics />
    case 'settings': return <AdminSettings />
    case 'audit': return <AdminAudit />
    case 'notifications': return <AdminNotifications />
    default: return <AdminDashboard />
  }
}

function ClientView({ view }: { view: string }) {
  switch (view) {
    case 'overview': return <ClientOverview />
    case 'my-vas': return <ClientMyVAs />
    case 'time': return <ClientTime />
    case 'hours': return <ClientHours />
    case 'tasks': return <ClientTasks />
    case 'services': return <ClientServices />
    case 'reports': return <ClientReports />
    case 'quality': return <ClientQuality />
    case 'documents': return <ClientDocuments />
    case 'messages': return <ChatInterface />
    case 'requests': return <ClientRequests />
    case 'account': return <ProfileEditor />
    default: return <ClientOverview />
  }
}

function VAView({ view }: { view: string }) {
  switch (view) {
    case 'dashboard': return <VADashboard />
    case 'tasks': return <VATasks />
    case 'schedule': return <VASchedule />
    case 'tracker': return <VATracker />
    case 'submission': return <VASubmission />
    case 'reports': return <VAReports />
    case 'feedback': return <VAFeedback />
    case 'documents': return <VADocuments />
    case 'messages': return <ChatInterface />
    case 'notifications': return <VANotifications />
    case 'profile': return <ProfileEditor />
    default: return <VADashboard />
  }
}

export default function Page() {
  const hydrated = useHydrated()
  const { user, loading, fetchUser } = useAuth()
  const { view, setView } = useViewStore()
  const [forceTimeout, setForceTimeout] = useState(false)

  // Fetch user on mount
  useEffect(() => {
    if (hydrated) fetchUser()
  }, [hydrated, fetchUser])

  // Safety timeout: if loading doesn't resolve in 6 seconds, force show login
  useEffect(() => {
    if (!hydrated || !loading) return
    const timer = setTimeout(() => {
      setForceTimeout(true)
    }, 6000)
    return () => clearTimeout(timer)
  }, [hydrated, loading])

  // Reset view when user changes (logout/login)
  useEffect(() => {
    if (!user) setView('dashboard')
  }, [user, setView])

  // Show loading skeleton during initial hydration
  // BUT: force timeout after 6 seconds so app never hangs forever
  if (!hydrated || (loading && !user && !forceTimeout)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <img src="/avas-icon.svg" alt="The AVAS" width={48} height={48} className="rounded-[18%] shadow-apple mx-auto mb-3 animate-pulse" />
          <div className="text-xs text-foreground/70 font-semibold">Loading The AVAS…</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    )
  }

  return (
    <>
      <AppShell activeView={view} setActiveView={setView}>
        {user.role === 'CLIENT' ? <ClientView view={view} /> : user.role === 'VA' ? <VAView view={view} /> : <AdminView view={view} />}
      </AppShell>
      <IncomingCallListener
        onCallAccepted={(call) => {
          setView('messages')
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('avas:incoming-call-accepted', { detail: call }))
          }, 100)
        }}
      />
      <ToastContainer />
    </>
  )
}
