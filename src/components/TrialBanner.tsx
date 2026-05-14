'use client'

import Link from 'next/link'
import { isTrialExpired, getTrialDaysLeft, type Profile } from '@/types'

interface Props {
  profile: Profile | null
}

export default function TrialBanner({ profile }: Props) {
  if (!profile || profile.plan !== 'free') return null

  const expired = isTrialExpired(profile)
  const daysLeft = getTrialDaysLeft(profile)

  if (!expired && daysLeft > 7) return null // Só mostra quando falta 7 dias ou menos

  if (expired) {
    return (
      <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">⚠️ Período gratuito encerrado. Assine para continuar.</p>
        <Link href="/dashboard/upgrade" className="shrink-0 bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
          Ver planos
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-amber-400 text-amber-900 px-4 py-2.5 flex items-center justify-between gap-3">
      <p className="text-sm font-medium">
        ⏳ {daysLeft} dia{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''} no período gratuito
      </p>
      <Link href="/dashboard/upgrade" className="shrink-0 bg-amber-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-800 transition-colors">
        Assinar
      </Link>
    </div>
  )
}
