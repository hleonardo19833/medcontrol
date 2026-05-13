import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MedicationCard from '@/components/MedicationCard'
import { FREE_PLAN_LIMITS } from '@/types'

export default async function MedicationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user!.id)
    .single()

  const plan = profile?.plan ?? 'free'
  const canAdd = plan === 'pro' || (medications?.length ?? 0) < FREE_PLAN_LIMITS.max_medications

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicamentos</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {medications?.length ?? 0} ativo{medications?.length !== 1 ? 's' : ''}
            {plan === 'free' && ` • ${FREE_PLAN_LIMITS.max_medications - (medications?.length ?? 0)} restante${medications?.length !== 1 ? 's' : ''} no plano grátis`}
          </p>
        </div>
        {canAdd ? (
          <Link href="/dashboard/medications/new" className="btn-primary text-sm px-4 py-2">
            + Adicionar
          </Link>
        ) : (
          <Link href="/dashboard/upgrade" className="btn-secondary text-sm px-4 py-2 text-brand-600 border-brand-200">
            ✨ Upgrade Pro
          </Link>
        )}
      </div>

      {!canAdd && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
          <p className="text-sm text-brand-700 font-medium">
            Limite do plano grátis atingido
          </p>
          <p className="text-xs text-brand-600 mt-1">
            Faça upgrade para o plano Pro e gerencie medicamentos ilimitados.
          </p>
          <Link href="/dashboard/upgrade" className="inline-block mt-3 text-xs font-semibold text-brand-700 underline">
            Ver plano Pro →
          </Link>
        </div>
      )}

      {medications?.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">💊</div>
          <h2 className="font-semibold text-slate-700 text-lg">Nenhum medicamento cadastrado</h2>
          <p className="text-slate-500 text-sm mt-2 mb-6">
            Adicione seus remédios para começar a receber alertas e controlar sua adesão.
          </p>
          <Link href="/dashboard/medications/new" className="btn-primary inline-flex">
            + Adicionar primeiro medicamento
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {medications.map(med => (
            <MedicationCard key={med.id} medication={med} />
          ))}
        </div>
      )}
    </div>
  )
}
