-- Policies do bucket privado `documentos` (documentos profissionais: diploma, CRM,
-- certificacoes). Path por dono: <user_id>/<arquivo>. Sem policy, o bucket estava
-- inacessivel ate para o proprio dono. Padrao identico ao do bucket avatares
-- (storage_avatares_rls_policies), mais leitura para admin Noun.

CREATE POLICY "documentos_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "documentos_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "documentos_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "documentos_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documentos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "documentos_select_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documentos' AND public.is_noun_admin());
