-- This file contains custom SQL migrations to fix the tsv column

-- First, drop the existing tsv column
ALTER TABLE public.resumes DROP COLUMN IF EXISTS tsv;

-- Add the tsv column as a GENERATED ALWAYS column
ALTER TABLE public.resumes ADD COLUMN tsv tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(raw_text, ''))) STORED;

-- Recreate the GIN index
DROP INDEX IF EXISTS idx_resumes_tsv;
CREATE INDEX idx_resumes_tsv ON public.resumes USING gin(tsv);

-- Create or replace the search function
CREATE OR REPLACE FUNCTION fts_ranked_search(q text, limit_count integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  name text,
  location text,
  snippet text,
  rank real
) AS $$
BEGIN
  -- Validate inputs
  IF limit_count <= 0 OR limit_count > 1000 THEN
    RAISE EXCEPTION 'limit_count must be between 1 and 1000';
  END IF;

  RETURN QUERY
    SELECT
      r.id,
      r.name,
      r.location,
      ts_headline('english', r.raw_text, plainto_tsquery('english', q)) AS snippet,
      ts_rank(r.tsv, plainto_tsquery('english', q)) AS rank
    FROM resumes r
    WHERE r.tsv @@ plainto_tsquery('english', q)
    ORDER BY rank DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;
