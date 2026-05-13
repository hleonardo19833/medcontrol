import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MedicationDetail from './MedicationDetail'

export default async function MedicationPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: medication } = await supabase
    .from('medications')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (!medication) notFound()

  // Last 7 doses
  const { data: recentDoses } = await supabase
    .from('doses')
    .select('*')
    .eq('medication_id', params.id)
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: false })
    .limit(14)

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user!.id)
    .single()

  return <MedicationDetail medication={medication} recentDoses={recentDoses ?? []} plan={profile?.plan ?? 'free'} />
}
