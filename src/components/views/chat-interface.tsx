'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, EmptyState, LoadingSkeleton, Pill } from '@/components/ui-primitives'
import { useAuth } from '@/stores/auth'
import { formatRelative, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Send, Search, Paperclip, Phone, Video, Mail, MoreVertical, ArrowLeft, Smile,
  Mic, Check, CheckCheck, X, Plus, FileText, Image as ImageIcon, File as FileIcon,
  Trash2, Ban, BellOff, Info, Video as VideoIcon, PhoneCall, Download, Play,
} from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Partner {
  id: string
  name: string
  role: string
  avatarUrl?: string | null
  jobTitle?: string | null
  email?: string
  phone?: string | null
  status?: string
  lastActiveAt?: string | null
  unreadCount: number
  lastMessage?: string
  lastMessageAt?: string
  lastMessageAttachment?: string | null
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  body: string
  attachmentUrl?: string | null
  attachmentType?: string | null
  attachmentName?: string | null
  attachmentSize?: number | null
  read: boolean
  deliveredAt?: string | null
  seenAt?: string | null
  createdAt: string
}

export function ChatInterface() {
  const { user } = useAuth()
  const [partners, setPartners] = useState<Partner[]>([])
  const [allUsers, setAllUsers] = useState<Partner[]>([])
  const [activePartner, setActivePartner] = useState<string | null>(null)
  const [partnerInfo, setPartnerInfo] = useState<Partner | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [showCall, setShowCall] = useState<'audio' | 'video' | null>(null)
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const loadPartners = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/messages', { cache: 'no-store' })
      const data = await res.json()
      setPartners(data.partners ?? [])
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
    if (data.otherUser) {
      setPartnerInfo({
        id: data.otherUser.id,
        name: data.otherUser.name,
        role: data.otherUser.role,
        avatarUrl: data.otherUser.avatarUrl,
        jobTitle: data.otherUser.jobTitle,
        email: data.otherUser.email,
        phone: data.otherUser.phone,
        status: data.otherUser.status,
        lastActiveAt: data.otherUser.lastActiveAt,
        unreadCount: 0,
      })
    }
  }

  useEffect(() => { loadPartners() }, [])
  useEffect(() => { if (activePartner) loadMessages() }, [activePartner])

  // Listen for incoming call accepted event (from IncomingCallListener overlay)
  useEffect(() => {
    const handler = (e: any) => {
      const call = e.detail
      if (call?.roomUrl) {
        setMeetingUrl(call.roomUrl)
        setShowCall(call.type === 'video' ? 'video' : 'audio')
        // Also set the partner info so the modal shows the caller's details
        if (call.callerName) {
          setPartnerInfo({
            id: call.callerId,
            name: call.callerName,
            avatarUrl: call.callerAvatarUrl,
            role: '',
            unreadCount: 0,
            status: 'Online',
          })
        }
      }
    }
    window.addEventListener('avas:incoming-call-accepted', handler)
    return () => window.removeEventListener('avas:incoming-call-accepted', handler)
  }, [])

  // Auto-refresh messages every 3s when chat is open
  useEffect(() => {
    if (!activePartner) return
    const i = setInterval(loadMessages, 3000)
    return () => clearInterval(i)
  }, [activePartner])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || !activePartner) return
    setSending(true)
    const text = input
    setInput('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activePartner, body: text }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); setInput(text); return }
      loadMessages()
      loadPartners()
    } catch {
      toast('Failed to send', 'error')
      setInput(text)
    } finally { setSending(false) }
  }

  const sendFile = async (file: File, type: 'image' | 'file') => {
    if (!activePartner || !file) return
    setSending(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const upRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const upData = await upRes.json()
      if (!upRes.ok) { toast(upData.error ?? 'Upload failed', 'error'); return }

      const attachmentType = file.type.startsWith('image/') ? 'image'
        : file.type === 'application/pdf' ? 'pdf'
        : file.type.includes('word') || file.type.includes('document') ? 'doc'
        : file.type.includes('sheet') || file.type.includes('excel') ? 'sheet'
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : 'file'

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activePartner,
          body: attachmentType === 'image' ? '📷 Photo' : `📎 ${file.name}`,
          attachmentUrl: upData.url,
          attachmentType,
          attachmentName: file.name,
          attachmentSize: file.size,
        }),
      })
      if (!res.ok) { toast('Failed to send file', 'error'); return }
      toast('File sent', 'success')
      loadMessages()
      loadPartners()
    } catch (e: any) {
      toast('Upload failed: ' + e.message, 'error')
    } finally { setSending(false) }
  }

  const startNewChat = async (userId: string) => {
    setActivePartner(userId)
    const u = allUsers.find((x) => x.id === userId)
    if (u) setPartnerInfo(u)
    setShowNewChat(false)
  }

  const startCall = async (type: 'audio' | 'video') => {
    if (!activePartner) return
    try {
      // Create a real call session — the receiver will be notified via polling + push notification
      const res = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: activePartner, type }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed to start call', 'error'); return }
      setMeetingUrl(d.call.roomUrl)
      setShowCall(type)
      toast(`📞 Ringing ${d.call.partnerName}…`, 'info')
    } catch {
      toast('Failed to start call', 'error')
    }
  }

  const clearChat = async () => {
    if (!activePartner) return
    if (!confirm('Clear all messages in this conversation? This cannot be undone.')) return
    try {
      const res = await fetch('/api/messages/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: activePartner }),
      })
      if (!res.ok) { toast('Failed to clear', 'error'); return }
      toast('Chat cleared', 'success')
      loadMessages()
      loadPartners()
    } catch {
      toast('Failed', 'error')
    }
  }

  const deleteMessage = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/delete?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { toast('Failed', 'error'); return }
      toast('Message deleted', 'success')
      loadMessages()
    } catch {
      toast('Failed', 'error')
    }
  }

  return (
    <div className="space-y-5 pb-16 md:pb-6 h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display tracking-tight text-navy">Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">Chat, call, and email directly with your team.</p>
        </div>
        <Button size="sm" variant="gold" onClick={() => setShowNewChat(true)}><Plus className="h-4 w-4 mr-1.5" />New Chat</Button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 min-h-0">
        {/* Conversation list */}
        <Card className="rounded-2xl border-border shadow-apple flex flex-col min-h-0 p-0 overflow-hidden">
          <div className="px-3 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder="Search conversations…" className="bg-muted rounded-full pl-9 pr-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-navy/20" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-3"><LoadingSkeleton rows={4} /></div> :
              partners.length === 0 ? <EmptyState icon={Send} title="No conversations yet" description="Start a new chat with your VA or admin." /> :
              partners.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setActivePartner(p.id); setPartnerInfo(p) }}
                  className={cn('w-full px-3 py-3 flex items-center gap-3 text-left border-b border-border/50 hover:bg-muted/50 transition-colors', activePartner === p.id && 'bg-muted')}
                >
                  <div className="relative">
                    <Avatar name={p.name} src={p.avatarUrl} size="md" />
                    <StatusDot status={p.status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-navy truncate">{p.name}</div>
                      {p.lastMessageAt && <div className="text-[10px] text-muted-foreground ml-1 shrink-0">{formatRelative(p.lastMessageAt)}</div>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="text-[11px] text-muted-foreground truncate flex-1">
                        {p.lastMessageAttachment === 'image' ? '📷 Photo' : p.lastMessageAttachment ? '📎 Attachment' : (p.lastMessage || p.jobTitle || p.role.toLowerCase())}
                      </div>
                      {p.unreadCount > 0 && <span className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-gold text-navy text-[10px] font-bold flex items-center justify-center shrink-0">{p.unreadCount}</span>}
                    </div>
                  </div>
                </button>
              ))
            }
          </div>
        </Card>

        {/* Conversation */}
        <Card className="rounded-2xl border-border shadow-apple md:col-span-2 flex flex-col min-h-0 p-0 overflow-hidden">
          {!partnerInfo ? (
            <EmptyState icon={Send} title="Select a conversation" description="Choose a contact to start messaging, or start a new chat." action={<Button size="sm" variant="gold" onClick={() => setShowNewChat(true)}><Plus className="h-4 w-4 mr-1.5" />New Chat</Button>} />
          ) : (
            <>
              {/* Header with action buttons */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <button onClick={() => { setActivePartner(null); setPartnerInfo(null) }} className="md:hidden"><ArrowLeft className="h-5 w-5 text-navy" /></button>
                <div className="relative">
                  <Avatar name={partnerInfo.name} src={partnerInfo.avatarUrl} size="md" />
                  <StatusDot status={partnerInfo.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-navy truncate">{partnerInfo.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <StatusText status={partnerInfo.status} lastActiveAt={partnerInfo.lastActiveAt} />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startCall('audio')} title="Audio Call" className="rounded-full"><Phone className="h-4 w-4 text-navy" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => startCall('video')} title="Video Call" className="rounded-full"><Video className="h-4 w-4 text-navy" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setShowEmail(true)} title="Send Email" className="rounded-full"><Mail className="h-4 w-4 text-navy" /></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="rounded-full"><MoreVertical className="h-4 w-4 text-navy" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl">
                      <DropdownMenuItem><Info className="h-3.5 w-3.5 mr-2" />Contact Info</DropdownMenuItem>
                      <DropdownMenuItem><BellOff className="h-3.5 w-3.5 mr-2" />Mute Notifications</DropdownMenuItem>
                      <DropdownMenuItem><Search className="h-3.5 w-3.5 mr-2" />Search Messages</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearChat} className="text-amber-600"><Trash2 className="h-3.5 w-3.5 mr-2" />Clear Chat</DropdownMenuItem>
                      <DropdownMenuItem className="text-rose-600"><Ban className="h-3.5 w-3.5 mr-2" />Block User</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-muted/30">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-14 w-14 rounded-2xl bg-card mx-auto flex items-center justify-center mb-3"><Send className="h-6 w-6 text-muted-foreground/40" /></div>
                    <p className="text-sm font-semibold text-navy">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Send your first message to start the conversation.</p>
                  </div>
                ) : (
                  <>
                    {messages.map((m, i) => {
                      const isMe = m.senderId === user?.id
                      const showAvatar = !isMe && (i === 0 || messages[i-1].senderId !== m.senderId)
                      const showTime = i === 0 || (new Date(m.createdAt).getTime() - new Date(messages[i-1].createdAt).getTime() > 5 * 60 * 1000)
                      return (
                        <div key={m.id}>
                          {showTime && (
                            <div className="text-center my-3">
                              <span className="text-[10px] font-medium text-muted-foreground bg-card px-3 py-1 rounded-full">
                                {new Date(m.createdAt).toDateString() === new Date().toDateString()
                                  ? formatTime(m.createdAt)
                                  : new Date(m.createdAt).toDateString() === new Date(Date.now() - 86400000).toDateString()
                                    ? `Yesterday, ${formatTime(m.createdAt)}`
                                    : new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                          <div className={cn('flex gap-2 group', isMe ? 'justify-end' : 'justify-start')}>
                            {!isMe && (
                              <div className="w-8 shrink-0">
                                {showAvatar && <Avatar name={partnerInfo.name} src={partnerInfo.avatarUrl} size="sm" />}
                              </div>
                            )}
                            <div className="max-w-[70%]">
                              {m.attachmentUrl && (
                                <AttachmentPreview
                                  url={m.attachmentUrl}
                                  type={m.attachmentType ?? 'file'}
                                  name={m.attachmentName ?? 'file'}
                                  size={m.attachmentSize ?? 0}
                                />
                              )}
                              {m.body && (
                                <div className={cn(isMe ? 'msg-bubble-sent' : 'msg-bubble-recv', 'px-3.5 py-2 shadow-apple')}>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
                                </div>
                              )}
                              <div className={cn('flex items-center gap-1 mt-0.5 px-1', isMe ? 'justify-end' : 'justify-start')}>
                                <span className="text-[10px] text-muted-foreground">{formatTime(m.createdAt)}</span>
                                {isMe && <MessageStatus read={m.read} deliveredAt={m.deliveredAt} seenAt={m.seenAt} />}
                                {isMe && (
                                  <button
                                    onClick={() => deleteMessage(m.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-rose-600"
                                    title="Delete message"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {isTyping && (
                      <div className="flex gap-2 justify-start">
                        <Avatar name={partnerInfo.name} src={partnerInfo.avatarUrl} size="sm" />
                        <div className="msg-bubble-recv px-4 py-3 flex items-center gap-1">
                          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                        </div>
                      </div>
                    )}
                    <div ref={endRef} />
                  </>
                )}
              </div>

              {/* Input bar */}
              <div className="px-3 py-3 border-t border-border bg-card relative">
                {showAttachMenu && (
                  <div className="absolute bottom-16 left-3 z-50 rounded-2xl border border-border bg-popover shadow-apple-lg p-2 grid grid-cols-2 gap-1 w-44 animate-scale-in">
                    <button onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false) }} className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-muted text-xs text-navy font-medium">
                      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center"><ImageIcon className="h-4 w-4 text-blue-500" /></div>
                      Photos
                    </button>
                    <button onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false) }} className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-muted text-xs text-navy font-medium">
                      <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center"><FileIcon className="h-4 w-4 text-amber-500" /></div>
                      Files
                    </button>
                    <button onClick={() => { setShowEmail(true); setShowAttachMenu(false) }} className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-muted text-xs text-navy font-medium">
                      <div className="h-8 w-8 rounded-full bg-violet-50 flex items-center justify-center"><Mail className="h-4 w-4 text-violet-500" /></div>
                      Email
                    </button>
                    <button onClick={() => { startCall('video'); setShowAttachMenu(false) }} className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-muted text-xs text-navy font-medium">
                      <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center"><VideoIcon className="h-4 w-4 text-emerald-500" /></div>
                      Meet
                    </button>
                  </div>
                )}
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendFile(f, 'image'); e.target.value = '' }} />
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendFile(f, 'file'); e.target.value = '' }} />

                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => setShowAttachMenu(!showAttachMenu)} title="Attach" className="rounded-full"><Paperclip className="h-5 w-5 text-muted-foreground" /></Button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                    placeholder="iMessage"
                    className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy/20"
                  />
                  <Button size="icon" variant="ghost" title="Emoji" className="rounded-full"><Smile className="h-5 w-5 text-muted-foreground" /></Button>
                  {input.trim() ? (
                    <Button size="icon" onClick={send} disabled={sending} className="rounded-full bg-navy hover:bg-navy-light" title="Send"><Send className="h-4 w-4" /></Button>
                  ) : (
                    <Button size="icon" variant="ghost" title="Voice" className="rounded-full"><Mic className="h-5 w-5 text-muted-foreground" /></Button>
                  )}
                </div>
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
                    <StatusDot status={u.status} />
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
      <EmailComposer open={showEmail} setOpen={setShowEmail} recipient={partnerInfo} />

      {/* Audio/Video Call Modal with real Jitsi meeting */}
      {showCall && (
        <CallModal
          open={!!showCall}
          type={showCall}
          meetingUrl={meetingUrl}
          recipient={partnerInfo}
          onClose={() => { setShowCall(null); setMeetingUrl(null) }}
        />
      )}
    </div>
  )
}

