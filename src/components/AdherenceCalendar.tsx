'use client'

import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Dose } from '@/types'

interface Props {
  doses: Dose[]
  monthStr: string
  onMonthChange?: (month: string) => void
}

export default function AdherenceCalendar({ doses, monthStr, onMonthChange }: Props) {
  const monthDate = new Date(monthStr + '-01')
  const days = eachDayOfInterval({ start: startOfMonth(monthDate), end: endOfMonth(monthDate) })
  const firstDayOfWeek = getDay(startOfMonth(monthDate))

  const dosesByDate: Record<string, Dose[]> = {}
  doses.forEach(d => {
    if (!dosesByDate[d.scheduled_date]) dosesByDate[d.scheduled_date] = []
    dosesByDate[d.scheduled_date].push(d)
  })

  function getDayStatus(dateStr: string) {
    const dayDoses = dosesByDate[dateStr]
    if (!dayDoses || dayDoses.length === 0) return 'empty'
    const taken = dayDoses.filter(d => d.status === 'taken').length
    const total = dayDoses.length
    if (taken === total) return 'all'
    if (taken === 0) return 'none'
    return 'partial'
  }

  function navigateMonth(delta: number) {
    const d = new Date(monthStr + '-01')
    d.setMonth(d.getMonth() + delta)
    const newMonth = format(d, 'yyyy-MM')
    if (onMonthChange) onMonthChange(newMonth)
  }

  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: ptBR })

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigateMonth(-1)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200">←</button>
        <h2 className="font-semibold text-slate-800 capitalize">{monthLabel}</h2>
        <button onClick={() => navigateMonth(1)} className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200">→</button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const status = getDayStatus(dateStr)
          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
          const isFuture = day > new Date()

          return (
            <div key={dateStr} className={`
              aspect-square flex items-center justify-center text-sm rounded-xl font-medium transition-all
              ${isToday ? 'ring-2 ring-brand-400 ring-offset-1' : ''}
              ${isFuture ? 'text-slate-300' : ''}
              ${!isFuture && status === 'all' ? 'bg-green-100 text-green-700' : ''}
              ${!isFuture && status === 'partial' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${!isFuture && status === 'none' ? 'bg-red-100 text-red-600' : ''}
              ${!isFuture && status === 'empty' ? 'text-slate-400' : ''}
            `}>
              {format(day, 'd')}
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 justify-center mt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-100" /> Todas tomadas</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-100" /> Parcial</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100" /> Perdidas</div>
      </div>
    </div>
  )
}
