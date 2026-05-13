'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { MED_COLORS } from '@/lib/utils'
import type { Medication, DoseUnit, Frequency } from '@/types'
import toast from 'react-hot-toast'

const DOSE_UNITS: DoseUnit[] = ['comprimido', 'cápsula', 'mg', 'ml', 'gota', 'ampola']
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function EditForm({ medication }: { medication: Medication }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(medication.photo_url)

  const [form, setForm] = useState({
    name: medication.name,
    description: medication.description ?? '',
    color: medication.color,
    dose_amount: medication.dose_amount,
    dose_unit: medication.dose_unit as DoseUnit,
    frequency: medication.frequency as Frequency,
    times_per_day: medication.times_per_day,
    schedule_times: medication.schedule_times,
    specific_days: medication.specific_days ?? [0,1,2,3,4,5,6],
    interval_hours: medication.interval_hours ?? 8,
    stock_count: String(medication.stock_count ?? ''),
    stock_alert_days: medication.stock_alert_days,
    start_date: medication.start_date,
    end_date: medication.end_date ?? '',
  })

  function setField(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function updateScheduleTime(index: number, value: string) {
    const times = [...form.schedule_times]
    times[index] = value
    setField('schedule_times', times)
  }

  function updateTimesPerDay(n: number) {
    const times = Array.from({ length: n }, (_, i) =>
      form.schedule_times[i] || `${String(8 + i * Math.floor(12 / n)).padStart(2, '0')}:00`
    )
    setForm(f => ({ ...f, times_per_day: n, schedule_times: times }))
  }

  function toggleDay(day: number) {
    const days = form.specific_days.includes(day)
      ? form.specific_days.filter(d => d !== day)
      : [...form.specific_days, day]
    setField('specific_days', days)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return }
    setLoading(true)

    try {
      let photo_url = medication.photo_url

      if (photoFile) {
        const { data: { user } } = await supabase.auth.getUser()
        const ext = photoFile.name.split('.').pop()
        const path = `${user!.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('medication-photos')
          .upload(path, photoFile)
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('medication-photos')
            .getPublicUrl(path)
          photo_url = publicUrl
        }
      }

      const { error } = await supabase
        .from('medications')
        .update({
          name: form.name.trim(),
          description: form.description || null,
          photo_url,
          color: form.color,
          dose_amount: form.dose_amount,
          dose_unit: form.dose_unit,
          frequency: form.frequency,
          times_per_day: form.times_per_day,
          schedule_times: form.schedule_times,
          specific_days: form.frequency === 'specific_days' ? form.specific_days : null,
          interval_hours: form.frequency === 'interval_hours' ? form.interval_hours : null,
          stock_count: form.stock_count ? parseInt(form.stock_count) : null,
          stock_alert_days: form.stock_alert_days,
          start_date: form.start_date,
          end_date: form.end_date || null,
        })
        .eq('id', medication.id)

      if (error) throw error

      toast.success('Medicamento atualizado!')
      router.push(`/dashboard/medications/${medication.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-slide-in pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600">
          ←
        </button>
        <h1 className="text-xl font-bold text-slate-900">Editar medicamento</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo */}
        <div className="card p-4">
          <label className="label">Foto do medicamento</label>
          <div className="flex items-center gap-4">
            <label htmlFor="photo-edit" className="cursor-pointer">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-brand-300 transition-colors overflow-hidden">
                {photoPreview ? (
                  <Image src={photoPreview} alt="Preview" width={80} height={80} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-3xl">📷</span>
                )}
              </div>
              <input id="photo-edit" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            <p className="text-sm text-slate-500">Clique para trocar a foto</p>
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input type="text" className="input" value={form.name} onChange={e => setField('name', e.target.value)} required />
          </div>
          <div>
            <label className="label">Observações</label>
            <input type="text" className="input" value={form.description} onChange={e => setField('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {MED_COLORS.map(c => (
                <button key={c} type="button"
                  className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setField('color', c)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <h3 className="font-semibold text-slate-800">Dose</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Quantidade</label>
              <input type="number" step="0.5" min="0.5" className="input" value={form.dose_amount}
                onChange={e => setField('dose_amount', parseFloat(e.target.value))} />
            </div>
            <div className="flex-1">
              <label className="label">Unidade</label>
              <select className="input" value={form.dose_unit} onChange={e => setField('dose_unit', e.target.value)}>
                {DOSE_UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-4 space-y-4">
          <h3 className="font-semibold text-slate-800">Horários</h3>
          <div>
            <label className="label">Frequência</label>
            <select className="input" value={form.frequency} onChange={e => setField('frequency', e.target.value)}>
              <option value="daily">Todos os dias</option>
              <option value="specific_days">Dias específicos</option>
              <option value="interval_hours">A cada N horas</option>
            </select>
          </div>

          {form.frequency === 'specific_days' && (
            <div>
              <label className="label">Dias da semana</label>
              <div className="flex gap-1.5">
                {DAYS.map((day, i) => (
                  <button key={i} type="button"
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${form.specific_days.includes(i) ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                    onClick={() => toggleDay(i)}>{day}</button>
                ))}
              </div>
            </div>
          )}

          {form.frequency === 'interval_hours' ? (
            <div>
              <label className="label">A cada quantas horas</label>
              <input type="number" min="1" max="24" className="input" value={form.interval_hours}
                onChange={e => setField('interval_hours', parseInt(e.target.value))} />
            </div>
          ) : (
            <>
              <div>
                <label className="label">Vezes por dia</label>
                <div className="flex gap-2">
                  {[1,2,3,4].map(n => (
                    <button key={n} type="button"
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${form.times_per_day === n ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                      onClick={() => updateTimesPerDay(n)}>{n}x</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="label">Horários</label>
                {form.schedule_times.map((t, i) => (
                  <input key={i} type="time" className="input" value={t}
                    onChange={e => updateScheduleTime(i, e.target.value)} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card p-4 space-y-4">
          <h3 className="font-semibold text-slate-800">Período</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Início</label>
              <input type="date" className="input" value={form.start_date}
                onChange={e => setField('start_date', e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="label">Término</label>
              <input type="date" className="input" value={form.end_date}
                onChange={e => setField('end_date', e.target.value)} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
          {loading ? 'Salvando...' : '💾 Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
