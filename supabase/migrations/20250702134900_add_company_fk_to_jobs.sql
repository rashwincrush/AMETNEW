-- Enable the moddatetime extension to automatically handle updated_at timestamps.
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Step 1: Create the 'companies' table if it doesn't exist.
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add a trigger to automatically update 'updated_at' on changes.
-- This assumes the 'moddatetime' extension is enabled, which is common in Supabase.
CREATE OR REPLACE TRIGGER handle_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);

-- Step 2: Populate the 'companies' table from existing distinct company names in the 'jobs' table.
INSERT INTO public.companies (name)
SELECT DISTINCT company_name FROM public.jobs
WHERE company_name IS NOT NULL AND company_name <> ''
ON CONFLICT (name) DO NOTHING;

-- Step 3: Add the 'company_id' column to the 'jobs' table if it doesn't exist.
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS company_id UUID;

-- Step 4: Populate the new 'company_id' column in the 'jobs' table.
UPDATE public.jobs j
SET company_id = c.id
FROM public.companies c
WHERE j.company_name = c.name;

-- Step 5: Add the foreign key constraint to link 'jobs' and 'companies'.
-- To make this script idempotent, we drop the constraint first if it exists.
ALTER TABLE public.jobs
DROP CONSTRAINT IF EXISTS fk_jobs_company_id;

ALTER TABLE public.jobs
ADD CONSTRAINT fk_jobs_company_id
FOREIGN KEY (company_id)
REFERENCES public.companies(id)
ON DELETE SET NULL; -- Use SET NULL to avoid deleting jobs if a company is deleted.

-- Step 6: Add an index on the new foreign key for better query performance.
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);

-- Note: After confirming data integrity, the redundant 'company_name' column
-- on the 'jobs' table can be removed in a future migration.
