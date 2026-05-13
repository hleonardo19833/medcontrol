'use client'

import { useState } from 'react'
import { generateAdherencePDF } from '@/lib/pdf-report'
import type { Profile, Medication, Dose, AdherenceStats } from '@/types'
import toast from 'react-hot-toast'

interface Props {
  profile: Profile | null
  medications: Medication[]
  doses: Dose[]
  stats?: AdherenceStats
  startDate: string
  endDate: string
  plan?: string
}

export default function PDFReportButton({ profile, medications, doses, stats, startDate, endDate, plan }: Props) {
  const [loading, setLoading] = useState(false)

  if (plan === 'free') {
    return (
      <a href="/dashboard/upgrade" className="btn-secondary text-sm px-3 py-2 text-brand-600 border-brand-200">
        ✨ PDF (Pro)
      </a>
    )
  }

  async function handleGenerate() {
    if (!profile || !stats) { toast.error('Sem dados suficientes'); return }
    setLoading(true)
    try {
      generateAdherencePDF({ profile, medications, doses, stats, startDate, endDate })
      toast.success('Relatório gerado!')
    } catch (err) {
      toast.error('Erro ao gerar PDF')
    }
    setLoading(false)
  }

  return (
    <button onClick={handleGenerate} disabled={loading} className="btn-secondary text-sm px-3 py-2">
      {loading ? 'Gerando...' : '📄 PDF'}
    </button>
  )
}
