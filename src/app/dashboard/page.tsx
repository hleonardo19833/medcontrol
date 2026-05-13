import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import TodayDoses from '@/components/TodayDoses'
import StockAlerts from '@/components/StockAlerts'
import AdherenceWidget from '@/components/AdherenceWidget'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const today = format(new Date(), 'yyyy-MM-dd')

  // Get today's doses with medication info
  const { data: doses } = await supabase
    .from('doses')
    .select('*, medication:medications(*)')
    .eq('user_id', user!.id)
    .eq('scheduled_date', today)
    .order('scheduled_time')

  // Get active medications for stock alerts
  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', user!.id)
    .eq('is_active', true)

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Get weekly adherence
  const weekAgo = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  const { data: stats } = await supabase
    .rpc('get_adherence_stats', {
      p_user_id: user!.id,
      p_start_date: weekAgo,
      p_end_date: today,
    })

  const todayFormatted = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })
  const pending = doses?.filter(d => d.status === 'pending') ?? []
  const taken   = doses?.filter(d => d.status === 'taken') ?? []

  return (
    <div className="space-y-5 animate-slide-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 capitalize">
          Olá, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm capitalize mt-0.5">{todayFormatted}</p>
      </div>

      {/* Summary pills */}
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
          <div className="text-2xl font-bold text-slate-800">{doses?.length ?? 0}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total hoje</div>
        </div>
      </div>

      {/* Stock alerts */}
      <StockAlerts medications={medications ?? []} plan={profile?.plan} />

      {/* Today's doses */}
      <TodayDoses doses={doses ?? []} />

      {/* Weekly adherence */}
      <AdherenceWidget stats={stats?.[0]} />
    </div>
  )
}
