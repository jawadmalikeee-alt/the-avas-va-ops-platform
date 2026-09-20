'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge, EmptyState, LoadingSkeleton, Pill } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { formatRelative } from '@/lib/format'
import { Send, FileCheck, Paperclip, CheckCircle2 } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'

export function VASubmission() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [taskId, setTaskId] = useState('')
  const [notes, setNotes] = useState('')
  const [payload, setPayload] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/data/va-dashboard', { cache: 'no-store' })
      const d = await res.json()
      setData(d)
      if (d.tasks?.length && !taskId) setTaskId(d.tasks[0].id)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const submit = async () => {
    if (!taskId) { toast('Select a task first', 'error'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_work',
          taskId,
          notes,
          payload: payload ? JSON.parse(payload) : {},
        }),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Submission failed', 'error'); return }
      toast('Work submitted for review', 'success')
      setNotes(''); setPayload('')
      load()
    } catch {
      toast('Invalid payload JSON', 'error')
    } finally { setSubmitting(false) }
  }

  if (loading || !data) return <Card className="shadow-none"><LoadingSkeleton rows={5} /></Card>

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="Work Submission" subtitle="Submit completed work for QA review" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Submission form */}
        <Card className="border-border/70 shadow-none p-5">
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Select Task</Label>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Choose a task…" /></SelectTrigger>
                <SelectContent>
                  {data.tasks.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.title} — {t.client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Completion Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe what was completed, any issues encountered, etc." className="mt-1 text-sm" rows={4} />
            </div>
            <div>
              <Label className="text-xs">Deliverable Metrics (JSON)</Label>
              <Textarea value={payload} onChange={(e) => setPayload(e.target.value)} placeholder='{"records_updated": 100, "duplicates_removed": 12}' className="mt-1 text-xs font-mono" rows={3} />
            </div>
            <div>
              <Label className="text-xs">Attachment (optional)</Label>
              <Button variant="outline" size="sm" className="mt-1 h-8 w-full"><Paperclip className="h-3.5 w-3.5 mr-1.5" />Upload file</Button>
            </div>
            <Button onClick={submit} disabled={submitting} className="w-full h-9"><Send className="h-3.5 w-3.5 mr-1.5" />{submitting ? 'Submitting…' : 'Submit for Review'}</Button>
          </div>
        </Card>

        {/* Recent submissions */}
        <div className="space-y-3">
          <Header title="Recent Submissions" subtitle="Your latest work submissions" />
          {data.recentDeliverables.length === 0 ? <Card className="shadow-none"><EmptyState icon={FileCheck} title="No submissions yet" /></Card> :
            <Card className="border-border/70 shadow-none">
              <div className="divide-y divide-border/50">
                {data.recentDeliverables.map((d: any) => (
                  <div key={d.id} className="px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-medium text-foreground truncate">{d.title}</div>
                      <Pill tone={d.status === 'Approved' ? 'success' : d.status === 'Under Review' ? 'info' : d.status === 'Revision Requested' ? 'warning' : 'muted'}>{d.status}</Pill>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{d.client} · {formatRelative(d.date)}</div>
                  </div>
                ))}
              </div>
            </Card>
          }
        </div>
      </div>
    </div>
  )
}
