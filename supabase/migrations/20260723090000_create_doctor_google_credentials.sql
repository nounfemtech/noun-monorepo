-- Prompt 3 (modulo Specialist): credenciais OAuth do medico para Google Calendar/Meet.
-- Decisao (apps/connect/CLAUDE.md, secao 8): OAuth por medico, nao conta de servico da Noun,
-- para que o evento apareca na agenda pessoal de quem atende.
--
-- Tokens sao credencial sensivel: a tabela tem RLS habilitada e PROPOSITALMENTE nao recebe
-- nenhuma policy. Isso bloqueia acesso de qualquer role authenticated/anon, mesmo o proprio
-- medico dono do token via client normal — so o service role (que bypassa RLS) le/escreve,
-- a partir de apps/connect/src/lib/supabase-admin.ts em server actions/route handlers.

CREATE TABLE public.doctor_google_credentials (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id         uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  google_email      text NOT NULL,
  access_token      text NOT NULL,
  refresh_token     text NOT NULL,
  scope             text NOT NULL,
  token_expires_at  timestamptz NOT NULL,
  connected_at      timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_google_credentials ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_doctor_google_credentials_updated_at
  BEFORE UPDATE ON public.doctor_google_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link do Meet + id do evento criado na confirmacao da consulta (Calendar API).
-- telemedicine_url ja existia (schema original); google_calendar_event_id e novo, precisa
-- para poder cancelar/atualizar o evento depois (ex. ao cancelar a consulta).
ALTER TABLE public.appointments ADD COLUMN google_calendar_event_id text;
