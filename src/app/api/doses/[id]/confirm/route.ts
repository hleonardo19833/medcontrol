import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await req.json()

  const { error } = await supabase
    .from('doses')
    .update({ status: status || 'taken', confirmed_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Decrement stock count if medication tracks stock
  const { data: dose } = await supabase
    .from('doses')
    .select('medication_id')
    .eq('id', params.id)
    .single()

  if (dose && status === 'taken') {
    const { data: med } = await supabase
      .from('medications')
      .select('stock_count, dose_amount')
      .eq('id', dose.medication_id)
      .single()

    if (med?.stock_count !== null) {
      await supabase
        .from('medications')
        .update({ stock_count: Math.max(0, med.stock_count - med.dose_amount) })
        .eq('id', dose.medication_id)
    }
  }

  return NextResponse.json({ ok: true })
}
