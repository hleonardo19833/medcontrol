export type Plan = 'free' | 'pro'

export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped'

export type Frequency = 'daily' | 'specific_days' | 'interval_hours'

export type DoseUnit = 'comprimido' | 'cápsula' | 'mg' | 'ml' | 'gota' | 'ampola'

export type CaregiverStatus = 'pending' | 'accepted' | 'rejected'

export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  phone: string | null
  plan: Plan
  plan_expires_at: string | null
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  push_subscription: PushSubscriptionJSON | null
  notifications_enabled: boolean
  is_caregiver: boolean
  caregiver_of: string[] | null
  created_at: string
  updated_at: string
}

export interface Medication {
  id: string
  user_id: string
  name: string
  description: string | null
  photo_url: string | null
  color: string
  dose_amount: number
  dose_unit: DoseUnit
  frequency: Frequency
  times_per_day: number
  schedule_times: string[]
  specific_days: number[] | null
  interval_hours: number | null
  stock_count: number | null
  stock_alert_days: number
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Dose {
  id: string
  medication_id: string
  user_id: string
  scheduled_date: string
  scheduled_time: string
  scheduled_at: string
  status: DoseStatus
  confirmed_at: string | null
  notes: string | null
  created_at: string
  // Joined
  medication?: Medication
}

export interface CaregiverLink {
  id: string
  patient_id: string
  caregiver_id: string
  status: CaregiverStatus
  invite_token: string
  alert_delay_minutes: number
  created_at: string
  accepted_at: string | null
  // Joined
  patient?: Profile
  caregiver?: Profile
}

export interface NotificationLog {
  id: string
  user_id: string
  medication_id: string | null
  dose_id: string | null
  type: string
  title: string
  body: string
  sent_at: string
  read_at: string | null
}

export interface AdherenceStats {
  total_doses: number
  taken_doses: number
  missed_doses: number
  skipped_doses: number
  adherence_rate: number
}

export interface PaymentHistory {
  id: string
  user_id: string
  asaas_payment_id: string | null
  amount: number
  status: 'pending' | 'confirmed' | 'failed' | 'refunded'
  plan: string
  period_start: string
  period_end: string
  created_at: string
}

// Free plan limits
export const FREE_PLAN_LIMITS = {
  max_medications: 3,
  history_days: 30,
  caregiver_links: 1,
  pdf_reports: false,
  stock_alerts: false,
}

export const PRO_PLAN_PRICE = 19.90 // BRL/month