// ============================================================
// Status Dot — green when active, amber when break, gray when offline
// ============================================================
function StatusDot({ status }: { status?: string }) {
  const color = status === 'Working' || status === 'Online'
    ? 'bg-emerald-500'
    : status === 'Break' ? 'bg-amber-500'
    : status === 'Meeting' ? 'bg-violet-500'
    : 'bg-slate-300'
  const isLive = status === 'Working' || status === 'Online'
  return <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card', color, isLive && 'live-pulse')} />
}

function StatusText({ status, lastActiveAt }: { status?: string; lastActiveAt?: string | null }) {
  if (status === 'Working' || status === 'Online') return <span className="text-emerald-600 font-medium">Active now</span>
  if (status === 'Break') return <span className="text-amber-600 font-medium">On break</span>
  if (status === 'Meeting') return <span className="text-violet-600 font-medium">In a meeting</span>
  if (lastActiveAt) {
    const diff = Date.now() - new Date(lastActiveAt).getTime()
    const min = Math.floor(diff / 60000)
    const hr = Math.floor(min / 60)
    const day = Math.floor(hr / 24)
    const lastSeen = day > 0 ? `${day}d ago` : hr > 0 ? `${hr}h ago` : min > 0 ? `${min}m ago` : 'just now'
    return <span className="text-muted-foreground">Last seen {lastSeen}</span>
  }
  return <span className="text-muted-foreground">Offline</span>
}

