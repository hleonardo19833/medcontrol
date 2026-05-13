'use client'

import Link from 'next/link'
import type { Profile } from '@/types'

interface Props {
  profile: Profile | null
}

export default function AppHeader({ profile }: Props) {
  return (
    <header className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">💊</div>
          <span className="font-bold text-slate-800">MedControl</span>
        </Link>

        <div className="flex items-center gap-2">
          {profile?.plan === 'free' && (
            <Link href="/dashboard/upgrade" className="text-xs bg-brand-50 text-brand-600 font-semibold px-3 py-1.5 rounded-full border border-brand-100 hover:bg-brand-100 transition-colors">
              ✨ Pro
            </Link>
          )}
          {profile?.plan === 'pro' && (
            <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-3 py-1.5 rounded-full border border-indigo-100">
              ⭐ Pro
            </span>
          )}
          <Link href="/dashboard/settings" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-semibold hover:bg-slate-200 transition-colors">
            {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
          </Link>
        </div>
      </div>
    </header>
  )
}
