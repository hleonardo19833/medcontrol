import Image from 'next/image'
import Link from 'next/link'
import { getDaysUntilRunOut, isStockLow } from '@/lib/utils'
import type { Medication } from '@/types'

interface Props {
  medication: Medication
}

export default function MedicationCard({ medication: med }: Props) {
  const stockDays = getDaysUntilRunOut(med)
  const stockLow = isStockLow(med)

  return (
    <Link href={`/dashboard/medications/${med.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow block">
      {/* Photo or color */}
      <div className="shrink-0">
        {med.photo_url ? (
          <div className="w-14 h-14 rounded-xl overflow-hidden">
            <Image src={med.photo_url} alt={med.name} width={56} height={56} className="object-cover w-full h-full" />
          </div>
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: med.color + '20', border: `2px solid ${med.color}40` }}
          >
            💊
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 truncate">{med.name}</p>
        <p className="text-sm text-slate-500">
          {med.dose_amount} {med.dose_unit} · {med.times_per_day}x ao dia
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {med.schedule_times.join(' • ')}
        </p>
      </div>

      {/* Stock */}
      <div className="shrink-0 text-right">
        {med.stock_count !== null && (
          <div className={`text-xs font-semibold px-2 py-1 rounded-lg ${
            stockLow ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {stockLow ? '⚠' : '📦'} {med.stock_count} un.
          </div>
        )}
        <div className="mt-1 text-slate-300 text-lg">›</div>
      </div>
    </Link>
  )
}
