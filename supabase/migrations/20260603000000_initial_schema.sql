-- ============================================================
-- NOUN — Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum (
  'patient', 'doctor', 'pharmacy', 'admin', 'super_admin'
);

create type user_status as enum (
  'active', 'inactive', 'suspended', 'pending_verification'
);

create type gender as enum (
  'female', 'male', 'non_binary', 'prefer_not_to_say'
);

create type doctor_specialty as enum (
  'gynecology', 'obstetrics', 'endocrinology', 'dermatology',
  'psychiatry', 'psychology', 'cardiology', 'general_practice', 'other'
);

create type doctor_status as enum (
  'active', 'inactive', 'on_vacation', 'suspended'
);

create type consultation_type as enum (
  'in_person', 'telemedicine', 'both'
);

create type pharmacy_type as enum (
  'independent', 'chain', 'compounding', 'online'
);

create type pharmacy_status as enum (
  'active', 'inactive', 'suspended', 'pending_approval'
);

create type delivery_mode as enum (
  'pickup', 'delivery', 'both'
);

create type appointment_status as enum (
  'pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled'
);

create type cancellation_reason as enum (
  'patient_request', 'doctor_unavailable', 'emergency', 'no_show', 'other'
);

create type payment_status as enum (
  'pending', 'paid', 'refunded', 'failed'
);

-- ============================================================
-- UTILITY
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- USERS (extends auth.users)
-- ============================================================

create table public.users (
  id            uuid         primary key references auth.users(id) on delete cascade,
  email         text         not null unique,
  phone         text,
  role          user_role    not null,
  status        user_status  not null default 'pending_verification',
  avatar_url    text,
  last_login_at timestamptz,
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now()
);

create trigger users_updated_at
  before update on public.users
  for each row execute function update_updated_at();

-- ============================================================
-- USER PROFILES
-- ============================================================

create table public.user_profiles (
  user_id       uuid  primary key references public.users(id) on delete cascade,
  first_name    text  not null,
  last_name     text  not null,
  full_name     text  generated always as (first_name || ' ' || last_name) stored,
  gender        gender,
  date_of_birth date,
  address       jsonb,
  bio           text
);

-- ============================================================
-- PHARMACIES (before patients for FK)
-- ============================================================

create table public.pharmacies (
  id                          uuid            primary key default gen_random_uuid(),
  user_id                     uuid            not null unique references public.users(id) on delete cascade,
  trade_name                  text            not null,
  legal_name                  text            not null,
  cnpj                        text            not null unique,
  crf                         text            not null,
  crf_state                   char(2)         not null,
  type                        pharmacy_type   not null,
  status                      pharmacy_status not null default 'pending_approval',
  address                     jsonb           not null,
  phone                       text            not null,
  email                       text            not null,
  website                     text,
  delivery_mode               delivery_mode   not null default 'pickup',
  delivery_radius_km          numeric(6,2),
  operating_hours             jsonb           not null default '[]',
  handles_controlled_substances boolean       not null default false,
  handles_compounding         boolean         not null default false,
  average_rating              numeric(3,2),
  total_reviews               integer         not null default 0,
  logo_url                    text,
  created_at                  timestamptz     not null default now(),
  updated_at                  timestamptz     not null default now()
);

create trigger pharmacies_updated_at
  before update on public.pharmacies
  for each row execute function update_updated_at();

-- ============================================================
-- PATIENTS
-- ============================================================

