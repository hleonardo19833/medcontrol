import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/notifications/send
 * Called by cron job to send dose reminders
 * Vercel Cron: configure in vercel.json
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const today = now.toISOString().split('T')[0]

  // Find doses scheduled for the next 5 minutes that are still pending
  const fiveMinLater = new Date(now.getTime() + 5 * 60000)
  const fiveMinTime = `${String(fiveMinLater.getHours()).padStart(2, '0')}:${String(fiveMinLater.getMinutes()).padStart(2, '0')}`

  const { data: pendingDoses } = await supabase
    .from('doses')
    .select(`
      *,
      medication:medications(name, dose_amount, dose_unit),
      user:profiles(push_subscription, notifications_enabled)
    `)
    .eq('scheduled_date', today)
    .eq('status', 'pending')
    .gte('scheduled_time', currentTime)
    .lte('scheduled_time', fiveMinTime)

  let sent = 0
  let failed = 0

  for (const dose of pendingDoses ?? []) {
    const user = dose.user as any
    if (!user?.notifications_enabled || !user?.push_subscription) continue

    try {
      await webpush.sendNotification(
        user.push_subscription,
        JSON.stringify({
          title: `💊 ${dose.medication?.name}`,
          body: `Hora de tomar ${dose.medication?.dose_amount} ${dose.medication?.dose_unit} • ${dose.scheduled_time}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: `dose-${dose.id}`,
          data: { doseId: dose.id, url: '/dashboard' },
          actions: [
            { action: 'confirm', title: '✓ Tomei' },
            { action: 'snooze',  title: '⏰ Lembrar em 10min' },
          ],
        })
      )

      // Log notification
      await supabase.from('notification_logs').insert({
        user_id: dose.user_id,
        medication_id: dose.medication_id,
        dose_id: dose.id,
        type: 'dose_reminder',
        title: `💊 ${dose.medication?.name}`,
        body: `Hora de tomar ${dose.medication?.dose_amount} ${dose.medication?.dose_unit}`,
      })

      sent++
    } catch (err) {
      console.error('Push failed for dose', dose.id, err)
      failed++
    }
  }

  // Check for missed doses (pending + 30+ min late) for caregiver alerts
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60000)
  const thirtyMinTime = `${String(thirtyMinAgo.getHours()).padStart(2, '0')}:${String(thirtyMinAgo.getMinutes()).padStart(2, '0')}`

  const { data: overdueDoses } = await supabase
    .from('doses')
    .select(`
      user_id, medication_id,
      medication:medications(name),
      scheduled_time
    `)
    .eq('scheduled_date', today)
    .eq('status', 'pending')
    .lte('scheduled_time', thirtyMinTime)

  for (const dose of overdueDoses ?? []) {
    // Find caregivers of this patient
    const { data: caregiverLinks } = await supabase
      .from('caregiver_links')
      .select('caregiver:profiles!caregiver_links_caregiver_id_fkey(push_subscription, notifications_enabled)')
      .eq('patient_id', dose.user_id)
      .eq('status', 'accepted')

    for (const link of caregiverLinks ?? []) {
      const caregiver = link.caregiver as any
      if (!caregiver?.notifications_enabled || !caregiver?.push_subscription) continue

      try {
        await webpush.sendNotification(
          caregiver.push_subscription,
          JSON.stringify({
            title: '⚠️ Dose não confirmada',
            body: `Seu familiar não confirmou ${dose.medication?.name} das ${dose.scheduled_time}`,
            icon: '/icons/icon-192x192.png',
            tag: `caregiver-${dose.user_id}-${dose.scheduled_time}`,
          })
        )
      } catch (err) {
        console.error('Caregiver push failed', err)
      }
    }
  }

  return NextResponse.json({ sent, failed, checked: pendingDoses?.length ?? 0 })
}
