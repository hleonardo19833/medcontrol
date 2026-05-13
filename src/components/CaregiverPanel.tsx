'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { Dose } from '@/types'

interface Patient {
  patient_id: string
  patient: { id: string; full_name: string; email: string } | null
  alert_delay_minutes: number
}

interface Props {
  patients: Patient[]
  doses: (Dose & { medication: any })[]
}

export default function CaregiverPanel({ patients, doses: initialDoses }: Props) {
  const supabase = createClient()
  const [doses, setDoses] = useState(initialDoses)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    const patientIds = patients.map(p => p.patient_id)
    if (patientIds.length === 0) return

    const channel = supabase
      .channel('caregiver-doses')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'doses',
        filter: `scheduled_date=eq.${today}`,
      }, payload => {
        if (payload.eventType === 'UPDATE') {
          setDoses(prev => prev.map(d =>
            d.id === (payload.new as Dose).id ? { ...d, ...payload.new } : d
          ))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients.map(p => p.patient_id).join(',')])

  return (
    <div className="space-y-4">
      {patients.map(link => {
        const patient = link.patient
        const patientDoses = doses.filter(d => d.user_id === link.patient_id)
        const taken = patientDoses.filter(d => d.status === 'taken').length
        const total = patientDoses.length
        const pending = patientDoses.filter(d => d.status === 'pending')

        const now = new Date()
        const overdue = pending.filter(d => {
          const scheduledAt = new Date(`${d.scheduled_date}T${d.scheduled_time}`)
          const minutesLate = (now.getTime() - scheduledAt.getTime()) / 60000
          return minutesLate >= link.alert_delay_minutes
        })

        return (
          <div key={link.patient_id} className="border border-slate-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                  {patient?.full_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">{patient?.full_name}</p>
                  <p className="text-xs text-slate-500">Hoje: {taken}/{total} doses</p>
                </div>
              </div>
              <div className={`badge text-xs ${
                total === 0 ? 'bg-slate-100 text-slate-500' :
                taken === total ? 'bg-green-100 text-green-700' :
                overdue.length > 0 ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {total === 0 ? 'Sem doses' :
                 taken === total ? '✓ Em dia' :
                 overdue.length > 0 ? `⚠ ${overdue.length} atrasada${overdue.length > 1 ? 's' : ''}` :
                 'Pendente'}
              </div>
            </div>

            {patientDoses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {patientDoses.map(d => (
                  <div
                    key={d.id}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      d.status === 'taken'   ? 'bg-green-100 text-green-700' :
                      d.status === 'missed'  ? 'bg-red-100 text-red-600' :
                      d.status === 'skipped' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {d.scheduled_time} · {d.medication?.name?.split(' ')[0]}
                    {d.status === 'taken' ? ' ✓' : d.status === 'pending' ? ' ⏳' : ' ✗'}
                  </div>
                ))}
              </div>
            )}

            {overdue.length > 0 && (
              <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-700">
                  ⚠️ Alerta: {patient?.full_name?.split(' ')[0]} não confirmou {overdue.length} dose{overdue.length > 1 ? 's' : ''} nos últimos {link.alert_delay_minutes} minutos
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
