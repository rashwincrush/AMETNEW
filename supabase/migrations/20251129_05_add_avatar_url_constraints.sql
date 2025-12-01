-- Migration: Add Avatar URL Constraints and Index
-- Date: 2025-11-29
-- Purpose: Ensure avatar_url is always a valid URL format and add index for analytics
-- Impact: Data integrity improvement, better query performance

BEGIN;

-- Add CHECK constraint for URL format
-- Only validates if avatar_url is NOT NULL
ALTER TABLE public.profiles 
ADD CONSTRAINT chk_avatar_url_format 
CHECK (
  avatar_url IS NULL 
  OR (
    avatar_url ~ '^https?://.+' 
    AND length(avatar_url) <= 2048
  )
);

-- Add index for analytics/search queries
-- CONCURRENTLY to avoid locking the table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_avatar_url_not_null 
ON public.profiles(avatar_url) 
WHERE avatar_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON CONSTRAINT chk_avatar_url_format ON public.profiles IS 
  'Ensures avatar_url is a valid HTTP/HTTPS URL with max length 2048 characters';

COMMIT;