// ============================================================
// Message Status (sent/delivered/seen) — iMessage-style
// ============================================================
function MessageStatus({ read, deliveredAt, seenAt }: { read: boolean; deliveredAt?: string | null; seenAt?: string | null }) {
  if (seenAt || read) return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
  if (deliveredAt) return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
  return <Check className="h-3.5 w-3.5 text-muted-foreground/60" />
}

// ============================================================
// Attachment Preview — image, PDF, doc, file, audio, video
// ============================================================
function AttachmentPreview({ url, type, name, size }: { url: string; type: string; name: string; size: number }) {
  const sizeStr = size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : size > 1024 ? `${Math.round(size / 1024)} KB` : `${size} B`
  const icon = type === 'image' ? ImageIcon : type === 'pdf' ? FileText : type === 'doc' || type === 'sheet' ? FileText : type === 'video' ? VideoIcon : type === 'audio' ? Mic : FileIcon
  const color = type === 'image' ? 'text-blue-500 bg-blue-50' : type === 'pdf' ? 'text-rose-500 bg-rose-50' : type === 'doc' ? 'text-blue-500 bg-blue-50' : type === 'sheet' ? 'text-emerald-500 bg-emerald-50' : type === 'video' ? 'text-violet-500 bg-violet-50' : type === 'audio' ? 'text-amber-500 bg-amber-50' : 'text-muted-foreground bg-muted'

  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block mb-1">
        <img src={url} alt={name} className="rounded-2xl max-w-full max-h-64 object-cover shadow-apple" />
      </a>
    )
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block mb-1">
      <div className="file-card flex items-center gap-3 px-3 py-2.5 min-w-[200px]">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', color)}>
          {icon === ImageIcon ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-navy truncate">{name}</div>
          <div className="text-[10px] text-muted-foreground">{sizeStr}</div>
        </div>
        <Download className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </a>
  )
}

