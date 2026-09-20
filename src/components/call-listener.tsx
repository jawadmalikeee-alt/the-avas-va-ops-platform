'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/stores/auth'
import { Avatar } from '@/components/ui-primitives'
import { Phone, Video, X, PhoneCall } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import { cn } from '@/lib/utils'

interface IncomingCall {
  id: string
  type: 'audio' | 'video'
  roomId: string
  roomUrl: string
  callerName: string
  callerAvatarUrl?: string | null
  callerId: string
  createdAt: string
}

/**
 * Listens for incoming calls every 2s and shows an incoming call overlay.
 * Also handles browser notifications for new messages/calls.
 */
export function IncomingCallListener({ onCallAccepted }: { onCallAccepted: (call: IncomingCall) => void }) {
  const { user } = useAuth()
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [declinedCallIds, setDeclinedCallIds] = useState<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastNotifiedCallId = useRef<string | null>(null)

  // Browser notification permission
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // Ringtone control functions (defined before effects that use them)
  const playRingtone = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.loop = true
      audioRef.current.play().catch(() => {})
    }
  }

  const stopRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  // Poll for incoming calls
  useEffect(() => {
    if (!user) return
    let active = true

    const checkForCalls = async () => {
      if (!active) return
      try {
        const res = await fetch('/api/calls/status', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (data.hasIncomingCall && data.call && !declinedCallIds.has(data.call.id)) {
          setIncomingCall(data.call)
          // Play ringtone
          playRingtone()
          // Browser notification
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notif = new Notification(`Incoming ${data.call.type === 'video' ? 'Video' : 'Audio'} Call`, {
              body: `${data.call.callerName} is calling you…`,
              icon: '/avas-icon.svg',
              badge: '/avas-icon.svg',
              tag: `call-${data.call.id}`,
              requireInteraction: true,
              vibrate: [200, 100, 200, 100, 200],
            })
            notif.onclick = () => {
              window.focus()
              notif.close()
            }
          }
          lastNotifiedCallId.current = data.call.id
        } else if (!data.hasIncomingCall && incomingCall && !declinedCallIds.has(incomingCall.id)) {
          // Call was answered/missed/cancelled elsewhere
          stopRingtone()
          setIncomingCall(null)
        }
      } catch {}
    }

    // Check immediately, then every 2 seconds
    checkForCalls()
    const interval = setInterval(checkForCalls, 2000)
    return () => {
      active = false
      clearInterval(interval)
      stopRingtone()
    }
  }, [user, declinedCallIds, incomingCall])

  // Also poll for new notifications — show toast + browser notification
  const [lastNotificationIds, setLastNotificationIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!user) return
    let active = true

    const checkNotifications = async () => {
      if (!active) return
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const items: any[] = data.items ?? []
        // Find new notifications we haven't seen yet
        const newOnes = items.filter((n) => !lastNotificationIds.has(n.id) && !n.read && n.type !== 'call')
        if (newOnes.length > 0 && lastNotificationIds.size > 0) {
          // Show toast for the latest
          const latest = newOnes[0]
          toast(`${latest.title}\n${latest.body ?? ''}`, 'info')
          // Browser notification
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(latest.title, {
              body: latest.body ?? '',
              icon: '/avas-icon.svg',
              badge: '/avas-icon.svg',
              tag: latest.id,
            })
          }
        }
        setLastNotificationIds(new Set(items.map((n) => n.id)))
      } catch {}
    }

    // Initial load — just record IDs, no toast
    fetch('/api/notifications', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const items: any[] = data.items ?? []
        setLastNotificationIds(new Set(items.map((n) => n.id)))
      })
      .catch(() => {})

    const interval = setInterval(checkNotifications, 4000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [user])

  const accept = async () => {
    if (!incomingCall) return
    stopRingtone()
    try {
      await fetch('/api/calls/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: incomingCall.id, status: 'accepted' }),
      })
      onCallAccepted(incomingCall)
      setIncomingCall(null)
    } catch {
      toast('Failed to accept call', 'error')
    }
  }

  const decline = async () => {
    if (!incomingCall) return
    stopRingtone()
    try {
      await fetch('/api/calls/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: incomingCall.id, status: 'declined' }),
      })
      setDeclinedCallIds((prev) => new Set(prev).add(incomingCall.id))
      setIncomingCall(null)
    } catch {
      setIncomingCall(null)
    }
  }

  if (!incomingCall) return null

  return (
    <>
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgSrLwVDPi5RjIkGqlixA2gUQ/hOE9oHhYFEQOGXx6eRwZkOOAmpOVYGRaOAm1hmpNQyAAA" type="audio/wav" />
      </audio>

      <div className="fixed inset-0 z-[200] flex items-center justify-center animate-scale-in">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={decline} />

        <div className="relative w-full max-w-md mx-auto p-6">
          {/* Caller info */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              {/* Pulsing rings */}
              <span className="absolute inset-0 rounded-full bg-avas-blue/30 ring-pulse" />
              <span className="absolute inset-0 rounded-full bg-avas-blue/20 ring-pulse" style={{ animationDelay: '0.5s' }} />
              <Avatar name={incomingCall.callerName} src={incomingCall.callerAvatarUrl} size="lg" className="h-32 w-32 text-4xl relative" />
            </div>
            <h2 className="text-2xl font-display text-white">{incomingCall.callerName}</h2>
            <p className="text-sm text-white/60 mt-1 flex items-center justify-center gap-1.5">
              {incomingCall.type === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
              Incoming {incomingCall.type === 'video' ? 'video' : 'audio'} call…
            </p>
          </div>

          {/* Call controls */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={decline}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="h-16 w-16 rounded-full bg-rose-500 flex items-center justify-center shadow-apple-lg group-hover:bg-rose-600 transition-colors btn-press">
                <PhoneCall className="h-7 w-7 text-white rotate-[135deg]" />
              </div>
              <span className="text-xs font-medium text-white/80">Decline</span>
            </button>

            <button
              onClick={accept}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-apple-lg group-hover:bg-emerald-600 transition-colors btn-press live-glow">
                {incomingCall.type === 'video' ? <Video className="h-7 w-7 text-white" /> : <Phone className="h-7 w-7 text-white" />}
              </div>
              <span className="text-xs font-medium text-white/80">Accept</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
