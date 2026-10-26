CREATE TABLE IF NOT EXISTS usage (
  user_id TEXT NOT NULL,
  usage_day TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 20),
  PRIMARY KEY (user_id, usage_day)
);
