-- ============================================================
-- patient_profiles — perfil de saúde da paciente (NOUN-31)
-- Separado da tabela profiles (dados de conta) para isolar
-- dados sensíveis de saúde com RLS dedicada.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.patient_profiles (
  user_id                uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_name         text,
  gender_identity        text        CHECK (
    gender_identity IS NULL OR gender_identity IN (
      'cisgender_woman',
      'trans_woman',
      'non_binary',
      'gender_fluid',
      'prefer_not_to_say',
      'other'
    )
  ),
  gender_identity_custom text,
  avatar_url             text,
  health_conditions      text[]      NOT NULL DEFAULT '{}',
  current_medications    text,
  allergies              text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- ── Índice para buscas por user_id (PK já cobre, mas garante) ──
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id
  ON public.patient_profiles (user_id);

-- ── Atualiza updated_at automaticamente ────────────────────────
CREATE OR REPLACE FUNCTION public.update_patient_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_patient_profiles_updated_at
  BEFORE UPDATE ON public.patient_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_patient_profiles_updated_at();

-- ── Row Level Security ─────────────────────────────────────────
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

-- Paciente lê apenas o próprio perfil
CREATE POLICY "patient_profiles: read own"
  ON public.patient_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Paciente cria apenas o próprio perfil
CREATE POLICY "patient_profiles: insert own"
  ON public.patient_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Paciente atualiza apenas o próprio perfil
CREATE POLICY "patient_profiles: update own"
  ON public.patient_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Paciente pode deletar o próprio perfil
CREATE POLICY "patient_profiles: delete own"
  ON public.patient_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
