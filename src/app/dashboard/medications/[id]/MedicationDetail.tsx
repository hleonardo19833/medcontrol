'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getDaysUntilRunOut, isStockLow, getStatusColor, getStatusLabel, formatDate } from '@/lib/utils'
import type { Medication, Dose } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Props {
  medication: Medication
  recentDoses: Dose[]
  plan: string
}

export default function MedicationDetail({ medication: initialMed, recentDoses, plan }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [med, setMed] = useState(initialMed)
  const [editingStock, setEditingStock] = useState(false)
  const [newStock, setNewStock] = useState(String(med.stock_count ?? ''))
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const stockDays = getDaysUntilRunOut(med)
  const stockLow = isStockLow(med)

  async function handleUpdateStock(e: React.FormEvent) {
    e.preventDefault()
    if (plan === 'free') { toast.error('Controle de estoque disponível no plano Pro'); return }
    const count = parseInt(newStock)
    if (isNaN(count)) return
    const { data, error } = await supabase
      .from('medications')
      .update({ stock_count: count })
      .eq('id', med.id)
      .select()
      .single()
    if (error) toast.error('Erro ao atualizar')
    else { setMed(data); setEditingStock(false); toast.success('Estoque atualizado!') }
  }

  async function handleDeactivate() {
    setLoading(true)
    const { error } = await supabase
      .from('medications')
      .update({ is_active: false })
      .eq('id', med.id)
    if (error) toast.error('Erro')
    else { toast.success('Medicamento arquivado'); router.push('/dashboard/medications') }
    setLoading(false)
  }

  const taken = recentDoses.filter(d => d.status === 'taken').length
  const total = recentDoses.filter(d => d.status !== 'pending').length
  const adherence = total > 0 ? Math.round((taken / total) * 100) : null

  return (
    <div className="space-y-5 animate-slide-in pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600">
          ←
        </button>
        <h1 className="text-xl font-bold text-slate-900 truncate">{med.name}</h1>
      </div>

      {/* Main card */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          {med.photo_url ? (
            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 shrink-0">
              <Image src={med.photo_url} alt={med.name} width={80} height={80} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0"
              style={{ backgroundColor: med.color + '20', border: `2px solid ${med.color}40` }}
            >
              💊
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{med.name}</h2>
            <p className="text-slate-500 text-sm mt-0.5">{med.dose_amount} {med.dose_unit}</p>
            {med.description && <p className="text-slate-500 text-sm mt-1">{med.description}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="badge bg-brand-50 text-brand-700">{med.times_per_day}x ao dia</span>
              <span className="badge bg-slate-100 text-slate-600">{med.schedule_times.join(' · ')}</span>
              {med.frequency === 'specific_days' && (
                <span className="badge bg-purple-50 text-purple-700">Dias específicos</span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-4 pt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-400 text-xs block">Início</span>
            <span className="font-medium text-slate-700">{formatDate(med.start_date)}</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Término</span>
            <span className="font-medium text-slate-700">{med.end_date ? formatDate(med.end_date) : 'Contínuo'}</span>
          </div>
        </div>
      </div>

      {/* Adherence mini stat */}
      {adherence !== null && (
        <div className="card p-4 flex items-center gap-4">
          <div className="text-3xl font-bold text-brand-600">{adherence}%</div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Adesão recente</p>
            <p className="text-xs text-slate-500">{taken} de {total} doses tomadas</p>
          </div>
        </div>
      )}

      {/* Stock control */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Estoque</h3>
          {plan === 'pro' && (
            <button
              onClick={() => setEditingStock(!editingStock)}
              className="text-xs text-brand-500 font-medium hover:underline"
            >
              {editingStock ? 'Cancelar' : 'Atualizar'}
            </button>
          )}
        </div>

        {plan === 'free' ? (
          <div className="text-center py-3">
            <p className="text-sm text-slate-500">Controle de estoque disponível no</p>
            <Link href="/dashboard/upgrade" className="text-brand-600 font-semibold text-sm hover:underline">plano Pro ✨</Link>
          </div>
        ) : med.stock_count === null && !editingStock ? (
          <div className="text-center py-3">
            <p className="text-sm text-slate-500 mb-2">Estoque não configurado</p>
            <button onClick={() => setEditingStock(true)} className="btn-secondary text-sm px-4 py-2">
              + Configurar estoque
            </button>
          </div>
        ) : editingStock ? (
          <form onSubmit={handleUpdateStock} className="flex gap-2">
            <input
              type="number"
              min="0"
              className="input flex-1"
              placeholder="Quantidade atual"
              value={newStock}
              onChange={e => setNewStock(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary px-4 py-2 text-sm">Salvar</button>
          </form>
        ) : (
          <div className={`flex items-center gap-3 p-3 rounded-xl ${stockLow ? 'bg-orange-50' : 'bg-slate-50'}`}>
            <span className="text-2xl">{stockLow ? '⚠️' : '📦'}</span>
            <div>
              <p className={`font-semibold ${stockLow ? 'text-orange-800' : 'text-slate-800'}`}>
                {med.stock_count} comprimidos restantes
              </p>
              <p className={`text-xs ${stockLow ? 'text-orange-600' : 'text-slate-500'}`}>
                {stockDays !== null
                  ? stockDays <= 0
                    ? 'Estoque esgotado!'
                    : `Dura mais ~${stockDays} dias`
                  : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent doses */}
      <div className="card p-4">
        <h3 className="font-semibold text-slate-800 mb-3">Últimas doses</h3>
        {recentDoses.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-3">Nenhum histórico ainda</p>
        ) : (
          <div className="space-y-2">
            {recentDoses.map(dose => (
              <div key={dose.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-slate-700">{formatDate(dose.scheduled_date)}</span>
                  <span className="text-xs text-slate-400 ml-2">{dose.scheduled_time}</span>
                </div>
                <span className={`badge text-xs ${getStatusColor(dose.status)}`}>
                  {getStatusLabel(dose.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="card p-4">
        <h3 className="font-semibold text-slate-800 mb-3">Ações</h3>
        <div className="space-y-2">
          <Link href={`/dashboard/medications/${med.id}/edit`} className="btn-secondary w-full text-sm">
            ✏️ Editar medicamento
          </Link>
          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="w-full text-sm text-red-500 hover:text-red-700 py-2 transition-colors"
            >
              Arquivar medicamento
            </button>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-sm text-red-700 font-medium mb-2">Confirma o arquivamento?</p>
              <p className="text-xs text-red-500 mb-3">O histórico de doses será mantido.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDelete(false)} className="btn-secondary flex-1 text-sm py-2">Cancelar</button>
                <button onClick={handleDeactivate} disabled={loading} className="btn-danger flex-1 text-sm py-2">
                  {loading ? '...' : 'Arquivar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
