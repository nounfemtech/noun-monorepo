-- Prompt 3 (modulo Specialist): RPCs de acesso ao schema `medical` e busca de paciente.
--
-- Por que RPC em vez de nested select / schema exposto direto:
-- supabase/config.toml tem `[api] schemas = ["public", "graphql_public"]` — o schema `medical`
-- (records/record_evolutions/prescriptions/reports/exam_requests) NAO e exposto ao PostgREST.
-- Chamar supabase.from('medical.records') do client falharia contra o projeto hospedado.
-- Toda leitura/escrita de prontuario passa por funcao SECURITY DEFINER aqui em `public`,
-- que valida auth.uid() internamente antes de tocar em medical.* (RLS de medical.* continua
-- habilitada como defesa em profundidade, mas quem acessa e o dono da funcao).
--
-- Busca de paciente (search_tenant_patients): escopo restrito a pacientes com pelo menos uma
-- consulta no MESMO tenant do medico que chama a funcao (decisao confirmada com a Fran no
-- Prompt 3 — nao e busca livre em toda a base de pacientes da Noun).

-- ── Busca de paciente para agendamento ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_tenant_patients(p_query text)
RETURNS TABLE (id uuid, full_name text, email text, phone_mobile text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.id, p.full_name, p.email, p.phone_mobile
  FROM public.profiles p
  JOIN public.appointments a ON a.patient_id = p.id
  WHERE public.is_professional()
    AND length(trim(coalesce(p_query, ''))) >= 3
    AND a.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    AND p.role = 'patient'
    AND p.is_active = true
    AND (
      p.full_name ILIKE '%' || p_query || '%'
      OR p.email ILIKE '%' || p_query || '%'
      OR p.cpf ILIKE '%' || p_query || '%'
    )
  LIMIT 20;
$$;

GRANT EXECUTE ON FUNCTION public.search_tenant_patients(text) TO authenticated;

-- ── Prontuario: leitura por consulta ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_medical_record(p_appointment_id uuid)
RETURNS medical.records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, medical
AS $$
DECLARE
  v_doctor_id uuid;
  v_record medical.records;
BEGIN
  SELECT doctor_id INTO v_doctor_id FROM public.appointments WHERE id = p_appointment_id;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'Consulta nao encontrada';
  END IF;

  IF v_doctor_id <> auth.uid() AND NOT public.is_noun_admin() THEN
    RAISE EXCEPTION 'Sem permissao para acessar este prontuario';
  END IF;

  SELECT * INTO v_record FROM medical.records WHERE appointment_id = p_appointment_id;
  RETURN v_record; -- todas as colunas NULL se o prontuario ainda nao existir para a consulta
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_medical_record(uuid) TO authenticated;

-- ── Prontuario: criar ou atualizar (bloqueado apos finalizado) ──────────────

CREATE OR REPLACE FUNCTION public.upsert_medical_record(
  p_appointment_id uuid,
  p_patient_id uuid,
  p_fields jsonb
)
RETURNS medical.records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, medical
AS $$
DECLARE
  v_doctor_id uuid;
  v_existing medical.records;
  v_result medical.records;
BEGIN
  SELECT doctor_id INTO v_doctor_id FROM public.appointments
    WHERE id = p_appointment_id AND patient_id = p_patient_id;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'Consulta nao encontrada para este paciente';
  END IF;

  IF v_doctor_id <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissao para editar este prontuario';
  END IF;

  SELECT * INTO v_existing FROM medical.records WHERE appointment_id = p_appointment_id;

  IF v_existing.id IS NOT NULL AND v_existing.is_finalized THEN
    RAISE EXCEPTION 'Prontuario finalizado: use add_record_evolution para registrar evolucao';
  END IF;

  IF v_existing.id IS NULL THEN
    INSERT INTO medical.records (
      patient_id, doctor_id, appointment_id,
      chief_complaint, history_of_illness, past_medical_history, family_history,
      social_history, gynecological_history, current_medications, allergies,
      physical_exam, diagnosis, icd10_codes, therapeutic_plan
    ) VALUES (
      p_patient_id, v_doctor_id, p_appointment_id,
      p_fields->>'chiefComplaint', p_fields->>'historyOfIllness', p_fields->>'pastMedicalHistory',
      p_fields->>'familyHistory', p_fields->>'socialHistory', p_fields->>'gynecologicalHistory',
      p_fields->>'currentMedications', p_fields->>'allergies', p_fields->>'physicalExam',
      p_fields->>'diagnosis',
      CASE WHEN p_fields ? 'icd10Codes'
        THEN ARRAY(SELECT jsonb_array_elements_text(p_fields->'icd10Codes'))
        ELSE NULL END,
      p_fields->>'therapeuticPlan'
    )
    RETURNING * INTO v_result;
  ELSE
    UPDATE medical.records SET
      chief_complaint = COALESCE(p_fields->>'chiefComplaint', chief_complaint),
      history_of_illness = COALESCE(p_fields->>'historyOfIllness', history_of_illness),
      past_medical_history = COALESCE(p_fields->>'pastMedicalHistory', past_medical_history),
      family_history = COALESCE(p_fields->>'familyHistory', family_history),
      social_history = COALESCE(p_fields->>'socialHistory', social_history),
      gynecological_history = COALESCE(p_fields->>'gynecologicalHistory', gynecological_history),
      current_medications = COALESCE(p_fields->>'currentMedications', current_medications),
      allergies = COALESCE(p_fields->>'allergies', allergies),
      physical_exam = COALESCE(p_fields->>'physicalExam', physical_exam),
      diagnosis = COALESCE(p_fields->>'diagnosis', diagnosis),
      icd10_codes = CASE WHEN p_fields ? 'icd10Codes'
        THEN ARRAY(SELECT jsonb_array_elements_text(p_fields->'icd10Codes'))
        ELSE icd10_codes END,
      therapeutic_plan = COALESCE(p_fields->>'therapeuticPlan', therapeutic_plan),
      updated_at = now()
    WHERE appointment_id = p_appointment_id
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_medical_record(uuid, uuid, jsonb) TO authenticated;

-- ── Prontuario: evolucao (apos finalizado, ou registro incremental por consulta) ────

CREATE OR REPLACE FUNCTION public.add_record_evolution(p_record_id uuid, p_notes text)
RETURNS medical.record_evolutions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, medical
AS $$
DECLARE
  v_doctor_id uuid;
  v_result medical.record_evolutions;
BEGIN
  SELECT doctor_id INTO v_doctor_id FROM medical.records WHERE id = p_record_id;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'Prontuario nao encontrado';
  END IF;

  IF v_doctor_id <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissao para adicionar evolucao a este prontuario';
  END IF;

  IF trim(coalesce(p_notes, '')) = '' THEN
    RAISE EXCEPTION 'Evolucao nao pode ser vazia';
  END IF;

  INSERT INTO medical.record_evolutions (record_id, doctor_id, notes)
  VALUES (p_record_id, v_doctor_id, p_notes)
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_record_evolution(uuid, text) TO authenticated;

-- ── Prontuario: finalizar (sem hard delete, retencao CFM 20 anos) ───────────

CREATE OR REPLACE FUNCTION public.finalize_medical_record(p_record_id uuid)
RETURNS medical.records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, medical
AS $$
DECLARE
  v_doctor_id uuid;
  v_result medical.records;
BEGIN
  SELECT doctor_id INTO v_doctor_id FROM medical.records WHERE id = p_record_id;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'Prontuario nao encontrado';
  END IF;

  IF v_doctor_id <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissao para finalizar este prontuario';
  END IF;

  UPDATE medical.records
  SET is_finalized = true, finalized_at = now()
  WHERE id = p_record_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_medical_record(uuid) TO authenticated;

-- ── Prontuario: evolucoes de um registro (historico incremental) ─────────────

CREATE OR REPLACE FUNCTION public.list_record_evolutions(p_record_id uuid)
RETURNS SETOF medical.record_evolutions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, medical
AS $$
DECLARE
  v_doctor_id uuid;
BEGIN
  SELECT doctor_id INTO v_doctor_id FROM medical.records WHERE id = p_record_id;

  IF v_doctor_id IS NULL THEN
    RAISE EXCEPTION 'Prontuario nao encontrado';
  END IF;

  IF v_doctor_id <> auth.uid() AND NOT public.is_noun_admin() THEN
    RAISE EXCEPTION 'Sem permissao para acessar este prontuario';
  END IF;

  RETURN QUERY
    SELECT * FROM medical.record_evolutions
    WHERE record_id = p_record_id
    ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_record_evolutions(uuid) TO authenticated;

-- ── Prontuario: historico por paciente (Prompt 3, item 6) ────────────────────

CREATE OR REPLACE FUNCTION public.list_patient_medical_records(p_patient_id uuid)
RETURNS SETOF medical.records
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, medical
AS $$
  SELECT * FROM medical.records
  WHERE patient_id = p_patient_id AND doctor_id = auth.uid()
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_patient_medical_records(uuid) TO authenticated;
