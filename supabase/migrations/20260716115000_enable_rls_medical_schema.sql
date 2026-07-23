-- Habilita RLS nas tabelas do schema medical (prontuario, evolucoes, receitas, laudos, exames),
-- que estavam totalmente expostas a anon/authenticated. Politicas seguem o padrao ja usado em
-- public.appointments/availability_slots (is_noun_admin(), auth.uid(), is_professional()).
-- Sem DELETE policy em nenhuma tabela: prontuario/receita nao tem hard delete (retencao CFM 20 anos),
-- soft delete/arquivamento fica a cargo dos campos is_finalized/is_valid ja existentes.

ALTER TABLE medical.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical.record_evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical.exam_requests ENABLE ROW LEVEL SECURITY;

-- medical.records
CREATE POLICY "records: admin all" ON medical.records
  FOR ALL USING (public.is_noun_admin());

CREATE POLICY "records: professional manage own" ON medical.records
  FOR ALL USING (doctor_id = auth.uid() AND public.is_professional())
  WITH CHECK (doctor_id = auth.uid() AND public.is_professional());

CREATE POLICY "records: patient select own" ON medical.records
  FOR SELECT USING (patient_id = auth.uid() AND public.current_user_role() = 'patient');

-- medical.record_evolutions (segue o record pai via record_id)
CREATE POLICY "record_evolutions: admin all" ON medical.record_evolutions
  FOR ALL USING (public.is_noun_admin());

CREATE POLICY "record_evolutions: professional manage own" ON medical.record_evolutions
  FOR ALL USING (doctor_id = auth.uid() AND public.is_professional())
  WITH CHECK (doctor_id = auth.uid() AND public.is_professional());

CREATE POLICY "record_evolutions: patient select own" ON medical.record_evolutions
  FOR SELECT USING (
    public.current_user_role() = 'patient'
    AND EXISTS (
      SELECT 1 FROM medical.records r
      WHERE r.id = record_evolutions.record_id AND r.patient_id = auth.uid()
    )
  );

-- medical.prescriptions
CREATE POLICY "prescriptions: admin all" ON medical.prescriptions
  FOR ALL USING (public.is_noun_admin());

CREATE POLICY "prescriptions: professional manage own" ON medical.prescriptions
  FOR ALL USING (doctor_id = auth.uid() AND public.is_professional())
  WITH CHECK (doctor_id = auth.uid() AND public.is_professional());

CREATE POLICY "prescriptions: patient select own" ON medical.prescriptions
  FOR SELECT USING (patient_id = auth.uid() AND public.current_user_role() = 'patient');

-- medical.reports
CREATE POLICY "reports: admin all" ON medical.reports
  FOR ALL USING (public.is_noun_admin());

CREATE POLICY "reports: professional manage own" ON medical.reports
  FOR ALL USING (doctor_id = auth.uid() AND public.is_professional())
  WITH CHECK (doctor_id = auth.uid() AND public.is_professional());

CREATE POLICY "reports: patient select own" ON medical.reports
  FOR SELECT USING (patient_id = auth.uid() AND public.current_user_role() = 'patient');

-- medical.exam_requests
CREATE POLICY "exam_requests: admin all" ON medical.exam_requests
  FOR ALL USING (public.is_noun_admin());

CREATE POLICY "exam_requests: professional manage own" ON medical.exam_requests
  FOR ALL USING (doctor_id = auth.uid() AND public.is_professional())
  WITH CHECK (doctor_id = auth.uid() AND public.is_professional());

CREATE POLICY "exam_requests: patient select own" ON medical.exam_requests
  FOR SELECT USING (patient_id = auth.uid() AND public.current_user_role() = 'patient');
