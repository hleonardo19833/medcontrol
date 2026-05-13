import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { format, addDays } from 'date-fns'

/**
 * GET /api/cron/daily
 * Runs every day at 00:05 via Vercel Cron
 * Generates dose records for today and tomorrow for all active medications
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today    = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  // Mark pending doses from yesterday as missed
  const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd')
  await supabase
    .from('doses')
    .update({ status: 'missed' })
    .eq('scheduled_date', yesterday)
    .eq('status', 'pending')

  // Get all active medications
  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', tomorrow)

  const dosesToInsert: any[] = []

  for (const med of medications ?? []) {
    for (const date of [today, tomorrow]) {
      if (med.end_date && date > med.end_date) continue

      if (med.frequency === 'specific_days') {
        const dayOfWeek = new Date(date + 'T12:00:00').getDay()
        if (!med.specific_days?.includes(dayOfWeek)) continue
      }

      for (const time of med.schedule_times) {
        dosesToInsert.push({
          medication_id: med.id,
          user_id: med.user_id,
          scheduled_date: date,
          scheduled_time: time,
          status: 'pending',
        })
      }
    }
  }

  let generated = 0
  if (dosesToInsert.length > 0) {
    const { error } = await supabase
      .from('doses')
      .upsert(dosesToInsert, { onConflict: 'medication_id,scheduled_date,scheduled_time', ignoreDuplicates: true })
    if (!error) generated = dosesToInsert.length
  }

  console.log(`[Daily Cron] Generated ${generated} dose records, marked missed doses for ${yesterday}`)
  return NextResponse.json({ ok: true, generated, date: today })
}
