-- This file contains custom SQL migrations that need to be run manually
-- after the Drizzle migrations are complete

-- Create GIN index for full-text search if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_resumes_tsv ON resumes USING gin(tsv);

-- Create function for ranked search
CREATE OR REPLACE FUNCTION fts_ranked_search(q text, limit_count integer DEFAULT 50)
 RETURNS TABLE (
   id uuid,
   name text,
   location text,
   snippet text,
   rank real
 ) AS $$
DECLARE
  query_tsquery tsquery;
 BEGIN
  -- Validate inputs
  IF limit_count <= 0 OR limit_count > 1000 THEN
    RAISE EXCEPTION 'limit_count must be between 1 and 1000';
  END IF;
  
  -- Parse query once and handle potential errors
  BEGIN
    query_tsquery := plainto_tsquery('english', q);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid search query: %', q;
  END;

   RETURN QUERY
     SELECT
       r.id,
       r.name,
       r.location,
      ts_headline('english', r.raw_text, query_tsquery) AS snippet,
      ts_rank(r.tsv, query_tsquery) AS rank
     FROM resumes r
    WHERE r.tsv @@ query_tsquery
     ORDER BY rank DESC
     LIMIT limit_count;
 END;
$$ LANGUAGE plpgsql STABLE;