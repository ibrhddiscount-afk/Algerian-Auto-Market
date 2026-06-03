INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'listing-photos',
  'listing-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS listing_photos_public_read
  ON storage.objects;

CREATE POLICY listing_photos_public_read
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'listing-photos');

DROP POLICY IF EXISTS listing_photos_authenticated_insert
  ON storage.objects;

DROP POLICY IF EXISTS listing_photos_insert
  ON storage.objects;

CREATE POLICY listing_photos_authenticated_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-photos');
