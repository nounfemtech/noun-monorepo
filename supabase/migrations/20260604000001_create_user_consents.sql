-- Migration: create user_consents table (LGPD)
-- Task: NOUN-6

CREATE TABLE IF NOT EXISTS public.user_consents (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type  text        NOT NULL CHECK (consent_type IN ('terms_of_use', 'privacy_policy', 'marketing', 'health_data')),
  accepted      boolean     NOT NULL DEFAULT false,
  accepted_at   timestamptz,
  revoked_at    timestamptz,
  terms_version text        NOT NULL DEFAULT '1.0.0',
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, consent_type, terms_version)
);

-- Índices para queries por usuário
CREATE INDEX IF NOT EXISTS user_consents_user_id_idx ON public.user_consents (user_id);
CREATE INDEX IF NOT EXISTS user_consents_user_type_idx ON public.user_consents (user_id, consent_type);

-- RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuária lê seus próprios consentimentos"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuária insere seus próprios consentimentos"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuária atualiza seus próprios consentimentos"
  ON public.user_consents FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_consents_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
