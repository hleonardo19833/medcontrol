import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import CaregiverPanel from '@/components/CaregiverPanel'
import InviteCaregiverForm from '@/components/InviteCaregiverForm'

export default async function CaregiverPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const today = format(new Date(), 'yyyy-MM-dd')

  // Caregivers linked to me (I'm the patient)
  const { data: myCaregiversLinks } = await supabase
    .from('caregiver_links')
    .select('*, caregiver:profiles!caregiver_links_caregiver_id_fkey(id, full_name, email, avatar_url)')
    .eq('patient_id', user!.id)

  // Patients I care for (I'm the caregiver)
  const { data: myPatientsLinks } = await supabase
    .from('caregiver_links')
    .select('*, patient:profiles!caregiver_links_patient_id_fkey(id, full_name, email)')
    .eq('caregiver_id', user!.id)
    .eq('status', 'accepted')

  // Get today's doses for each patient
  const patientIds = myPatientsLinks?.map(l => l.patient_id) ?? []
  const { data: patientDoses } = patientIds.length > 0
    ? await supabase
        .from('doses')
        .select('*, medication:medications(name, color)')
        .in('user_id', patientIds)
        .eq('scheduled_date', today)
    : { data: [] }

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Modo Cuidador</h1>
        <p className="text-slate-500 text-sm mt-0.5">Monitore e seja monitorado</p>
      </div>

      {/* My caregivers */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Meus cuidadores</h2>
        {myCaregiversLinks?.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">Nenhum cuidador vinculado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myCaregiversLinks?.map(link => (
              <div key={link.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold">
                  {link.caregiver?.full_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-800">{link.caregiver?.full_name}</p>
                  <p className="text-xs text-slate-500">{link.caregiver?.email}</p>
                </div>
                <span className={`badge text-xs ${
                  link.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  link.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {link.status === 'accepted' ? 'Ativo' : link.status === 'pending' ? 'Pendente' : 'Recusado'}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <InviteCaregiverForm />
        </div>
      </div>

      {/* Patients I monitor */}
      {myPatientsLinks && myPatientsLinks.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Pacientes que monitoro</h2>
          <CaregiverPanel patients={myPatientsLinks} doses={patientDoses ?? []} />
        </div>
      )}
    </div>
  )
}
