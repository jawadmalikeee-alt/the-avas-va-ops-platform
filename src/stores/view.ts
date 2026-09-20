'use client'

import { create } from 'zustand'

interface ViewState {
  view: string
  setView: (v: string) => void
  // Optional context (e.g., selected entity ID)
  context: Record<string, any>
  setContext: (c: Record<string, any>) => void
}

export const useViewStore = create<ViewState>((set) => ({
  view: 'dashboard',
  setView: (v) => set({ view: v }),
  context: {},
  setContext: (c) => set({ context: c }),
}))
