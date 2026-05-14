'use client'

import Link from 'next/link'
import { PLANS, isTrialExpired, getTrialDaysLeft, type Profile } from '@/types'

interface Props {
  profile: Profile | null
}

export default function AppHeader({ profile }: Props) {
  const plan = profile?.plan ?? 'free'
  const expired = profile ? isTrialExpired(profile) : false
  const daysLeft = profile ? getTrialDaysLeft(profile) : 0

  return (
    <header className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">💊</div>
          <span className="font-bold text-slate-800">MedControl</span>
        </Link>

        <div className="flex items-center gap-2">
          {plan === 'free' && !expired && (
            <Link href="/dashboard/upgrade" className="text-xs bg-amber-50 text-amber-700 font-semibold px-3 py-1.5 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors">
              {daysLeft}d grátis
            </Link>
          )}
          {plan === 'free' && expired && (
            <Link href="/dashboard/upgrade" className="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-full border border-red-200 hover:bg-red-100 transition-colors">
              ⚠️ Expirado
            </Link>
          )}
          {plan === 'basic' && (
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-1.5 rounded-full border border-blue-100">💙 Básico</span>
          )}
          {plan === 'pro' && (
            <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-3 py-1.5 rounded-full border border-brand-100">⭐ Pro</span>
          )}
          {plan === 'premium' && (
            <span className="text-xs bg-purple-50 text-purple-700 font-semibold px-3 py-1.5 rounded-full border border-purple-100">👑 Premium</span>
          )}
          <Link href="/dashboard/settings" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-semibold hover:bg-slate-200 transition-colors">
            {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
          </Link>
        </div>
      </div>
    </header>
  )
}
