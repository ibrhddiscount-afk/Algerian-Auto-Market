CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY,
  listing_id integer NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  sender_id integer REFERENCES users(id) ON DELETE SET NULL,
  seller_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  email varchar(255),
  phone varchar(40) NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS messages_listing_id_idx ON messages (listing_id);
CREATE INDEX IF NOT EXISTS messages_seller_id_idx ON messages (seller_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages (sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at);
