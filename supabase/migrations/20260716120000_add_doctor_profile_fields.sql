-- Campos de perfil profissional do medico que faltavam em public.profiles
-- (CRM/UF/especialidade/RQE ja existiam: council_id, council_state, medical_specialty,
-- e tenants.rqe). Nao ha RLS nova: "profiles: update own" / "profiles_update_own" ja
-- cobrem o proprio medico editar essas colunas.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS default_consultation_price numeric,
  ADD COLUMN IF NOT EXISTS accepts_insurance boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_insurance_plans text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.profiles.bio IS 'Biografia profissional exibida no perfil (role = doctor/nutritionist/psychologist).';
COMMENT ON COLUMN public.profiles.default_consultation_price IS 'Valor de consulta padrao do profissional. availability_slots.price pode sobrescrever por horario.';
COMMENT ON COLUMN public.profiles.accepts_insurance IS 'Se o profissional aceita convenio. Apenas para role = doctor/nutritionist/psychologist.';
COMMENT ON COLUMN public.profiles.accepted_insurance_plans IS 'Lista de convenios aceitos, quando accepts_insurance = true.';
