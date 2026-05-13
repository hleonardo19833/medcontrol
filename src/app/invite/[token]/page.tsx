import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AcceptInvitePage({ params }: { params: { token: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/auth/login?redirect=/invite/${params.token}`)

  const { data: link } = await supabase
    .from('caregiver_links')
    .select('*, patient:profiles!caregiver_links_patient_id_fkey(full_name, email)')
    .eq('invite_token', params.token)
    .single()

  if (!link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-3">❌</div>
          <h1 className="text-xl font-bold text-slate-900">Convite inválido</h1>
          <p className="text-slate-500 text-sm mt-2">Este link de convite não existe ou expirou.</p>
        </div>
      </div>
    )
  }

  async function acceptInvite() {
    'use server'
    const supabase = createClient()
    await supabase
      .from('caregiver_links')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('invite_token', params.token)
    redirect('/dashboard/caregiver')
  }

  async function rejectInvite() {
    'use server'
    const supabase = createClient()
    await supabase
      .from('caregiver_links')
      .update({ status: 'rejected' })
      .eq('invite_token', params.token)
    redirect('/dashboard')
  }

  const patient = link.patient as any

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-indigo-50 px-4">
      <div className="card p-8 max-w-sm w-full text-center animate-slide-in">
        <div className="text-5xl mb-4">👥</div>
        <h1 className="text-xl font-bold text-slate-900">Convite de cuidador</h1>
        <p className="text-slate-500 text-sm mt-3">
          <strong className="text-slate-700">{patient?.full_name}</strong> ({patient?.email}) quer que você seja o cuidador dele no MedControl.
        </p>
        <p className="text-slate-400 text-xs mt-2">
          Como cuidador, você poderá ver se as doses foram confirmadas e receberá alertas caso alguma seja perdida.
        </p>

        <div className="flex gap-3 mt-6">
          <form action={rejectInvite} className="flex-1">
            <button type="submit" className="btn-secondary w-full">Recusar</button>
          </form>
          <form action={acceptInvite} className="flex-1">
            <button type="submit" className="btn-primary w-full">✓ Aceitar</button>
          </form>
        </div>
      </div>
    </div>
  )
}
