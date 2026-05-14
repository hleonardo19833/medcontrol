'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MedicationCard from '@/components/MedicationCard'
import { PLANS, isTrialExpired, canAddMedication, type Profile } from '@/types'

export default function MedicationsPage() {
  const supabase = createClient()
  const [medications, setMedications] = useState<any[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [medsRes, profileRes] = await Promise.all([
        supabase.from('medications').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])
      setMedications(medsRes.data ?? [])
      setProfile(profileRes.data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-center py-10 text-slate-400">Carregando...</div>

  const plan = profile?.plan ?? 'free'
  const planConfig = PLANS[plan]
  const expired = profile ? isTrialExpired(profile) : false
  const canAdd = profile ? canAddMedication(profile, medications.length) : false
  const maxMeds = planConfig.max_medications

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicamentos</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {medications.length}{maxMeds ? `/${maxMeds}` : ''} ativo{medications.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canAdd ? (
          <Link href="/dashboard/medications/new" className="btn-primary text-sm px-4 py-2">+ Adicionar</Link>
        ) : (
          <Link href="/dashboard/upgrade" className="btn-secondary text-sm px-4 py-2 text-brand-600 border-brand-200">✨ Upgrade</Link>
        )}
      </div>

      {/* Bloqueio trial expirado */}
      {expired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-700 font-semibold">⚠️ Período gratuito encerrado</p>
          <p className="text-xs text-red-600 mt-1">Assine um plano para adicionar e gerenciar medicamentos.</p>
          <Link href="/dashboard/upgrade" className="inline-block mt-3 text-xs font-semibold text-red-700 underline">Ver planos →</Link>
        </div>
      )}

      {/* Limite do plano */}
      {!expired && !canAdd && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4">
          <p className="text-sm text-brand-700 font-medium">Limite do plano {planConfig.name} atingido</p>
          <p className="text-xs text-brand-600 mt-1">Faça upgrade para adicionar mais medicamentos.</p>
          <Link href="/dashboard/upgrade" className="inline-block mt-3 text-xs font-semibold text-brand-700 underline">Ver planos →</Link>
        </div>
      )}

      {medications.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-4">💊</div>
          <h2 className="font-semibold text-slate-700 text-lg">Nenhum medicamento cadastrado</h2>
          <p className="text-slate-500 text-sm mt-2 mb-6">Adicione seus remédios para começar a receber alertas.</p>
          {canAdd && <Link href="/dashboard/medications/new" className="btn-primary inline-flex">+ Adicionar primeiro medicamento</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {medications.map(med => <MedicationCard key={med.id} medication={med} />)}
        </div>
      )}
    </div>
  )
}
