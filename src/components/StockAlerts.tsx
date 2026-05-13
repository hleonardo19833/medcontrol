import { getDaysUntilRunOut, isStockLow } from '@/lib/utils'
import type { Medication } from '@/types'

interface Props {
  medications: Medication[]
  plan?: string
}

export default function StockAlerts({ medications, plan }: Props) {
  if (plan === 'free') return null

  const lowStock = medications.filter(m => m.stock_count !== null && isStockLow(m))
  if (lowStock.length === 0) return null

  return (
    <div className="space-y-2">
      {lowStock.map(med => {
        const days = getDaysUntilRunOut(med)
        return (
          <div key={med.id} className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div className="flex-1">
              <p className="font-semibold text-orange-800 text-sm">{med.name}</p>
              <p className="text-xs text-orange-600 mt-0.5">
                {days !== null && days <= 0
                  ? 'Estoque esgotado! Compre mais urgente.'
                  : `Estoque acaba em ~${days} dia${days !== 1 ? 's' : ''}. Compre mais em breve.`
                }
              </p>
            </div>
            <span className="text-sm font-bold text-orange-700">{med.stock_count} un.</span>
          </div>
        )
      })}
    </div>
  )
}
