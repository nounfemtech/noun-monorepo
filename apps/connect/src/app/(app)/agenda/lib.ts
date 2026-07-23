// Calculo de slots a partir das regras recorrentes + bloqueios (client-safe, sem lib externa).

export interface RuleRow {
  id: string
  weekday: number
  start_time: string // "HH:mm:ss" (Postgres time)
  end_time: string
  slot_duration_minutes: number
  consultation_type: 'in_person' | 'telemedicine' | 'both'
  is_active: boolean
}

export interface BlockRow {
  id: string
  starts_at: string
  ends_at: string
  reason: string | null
}

export interface ComputedSlot {
  time: string // "HH:mm"
  durationMinutes: number
  consultationType: RuleRow['consultation_type']
  blocked: boolean
}

export const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

export const MODALITY_LABELS: Record<RuleRow['consultation_type'], string> = {
  in_person: 'Presencial',
  telemedicine: 'Telemedicina',
  both: 'Presencial e telemedicina',
}

const pad = (n: number) => String(n).padStart(2, '0')

export function formatTime(t: string): string {
  return t.slice(0, 5)
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Segunda-feira da semana que contem `d` */
export function startOfWeek(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  const diff = (out.getDay() + 6) % 7 // 0 = segunda
  out.setDate(out.getDate() - diff)
  return out
}

export function addDays(d: Date, days: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + days)
  return out
}

export function slotsForDay(date: Date, rules: RuleRow[], blocks: BlockRow[]): ComputedSlot[] {
  const weekday = date.getDay()
  const out: ComputedSlot[] = []

  for (const rule of rules) {
    if (!rule.is_active || rule.weekday !== weekday) continue
    const [sh = 0, sm = 0] = rule.start_time.split(':').map(Number)
    const [eh = 0, em = 0] = rule.end_time.split(':').map(Number)
    let t = sh * 60 + sm
    const end = eh * 60 + em

    while (t + rule.slot_duration_minutes <= end) {
      const slotStart = new Date(date)
      slotStart.setHours(Math.floor(t / 60), t % 60, 0, 0)
      const slotEnd = new Date(slotStart.getTime() + rule.slot_duration_minutes * 60_000)

      const blocked = blocks.some((b) => {
        const bs = new Date(b.starts_at)
        const be = new Date(b.ends_at)
        return bs < slotEnd && be > slotStart
      })

      out.push({
        time: `${pad(Math.floor(t / 60))}:${pad(t % 60)}`,
        durationMinutes: rule.slot_duration_minutes,
        consultationType: rule.consultation_type,
        blocked,
      })
      t += rule.slot_duration_minutes
    }
  }

  return out.sort((a, b) => a.time.localeCompare(b.time))
}

export function dayHasBlock(date: Date, blocks: BlockRow[]): boolean {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)
  return blocks.some((b) => new Date(b.starts_at) <= dayEnd && new Date(b.ends_at) >= dayStart)
}
