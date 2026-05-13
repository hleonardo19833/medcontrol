import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isToday, isTomorrow, isPast, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Medication, DoseStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = "dd/MM/yyyy") {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: ptBR })
}

export function formatTime(time: string) {
  return time.substring(0, 5) // "08:00"
}

export function getDaysUntilRunOut(medication: Medication): number | null {
  if (!medication.stock_count || !medication.times_per_day) return null
  const dailyDoses = medication.times_per_day * medication.dose_amount
  return Math.floor(medication.stock_count / dailyDoses)
}

export function isStockLow(medication: Medication): boolean {
  const days = getDaysUntilRunOut(medication)
  if (days === null) return false
  return days <= medication.stock_alert_days
}

export function getStatusColor(status: DoseStatus) {
  switch (status) {
    case 'taken':   return 'text-green-600 bg-green-50'
    case 'missed':  return 'text-red-600 bg-red-50'
    case 'skipped': return 'text-yellow-600 bg-yellow-50'
    default:        return 'text-gray-500 bg-gray-50'
  }
}

export function getStatusLabel(status: DoseStatus) {
  switch (status) {
    case 'taken':   return 'Tomado'
    case 'missed':  return 'Perdido'
    case 'skipped': return 'Pulado'
    default:        return 'Pendente'
  }
}

export function getAdherenceColor(rate: number) {
  if (rate >= 90) return 'text-green-600'
  if (rate >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

export function getAdherenceLabel(rate: number) {
  if (rate >= 90) return 'Excelente'
  if (rate >= 70) return 'Razoável'
  return 'Precisa melhorar'
}

export function getNextDoseTime(medication: Medication): string | null {
  const now = new Date()
  const currentTime = format(now, 'HH:mm')
  const todayTimes = medication.schedule_times.sort()
  const nextToday = todayTimes.find(t => t > currentTime)
  if (nextToday) return `hoje às ${nextToday}`
  if (todayTimes.length > 0) return `amanhã às ${todayTimes[0]}`
  return null
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const MED_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#3b82f6',
]
