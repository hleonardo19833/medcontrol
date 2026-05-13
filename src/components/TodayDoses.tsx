'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getStatusColor, getStatusLabel, formatTime } from '@/lib/utils'
import type { Dose } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  doses: (Dose & { medication: any })[]
}

export default function TodayDoses({ doses }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)

  if (doses.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <p className="font-semibold text-slate-700">Nenhuma dose hoje</p>
        <p className="text-sm text-slate-500 mt-1">Adicione medicamentos para começar a controlar</p>
      </div>
    )
  }

  async function confirmDose(doseId: string, status: 'taken' | 'skipped') {
    setLoading(doseId)
    const { error } = await supabase
      .from('doses')
      .update({ status, confirmed_at: new Date().toISOString() })
      .eq('id', doseId)

    if (error) {
      toast.error('Erro ao confirmar dose')
    } else {
      toast.success(status === 'taken' ? '✅ Dose confirmada!' : 'Dose marcada como pulada')
      router.refresh()
    }
    setLoading(null)
  }

  async function undoDose(doseId: string) {
    setLoading(doseId)
    const { error } = await supabase
      .from('doses')
      .update({ status: 'pending', confirmed_at: null })
      .eq('id', doseId)

    if (!error) router.refresh()
    setLoading(null)
  }

  const pending = doses.filter(d => d.status === 'pending')
  const confirmed = doses.filter(d => d.status !== 'pending')

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Doses de hoje
          </h2>
          <div className="space-y-3">
            {pending.map(dose => (
              <DoseCard
                key={dose.id}
                dose={dose}
                loading={loading === dose.id}
                onConfirm={() => confirmDose(dose.id, 'taken')}
                onSkip={() => confirmDose(dose.id, 'skipped')}
                onUndo={() => undoDose(dose.id)}
              />
            ))}
          </div>
        </div>
      )}

      {confirmed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Confirmadas
          </h2>
          <div className="space-y-2">
            {confirmed.map(dose => (
              <DoseCard
                key={dose.id}
                dose={dose}
                loading={loading === dose.id}
                onConfirm={() => confirmDose(dose.id, 'taken')}
                onSkip={() => confirmDose(dose.id, 'skipped')}
                onUndo={() => undoDose(dose.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DoseCard({ dose, loading, onConfirm, onSkip, onUndo }: {
  dose: Dose & { medication: any }
  loading: boolean
  onConfirm: () => void
  onSkip: () => void
  onUndo: () => void
}) {
  const med = dose.medication
  const isPending = dose.status === 'pending'

  return (
    <div className={`card p-4 transition-all ${
      dose.status === 'taken' ? 'opacity-70' : ''
    }`}>
      <div className="flex items-center gap-3">
        {/* Medication photo or color dot */}
        <div className="relative shrink-0">
          {med?.photo_url ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-100">
              <Image src={med.photo_url} alt={med.name} width={56} height={56} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: med?.color + '20', border: `2px solid ${med?.color}40` }}
            >
              💊
            </div>
          )}
          {/* Status indicator */}
          {dose.status !== 'pending' && (
            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              dose.status === 'taken' ? 'bg-green-500' : 'bg-yellow-400'
            }`}>
              {dose.status === 'taken' ? '✓' : '–'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{med?.name}</p>
          <p className="text-sm text-slate-500">{med?.dose_amount} {med?.dose_unit}</p>
          <p className="text-xs text-slate-400 mt-0.5">🕐 {formatTime(dose.scheduled_time)}</p>
        </div>

        {/* Action */}
        <div className="shrink-0">
          {isPending ? (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={onConfirm}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {loading ? '...' : '✓ Tomei'}
              </button>
              <button
                onClick={onSkip}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-slate-600 text-center"
              >
                Pular
              </button>
            </div>
          ) : (
            <button
              onClick={onUndo}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Desfazer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
