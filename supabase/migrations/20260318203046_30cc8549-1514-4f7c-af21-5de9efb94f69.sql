
-- Add new profile fields for customized experience
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS school_name text,
  ADD COLUMN IF NOT EXISTS career_stage text DEFAULT 'professional',
  ADD COLUMN IF NOT EXISTS cv_url text;

-- Create storage bucket for CV uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own CVs
CREATE POLICY "Users can upload own CV"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own CVs
CREATE POLICY "Users can read own CV"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own CVs
CREATE POLICY "Users can delete own CV"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update/replace their own CVs
CREATE POLICY "Users can update own CV"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'cv-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
