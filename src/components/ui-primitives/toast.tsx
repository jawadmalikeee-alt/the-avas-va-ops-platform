'use client'

import { create } from 'zustand'
import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastStore {
  toasts: Toast[]
  add: (type: ToastType, message: string) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (type, message) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function toast(message: string, type: ToastType = 'success') {
  useToastStore.getState().add(type, message)
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info
        const color = t.type === 'success' ? 'text-emerald-600' : t.type === 'error' ? 'text-rose-600' : 'text-blue-600'
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg',
              'animate-in slide-in-from-top-2 fade-in duration-200'
            )}
          >
            <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', color)} />
            <p className="text-sm text-foreground flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** Hook for safe client-side hydration */
export function useHydrated() {
  const [h, setH] = useState(false)
  useEffect(() => {
    // use queueMicrotask to defer setState outside the effect body
    queueMicrotask(() => setH(true))
  }, [])
  return h
}
