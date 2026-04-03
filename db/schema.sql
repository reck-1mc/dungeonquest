CREATE TABLE IF NOT EXISTS highscores (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(40) NOT NULL,
  last_name VARCHAR(40) NOT NULL,
  hero_name VARCHAR(40) NOT NULL,
  hero_class VARCHAR(40) NOT NULL,
  gold INTEGER NOT NULL DEFAULT 0,
  items_count INTEGER NOT NULL DEFAULT 0,
  remaining_body INTEGER NOT NULL DEFAULT 0,
  killed_dragon BOOLEAN NOT NULL DEFAULT FALSE,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_highscores_score_created
  ON highscores (score DESC, created_at ASC);
