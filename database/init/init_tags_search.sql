CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS file_tags (
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  tag_id  INT  NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (file_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tags_lower_name ON tags((lower(name)));
CREATE INDEX IF NOT EXISTS idx_files_lower_name ON files((lower(name)));
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);