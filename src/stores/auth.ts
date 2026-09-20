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
          const res = await fetch('/api/auth/me', { cache: 'no-store' })
          if (!res.ok) {
            set({ user: null, loading: false })
            return
          }
          const data = await res.json()
          set({ user: data.user, loading: false })
        } catch {
          set({ user: null, loading: false })
        }
      },
      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        set({ user: null, loading: false })
      },
    }),
    { name: 'avas-auth' }
  )
)
