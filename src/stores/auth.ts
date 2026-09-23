'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'CLIENT' | 'VA' | 'OPERATIONS_MANAGER' | 'TEAM_LEAD' | 'QA_MANAGER'
  timezone: string
  phone: string | null
  avatarUrl: string | null
  jobTitle: string | null
  designation: string | null
  customDesignation: string | null
  description: string | null
  status: string
  mustChangePassword: boolean
  lastLogin: string | null
  clientId: string | null
  client: {
    id: string
    companyName: string
    contactPerson: string
    email: string
    phone: string | null
    country: string
    industry: string
    package: string
    contractedHours: number
    billingCycle: string
    brandColor: string
    timezone: string
    canSeeHours: boolean
    canSeeQA: boolean
    canSeeActivity: boolean
    canSeeTaskDetails: boolean
    canMessageVA: boolean
    canApproveDeliverable: boolean
    canSeePerformance: boolean
  } | null
  va: {
    id: string
    specialization: string
    currentStatus: string
    shiftStartedAt: string | null
    performanceScore: number
    qualityScore: number
    attendanceScore: number
  } | null
}

interface AuthState {
  user: SessionUser | null
  loading: boolean
  setUser: (u: SessionUser | null) => void
  setLoading: (l: boolean) => void
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      setUser: (u) => set({ user: u, loading: false }),
      setLoading: (l) => set({ loading: l }),
      fetchUser: async () => {
        try {
          // Add 5-second timeout — never hang forever on "Loading The AVAS…"
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          const res = await fetch('/api/auth/me', {
            cache: 'no-store',
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          if (!res.ok) {
            set({ user: null, loading: false })
            return
          }
          const data = await res.json()
          set({ user: data.user, loading: false })
        } catch {
          // Timeout or network error — don't hang, show login page
          set({ user: null, loading: false })
        }
      },
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } catch {}
        set({ user: null, loading: false })
      },
    }),
    { name: 'avas-auth' }
  )
)
