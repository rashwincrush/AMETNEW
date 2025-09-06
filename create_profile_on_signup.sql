-- Function to create a profile for a new user.
-- Updated to standardize on 'role' metadata key and improve role handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    created_at,
    role,
    is_verified,
    first_name,
    last_name,
    phone,
    graduation_year,
    expected_graduation_year,
    degree,
    department,
    student_id,
    is_employer,
    company_name,
    company_website,
    industry,
    company_size,
    job_title,
    linkedin_url,
    skills,
    interests,
    bio,
    location,
    interested_in_mentorship,
    mentorship_role,
    mentorship_experience_years,
    mentorship_goals
  )
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user'),
    false,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    NULLIF(NEW.raw_user_meta_data ->> 'graduation_year', '')::integer,
    NULLIF(NEW.raw_user_meta_data ->> 'expected_graduation_year', '')::integer,
    NEW.raw_user_meta_data ->> 'degree',
    NEW.raw_user_meta_data ->> 'department',
    NEW.raw_user_meta_data ->> 'student_id',
    NULLIF(NEW.raw_user_meta_data ->> 'is_employer', '')::boolean,
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'company_website',
    NEW.raw_user_meta_data ->> 'industry',
    NEW.raw_user_meta_data ->> 'company_size',
    NEW.raw_user_meta_data ->> 'job_title',
    NEW.raw_user_meta_data ->> 'linkedin_url',
    (SELECT jsonb_agg(elem) FROM jsonb_array_elements_text(NEW.raw_user_meta_data -> 'skills') AS elem),
    (SELECT jsonb_agg(elem) FROM jsonb_array_elements_text(NEW.raw_user_meta_data -> 'interests') AS elem),
    NEW.raw_user_meta_data ->> 'bio',
    NEW.raw_user_meta_data ->> 'location',
    NULLIF(NEW.raw_user_meta_data ->> 'interested_in_mentorship', '')::boolean,
    NEW.raw_user_meta_data ->> 'mentorship_role',
    NULLIF(NEW.raw_user_meta_data ->> 'mentorship_experience_years', '')::integer,
    NEW.raw_user_meta_data ->> 'mentorship_goals'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function after a new user is created.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
