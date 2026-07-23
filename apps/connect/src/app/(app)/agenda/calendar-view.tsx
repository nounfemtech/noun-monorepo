'use client'

import * as React from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  addDays,
  dayHasBlock,
  slotsForDay,
  startOfWeek,
  WEEKDAY_SHORT,
  type BlockRow,
  type RuleRow,
} from './lib'

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

function monthLabel(d: Date): string {
  const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// ── Semana ───────────────────────────────────────────────────────────────────

function WeekView({ rules, blocks }: { rules: RuleRow[]; blocks: BlockRow[] }) {
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date()))
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = addDays(weekStart, 6)

  const rangeLabel = `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} a ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{rangeLabel}</p>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Semana anterior">
            <IconChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Hoje
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Proxima semana">
            <IconChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 overflow-x-auto">
        {days.map((day) => {
          const slots = slotsForDay(day, rules, blocks)
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} className="min-w-20">
              <div className={cn('text-center text-xs py-1.5 rounded-lg mb-2', isToday ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground')}>
                <span>{WEEKDAY_SHORT[day.getDay()]}</span>{' '}
                <span className="tabular-nums">{day.getDate()}</span>
              </div>
              <div className="space-y-1.5">
                {slots.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground/60 py-3">Sem horarios</p>
                ) : (
                  slots.map((slot) => (
                    <div
                      key={`${day.toISOString()}-${slot.time}`}
                      title={slot.blocked ? 'Bloqueado' : undefined}
                      className={cn(
                        'rounded-lg px-1.5 py-1 text-center text-xs tabular-nums',
                        slot.blocked
                          ? 'bg-muted/60 text-muted-foreground line-through'
                          : 'bg-primary/10 text-foreground',
                      )}
                    >
                      {slot.time}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Mes ──────────────────────────────────────────────────────────────────────

function MonthView({ rules, blocks }: { rules: RuleRow[]; blocks: BlockRow[] }) {
  const [month, setMonth] = React.useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const today = new Date()

  const gridStart = startOfWeek(month)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{monthLabel(month)}</p>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mes anterior">
            <IconChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)) }}>
            Hoje
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Proximo mes">
            <IconChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {[1, 2, 3, 4, 5, 6, 0].map((wd) => (
          <div key={wd} className="text-center text-xs text-muted-foreground py-1">{WEEKDAY_SHORT[wd]}</div>
        ))}
        {cells.map((day) => {
          const inMonth = day.getMonth() === month.getMonth()
          const slots = inMonth ? slotsForDay(day, rules, blocks) : []
          const free = slots.filter((s) => !s.blocked).length
          const hasBlock = inMonth && dayHasBlock(day, blocks)
          const isToday = isSameDay(day, today)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'rounded-lg p-2 min-h-16 text-xs',
                inMonth ? 'bg-muted/40' : 'opacity-40',
                isToday && 'bg-primary/10',
              )}
            >
              <span className={cn('tabular-nums', isToday && 'font-semibold text-primary')}>{day.getDate()}</span>
              {inMonth && free > 0 && (
                <p className="mt-1.5 rounded-md bg-background px-1 py-0.5 text-center text-[11px] text-foreground">
                  {free} {free === 1 ? 'horario' : 'horarios'}
                </p>
              )}
              {hasBlock && (
                <p className="mt-1.5 rounded-md px-1 py-0.5 text-center text-[11px] text-muted-foreground">
                  Bloqueio
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Container com tabs ───────────────────────────────────────────────────────

export function CalendarView({ rules, blocks }: { rules: RuleRow[]; blocks: BlockRow[] }) {
  return (
    <Tabs defaultValue="semana">
      <TabsList>
        <TabsTrigger value="semana">Semana</TabsTrigger>
        <TabsTrigger value="mes">Mes</TabsTrigger>
      </TabsList>
      <TabsContent value="semana" className="mt-4">
        <WeekView rules={rules} blocks={blocks} />
      </TabsContent>
      <TabsContent value="mes" className="mt-4">
        <MonthView rules={rules} blocks={blocks} />
      </TabsContent>
    </Tabs>
  )
}
