CREATE POLICY "Users read own product photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own product photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own product photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-photos' AND (storage.foldername(name))[1] = auth.uid()::text);