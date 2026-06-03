CREATE TABLE IF NOT EXISTS message_replies (
  id serial PRIMARY KEY,
  message_id integer NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  author_id integer REFERENCES users(id) ON DELETE SET NULL,
  author_role varchar(20) NOT NULL DEFAULT 'seller',
  author_name varchar(160) NOT NULL,
  author_email varchar(255),
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS message_replies_message_id_idx ON message_replies (message_id);
CREATE INDEX IF NOT EXISTS message_replies_author_id_idx ON message_replies (author_id);
CREATE INDEX IF NOT EXISTS message_replies_created_at_idx ON message_replies (created_at);
