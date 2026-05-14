export type Plan = 'free' | 'basic' | 'pro' | 'premium'

export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped'

export type Frequency = 'daily' | 'specific_days' | 'interval_hours'

export type DoseUnit = 'comprimido' | 'cápsula' | 'mg' | 'ml' | 'gota' | 'ampola'

export type CaregiverStatus = 'pending' | 'accepted' | 'rejected'

export interface PlanConfig {
  id: Plan
  name: string
  price: number
  max_medications: number | null
  max_caregivers: number | null
  history_days: number | null
  pdf_reports: boolean
  stock_control: boolean
  push_alerts: boolean
  caregiver_mode: boolean
  multi_patients: boolean
  support_level: 'none' | 'email' | 'priority' | 'vip'
  sort_order: number
}

export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  phone: string | null
  plan: Plan
  plan_expires_at: string | null
  trial_started_at: string | null
  trial_expires_at: string | null
  asaas_customer_id: string | null
  asaas_subscription_id: string | null
  push_subscription: any | null
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
  scheduled_at?: string
  status: DoseStatus
  confirmed_at: string | null
  notes: string | null
  created_at: string
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
  patient?: Profile
  caregiver?: Profile
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

// ==========================================
// PLANOS
// ==========================================

export const PLANS: Record<Plan, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    max_medications: 1,
    max_caregivers: 0,
    history_days: 30,
    pdf_reports: false,
    stock_control: false,
    push_alerts: false,
    caregiver_mode: false,
    multi_patients: false,
    support_level: 'none',
    sort_order: 0,
  },
  basic: {
    id: 'basic',
    name: 'Básico',
    price: 9.90,
    max_medications: 5,
    max_caregivers: 1,
    history_days: 90,
    pdf_reports: false,
    stock_control: false,
    push_alerts: true,
    caregiver_mode: true,
    multi_patients: false,
    support_level: 'email',
    sort_order: 1,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19.90,
    max_medications: 15,
    max_caregivers: 3,
    history_days: 365,
    pdf_reports: true,
    stock_control: true,
    push_alerts: true,
    caregiver_mode: true,
    multi_patients: false,
    support_level: 'priority',
    sort_order: 2,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 39.90,
    max_medications: null,
    max_caregivers: null,
    history_days: null,
    pdf_reports: true,
    stock_control: true,
    push_alerts: true,
    caregiver_mode: true,
    multi_patients: true,
    support_level: 'vip',
    sort_order: 3,
  },
}

export const TRIAL_DAYS = 30

export function getPlanConfig(plan: Plan): PlanConfig {
  return PLANS[plan] ?? PLANS.free
}

export function isTrialExpired(profile: Profile): boolean {
  if (profile.plan !== 'free') return false
  if (!profile.trial_expires_at) return false
  return new Date(profile.trial_expires_at) < new Date()
}

export function getTrialDaysLeft(profile: Profile): number {
  if (!profile.trial_expires_at) return 0
  const diff = new Date(profile.trial_expires_at).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function canAddMedication(profile: Profile, currentCount: number): boolean {
  if (isTrialExpired(profile)) return false
  const plan = getPlanConfig(profile.plan)
  if (plan.max_medications === null) return true
  return currentCount < plan.max_medications
}

export function canAddCaregiver(profile: Profile, currentCount: number): boolean {
  if (isTrialExpired(profile)) return false
  const plan = getPlanConfig(profile.plan)
  if (plan.max_caregivers === null) return true
  return currentCount < plan.max_caregivers
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
