INSERT INTO storage.buckets (id, name, public) VALUES ('sim-images', 'sim-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read sim-images" ON storage.objects FOR SELECT USING (bucket_id = 'sim-images');
CREATE POLICY "Service role upload sim-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sim-images');