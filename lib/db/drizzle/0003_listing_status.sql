DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('active', 'draft', 'sold');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS status listing_status NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS listings_status_idx ON listings (status);
