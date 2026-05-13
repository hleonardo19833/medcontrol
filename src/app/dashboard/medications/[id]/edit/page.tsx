import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditForm from './EditForm'

export default async function EditMedicationPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: medication } = await supabase
    .from('medications')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (!medication) notFound()

  return <EditForm medication={medication} />
}
