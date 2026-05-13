import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, addDays } from 'date-fns'

/**
 * Generates pending dose records for medications.
 * Called after adding a medication and by cron job daily.
 * POST /api/doses/generate
 */
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  // Get active medications
  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .lte('start_date', tomorrow)

  if (!medications) return NextResponse.json({ generated: 0 })

  const dosesToInsert: any[] = []

  for (const med of medications) {
    for (const date of [today, tomorrow]) {
      // Check if end_date has passed
      if (med.end_date && date > med.end_date) continue

      // Check frequency
      if (med.frequency === 'specific_days') {
        const dayOfWeek = new Date(date).getDay()
        if (!med.specific_days?.includes(dayOfWeek)) continue
      }

      // Generate for each scheduled time
      for (const time of med.schedule_times) {
        dosesToInsert.push({
          medication_id: med.id,
          user_id: user.id,
          scheduled_date: date,
          scheduled_time: time,
          status: 'pending',
        })
      }
    }
  }

  // Upsert doses (skip if already exists)
  if (dosesToInsert.length > 0) {
    const { error } = await supabase
      .from('doses')
      .upsert(dosesToInsert, { onConflict: 'medication_id,scheduled_date,scheduled_time', ignoreDuplicates: true })

    if (error) console.error('Error generating doses:', error)
  }

  return NextResponse.json({ generated: dosesToInsert.length })
}
