import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNav from '@/components/AppNav'
import AppHeader from '@/components/AppHeader'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppHeader profile={profile} />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-4 pb-24">
        {children}
      </main>
      <AppNav />
    </div>
  )
}
