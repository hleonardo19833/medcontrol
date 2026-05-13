'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, PRO_PLAN_PRICE } from '@/lib/utils'
import toast from 'react-hot-toast'

const FEATURES_FREE = ['Até 3 medicamentos', 'Alertas de horário', 'Histórico de 30 dias', '1 cuidador']
const FEATURES_PRO  = [
  'Medicamentos ilimitados',
  'Alertas avançados',
  'Histórico completo',
  'Cuidadores ilimitados',
  'Relatório PDF para médico',
  'Controle de estoque',
  'Alerta de estoque acabando',
  'Suporte prioritário',
]

export default function UpgradePage() {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    /**
     * ASAAS PAYMENT INTEGRATION - READY TO IMPLEMENT
     * 
     * Quando for implementar:
     * 1. Chame a API: POST /api/payment/create-subscription
     * 2. A API cria o cliente no Asaas e gera o link de pagamento
     * 3. Redirecione para o link do Asaas
     * 4. O webhook /api/webhooks/asaas atualiza o plano após confirmação
     * 
     * Exemplo de implementação:
     * const res = await fetch('/api/payment/create-subscription', { method: 'POST' })
     * const { paymentUrl } = await res.json()
     * window.location.href = paymentUrl
     */
    toast('Em breve! Integração Asaas em implementação.', { icon: '🚧' })
    setLoading(false)
  }

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="text-center pt-4">
        <div className="text-5xl mb-3">⭐</div>
        <h1 className="text-2xl font-bold text-slate-900">MedControl Pro</h1>
        <p className="text-slate-500 mt-2">Todos os recursos para seguir seu tratamento com perfeição</p>
      </div>

      {/* Price */}
      <div className="card p-6 text-center">
        <div className="text-4xl font-bold text-slate-900">
          {formatCurrency(PRO_PLAN_PRICE)}
        </div>
        <div className="text-slate-500 mt-1">por mês • cancele quando quiser</div>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="btn-primary w-full mt-5 py-3.5 text-base shadow-lg shadow-brand-200"
        >
          {loading ? 'Aguarde...' : '✨ Assinar Pro agora'}
        </button>
        <p className="text-xs text-slate-400 mt-3">
          Pagamento seguro via Asaas • Cancele a qualquer momento
        </p>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">🆓 Grátis</h3>
          <ul className="space-y-2">
            {FEATURES_FREE.map(f => (
              <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="text-slate-400 mt-0.5">·</span> {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4 border-2 border-brand-400">
          <h3 className="font-semibold text-brand-700 text-sm mb-3">⭐ Pro</h3>
          <ul className="space-y-2">
            {FEATURES_PRO.map(f => (
              <li key={f} className="flex items-start gap-2 text-xs text-slate-700">
                <span className="text-brand-500 mt-0.5">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 pb-4">
        Dúvidas? Entre em contato pelo suporte.
      </p>
    </div>
  )
}
