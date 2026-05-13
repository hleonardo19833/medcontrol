import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const features = [
    { icon: '💊', title: 'Alarme com foto e dose', desc: 'Cadastre o medicamento com foto, horário e dose. Nunca confunda os remédios.' },
    { icon: '✅', title: 'Confirmação em 1 toque', desc: 'Notificação push com confirmação rápida. Marque como tomado com um clique.' },
    { icon: '📅', title: 'Calendário de adesão', desc: 'Veja quais dias tomou e quais perdeu. Calendário visual e intuitivo.' },
    { icon: '📄', title: 'Relatório PDF', desc: 'Gere um relatório mensal completo para levar à consulta médica.' },
    { icon: '👨‍👩‍👧', title: 'Modo cuidador', desc: 'Familiar vê em tempo real se a dose foi tomada. Alerta se não confirmar em 30 min.' },
    { icon: '📦', title: 'Alerta de estoque', desc: 'Conta os comprimidos restantes e avisa com 5 dias de antecedência para comprar mais.' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-indigo-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white text-lg">💊</div>
          <span className="font-bold text-xl text-slate-800">MedControl</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-slate-600 hover:text-brand-600 text-sm font-medium transition-colors">
            Entrar
          </Link>
          <Link href="/auth/register" className="btn-primary text-sm px-5 py-2">
            Criar conta grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-20 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          ✨ Grátis para começar
        </div>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-5">
          Nunca perca uma<br />
          <span className="text-brand-500">dose de remédio</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 leading-relaxed">
          Alertas inteligentes, modo cuidador, histórico de adesão e relatório PDF para o médico.
          Tudo num só app.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-brand-200">
            Começar gratuitamente →
          </Link>
          <Link href="#features" className="text-slate-500 hover:text-slate-700 text-sm font-medium">
            Ver recursos ↓
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 pb-20 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-3">Tudo que você precisa</h2>
        <p className="text-slate-500 text-center mb-10">Para seguir o tratamento com segurança e tranquilidade</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-slate-800 mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-3">Planos simples e transparentes</h2>
        <p className="text-slate-500 text-center mb-10">Comece de graça, evolua quando precisar</p>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="card p-8">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Grátis</div>
            <div className="text-4xl font-bold text-slate-900 mb-1">R$ 0</div>
            <p className="text-slate-500 text-sm mb-6">Para sempre</p>
            <ul className="space-y-2.5 text-sm text-slate-600 mb-8">
              {['Até 3 medicamentos', 'Alertas básicos', 'Histórico de 30 dias', '1 cuidador vinculado'].map(i => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> {i}
                </li>
              ))}
            </ul>
            <Link href="/auth/register" className="btn-secondary w-full">Começar grátis</Link>
          </div>
          {/* Pro */}
          <div className="card p-8 border-2 border-brand-400 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
              MAIS POPULAR
            </div>
            <div className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-2">Pro</div>
            <div className="text-4xl font-bold text-slate-900 mb-1">R$ 19,90</div>
            <p className="text-slate-500 text-sm mb-6">por mês</p>
            <ul className="space-y-2.5 text-sm text-slate-600 mb-8">
              {[
                'Medicamentos ilimitados',
                'Alertas avançados',
                'Histórico completo',
                'Cuidadores ilimitados',
                'Relatório PDF',
                'Controle de estoque',
              ].map(i => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-brand-500">✓</span> {i}
                </li>
              ))}
            </ul>
            <Link href="/auth/register" className="btn-primary w-full">Começar grátis</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} MedControl. Feito com ♥ para facilitar tratamentos.</p>
        <p className="mt-1 text-xs">Este app não substitui orientação médica profissional.</p>
      </footer>
    </main>
  )
}
