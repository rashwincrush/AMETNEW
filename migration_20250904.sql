BEGIN;

-- ===== Profiles: ensure fields and create a clean read view for the directory cards =====

-- 1) Ensure flexible JSONB arrays exist for positions and skills (do NOT overwrite data)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS positions jsonb DEFAULT '[]'::jsonb, -- [{title, company, start_date, end_date}]
  ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb,     -- ["Leadership","C","Marine Ops"]
  ADD COLUMN IF NOT EXISTS profession text,                      -- e.g., "Mariner"
  ADD COLUMN IF NOT EXISTS degree text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_country text;

-- 2) Convenience view for the Directory cards: merges, picks current position, hides empties
DROP VIEW IF EXISTS public.v_profiles_directory_card CASCADE;
CREATE VIEW public.v_profiles_directory_card
AS
SELECT
  p.id,
  trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')) AS full_name,
  p.graduation_year,
  -- Current position: prefer first item in positions where end_date is NULL, else latest by end_date/start_date
  COALESCE(
    (SELECT pos->>'title'
     FROM jsonb_array_elements(p.positions) AS pos
     WHERE (pos->>'end_date') IS NULL OR (pos->>'end_date') = ''
     ORDER BY (pos->>'start_date') DESC NULLS LAST
     LIMIT 1),
    (SELECT pos->>'title'
     FROM jsonb_array_elements(p.positions) AS pos
     ORDER BY (pos->>'end_date') DESC NULLS LAST, (pos->>'start_date') DESC NULLS LAST
     LIMIT 1)
  ) AS current_title,
  COALESCE(
    (SELECT pos->>'company'
     FROM jsonb_array_elements(p.positions) AS pos
     WHERE (pos->>'end_date') IS NULL OR (pos->>'end_date') = ''
     ORDER BY (pos->>'start_date') DESC NULLS LAST
     LIMIT 1),
    (SELECT pos->>'company'
     FROM jsonb_array_elements(p.positions) AS pos
     ORDER BY (pos->>'end_date') DESC NULLS LAST, (pos->>'start_date') DESC NULLS LAST
     LIMIT 1)
  ) AS current_company,
  NULLIF(p.profession,'') AS profession,
  NULLIF(
    trim(
      COALESCE(p.location_city,'') ||
      CASE WHEN p.location_city IS NOT NULL AND p.location_city <> '' AND p.location_country IS NOT NULL AND p.location_country <> '' THEN ', ' ELSE '' END ||
      COALESCE(p.location_country,'')
    )
  ,'') AS location_label,
  NULLIF(
    trim(
      COALESCE(p.degree,'') ||
      CASE WHEN p.department IS NOT NULL AND p.department <> '' THEN ', ' ELSE '' END ||
      COALESCE(p.department,'')
    )
  ,'') AS degree_department,
  p.skills
FROM public.profiles p;

-- ===== Events: normalize columns expected by Create/Edit/List/Calendar =====

-- 3) Add/align columns used by UI everywhere
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS organizer_name text,
  ADD COLUMN IF NOT EXISTS organizer_email text,
  ADD COLUMN IF NOT EXISTS organizer_phone text,
  ADD COLUMN IF NOT EXISTS venue text,          -- Hall name / venue name
  ADD COLUMN IF NOT EXISTS location text,       -- City/Campus or address line
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category text;

-- 4) Backward-compat: if older columns existed (camelCase etc.), migrate then drop
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='events' AND column_name='longDescription'
  ) THEN
    EXECUTE 'UPDATE public.events SET long_description = COALESCE(long_description, longDescription)';
    EXECUTE 'ALTER TABLE public.events DROP COLUMN longDescription';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='events' AND column_name='organizerName'
  ) THEN
    EXECUTE 'UPDATE public.events SET organizer_name = COALESCE(organizer_name, organizerName)';
    EXECUTE 'ALTER TABLE public.events DROP COLUMN organizerName';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='events' AND column_name='organizerPhone'
  ) THEN
    EXECUTE 'UPDATE public.events SET organizer_phone = COALESCE(organizer_phone, organizerPhone)';
    EXECUTE 'ALTER TABLE public.events DROP COLUMN organizerPhone';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='events' AND column_name='featured_image_url'
  ) THEN
    -- keep as-is; present for UI
    NULL;
  END IF;
END$$;

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events((COALESCE(start_time, start_date)));
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_tags ON public.events USING GIN (tags);

-- 6) Create event_groups table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_groups') THEN
    CREATE TABLE public.event_groups (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
      group_id uuid NOT NULL,
      created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz NOT NULL DEFAULT NOW(),
      created_by uuid REFERENCES auth.users(id),
      UNIQUE(event_id, group_id)
    );
    
    -- Add RLS policy for event_groups
    ALTER TABLE public.event_groups ENABLE ROW LEVEL SECURITY;
    
    -- Allow read access to all authenticated users
    CREATE POLICY "Users can read event groups" ON public.event_groups
      FOR SELECT USING (auth.role() = 'authenticated');
      
    -- Allow insert/update/delete for admins only
    CREATE POLICY "Admins can manage event groups" ON public.event_groups
      FOR ALL USING (auth.role() = 'authenticated' AND (
        -- Check if user is admin
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND is_admin = true
        )
      ));
  END IF;
END;
$$;

COMMIT;
