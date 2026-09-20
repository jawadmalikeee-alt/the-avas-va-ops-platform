'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { SectionHeader, EmptyState, LoadingSkeleton, Pill } from '@/components/ui-primitives'
import { Header } from '@/components/views/admin/clients'
import { Calendar, Clock, MapPin } from 'lucide-react'

export function VASchedule() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/data/va-dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <Card className="shadow-none"><LoadingSkeleton rows={5} /></Card>

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      <Header title="My Schedule" subtitle="Working schedule across all client assignments" />

      <Card className="border-border/70 shadow-none p-5">
        <SectionHeader title="This Week" subtitle={data.todaySchedule.day} />
        <div className="space-y-2">
          {weekDays.map((day, i) => {
            const isToday = day === data.todaySchedule.day
            return (
              <div key={day} className={`flex items-center gap-3 p-3 rounded-md ${isToday ? 'bg-muted/60' : ''}`}>
                <div className="w-24">
                  <div className="text-xs font-medium text-foreground">{day}</div>
                  {isToday && <div className="text-[10px] text-emerald-600">Today</div>}
                </div>
                <div className="flex-1">
                  {i < 5 ? (
                    <div className="space-y-1">
                      {data.todaySchedule.assignments.map((a: any, idx: number) => (
                        <div key={idx} className="text-xs text-muted-foreground">
                          <span className="text-foreground">{a.client}</span> — {a.schedule}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Weekend</span>
                  )}
                </div>
                {i < 5 && <Pill tone="muted">{data.scheduledWeeklyHours / 5}h</Pill>}
              </div>
            )
          })}
        </div>
      </Card>

      <SectionHeader title="Client Assignments" subtitle={`${data.todaySchedule.assignments.length} active clients`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.todaySchedule.assignments.map((a: any, i: number) => (
          <Card key={i} className="border-border/70 shadow-none p-4">
            <div className="text-sm font-medium text-foreground">{a.client}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{a.role}</div>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.weeklyHours}h/week</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.schedule.split(' ').slice(-2).join(' ')}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
