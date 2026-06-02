-- Migration: Create whatsapp_audio bucket
-- Description: Creates the public storage bucket for WhatsApp audio files processed by the AI.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('whatsapp_audio', 'whatsapp_audio', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for public read access (if needed, though 'public = true' usually suffices for GET requests)
CREATE POLICY "Public read access for whatsapp_audio" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'whatsapp_audio');

-- Service role bypasses RLS for uploads, so no INSERT policy is strictly required.
