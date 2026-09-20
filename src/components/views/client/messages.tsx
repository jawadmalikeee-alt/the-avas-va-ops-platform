'use client'

import { useEffect, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, EmptyState, LoadingSkeleton } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { useAuth } from '@/stores/auth'
import { formatRelative } from '@/lib/format'
import { Send, MessageSquare, Search, Paperclip } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'

export function ClientMessages() {
  const { user } = useAuth()
  const [partners, setPartners] = useState<any[]>([])
  const [activePartner, setActivePartner] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const loadPartners = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/messages', { cache: 'no-store' })
      const data = await res.json()
      setPartners(data.partners ?? [])
      if (!activePartner && data.partners?.length) setActivePartner(data.partners[0].id)
    } finally { setLoading(false) }
  }

  const loadMessages = async () => {
    if (!activePartner) return
    const res = await fetch(`/api/messages?userId=${activePartner}`, { cache: 'no-store' })
    const data = await res.json()
    setMessages(data.messages ?? [])
  }

  useEffect(() => { loadPartners() }, [])
  useEffect(() => { if (activePartner) loadMessages() }, [activePartner])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || !activePartner) return
    setSending(true)
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activePartner, body: input }),
      })
      setInput('')
      loadMessages()
      loadPartners()
    } catch {
      toast('Failed to send message', 'error')
    } finally { setSending(false) }
  }

  return (
    <div className="space-y-5 pb-16 md:pb-6 h-[calc(100vh-7rem)] flex flex-col">
      <Header title="Messages" subtitle="Chat with your AVAS account manager" />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0">
        <Card className="border-border/70 shadow-none flex flex-col min-h-0">
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input placeholder="Search…" className="bg-transparent text-xs outline-none flex-1" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <LoadingSkeleton rows={3} /> :
              partners.length === 0 ? <EmptyState icon={MessageSquare} title="No conversations yet" description="Your AVAS account manager will reach out soon." /> :
              partners.map((p) => (
                <button key={p.id} onClick={() => setActivePartner(p.id)} className={`w-full px-3 py-2.5 flex items-center gap-2.5 text-left border-b border-border/50 hover:bg-muted/30 ${activePartner === p.id ? 'bg-muted/50' : ''}`}>
                  <Avatar name={p.name} src={p.avatarUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-foreground truncate">{p.name}</div>
                      {p.unreadCount > 0 && <span className="h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">{p.unreadCount}</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{p.jobTitle ?? p.role.toLowerCase()}</div>
                  </div>
                </button>
              ))
            }
          </div>
        </Card>
        <Card className="border-border/70 shadow-none md:col-span-2 flex flex-col min-h-0">
          {!activePartner ? <EmptyState icon={MessageSquare} title="Select a conversation" /> :
            <>
              <div className="px-4 py-2.5 border-b border-border flex items-center gap-2.5">
                {(() => {
                  const p = partners.find((x) => x.id === activePartner)
                  return p ? (
                    <>
                      <Avatar name={p.name} src={p.avatarUrl} size="sm" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground">{p.jobTitle ?? p.role.toLowerCase()}</div>
                      </div>
                    </>
                  ) : null
                })()}
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((m) => {
                  const isMe = m.senderId === user?.id
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${isMe ? 'bg-foreground text-background' : 'bg-muted text-foreground'} rounded-lg px-3 py-2`}>
                        <p className="text-xs leading-relaxed">{m.body}</p>
                        <div className={`text-[10px] mt-1 ${isMe ? 'text-background/60' : 'text-muted-foreground'}`}>{formatRelative(m.createdAt)}</div>
                      </div>
                    </div>
                  )
                })}
                <div ref={endRef} />
              </div>
              <div className="px-3 py-2 border-t border-border flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Paperclip className="h-3.5 w-3.5" /></Button>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Type a message…" className="flex-1 bg-transparent text-xs outline-none" />
                <Button size="sm" className="h-8" onClick={send} disabled={sending || !input.trim()}><Send className="h-3.5 w-3.5 mr-1" />Send</Button>
              </div>
            </>
          }
        </Card>
      </div>
    </div>
  )
}
