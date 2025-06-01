-- This file contains custom SQL migrations that need to be run manually
-- after the Drizzle migrations are complete

-- Create GIN index for full-text search if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_resumes_tsv ON resumes USING gin(tsv);

-- Create function for ranked search
CREATE OR REPLACE FUNCTION fts_ranked_search(q text, limit_count integer)
RETURNS TABLE (
  id uuid,
  name text,
  location text,
  snippet text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      r.id,
      r.name,
      r.location,
      ts_headline('english', r.raw_text, to_tsquery(q)) AS snippet,
      ts_rank(r.tsv, to_tsquery(q)) AS rank
    FROM resumes r
    WHERE r.tsv @@ to_tsquery(q)
    ORDER BY rank DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;