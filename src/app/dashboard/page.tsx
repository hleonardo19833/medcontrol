'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import TodayDoses from '@/components/TodayDoses'
import StockAlerts from '@/components/StockAlerts'
import AdherenceWidget from '@/components/AdherenceWidget'

export default function DashboardPage() {
  const supabase = createClient()
  const [data, setData] = useState<any>({ doses: [], medications: [], profile: null, stats: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = format(new Date(), 'yyyy-MM-dd')
      const weekAgo = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

      const [dosesRes, medsRes, profileRes, statsRes] = await Promise.all([
        supabase.from('doses').select('*, medication:medications(*)').eq('user_id', user.id).eq('scheduled_date', today).order('scheduled_time'),
        supabase.from('medications').select('*').eq('user_id', user.id).eq('is_active', true),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.rpc('get_adherence_stats', { p_user_id: user.id, p_start_date: weekAgo, p_end_date: today }),
      ])

      setData({
        doses: dosesRes.data ?? [],
        medications: medsRes.data ?? [],
        profile: profileRes.data,
        stats: statsRes.data?.[0],
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-center py-10 text-slate-400">Carregando...</div>

  const { doses, medications, profile, stats } = data
  const pending = doses.filter((d: any) => d.status === 'pending')
  const taken = doses.filter((d: any) => d.status === 'taken')
  const todayFormatted = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 capitalize">
          Olá, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm capitalize mt-0.5">{todayFormatted}</p>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-brand-600">{pending.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Pendentes</div>
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{taken.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Tomados hoje</div>
        </div>
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-slate-800">{doses.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total hoje</div>
        </div>
      </div>

      <StockAlerts medications={medications} plan={profile?.plan} />
      <TodayDoses doses={doses} />
      <AdherenceWidget stats={stats} />
    </div>
  )
}
