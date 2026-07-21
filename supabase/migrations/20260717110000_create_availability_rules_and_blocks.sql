-- Modelo de disponibilidade recorrente do profissional (Prompt 2, modulo Specialist).
-- NAO substitui public.availability_slots (slots concretos, ja referenciados por
-- appointments.slot_id): as regras recorrentes + bloqueios definidos aqui sao a fonte
-- a partir da qual os slots livres serao calculados/materializados no agendamento (Prompt 3).

CREATE TYPE public.consultation_modality AS ENUM ('in_person', 'telemedicine', 'both');

-- ── Regras recorrentes (dia da semana + faixa de horario) ────────────────────

CREATE TABLE public.availability_rules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id             uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  weekday               smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0 = domingo
  start_time            time NOT NULL,
  end_time              time NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 30 CHECK (slot_duration_minutes BETWEEN 10 AND 240),
  consultation_type     public.consultation_modality NOT NULL DEFAULT 'telemedicine',
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX idx_availability_rules_doctor ON public.availability_rules (doctor_id, weekday);

CREATE TRIGGER trg_availability_rules_updated_at
  BEFORE UPDATE ON public.availability_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_rules: admin all" ON public.availability_rules
  FOR ALL USING (public.is_noun_admin());

CREATE POLICY "availability_rules: professional manage own" ON public.availability_rules
  FOR ALL USING (doctor_id = auth.uid() AND public.is_professional())
  WITH CHECK (doctor_id = auth.uid() AND public.is_professional());

-- ── Bloqueios pontuais (feriado, ausencia, faixa de horario) ─────────────────

CREATE TABLE public.availability_blocks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  starts_at  timestamptz NOT NULL,
  ends_at    timestamptz NOT NULL,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX idx_availability_blocks_doctor ON public.availability_blocks (doctor_id, starts_at);

CREATE TRIGGER trg_availability_blocks_updated_at
  BEFORE UPDATE ON public.availability_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_blocks: admin all" ON public.availability_blocks
  FOR ALL USING (public.is_noun_admin());

CREATE POLICY "availability_blocks: professional manage own" ON public.availability_blocks
  FOR ALL USING (doctor_id = auth.uid() AND public.is_professional())
  WITH CHECK (doctor_id = auth.uid() AND public.is_professional());

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- A publication supabase_realtime estava vazia (nenhuma tabela emitia postgres_changes).
-- appointments entra ja para a notificacao in-app de novas marcacoes/cancelamentos
-- (infra do Prompt 2, gatilho real no Prompt 3).

ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
