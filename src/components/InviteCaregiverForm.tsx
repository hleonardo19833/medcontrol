'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function InviteCaregiverForm() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Find user by email
    const { data: { user } } = await supabase.auth.getUser()
    const { data: caregiver } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (!caregiver) {
      toast.error('Usuário não encontrado. O cuidador precisa ter uma conta no MedControl.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('caregiver_links').insert({
      patient_id: user!.id,
      caregiver_id: caregiver.id,
    })

    if (error) {
      if (error.code === '23505') toast.error('Cuidador já vinculado')
      else toast.error('Erro ao vincular cuidador')
    } else {
      toast.success('Convite enviado!')
      setEmail('')
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm">
        + Adicionar cuidador
      </button>
    )
  }

  return (
    <form onSubmit={handleInvite} className="space-y-3">
      <div>
        <label className="label">E-mail do cuidador</label>
        <input
          type="email"
          className="input"
          placeholder="familiar@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <p className="text-xs text-slate-400 mt-1">O cuidador precisa ter conta no MedControl</p>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 text-sm">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm">
          {loading ? 'Enviando...' : 'Enviar convite'}
        </button>
      </div>
    </form>
  )
}