create table public.patients (
  id                        uuid        primary key default gen_random_uuid(),
  user_id                   uuid        not null unique references public.users(id) on delete cascade,
  health_metrics            jsonb       not null default '{}',
  insurance_plan            text,
  insurance_number          text,
  preferred_pharmacy_id     uuid        references public.pharmacies(id) on delete set null,
  emergency_contact         jsonb,
  consented_to_data_sharing boolean     not null default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create trigger patients_updated_at
  before update on public.patients
  for each row execute function update_updated_at();

-- ============================================================
-- DOCTORS
-- ============================================================

create table public.doctors (
  id                      uuid              primary key default gen_random_uuid(),
  user_id                 uuid              not null unique references public.users(id) on delete cascade,
  crm                     text              not null unique,
  crm_state               char(2)           not null,
  specialties             doctor_specialty[] not null default '{}',
  status                  doctor_status     not null default 'active',
  clinic_address          jsonb,
  consultation_fee_reais  numeric(10,2),
  availability            jsonb,
  bio                     text,
  accepts_insurance       boolean           not null default false,
  accepted_insurance_plans text[]           not null default '{}',
  average_rating          numeric(3,2),
  total_reviews           integer           not null default 0,
  created_at              timestamptz       not null default now(),
  updated_at              timestamptz       not null default now()
);

create trigger doctors_updated_at
  before update on public.doctors
  for each row execute function update_updated_at();

-- ============================================================
-- APPOINTMENTS
-- ============================================================

create table public.appointments (
  id                   uuid                 primary key default gen_random_uuid(),
  patient_id           uuid                 not null references public.patients(id) on delete restrict,
  doctor_id            uuid                 not null references public.doctors(id) on delete restrict,
  scheduled_at         timestamptz          not null,
  duration_minutes     integer              not null default 30,
  consultation_type    consultation_type    not null,
  status               appointment_status   not null default 'pending',
  payment_status       payment_status       not null default 'pending',
  payment_amount_reais numeric(10,2),
  meeting_url          text,
  notes                jsonb,
  cancellation_reason  cancellation_reason,
  cancellation_note    text,
  cancelled_at         timestamptz,
  cancelled_by         uuid                 references public.users(id) on delete set null,
  created_at           timestamptz          not null default now(),
  updated_at           timestamptz          not null default now()
);

create index appointments_patient_id_idx  on public.appointments(patient_id);
create index appointments_doctor_id_idx   on public.appointments(doctor_id);
create index appointments_scheduled_at_idx on public.appointments(scheduled_at);
create index appointments_status_idx      on public.appointments(status);

create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users           enable row level security;
alter table public.user_profiles   enable row level security;
alter table public.patients        enable row level security;
alter table public.doctors         enable row level security;
alter table public.pharmacies      enable row level security;
alter table public.appointments    enable row level security;

-- users: leitura e atualização do próprio registro
create policy "users: own read" on public.users
  for select using (auth.uid() = id);

create policy "users: own update" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- user_profiles: CRUD do próprio perfil
create policy "user_profiles: own read" on public.user_profiles
  for select using (auth.uid() = user_id);

create policy "user_profiles: own write" on public.user_profiles
  for all using (auth.uid() = user_id);

-- doctors: leitura por todos autenticados (busca para agendamento)
create policy "doctors: authenticated read" on public.doctors
  for select to authenticated using (status = 'active');

create policy "doctors: own write" on public.doctors
  for all using (auth.uid() = user_id);

-- pharmacies: leitura por todos autenticados
create policy "pharmacies: authenticated read" on public.pharmacies
  for select to authenticated using (status = 'active');

create policy "pharmacies: own write" on public.pharmacies
  for all using (auth.uid() = user_id);

-- patients: somente o próprio paciente
create policy "patients: own read" on public.patients
  for select using (auth.uid() = user_id);

create policy "patients: own write" on public.patients
  for all using (auth.uid() = user_id);

-- appointments: paciente e médico veem os seus
create policy "appointments: patient read" on public.appointments
  for select using (
    auth.uid() = (select user_id from public.patients where id = patient_id)
  );

create policy "appointments: doctor read" on public.appointments
  for select using (
    auth.uid() = (select user_id from public.doctors where id = doctor_id)
  );

create policy "appointments: patient create" on public.appointments
  for insert with check (
    auth.uid() = (select user_id from public.patients where id = patient_id)
  );

create policy "appointments: patient or doctor update" on public.appointments
  for update using (
    auth.uid() = (select user_id from public.patients where id = patient_id) or
    auth.uid() = (select user_id from public.doctors where id = doctor_id)
  );

-- ============================================================
-- TRIGGER: auto-criar registro em public.users após signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, status)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'patient'),
    'pending_verification'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
