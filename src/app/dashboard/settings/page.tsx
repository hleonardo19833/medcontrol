'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { subscribeToPush } from '@/lib/push'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', notifications_enabled: true })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setForm({ full_name: data?.full_name ?? '', phone: data?.phone ?? '', notifications_enabled: data?.notifications_enabled ?? true })
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone, notifications_enabled: form.notifications_enabled }).eq('id', profile.id)
    if (error) toast.error('Erro ao salvar')
    else toast.success('Salvo!')
    setSaving(false)
  }

  async function handleEnablePush() {
    const sub = await subscribeToPush()
    if (!sub) { toast.error('Permissão negada'); return }
    await supabase.from('profiles').update({ push_subscription: sub.toJSON() }).eq('id', profile.id)
    toast.success('Notificações push ativadas!')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div className="text-center py-10 text-slate-400">Carregando...</div>

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm mt-0.5">{profile?.email}</p>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800">Plano {profile?.plan === 'pro' ? '⭐ Pro' : '🆓 Grátis'}</p>
          <p className="text-sm text-slate-500 mt-0.5">{profile?.plan === 'free' ? 'Até 3 medicamentos' : 'Todos os recursos'}</p>
        </div>
        {profile?.plan === 'free' && <Link href="/dashboard/upgrade" className="btn-primary text-sm px-4 py-2">Upgrade</Link>}
      </div>

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
          <button type="button"
            className={`w-12 h-6 rounded-full transition-colors ${form.notifications_enabled ? 'bg-brand-500' : 'bg-slate-200'}`}
            onClick={() => setForm(f => ({ ...f, notifications_enabled: !f.notifications_enabled }))}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.notifications_enabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Salvando...' : 'Salvar alterações'}</button>
      </form>

      {!profile?.push_subscription && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-1">Notificações Push</h2>
          <p className="text-sm text-slate-500 mb-4">Receba alertas mesmo com o app fechado</p>
          <button onClick={handleEnablePush} className="btn-secondary w-full">🔔 Ativar notificações push</button>
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Conta</h2>
        <button onClick={handleSignOut} className="btn-danger w-full text-sm py-2.5">Sair da conta</button>
      </div>
      <p className="text-center text-xs text-slate-400 pb-4">MedControl v1.0 • Não substitui orientação médica</p>
    </div>
  )
}
