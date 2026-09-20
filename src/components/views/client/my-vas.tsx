'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, StatusBadge, SectionHeader, EmptyState, LoadingSkeleton, Pill, MetricCard, MiniProgress } from '@/components/ui-primitives'
import { useViewStore } from '@/stores/view'
import { formatDuration, hoursFromMs, formatTime } from '@/lib/format'
import { UserCog, Clock, Activity, MessageSquare, ChevronRight } from 'lucide-react'

export function ClientMyVAs() {
  const { setView } = useViewStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data/client-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Card className="shadow-none"><LoadingSkeleton rows={4} /></Card>

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <div>
        <h1 className="text-2xl font-display font-semibold tracking-tight">My VAs</h1>
        <p className="text-sm text-muted-foreground mt-1">Your assigned virtual assistants and their current status.</p>
      </div>

      {data.vas.length === 0 ? <Card className="shadow-none"><EmptyState icon={UserCog} title="No VAs assigned" description="Your AVAS account manager will assign VAs shortly." /></Card> :
        <div className="space-y-4">
          {data.vas.map((va: any) => (
            <Card key={va.id} className="border-border/70 shadow-none p-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar name={va.name} src={va.avatarUrl} size="lg" />
                  <div>
                    <div className="text-base font-display font-semibold text-foreground">{va.name}</div>
                    <div className="text-xs text-muted-foreground">{va.specialization}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={va.status} size="xs" />
                      <Pill tone="muted">{va.role}</Pill>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setView('messages')}><MessageSquare className="h-3.5 w-3.5 mr-1" />Message</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Weekly Hours</div>
                  <div className="text-sm font-semibold tabular-nums mt-0.5">{va.weeklyHours}h</div>
                </div>
                {data.visibility.canSeePerformance && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Performance</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-semibold tabular-nums">{va.performanceScore}%</span>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${va.performanceScore}%` }} />
                      </div>
                    </div>
                  </div>
                )}
                {data.visibility.canSeeQA && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quality Score</div>
                    <div className="text-sm font-semibold tabular-nums mt-0.5">{va.qualityScore}%</div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Shift Started</div>
                  <div className="text-sm font-medium mt-0.5">{va.shiftStartedAt ? formatTime(va.shiftStartedAt) : 'Not started'}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }
    </div>
  )
}
