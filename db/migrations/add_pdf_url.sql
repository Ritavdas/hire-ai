-- Add pdf_url column to resumes table if it doesn't exist
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS pdf_url text;

-- Add comment to the column
COMMENT ON COLUMN public.resumes.pdf_url IS 'URL to the PDF file stored in Supabase Storage';