// ============================================================
// Email Composer Modal — improved with full mailto + logging
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
    if (!recipient?.id) { toast('No recipient selected', 'error'); return }
    setSending(true)
    try {
      // Send via real email API — logs to DB, creates message in conversation, notifies recipient
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: recipient.id,
          toEmail: to,
          subject,
          body,
        }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed to send email', 'error'); return }

      // Also open default mail client for direct SMTP send
      if (d.mailtoUrl) {
        window.open(d.mailtoUrl, '_blank')
      }

      toast('Email sent & recipient notified', 'success')
      setOpen(false)
      // Reload messages to show the email in conversation
      window.location.reload()
    } catch {
      toast('Failed to send email', 'error')
    } finally { setSending(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-navy" />Compose Email</DialogTitle>
          <DialogDescription>Send an email to {recipient?.name ?? 'recipient'}. A copy will be logged in your conversation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-[11px] text-muted-foreground">To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@email.com" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" className="mt-1 h-10 text-sm" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email…" className="mt-1 text-sm" rows={6} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={send} disabled={sending}>
            <Mail className="h-4 w-4 mr-1.5" />
            {sending ? 'Sending…' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Call Modal — embeds real Jitsi Meet for video/audio calls
// ============================================================
export function CallModal({ open, type, meetingUrl, recipient, onClose }: {
  open: boolean
  type: 'audio' | 'video'
  meetingUrl: string | null
  recipient: Partner | null
  onClose: () => void
}) {
  const [duration, setDuration] = useState(0)
  const [connected, setConnected] = useState(false)
  const [muted, setMuted] = useState(false)
  const [cameraOn, setCameraOn] = useState(type === 'video')

  useEffect(() => {
    if (open) {
      queueMicrotask(() => { setDuration(0); setConnected(false) })
      const conn = setTimeout(() => setConnected(true), 2500)
      return () => clearTimeout(conn)
    }
  }, [open])

  useEffect(() => {
    if (!connected) return
    const i = setInterval(() => setDuration((d) => d + 1), 1000)
    return () => clearInterval(i)
  }, [connected])

  const end = () => { onClose() }

  if (!open || !recipient) return null
  const formatDur = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-navy-deep/95 backdrop-blur-md" onClick={end} />
      <div className="relative w-full max-w-3xl mx-auto p-4 animate-scale-in">
        <div className="rounded-3xl bg-card shadow-apple-xl overflow-hidden">
          {/* Call header */}
          <div className="px-6 py-4 flex items-center justify-between bg-navy text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={recipient.name} src={recipient.avatarUrl} size="md" />
                {connected && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-navy live-pulse" />}
              </div>
              <div>
                <div className="text-sm font-semibold">{recipient.name}</div>
                <div className="text-[11px] text-white/60">
                  {connected ? `Connected · ${formatDur(duration)}` : `${type === 'video' ? 'Video' : 'Audio'} calling…`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Pill tone="gold">{type === 'video' ? 'Video Meet' : 'Audio Call'}</Pill>
              <button onClick={end} className="text-white/60 hover:text-white ml-2"><X className="h-5 w-5" /></button>
            </div>
          </div>

          {/* Body — Jitsi embed for video, audio-only UI for audio */}
          {type === 'video' && meetingUrl && connected ? (
            <div className="aspect-video bg-black">
              <iframe
                src={`${meetingUrl}#config.startWithVideo=true&config.startWithAudioMuted=${muted}&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false&config.prejoinPageEnabled=false&config.disableDeepLinking=true`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
                title="Video Meeting"
              />
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-navy to-navy-light flex items-center justify-center relative">
              <div className="text-center">
                <Avatar name={recipient.name} src={recipient.avatarUrl} size="lg" className="h-32 w-32 text-3xl mx-auto" />
                <div className="mt-4 text-white font-display text-xl">{recipient.name}</div>
                <div className="text-white/60 text-sm mt-1">
                  {connected ? formatDur(duration) : 'Calling…'}
                </div>
              </div>
              {type === 'video' && connected && (
                <div className="absolute bottom-3 right-3 h-24 w-32 rounded-xl bg-navy-deep border-2 border-card flex items-center justify-center">
                  <span className="text-white/40 text-[10px]">You</span>
                </div>
              )}
            </div>
          )}

          {/* Call controls */}
          <div className="px-6 py-4 flex items-center justify-center gap-3 bg-card border-t border-border">
            <button
              onClick={() => setMuted(!muted)}
              className={cn('h-12 w-12 rounded-full flex items-center justify-center transition-colors shadow-apple', muted ? 'bg-rose-500 text-white' : 'bg-muted text-navy')}
              title={muted ? 'Unmute' : 'Mute'}
            >
              <Mic className="h-5 w-5" />
            </button>
            {type === 'video' && (
              <button
                onClick={() => setCameraOn(!cameraOn)}
                className={cn('h-12 w-12 rounded-full flex items-center justify-center transition-colors shadow-apple', !cameraOn ? 'bg-rose-500 text-white' : 'bg-muted text-navy')}
                title={cameraOn ? 'Camera Off' : 'Camera On'}
              >
                <VideoIcon className="h-5 w-5" />
              </button>
            )}
            <button className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-navy hover:bg-muted/70 transition-colors shadow-apple" title="Speaker">
              <PhoneCall className="h-5 w-5" />
            </button>
            <button onClick={end} className="h-14 w-14 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-apple-lg btn-press" title="End Call">
              <PhoneCall className="h-6 w-6 rotate-[135deg]" />
            </button>
          </div>
        </div>
        {meetingUrl && (
          <div className="mt-3 text-center">
            <a href={meetingUrl} target="_blank" rel="noreferrer" className="text-white/60 hover:text-gold text-xs underline">
              Open meeting in new tab ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
