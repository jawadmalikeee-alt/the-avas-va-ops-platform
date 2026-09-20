'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, StatusBadge, EmptyState, LoadingSkeleton, Pill, SectionHeader } from '@/components/ui-primitives'
import { useAuth } from '@/stores/auth'
import { formatRelative, formatTime, formatDate } from '@/lib/format'
import { Send, Search, Paperclip, Phone, Video, Mail, MoreVertical, ArrowLeft, Smile, Mic, Info, CheckCheck, PhoneCall, VideoIcon, X, Plus, FileText, User } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface Partner {
  id: string
  name: string
  role: string
  avatarUrl?: string | null
  jobTitle?: string | null
  unreadCount: number
  lastMessage?: string
  lastMessageAt?: string
  status?: string
  email?: string
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  body: string
  createdAt: string
  read: boolean
}

export function ChatInterface() {
  const { user } = useAuth()
  const [partners, setPartners] = useState<Partner[]>([])
  const [allUsers, setAllUsers] = useState<Partner[]>([])
  const [activePartner, setActivePartner] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [showCall, setShowCall] = useState<'audio' | 'video' | null>(null)
  const [partnerInfo, setPartnerInfo] = useState<Partner | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const loadPartners = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/messages', { cache: 'no-store' })
      const data = await res.json()
      setPartners(data.partners ?? [])
      // Load all available users to start new chats with
      const usersRes = await fetch('/api/users/contacts', { cache: 'no-store' })
      const usersData = await usersRes.json()
      setAllUsers(usersData.items ?? [])
      if (!activePartner && (data.partners?.length ?? 0) > 0) {
        setActivePartner(data.partners[0].id)
        setPartnerInfo(data.partners[0])
      }
    } finally { setLoading(false) }
  }

  const loadMessages = async () => {
    if (!activePartner) return
    const res = await fetch(`/api/messages?userId=${activePartner}`, { cache: 'no-store' })
    const data = await res.json()
    setMessages(data.messages ?? [])
    // Update partner info
    const p = partners.find((x) => x.id === activePartner) ?? allUsers.find((x) => x.id === activePartner)
    if (p) setPartnerInfo(p)
  }

  useEffect(() => { loadPartners() }, [])
  useEffect(() => { if (activePartner) loadMessages() }, [activePartner])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-refresh messages every 5s when chat is open
  useEffect(() => {
    if (!activePartner) return
    const i = setInterval(loadMessages, 5000)
    return () => clearInterval(i)
  }, [activePartner])

  const send = async () => {
    if (!input.trim() || !activePartner) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activePartner, body: input }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      setInput('')
      loadMessages()
      loadPartners()
    } catch {
      toast('Failed to send', 'error')
    } finally { setSending(false) }
  }

  const startNewChat = async (userId: string) => {
    setActivePartner(userId)
    const u = allUsers.find((x) => x.id === userId)
    if (u) setPartnerInfo(u)
    setShowNewChat(false)
  }

  const activeMessages = messages
  const activeP = partnerInfo

  return (
    <div className="space-y-5 pb-16 md:pb-6 h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display tracking-tight text-navy">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">Chat directly with your VA, the AVAS admin team, and clients.</p>
        </div>
        <Button size="sm" variant="gold" onClick={() => setShowNewChat(true)}><Plus className="h-3.5 w-3.5 mr-1" />New Chat</Button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0">
        {/* Conversation list */}
        <Card className="rounded-2xl border-border shadow-apple flex flex-col min-h-0 p-0 overflow-hidden">
          <div className="px-3 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder="Search conversations…" className="bg-muted rounded-full pl-9 pr-3 py-2 text-xs w-full outline-none focus:ring-2 focus:ring-navy/20" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-3"><LoadingSkeleton rows={4} /></div> :
              partners.length === 0 ? <EmptyState icon={User} title="No conversations yet" description="Start a new chat with your VA or the AVAS admin." /> :
              partners.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setActivePartner(p.id); setPartnerInfo(p) }}
                  className={cn('w-full px-3 py-3 flex items-center gap-3 text-left border-b border-border/50 hover:bg-muted/50 transition-colors', activePartner === p.id && 'bg-muted')}
                >
                  <div className="relative">
                    <Avatar name={p.name} src={p.avatarUrl} size="md" />
                    {p.status === 'Working' && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-navy truncate">{p.name}</div>
                      {p.unreadCount > 0 && <span className="h-5 min-w-5 px-1.5 rounded-full bg-gold text-navy text-[10px] font-bold flex items-center justify-center">{p.unreadCount}</span>}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{p.jobTitle ?? p.role.toLowerCase()}</div>
                  </div>
                </button>
              ))
            }
          </div>
        </Card>

        {/* Conversation */}
        <Card className="rounded-2xl border-border shadow-apple md:col-span-2 flex flex-col min-h-0 p-0 overflow-hidden">
          {!activeP ? (
            <EmptyState icon={Send} title="Select a conversation" description="Choose a contact to start messaging, or start a new chat." action={<Button size="sm" variant="gold" onClick={() => setShowNewChat(true)}><Plus className="h-3.5 w-3.5 mr-1" />New Chat</Button>} />
          ) : (
            <>
              {/* Conversation header with action buttons */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <button onClick={() => { setActivePartner(null); setPartnerInfo(null) }} className="md:hidden"><ArrowLeft className="h-4 w-4 text-navy" /></button>
                <div className="relative">
                  <Avatar name={activeP.name} src={activeP.avatarUrl} size="md" />
                  {activeP.status === 'Working' && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-navy">{activeP.name}</div>
                  <div className="text-[11px] text-muted-foreground">{activeP.status === 'Working' ? 'Online now' : activeP.jobTitle ?? activeP.role.toLowerCase()}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => setShowCall('audio')} title="Audio Call"><Phone className="h-4 w-4 text-navy" /></Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setShowCall('video')} title="Video Call"><Video className="h-4 w-4 text-navy" /></Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setShowEmail(true)} title="Send Email"><Mail className="h-4 w-4 text-navy" /></Button>
                  <Button size="icon-sm" variant="ghost"><MoreVertical className="h-4 w-4 text-navy" /></Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/30">
                {activeMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-14 w-14 rounded-2xl bg-card mx-auto flex items-center justify-center mb-3"><Send className="h-6 w-6 text-muted-foreground/40" /></div>
                    <p className="text-sm font-medium text-navy">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Send your first message to start the conversation.</p>
                  </div>
                ) : (
                  activeMessages.map((m, i) => {
                    const isMe = m.senderId === user?.id
                    const showAvatar = !isMe && (i === 0 || activeMessages[i-1].senderId !== m.senderId)
                    return (
                      <div key={m.id} className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}>
                        {!isMe && (
                          <div className="w-7 shrink-0">
                            {showAvatar && <Avatar name={activeP.name} src={activeP.avatarUrl} size="sm" />}
                          </div>
                        )}
                        <div className={cn('max-w-[75%]', isMe ? 'msg-bubble-sent' : 'msg-bubble-recv', 'px-3.5 py-2 shadow-apple')}>
                          <p className="text-sm leading-relaxed">{m.body}</p>
                          <div className={cn('text-[10px] mt-1 flex items-center gap-1', isMe ? 'text-white/60' : 'text-muted-foreground')}>
                            {formatTime(m.createdAt)}
                            {isMe && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-border flex items-center gap-2 bg-card">
                <Button size="icon-sm" variant="ghost" title="Attach"><Paperclip className="h-4 w-4 text-muted-foreground" /></Button>
                <Button size="icon-sm" variant="ghost" title="Emoji"><Smile className="h-4 w-4 text-muted-foreground" /></Button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="Type a message…"
                  className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-navy/20"
                />
                {input.trim() ? (
                  <Button size="icon-sm" variant="default" onClick={send} disabled={sending}><Send className="h-4 w-4" /></Button>
                ) : (
                  <Button size="icon-sm" variant="ghost" title="Voice"><Mic className="h-4 w-4 text-muted-foreground" /></Button>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogDescription>Select a contact to message directly.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto -mx-2 px-2">
            {allUsers.length === 0 ? <div className="text-center py-8 text-xs text-muted-foreground">No contacts available.</div> :
              allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startNewChat(u.id)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div className="relative">
                    <Avatar name={u.name} src={u.avatarUrl} size="md" />
                    {u.status === 'Working' && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-navy">{u.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{u.jobTitle ?? u.role.toLowerCase()} · {u.email}</div>
                  </div>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </button>
              ))
            }
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Composer */}
      <EmailComposer
        open={showEmail}
        setOpen={setShowEmail}
        recipient={activeP}
      />

      {/* Audio/Video Call Modal */}
      <CallModal
        open={showCall !== null}
        type={showCall}
        recipient={activeP}
        onClose={() => setShowCall(null)}
      />
    </div>
  )
}

// ============================================================
// Email Composer Modal — fully working with mailto + draft save
// ============================================================

export function EmailComposer({ open, setOpen, recipient }: { open: boolean; setOpen: (v: boolean) => void; recipient: Partner | null }) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open && recipient) {
      setTo(recipient.email ?? '')
      setSubject('')
      setBody('')
    }
  }, [open, recipient])

  const send = async () => {
    if (!to || !subject) { toast('Recipient and subject required', 'error'); return }
    setSending(true)
    // Save the email as a notification record + open mailto
    try {
      // Log email as a notification for the recipient
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: recipient?.id,
          body: `[EMAIL] ${subject}\n\n${body}`,
        }),
      })
      // Open default mail client
      const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(mailto, '_blank')
      toast('Email drafted & logged — opening your mail client…', 'success')
      setOpen(false)
    } catch {
      toast('Failed to send email', 'error')
    } finally { setSending(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-navy" />Compose Email</DialogTitle>
          <DialogDescription>Send an email to {recipient?.name ?? 'recipient'}. A copy will be logged in your conversation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-[11px] text-muted-foreground">To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@email.com" className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" className="mt-1 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email…" className="mt-1 text-sm" rows={6} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={send} disabled={sending} variant="default">
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            {sending ? 'Sending…' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Audio/Video Call Modal — meeting session UI
// ============================================================

export function CallModal({ open, type, recipient, onClose }: { open: boolean; type: 'audio' | 'video' | null; recipient: Partner | null; onClose: () => void }) {
  const [duration, setDuration] = useState(0)
  const [status, setStatus] = useState<'calling' | 'connected' | 'ended'>('calling')

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setDuration(0)
        setStatus('calling')
      })
      const conn = setTimeout(() => setStatus('connected'), 3000)
      return () => clearTimeout(conn)
    }
  }, [open])

  useEffect(() => {
    if (status !== 'connected') return
    const i = setInterval(() => setDuration((d) => d + 1), 1000)
    return () => clearInterval(i)
  }, [status])

  const end = () => {
    setStatus('ended')
    setTimeout(() => onClose(), 500)
  }

  if (!open || !recipient) return null

  const formatDur = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-navy-deep/95 backdrop-blur-md" onClick={end} />
      <div className="relative w-full max-w-md mx-auto p-6 animate-scale-in">
        <div className="rounded-3xl bg-card shadow-apple-xl p-8 text-center">
          {/* Recipient */}
          <div className="relative inline-block mb-4">
            <Avatar name={recipient.name} src={recipient.avatarUrl} size="lg" className="h-24 w-24 text-2xl" />
            {status === 'connected' && <span className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-emerald-500 border-4 border-card live-pulse" />}
          </div>
          <h3 className="text-lg font-display text-navy">{recipient.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{recipient.jobTitle ?? recipient.role.toLowerCase()}</p>

          {/* Status */}
          <div className="mt-4">
            {status === 'calling' && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-amber-500 live-pulse" />
                {type === 'video' ? 'Video' : 'Audio'} calling…
              </div>
            )}
            {status === 'connected' && (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Connected · {formatDur(duration)}
              </div>
            )}
            {status === 'ended' && (
              <div className="text-sm text-muted-foreground">Call ended</div>
            )}
          </div>

          {/* Video preview area (for video calls) */}
          {type === 'video' && status === 'connected' && (
            <div className="mt-6 aspect-video rounded-2xl bg-gradient-to-br from-navy to-navy-light flex items-center justify-center mb-4 relative overflow-hidden">
              <div className="text-white/40 text-xs">{recipient.name}'s camera</div>
              {/* Self view */}
              <div className="absolute bottom-2 right-2 h-20 w-28 rounded-xl bg-navy-deep border-2 border-card flex items-center justify-center">
                <div className="text-white/30 text-[10px]">You</div>
              </div>
            </div>
          )}

          {/* Call controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button className="h-12 w-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors" title="Mute">
              <Mic className="h-5 w-5 text-navy" />
            </button>
            {type === 'video' && (
              <button className="h-12 w-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors" title="Toggle Camera">
                <VideoIcon className="h-5 w-5 text-navy" />
              </button>
            )}
            <button className="h-12 w-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors" title="Speaker">
              <PhoneCall className="h-5 w-5 text-navy" />
            </button>
            <button onClick={end} className="h-14 w-14 rounded-full bg-destructive flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-apple-lg" title="End Call">
              <PhoneCall className="h-6 w-6 text-white rotate-[135deg]" />
            </button>
          </div>
        </div>
        <button onClick={end} className="mt-4 mx-auto block text-white/60 hover:text-white text-xs flex items-center gap-1">
          <X className="h-3 w-3" /> Close
        </button>
      </div>
    </div>
  )
}
