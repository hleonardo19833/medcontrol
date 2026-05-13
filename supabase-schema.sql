-- MedControl Database Schema
-- Run this in Supabase SQL Editor

-- ==========================================
-- EXTENSIONS
-- ==========================================
create extension if not exists "uuid-ossp";

-- ==========================================
-- PROFILES (extends auth.users)
-- ==========================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null,
  avatar_url text,
  phone text,
  plan text not null default 'free', -- 'free' | 'pro'
  plan_expires_at timestamptz,
  -- Asaas payment integration (ready for future)
  asaas_customer_id text,
  asaas_subscription_id text,
  -- Notifications
  push_subscription jsonb, -- Web Push subscription object
  notifications_enabled boolean default true,
  -- Caregiver mode
  is_caregiver boolean default false,
  caregiver_of uuid[], -- array of patient user IDs this user cares for
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==========================================
-- MEDICATIONS
-- ==========================================
create table public.medications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  photo_url text, -- stored in Supabase Storage
  color text default '#6366f1', -- for UI identification
  -- Dosage
  dose_amount numeric not null,
  dose_unit text not null default 'comprimido', -- comprimido, mg, ml, cápsula, gota
  -- Schedule
  frequency text not null default 'daily', -- daily | specific_days | interval_hours
  times_per_day int not null default 1,
  schedule_times text[] not null default '{"08:00"}', -- ["08:00", "20:00"]
  specific_days int[] default null, -- [0,1,2,3,4,5,6] (0=Sun)
  interval_hours int default null, -- every N hours
  -- Stock control
  stock_count int default null, -- null = not tracking
  stock_alert_days int default 5, -- alert N days before running out
  -- Treatment period
  start_date date not null default current_date,
  end_date date default null, -- null = ongoing
  -- Status
  is_active boolean default true,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==========================================
-- DOSES (adherence tracking)
-- ==========================================
create table public.doses (
  id uuid default uuid_generate_v4() primary key,
  medication_id uuid references public.medications(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  -- Scheduled info
  scheduled_date date not null,
  scheduled_time text not null, -- "08:00"
  scheduled_at timestamptz generated always as (
    (scheduled_date || ' ' || scheduled_time)::timestamptz
  ) stored,
  -- Confirmation
  status text not null default 'pending', -- pending | taken | missed | skipped
  confirmed_at timestamptz,
  notes text,
  -- Timestamps
  created_at timestamptz default now()
);

create unique index doses_unique_schedule 
  on public.doses(medication_id, scheduled_date, scheduled_time);

-- ==========================================
-- CAREGIVER LINKS
-- ==========================================
create table public.caregiver_links (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.profiles(id) on delete cascade not null,
  caregiver_id uuid references public.profiles(id) on delete cascade not null,
  -- Status
  status text default 'pending', -- pending | accepted | rejected
  invite_token text unique default uuid_generate_v4()::text,
  -- Alert settings
  alert_delay_minutes int default 30,
  -- Timestamps
  created_at timestamptz default now(),
  accepted_at timestamptz,
  unique(patient_id, caregiver_id)
);

-- ==========================================
-- NOTIFICATIONS LOG
-- ==========================================
create table public.notification_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  medication_id uuid references public.medications(id) on delete set null,
  dose_id uuid references public.doses(id) on delete set null,
  type text not null, -- dose_reminder | missed_alert | caregiver_alert | stock_alert
  title text not null,
  body text not null,
  sent_at timestamptz default now(),
  read_at timestamptz
);

-- ==========================================
-- PAYMENT HISTORY (Asaas - ready for future)
-- ==========================================
create table public.payment_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  asaas_payment_id text unique,
  amount numeric not null,
  status text not null, -- pending | confirmed | failed | refunded
  plan text not null,
  period_start date,
  period_end date,
  created_at timestamptz default now()
);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

alter table public.profiles enable row level security;
alter table public.medications enable row level security;
alter table public.doses enable row level security;
alter table public.caregiver_links enable row level security;
alter table public.notification_logs enable row level security;
alter table public.payment_history enable row level security;

-- Profiles: users see own profile + caregivers see their patients
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Medications: users see own meds + caregivers see patients' meds
create policy "Users see own medications" on public.medications
  for select using (
    auth.uid() = user_id
    or auth.uid() in (
      select caregiver_id from public.caregiver_links
      where patient_id = medications.user_id and status = 'accepted'
    )
  );

create policy "Users manage own medications" on public.medications
  for all using (auth.uid() = user_id);

-- Doses: same as medications
create policy "Users see own doses" on public.doses
  for select using (
    auth.uid() = user_id
    or auth.uid() in (
      select caregiver_id from public.caregiver_links
      where patient_id = doses.user_id and status = 'accepted'
    )
  );

create policy "Users manage own doses" on public.doses
  for all using (auth.uid() = user_id);

-- Caregiver links
create policy "Users see their caregiver links" on public.caregiver_links
  for select using (auth.uid() = patient_id or auth.uid() = caregiver_id);

create policy "Patients manage their links" on public.caregiver_links
  for all using (auth.uid() = patient_id);

create policy "Caregivers can update link status" on public.caregiver_links
  for update using (auth.uid() = caregiver_id);

-- Notifications
create policy "Users see own notifications" on public.notification_logs
  for select using (auth.uid() = user_id);

-- Payment history
create policy "Users see own payments" on public.payment_history
  for select using (auth.uid() = user_id);

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================

-- Run these in Supabase Dashboard > Storage
-- Or via SQL:
insert into storage.buckets (id, name, public)
values ('medication-photos', 'medication-photos', true)
on conflict do nothing;

create policy "Users can upload medication photos" on storage.objects
  for insert with check (
    bucket_id = 'medication-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Medication photos are public" on storage.objects
  for select using (bucket_id = 'medication-photos');

create policy "Users can delete own photos" on storage.objects
  for delete using (
    bucket_id = 'medication-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at on profiles
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger medications_updated_at before update on public.medications
  for each row execute procedure public.handle_updated_at();

-- Function: get adherence stats for a user
create or replace function public.get_adherence_stats(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (
  total_doses bigint,
  taken_doses bigint,
  missed_doses bigint,
  skipped_doses bigint,
  adherence_rate numeric
) language sql security definer as $$
  select
    count(*) as total_doses,
    count(*) filter (where status = 'taken') as taken_doses,
    count(*) filter (where status = 'missed') as missed_doses,
    count(*) filter (where status = 'skipped') as skipped_doses,
    round(
      count(*) filter (where status = 'taken') * 100.0 / nullif(count(*), 0), 1
    ) as adherence_rate
  from public.doses
  where user_id = p_user_id
    and scheduled_date between p_start_date and p_end_date;
$$;
