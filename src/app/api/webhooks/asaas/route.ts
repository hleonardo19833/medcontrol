import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { addMonths, format } from 'date-fns'

/**
 * ASAAS WEBHOOK HANDLER
 * 
 * Configure no painel Asaas: 
 * URL: https://seu-dominio.vercel.app/api/webhooks/asaas
 * Eventos: PAYMENT_CONFIRMED, PAYMENT_OVERDUE, SUBSCRIPTION_INACTIVATED
 * 
 * Adicione ASAAS_WEBHOOK_SECRET no .env
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Verify webhook signature (implement when going live)
  // const signature = req.headers.get('asaas-access-token')
  // if (signature !== process.env.ASAAS_WEBHOOK_SECRET) {
  //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  // }

  const event = await req.json()
  console.log('Asaas webhook:', event.event, event.payment?.id)

  switch (event.event) {
    case 'PAYMENT_CONFIRMED': {
      // Find user by asaas customer id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('asaas_customer_id', event.payment.customer)
        .single()

      if (profile) {
        // Activate pro plan for 1 month
        await supabase.from('profiles').update({
          plan: 'pro',
          plan_expires_at: format(addMonths(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
          asaas_subscription_id: event.payment.subscription,
        }).eq('id', profile.id)

        // Log payment
        await supabase.from('payment_history').insert({
          user_id: profile.id,
          asaas_payment_id: event.payment.id,
          amount: event.payment.value,
          status: 'confirmed',
          plan: 'pro',
          period_start: format(new Date(), 'yyyy-MM-dd'),
          period_end: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        })
      }
      break
    }

    case 'PAYMENT_OVERDUE':
    case 'SUBSCRIPTION_INACTIVATED': {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('asaas_customer_id', event.payment?.customer || event.subscription?.customer)
        .single()

      if (profile) {
        await supabase.from('profiles').update({
          plan: 'free',
          plan_expires_at: null,
        }).eq('id', profile.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
