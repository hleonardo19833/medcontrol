'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import AdherenceCalendar from '@/components/AdherenceCalendar'
import PDFReportButton from '@/components/PDFReportButton'

export default function HistoryPage() {
  const supabase = createClient()
  const [monthStr, setMonthStr] = useState(format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<any>({ doses: [], stats: null, medications: [], profile: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const monthDate = new Date(monthStr + '-01')
      const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
      const end = format(endOfMonth(monthDate), 'yyyy-MM-dd')

      const [dosesRes, statsRes, medsRes, profileRes] = await Promise.all([
        supabase.from('doses').select('*, medication:medications(name, color)').eq('user_id', user.id).gte('scheduled_date', start).lte('scheduled_date', end).order('scheduled_time'),
        supabase.rpc('get_adherence_stats', { p_user_id: user.id, p_start_date: start, p_end_date: end }),
        supabase.from('medications').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])

      setData({ doses: dosesRes.data ?? [], stats: statsRes.data?.[0], medications: medsRes.data ?? [], profile: profileRes.data })
      setLoading(false)
    }
    load()
  }, [monthStr])

  const { doses, stats, medications, profile } = data
  const monthDate = new Date(monthStr + '-01')
  const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const end = format(endOfMonth(monthDate), 'yyyy-MM-dd')

  if (loading) return <div className="text-center py-10 text-slate-400">Carregando...</div>

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Histórico</h1>
          <p className="text-slate-500 text-sm mt-0.5">Adesão ao tratamento</p>
        </div>
        <PDFReportButton profile={profile} medications={medications} doses={doses} stats={stats} startDate={start} endDate={end} plan={profile?.plan} />
      </div>

      {stats && stats.total_doses > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.adherence_rate ?? 0}%</div>
            <div className="text-xs text-slate-500 mt-1">Taxa de adesão</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-slate-800">{stats.taken_doses}/{stats.total_doses}</div>
            <div className="text-xs text-slate-500 mt-1">Doses tomadas</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-red-500">{stats.missed_doses}</div>
            <div className="text-xs text-slate-500 mt-1">Perdidas</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500">{stats.skipped_doses}</div>
            <div className="text-xs text-slate-500 mt-1">Puladas</div>
          </div>
        </div>
      )}

      <AdherenceCalendar doses={doses} monthStr={monthStr} onMonthChange={setMonthStr} />
    </div>
  )
}
