'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge, EmptyState, LoadingSkeleton, Pill, SectionHeader } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { useAuth } from '@/stores/auth'
import { formatRelative } from '@/lib/format'
import { Send, Plus, Check, Paperclip } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription
} from '@/components/ui/dialog'

export function ClientRequests() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: 'Task Request', priority: 'Medium', dueDate: '' })

  const load = async () => {
    setLoading(true)
    try {
      // Use admin-list endpoint but filter client's own — backend will enforce tenant isolation
      const res = await fetch('/api/data/admin-list?type=tickets', { cache: 'no-store' })
      const data = await res.json()
      setTickets(data.items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const submit = async () => {
    if (!form.title) {
      toast('Please enter a title', 'error')
      return
    }
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error ?? 'Failed to create request', 'error')
        return
      }
      toast('Request submitted successfully', 'success')
      setOpen(false)
      setForm({ title: '', description: '', type: 'Task Request', priority: 'Medium', dueDate: '' })
      load()
    } catch {
      toast('Something went wrong', 'error')
    }
  }

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Requests" subtitle="Submit and track task requests for your VA team" action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="h-8"><Plus className="h-3.5 w-3.5 mr-1" />New Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Task Request</DialogTitle>
              <DialogDescription>Submit a request to your AVAS team. They'll be notified instantly.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief title of the task" className="mt-1 h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Task Request">Task Request</SelectItem>
                      <SelectItem value="Change Request">Change Request</SelectItem>
                      <SelectItem value="Issue">Issue</SelectItem>
                      <SelectItem value="Question">Question</SelectItem>
                      <SelectItem value="Urgent Request">Urgent Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the task in detail…" className="mt-1 text-sm" rows={4} />
              </div>
              <div>
                <Label className="text-xs">Due Date (optional)</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="mt-1 h-9 text-sm" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit}><Send className="h-3.5 w-3.5 mr-1" />Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      } />

      <Card className="border-border/70 shadow-none">
        {loading ? <LoadingSkeleton rows={5} /> :
          tickets.length === 0 ? <EmptyState icon={Send} title="No requests yet" description="Submit your first task request above." /> :
          <div className="divide-y divide-border/50">
            {tickets.map((t) => (
              <div key={t.id} className="px-3 py-3 hover:bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill tone="muted">{t.ticketId}</Pill>
                      <StatusBadge status={t.priority} size="xs" />
                      <StatusBadge status={t.status} size="xs" />
                    </div>
                    <div className="text-sm font-medium text-foreground">{t.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{t.type} · {formatRelative(t.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      </Card>
    </div>
  )
}
