import { getAdherenceColor, getAdherenceLabel } from '@/lib/utils'
import type { AdherenceStats } from '@/types'
import Link from 'next/link'

interface Props {
  stats?: AdherenceStats
}

export default function AdherenceWidget({ stats }: Props) {
  if (!stats || stats.total_doses === 0) return null

  const rate = stats.adherence_rate ?? 0
  const color = getAdherenceColor(rate)
  const label = getAdherenceLabel(rate)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">Adesão nos últimos 7 dias</h2>
        <Link href="/dashboard/history" className="text-xs text-brand-500 font-medium hover:underline">
          Ver histórico →
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={rate >= 90 ? '#16a34a' : rate >= 70 ? '#ca8a04' : '#dc2626'}
              strokeWidth="3"
              strokeDasharray={`${rate} ${100 - rate}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${color}`}>{rate}%</span>
          </div>
        </div>

        <div className="flex-1">
          <p className={`font-semibold ${color}`}>{label}</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Tomadas</span>
              <span className="font-medium text-green-600">{stats.taken_doses}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Perdidas</span>
              <span className="font-medium text-red-500">{stats.missed_doses}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Total</span>
              <span className="font-medium text-slate-700">{stats.total_doses}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
