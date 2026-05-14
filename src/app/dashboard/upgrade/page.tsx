'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PLANS, formatCurrency, isTrialExpired, getTrialDaysLeft, type Plan, type Profile } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

const PLAN_ICONS: Record<Plan, string> = {
  free: '🆓',
  basic: '💙',
  pro: '⭐',
  premium: '👑',
}

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: [
    '1 medicamento',
    'Válido por 30 dias',
    'Histórico de 30 dias',
    'Sem alertas push',
    'Sem modo cuidador',
  ],
  basic: [
    '5 medicamentos',
    '1 cuidador',
    'Histórico de 90 dias',
    'Alertas push',
    'Modo cuidador',
    'Suporte por e-mail',
  ],
  pro: [
    '15 medicamentos',
    'Até 3 cuidadores',
    'Histórico de 1 ano',
    'Relatório PDF',
    'Controle de estoque',
    'Alertas de estoque',
    'Suporte prioritário',
  ],
  premium: [
    'Medicamentos ilimitados',
    'Cuidadores ilimitados',
    'Histórico completo',
    'Relatório PDF',
    'Controle de estoque',
    'Múltiplos pacientes',
    'Suporte VIP 24h',
  ],
}

export default function UpgradePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<Plan | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubscribe(plan: Plan) {
    if (plan === 'free') return
    setPaying(plan)
    /**
     * ASAAS PAYMENT — implementar quando ativar:
     * const res = await fetch('/api/payment/create-subscription', {
     *   method: 'POST',
     *   body: JSON.stringify({ plan }),
     * })
     * const { paymentUrl } = await res.json()
     * window.location.href = paymentUrl
     */
    toast('Em breve! Pagamento via Asaas será ativado em breve.', { icon: '🚧' })
    setPaying(null)
  }

  if (loading) return <div className="text-center py-10 text-slate-400">Carregando...</div>

  const trialExpired = profile ? isTrialExpired(profile) : false
  const trialDaysLeft = profile ? getTrialDaysLeft(profile) : 0
  const currentPlan = profile?.plan ?? 'free'

  return (
    <div className="space-y-5 animate-slide-in pb-8">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="w-9 h-9 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600">←</Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Planos e Assinatura</h1>
          <p className="text-slate-500 text-sm">Escolha o melhor plano para você</p>
        </div>
      </div>

      {/* Trial banner */}
      {currentPlan === 'free' && (
        <div className={`rounded-2xl p-4 ${trialExpired ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
          {trialExpired ? (
            <>
              <p className="font-semibold text-red-700">⚠️ Período gratuito encerrado</p>
              <p className="text-sm text-red-600 mt-1">Assine um plano para continuar usando o MedControl.</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-800">⏳ Período gratuito: {trialDaysLeft} dia{trialDaysLeft !== 1 ? 's' : ''} restante{trialDaysLeft !== 1 ? 's' : ''}</p>
              <p className="text-sm text-amber-700 mt-1">Aproveite para testar todas as funcionalidades e escolher seu plano.</p>
            </>
          )}
        </div>
      )}

      {/* Current plan badge */}
      {currentPlan !== 'free' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">{PLAN_ICONS[currentPlan]}</span>
          <div>
            <p className="font-semibold text-green-800">Plano {PLANS[currentPlan].name} ativo</p>
            <p className="text-sm text-green-600">
              {profile?.plan_expires_at
                ? `Renova em ${new Date(profile.plan_expires_at).toLocaleDateString('pt-BR')}`
                : 'Assinatura ativa'}
            </p>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="space-y-4">
        {(['basic', 'pro', 'premium'] as Plan[]).map(planId => {
          const plan = PLANS[planId]
          const isCurrent = currentPlan === planId
          const isPro = planId === 'pro'
          const features = PLAN_FEATURES[planId]

          return (
            <div key={planId} className={`card p-5 relative ${isPro ? 'border-2 border-brand-400' : ''}`}>
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MAIS POPULAR
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{PLAN_ICONS[planId]}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">{formatCurrency(plan.price)}</span>
                      <span className="text-slate-500 text-sm">/mês</span>
                    </div>
                  </div>
                </div>
                {isCurrent && (
                  <span className="badge bg-green-100 text-green-700 text-xs">Plano atual</span>
                )}
              </div>

              <ul className="space-y-2 mb-5">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className={`font-bold ${isPro ? 'text-brand-500' : 'text-green-500'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-2.5 text-center text-sm font-medium text-slate-500 bg-slate-100 rounded-xl">
                  Plano atual
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(planId)}
                  disabled={paying === planId}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    isPro
                      ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-200'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  } disabled:opacity-50`}
                >
                  {paying === planId ? 'Aguarde...' : `Assinar ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Free plan details */}
      <div className="card p-5 border border-dashed border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🆓</span>
          <div>
            <h3 className="font-bold text-slate-700">Free</h3>
            <span className="text-slate-500 text-sm">30 dias • sem custo</span>
          </div>
        </div>
        <ul className="space-y-1.5">
          {PLAN_FEATURES.free.map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-500">
              <span className="text-slate-400">·</span> {f}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-xs text-slate-400">
        Pagamento seguro via Asaas · Cancele quando quiser · Sem multa
      </p>
    </div>
  )
}
