'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Conta criada! Verifique seu e-mail.')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-indigo-50 px-4">
      <div className="card w-full max-w-md p-8 animate-slide-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4">💊</div>
          <h1 className="text-2xl font-bold text-slate-900">Criar conta grátis</h1>
          <p className="text-slate-500 text-sm mt-1">Comece a controlar seus medicamentos hoje</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="label">Nome completo</label>
            <input
              type="text"
              className="input"
              placeholder="Seu nome"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              placeholder="seu@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              className="input"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Ao criar sua conta, você concorda com nossos termos de uso.
        </p>

        <p className="text-center text-sm text-slate-500 mt-4">
          Já tem conta?{' '}
          <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
