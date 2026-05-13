import { createClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import AdherenceCalendar from '@/components/AdherenceCalendar'
import PDFReportButton from '@/components/PDFReportButton'

export default async function HistoryPage({ searchParams }: { searchParams: { month?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const monthStr = searchParams.month || format(new Date(), 'yyyy-MM')
  const monthDate = new Date(monthStr + '-01')
  const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const end = format(endOfMonth(monthDate), 'yyyy-MM-dd')

  const { data: doses } = await supabase
    .from('doses')
    .select('*, medication:medications(name, color)')
    .eq('user_id', user!.id)
    .gte('scheduled_date', start)
    .lte('scheduled_date', end)
    .order('scheduled_time')

  const { data: stats } = await supabase
    .rpc('get_adherence_stats', {
      p_user_id: user!.id,
      p_start_date: start,
      p_end_date: end,
    })

  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', user!.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Histórico</h1>
          <p className="text-slate-500 text-sm mt-0.5">Adesão ao tratamento</p>
        </div>
        <PDFReportButton
          profile={profile}
          medications={medications ?? []}
          doses={doses ?? []}
          stats={stats?.[0]}
          startDate={start}
          endDate={end}
          plan={profile?.plan}
        />
      </div>

      {/* Stats */}
      {stats?.[0] && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats[0].adherence_rate ?? 0}%</div>
            <div className="text-xs text-slate-500 mt-1">Taxa de adesão</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-slate-800">{stats[0].taken_doses}/{stats[0].total_doses}</div>
            <div className="text-xs text-slate-500 mt-1">Doses tomadas</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-red-500">{stats[0].missed_doses}</div>
            <div className="text-xs text-slate-500 mt-1">Perdidas</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-yellow-500">{stats[0].skipped_doses}</div>
            <div className="text-xs text-slate-500 mt-1">Puladas</div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <AdherenceCalendar doses={doses ?? []} monthStr={monthStr} />
    </div>
  )
}
