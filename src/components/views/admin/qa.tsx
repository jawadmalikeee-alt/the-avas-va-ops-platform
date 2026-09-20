'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge, EmptyState, LoadingSkeleton, Pill, MetricCard, MiniProgress } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/shared'
import { formatDate } from '@/lib/format'
import { Plus, ShieldCheck, TrendingUp, AlertTriangle, Star } from 'lucide-react'
import { toast } from '@/components/ui-primitives/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'

const WEIGHTS = [
  { name: 'Accuracy', weight: 25, key: 'accuracy' },
  { name: 'Completeness', weight: 20, key: 'completeness' },
  { name: 'SOP Adherence', weight: 20, key: 'sopAdherence' },
  { name: 'Communication', weight: 15, key: 'communication' },
  { name: 'Timeliness', weight: 10, key: 'timeliness' },
  { name: 'Professionalism', weight: 10, key: 'professionalism' },
]

export function AdminQA() {
  const [items, setItems] = useState<any[]>([])
  const [vas, setVAs] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({})

  const load = async () => {
    setLoading(true)
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch('/api/data/admin-list?type=qa', { cache: 'no-store' }),
        fetch('/api/vas', { cache: 'no-store' }),
        fetch('/api/clients', { cache: 'no-store' }),
      ])
      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()])
      setItems(d1.items ?? [])
      setVAs(d2.items ?? [])
      setClients(d3.items ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({
      vaId: '', clientId: '', taskId: '',
      accuracy: 95, completeness: 95, sopAdherence: 95, communication: 95, timeliness: 90, professionalism: 95,
      mistakes: '', feedback: '', correctiveAction: '',
    })
    setOpen(true)
  }

  const calcScore = () => {
    return Math.round(
      (form.accuracy * 25 + form.completeness * 20 + form.sopAdherence * 20 + form.communication * 15 + form.timeliness * 10 + form.professionalism * 10) / 100 * 10
    ) / 10
  }

  const submit = async () => {
    if (!form.vaId) { toast('Please select a VA', 'error'); return }
    try {
      const res = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok) { toast(d.error ?? 'Failed', 'error'); return }
      toast(`QA review submitted — Score: ${d.score}%`, 'success')
      setOpen(false)
      load()
    } catch {
      toast('Something went wrong', 'error')
    }
  }

  const avgScore = items.length ? Math.round(items.reduce((s, i) => s + i.score, 0) / items.length * 10) / 10 : 0
  const passing = items.filter((i) => i.score >= 90).length
  const failing = items.filter((i) => i.score < 85).length

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header
        title="QA & Quality"
        subtitle="Quality assurance reviews across all VAs"
        action={<Button size="sm" className="h-8 bg-navy hover:bg-navy-light" onClick={openCreate}><Plus className="h-3.5 w-3.5 mr-1" />New QA Review</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Reviews" value={items.length} icon={ShieldCheck} />
        <MetricCard label="Avg Score" value={`${avgScore}%`} icon={TrendingUp} deltaType={avgScore >= 90 ? 'up' : 'neutral'} delta={avgScore >= 90 ? 'on target' : 'watch'} />
        <MetricCard label="Passing (90%+)" value={passing} icon={ShieldCheck} hint="this period" />
        <MetricCard label="Issues (<85%)" value={failing} icon={AlertTriangle} hint="needs attention" />
      </div>

      <Card className="card-corporate">
        {loading ? <div className="p-4"><LoadingSkeleton /></div> :
          items.length === 0 ? <EmptyState icon={ShieldCheck} title="No QA reviews" description="Submit your first QA review to track quality." action={<Button size="sm" className="h-8 bg-navy hover:bg-navy-light" onClick={openCreate}><Plus className="h-3.5 w-3.5 mr-1" />New QA Review</Button>} /> :
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="px-4 py-2.5 border-b border-border grid gap-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em]"
                style={{ gridTemplateColumns: '1.2fr 1.2fr 2fr 1fr 1fr 1.5fr 0.8fr' }}>
                <div>VA</div><div>Client</div><div>Task</div><div>Score</div><div>Date</div><div>Feedback</div><div>Evaluator</div>
              </div>
              <div className="divide-y divide-border/50">
                {items.map((q) => (
                  <div key={q.id} className="px-4 py-3 grid gap-3 items-center hover:bg-muted/30 transition-colors"
                    style={{ gridTemplateColumns: '1.2fr 1.2fr 2fr 1fr 1fr 1.5fr 0.8fr' }}
                  >
                    <div className="text-xs font-semibold text-navy truncate">{q.vaName}</div>
                    <div className="text-xs text-muted-foreground truncate">{q.client}</div>
                    <div className="text-xs text-foreground truncate">{q.task}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold tabular-nums ${q.score >= 90 ? 'text-emerald-600' : q.score >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>{q.score}%</span>
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full ${q.score >= 90 ? 'bg-emerald-500' : q.score >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${q.score}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{formatDate(q.date, { month: 'short', day: 'numeric' })}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{q.feedback ?? '—'}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{q.evaluator}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>New QA Review</DialogTitle>
            <DialogDescription>Evaluate the VA's work. The score is calculated using weighted metrics. The VA will be notified.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">VA *</Label>
                <Select value={form.vaId} onValueChange={(v) => setForm({ ...form, vaId: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select VA…" /></SelectTrigger>
                  <SelectContent>
                    {vas.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Client</Label>
                <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Optional…" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-navy">Quality Metrics</span>
                <span className="text-[10px] text-muted-foreground">Weighted scoring</span>
              </div>
              {WEIGHTS.map((w) => (
                <div key={w.key} className="flex items-center gap-3">
                  <div className="w-32">
                    <div className="text-xs text-foreground">{w.name}</div>
                    <div className="text-[10px] text-muted-foreground">Weight: {w.weight}%</div>
                  </div>
                  <input
                    type="range" min="0" max="100" value={form[w.key] ?? 90}
                    onChange={(e) => setForm({ ...form, [w.key]: parseInt(e.target.value) })}
                    className="flex-1 accent-navy"
                  />
                  <span className="text-xs font-semibold tabular-nums w-10 text-right text-navy">{form[w.key] ?? 90}%</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-md border border-gold/30 bg-gold/5 px-3 py-2">
              <span className="text-xs font-semibold text-navy">Calculated QA Score</span>
              <span className={`text-xl font-bold tabular-nums ${calcScore() >= 90 ? 'text-emerald-600' : calcScore() >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>{calcScore()}%</span>
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground">Mistakes Found</Label>
              <Input value={form.mistakes ?? ''} onChange={(e) => setForm({ ...form, mistakes: e.target.value })} className="mt-1 h-9 text-sm" placeholder="e.g. Minor CRM field errors" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Feedback</Label>
              <Textarea value={form.feedback ?? ''} onChange={(e) => setForm({ ...form, feedback: e.target.value })} className="mt-1 text-sm" rows={2} placeholder="Constructive feedback for the VA…" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Corrective Action (optional)</Label>
              <Input value={form.correctiveAction ?? ''} onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })} className="mt-1 h-9 text-sm" placeholder="e.g. Review SOP section 4.2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} className="bg-navy hover:bg-navy-light">Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
