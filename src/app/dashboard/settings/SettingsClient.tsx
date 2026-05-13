'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push'
import type { Profile } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Props {
  profile: Profile | null
}

export default function SettingsClient({ profile }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    notifications_enabled: profile?.notifications_enabled ?? true,
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: form.full_name, phone: form.phone, notifications_enabled: form.notifications_enabled })
      .eq('id', profile!.id)
    if (error) toast.error('Erro ao salvar')
    else { toast.success('Salvo!'); router.refresh() }
    setLoading(false)
  }

  async function handleEnablePush() {
    const sub = await subscribeToPush()
    if (!sub) { toast.error('Permissão negada'); return }
    await supabase.from('profiles').update({ push_subscription: sub.toJSON() }).eq('id', profile!.id)
    toast.success('Notificações push ativadas!')
    router.refresh()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm mt-0.5">{profile?.email}</p>
      </div>

      {/* Plan badge */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800">
            Plano {profile?.plan === 'pro' ? '⭐ Pro' : '🆓 Grátis'}
          </p>
          <p className="text-sm text-slate-500 mt-0.5">
            {profile?.plan === 'free'
              ? 'Até 3 medicamentos, histórico de 30 dias'
              : 'Medicamentos ilimitados, todos os recursos'}
          </p>
        </div>
        {profile?.plan === 'free' && (
          <Link href="/dashboard/upgrade" className="btn-primary text-sm px-4 py-2">
            Upgrade
          </Link>
        )}
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="card p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Perfil</h2>
        <div>
          <label className="label">Nome completo</label>
          <input type="text" className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Telefone (opcional)</label>
          <input type="tel" className="input" placeholder="(44) 99999-9999" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="font-medium text-sm text-slate-700">Notificações</p>
            <p className="text-xs text-slate-400">Receber alertas de doses</p>
          </div>
          <button
            type="button"
            className={`w-12 h-6 rounded-full transition-colors ${form.notifications_enabled ? 'bg-brand-500' : 'bg-slate-200'}`}
            onClick={() => setForm(f => ({ ...f, notifications_enabled: !f.notifications_enabled }))}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.notifications_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      {/* Push notifications */}
      {!profile?.push_subscription && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-1">Notificações Push</h2>
          <p className="text-sm text-slate-500 mb-4">Receba alertas mesmo com o app fechado</p>
          <button onClick={handleEnablePush} className="btn-secondary w-full">
            🔔 Ativar notificações push
          </button>
        </div>
      )}

      {/* Danger zone */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Conta</h2>
        <button onClick={handleSignOut} className="btn-danger w-full text-sm py-2.5">
          Sair da conta
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 pb-4">
        MedControl v0.1.0 • Não substitui orientação médica
      </p>
    </div>
  )
}
