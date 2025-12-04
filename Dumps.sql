

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "realtime";


ALTER SCHEMA "realtime" OWNER TO "supabase_admin";


CREATE SCHEMA IF NOT EXISTS "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";


CREATE TYPE "public"."app_role_enum" AS ENUM (
    'alumni',
    'employer',
    'admin',
    'super_admin',
    'student',
    'mentor'
);


ALTER TYPE "public"."app_role_enum" OWNER TO "postgres";


CREATE TYPE "public"."approval_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."approval_status" OWNER TO "postgres";


CREATE TYPE "public"."employment_type" AS ENUM (
    'full-time',
    'part-time',
    'contract',
    'internship'
);


ALTER TYPE "public"."employment_type" OWNER TO "postgres";


CREATE TYPE "public"."group_member_role_enum" AS ENUM (
    'owner',
    'admin',
    'member'
);


ALTER TYPE "public"."group_member_role_enum" OWNER TO "postgres";


CREATE TYPE "public"."group_visibility_enum" AS ENUM (
    'public',
    'private'
);


ALTER TYPE "public"."group_visibility_enum" OWNER TO "postgres";


CREATE TYPE "public"."job_status_enum" AS ENUM (
    'draft',
    'pending_approval',
    'active',
    'paused',
    'closed',
    'rejected'
);


ALTER TYPE "public"."job_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."membership_status_enum" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."membership_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."mentorship_relationship_status" AS ENUM (
    'active',
    'completed',
    'terminated'
);


ALTER TYPE "public"."mentorship_relationship_status" OWNER TO "postgres";


CREATE TYPE "public"."mentorship_request_status" AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'cancelled_by_user',
    'cancelled_by_system'
);


ALTER TYPE "public"."mentorship_request_status" OWNER TO "postgres";


CREATE TYPE "public"."notification_module" AS ENUM (
    'jobs',
    'events',
    'mentorship',
    'groups',
    'dm',
    'system'
);


ALTER TYPE "public"."notification_module" OWNER TO "postgres";


CREATE TYPE "public"."notification_type_enum" AS ENUM (
    'system',
    'event',
    'message',
    'connection',
    'job'
);


ALTER TYPE "public"."notification_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."profile_approval_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."profile_approval_status" OWNER TO "postgres";


CREATE TYPE "public"."rsvp_status" AS ENUM (
    'going',
    'not_going',
    'interested'
);


ALTER TYPE "public"."rsvp_status" OWNER TO "postgres";


CREATE TYPE "public"."social_type" AS ENUM (
    'linkedin',
    'github',
    'website',
    'instagram',
    'facebook',
    'x'
);


ALTER TYPE "public"."social_type" OWNER TO "postgres";


CREATE TYPE "realtime"."action" AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE "realtime"."action" OWNER TO "supabase_admin";


CREATE TYPE "realtime"."equality_op" AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE "realtime"."equality_op" OWNER TO "supabase_admin";


CREATE TYPE "realtime"."user_defined_filter" AS (
	"column_name" "text",
	"op" "realtime"."equality_op",
	"value" "text"
);


ALTER TYPE "realtime"."user_defined_filter" OWNER TO "supabase_admin";


CREATE TYPE "realtime"."wal_column" AS (
	"name" "text",
	"type_name" "text",
	"type_oid" "oid",
	"value" "jsonb",
	"is_pkey" boolean,
	"is_selectable" boolean
);


ALTER TYPE "realtime"."wal_column" OWNER TO "supabase_admin";


CREATE TYPE "realtime"."wal_rls" AS (
	"wal" "jsonb",
	"is_rls_enabled" boolean,
	"subscription_ids" "uuid"[],
	"errors" "text"[]
);


ALTER TYPE "realtime"."wal_rls" OWNER TO "supabase_admin";


CREATE TYPE "storage"."buckettype" AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE "storage"."buckettype" OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "public"."_conn_max"("a" "uuid", "b" "uuid") RETURNS "uuid"
    LANGUAGE "sql" IMMUTABLE
    AS $$ select case when a>b then a else b end $$;


ALTER FUNCTION "public"."_conn_max"("a" "uuid", "b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_conn_min"("a" "uuid", "b" "uuid") RETURNS "uuid"
    LANGUAGE "sql" IMMUTABLE
    AS $$ select case when a<b then a else b end $$;


ALTER FUNCTION "public"."_conn_min"("a" "uuid", "b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_http_request_compat"("_method" "text", "_url" "text", "_headers" "extensions"."http_header"[] DEFAULT NULL::"extensions"."http_header"[], "_content" "text" DEFAULT NULL::"text") RETURNS "extensions"."http_response"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare resp extensions.http_response; _m text := upper(coalesce(_method,'GET'));
begin
  begin resp := extensions.http_request(method:=_m, uri:=_url, headers:=_headers, content:=_content); return resp; exception when undefined_function then null; end;
  begin resp := extensions.http_request(_m, _url, _content, _headers); return resp; exception when undefined_function then null; end;

  if _m='DELETE' then begin resp := extensions.http_delete(_url, _headers); return resp; exception when undefined_function then null; end; end if;
  if _m='POST' then
    begin resp := extensions.http_post(_url, _content, 'application/json', _headers); return resp; exception when undefined_function then null; end;
    begin resp := extensions.http_post(_url, _content, _headers); return resp; exception when undefined_function then null; end;
  end if;
  if _m='GET' then begin resp := extensions.http_get(_url, _headers); return resp; exception when undefined_function then null; end; end if;

  raise exception 'No compatible HTTP function found' using errcode='42883';
end;
$$;


ALTER FUNCTION "public"."_http_request_compat"("_method" "text", "_url" "text", "_headers" "extensions"."http_header"[], "_content" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_is_admin"("uid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  col    text;
  sql    text;
  result boolean;
BEGIN
  -- NEW: direct check on profiles.role for apps that use app_role_enum
  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid
      AND p.role IN ('admin','super_admin')
  ) THEN
    RETURN true;
  END IF;

  -- Try to detect a label column on roles (name/slug/code/key/title/role/label)
  SELECT c.column_name INTO col
  FROM information_schema.columns c
  WHERE c.table_schema='public'
    AND c.table_name='roles'
    AND c.column_name = ANY (ARRAY['name','slug','code','key','title','role','label'])
  ORDER BY array_position(ARRAY['name','slug','code','key','title','role','label'], c.column_name)
  LIMIT 1;

  IF col IS NULL THEN
    -- Fallback 1: roles.is_admin boolean exists?
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='roles' AND column_name='is_admin'
    ) THEN
      sql := $q$
        SELECT EXISTS (
          SELECT 1
          FROM public.user_roles ur
          JOIN public.roles r ON r.id = ur.role_id
          WHERE ur.profile_id = $1
            AND r.is_admin = true
        )
      $q$;
      EXECUTE sql INTO result USING uid;
      RETURN COALESCE(result, false);
    ELSE
      -- Fallback 2: profiles.is_admin flag
      RETURN COALESCE((SELECT p.is_admin FROM public.profiles p WHERE p.id = uid), false);
    END IF;
  END IF;

  -- Primary path: match role label against admin names
  sql := format($fmt$
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.profile_id = $1
        AND lower(r.%I) IN ('admin','super_admin','super admin')
    )
  $fmt$, col);

  EXECUTE sql INTO result USING uid;
  RETURN COALESCE(result, false);
END;
$_$;


ALTER FUNCTION "public"."_is_admin"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_ja_fill_resume_path"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
begin
  if new.resume_path is null and new.resume_url ilike '%/storage/v1/object/public/resumes/%' then
    -- extract 'resumes/<key>' part; adjust regexp if your public URL base differs
    new.resume_path := regexp_replace(new.resume_url, '.*?/storage/v1/object/public/(resumes/.+)$', '\1');
  end if;
  return new;
end$_$;


ALTER FUNCTION "public"."_ja_fill_resume_path"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end $$;


ALTER FUNCTION "public"."_touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_creator_to_group_members"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = NEW.id AND user_id = auth.uid()
  ) THEN
    INSERT INTO group_members (group_id, user_id)
    VALUES (NEW.id, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_creator_to_group_members"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_delete_job"("p_job_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.is_admin = true OR p.role IN ('admin','super_admin'))
  ) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE='42501';
  END IF;

  DELETE FROM public.jobs WHERE id = p_job_id;

  INSERT INTO public.admin_actions (admin_id, action_type, target_type, target_id, description)
  VALUES (auth.uid(), 'delete', 'job', p_job_id, 'Admin deleted job');
END;
$$;


ALTER FUNCTION "public"."admin_delete_job"("p_job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_delete_user_fallback"("target_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  caller_id UUID;
  caller_role TEXT;
  target_role TEXT;
  result JSONB;
BEGIN
  -- Get caller's ID from current session
  caller_id := auth.uid();
  
  -- Check if caller is authenticated
  IF caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Get caller's role
  SELECT role INTO caller_role FROM profiles WHERE id = caller_id;
  
  -- Only admin or super_admin can delete users
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Get target user's role
  SELECT role INTO target_role FROM profiles WHERE id = target_user_id;
  
  -- Check if user exists
  IF target_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Only super_admin can delete admin/super_admin users
  IF target_role IN ('admin', 'super_admin') AND caller_role <> 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only super_admin can delete admin/super_admin users');
  END IF;
  
  -- Cannot delete yourself
  IF caller_id = target_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot delete your own account');
  END IF;
  
  -- We'll skip purge_user_data and just do direct cleanup
  
  -- Delete all user's content (add specific tables based on your schema)
  -- This is simplified and should be expanded based on your specific database schema
  BEGIN
    -- Posts (if such table exists)
    DELETE FROM posts WHERE author_id = target_user_id;
    EXCEPTION WHEN undefined_table THEN NULL; -- Ignore if table doesn't exist
  END;
  
  BEGIN
    -- Comments (if such table exists)
    DELETE FROM comments WHERE user_id = target_user_id;
    EXCEPTION WHEN undefined_table THEN NULL; -- Ignore if table doesn't exist
  END;
  
  BEGIN
    -- Group memberships
    DELETE FROM group_members WHERE user_id = target_user_id;
    EXCEPTION WHEN undefined_table THEN NULL; -- Ignore if table doesn't exist
  END;
  
  -- Mark as deleted in profiles
  -- This is NOT a complete deletion! Auth.users record remains, but data is anonymized
  UPDATE profiles 
  SET 
    email = 'deleted_' || id || '@deleted.user',
    full_name = 'Deleted User',
    updated_at = NOW(),
    is_deleted = TRUE
  WHERE id = target_user_id;
  
  -- Log action to admin_actions
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    description
  ) VALUES (
    caller_id,
    'delete_user_fallback',
    'user',
    target_user_id,
    'User data cleanup via fallback RPC (auth record remains)'
  );
  
  -- Return success with warnings
  RETURN jsonb_build_object(
    'success', true,
    'warning', 'This is a partial deletion. The auth.users record may remain as RPC cannot access the Auth Admin API.',
    'details', jsonb_build_object('user_id', target_user_id, 'deleted_by', caller_id)
  );
END;
$$;


ALTER FUNCTION "public"."admin_delete_user_fallback"("target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_delete_user_fallback"("target_user_id" "uuid") IS 'Fallback admin user deletion. Only cleans up application data. Cannot delete auth records - Edge Function required for complete deletion.';



CREATE OR REPLACE FUNCTION "public"."admin_delete_user_rpc"("target" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'net', 'vault', 'extensions'
    AS $$
declare
  requester uuid := auth.uid();
  srv_key   text := (select decrypted_secret from vault.decrypted_secrets where name='service_role');
  base_url  text := (select decrypted_secret from vault.decrypted_secrets where name='project_url');

  req_id    bigint;
  v_status  int;
  v_body    text;

  target_role text;
  super_admins_left int;

  -- OPTIONAL: gather storage object paths if you use them
  avatar_path text;
  resume_paths text[];
begin
  -- AuthZ
  if requester is null then return jsonb_build_object('error','unauthorized'); end if;
  if not exists (select 1 from public.profiles p where p.id=requester and p.role in ('admin','super_admin'))
     then return jsonb_build_object('error','forbidden'); end if;
  if target = requester then return jsonb_build_object('error','cannot_delete_self'); end if;

  select role into target_role from public.profiles where id=target;
  if target_role in ('admin','super_admin') and not exists
     (select 1 from public.profiles p where p.id=requester and p.role='super_admin')
  then return jsonb_build_object('error','only_super_admin_can_delete_admins'); end if;

  if target_role='super_admin' then
    select count(*) into super_admins_left from public.profiles where role='super_admin' and id<>target;
    if coalesce(super_admins_left,0)=0 then
      return jsonb_build_object('error','cannot_delete_last_super_admin');
    end if;
  end if;

  -- OPTIONAL storage cleanup (ignore if columns/tables don’t exist)
  begin
    select p.avatar_path into avatar_path from public.profiles p where p.id=target;
  exception when undefined_column then null; end;

  begin
    select array_agg(file_path) into resume_paths from public.user_resumes where user_id=target;
  exception when undefined_table or undefined_column then null; end;

  if avatar_path is not null then
    perform net.http_post(
      url     := base_url || '/storage/v1/object/avatars/remove',
      headers := jsonb_build_object('apikey',srv_key,'authorization','Bearer '||srv_key,'Content-Type','application/json'),
      body    := jsonb_build_array(jsonb_build_object('bucket','avatars','name',avatar_path))
    );
  end if;

  if resume_paths is not null then
    perform net.http_post(
      url     := base_url || '/storage/v1/object/resumes/remove',
      headers := jsonb_build_object('apikey',srv_key,'authorization','Bearer '||srv_key,'Content-Type','application/json'),
      body    := (select jsonb_agg(jsonb_build_object('bucket','resumes','name',p)) from unnest(resume_paths) as p)
    );
  end if;

  -- Purge app data
  perform public.purge_user_data(target);

  -- Delete Auth user via GoTrue Admin API (async)
  req_id := net.http_delete(
    url     := base_url || '/auth/v1/admin/users/' || target::text,
    headers := jsonb_build_object('apikey',srv_key,'authorization','Bearer '||srv_key,'Content-Type','application/json')
  );

  -- Block for up to ~5s waiting for the response to land
  perform pg_sleep(0.2);
  for i in 1..25 loop
    select status_code, content into v_status, v_body from net._http_response where id=req_id;
    exit when v_status is not null;
    perform pg_sleep(0.2);
  end loop;

  if v_status between 200 and 299 then
    return jsonb_build_object('ok',true,'status',v_status);
  else
    return jsonb_build_object('error','auth_delete_failed','status',v_status,'body',v_body);
  end if;
end;
$$;


ALTER FUNCTION "public"."admin_delete_user_rpc"("target" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_get_avatar"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Check caller is admin or super_admin
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  )
  INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can access this function'
      USING ERRCODE = '42501';
  END IF;

  -- Delegate to your existing function
  RETURN public.get_signed_avatar_url(p_user_id);
END;
$$;


ALTER FUNCTION "public"."admin_get_avatar"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_get_avatar"("p_user_id" "uuid") IS 'Admin-only helper to fetch a user''s avatar URL (wraps get_signed_avatar_url).';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profile_approval_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "old_approval_status" "public"."profile_approval_status",
    "new_approval_status" "public"."profile_approval_status",
    "old_is_approved" boolean,
    "new_is_approved" boolean,
    "old_alumni_verification_status" "text",
    "new_alumni_verification_status" "text",
    "decision" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profile_approval_audit_decision_ck" CHECK (("decision" = ANY (ARRAY['approve'::"text", 'reject'::"text", 'block'::"text", 'unblock'::"text", 'deactivate'::"text", 'reactivate'::"text"])))
);


ALTER TABLE "public"."profile_approval_audit" OWNER TO "postgres";


COMMENT ON TABLE "public"."profile_approval_audit" IS 'Audit log of admin approval/rejection/block decisions on profiles';



CREATE OR REPLACE FUNCTION "public"."admin_get_profile_approval_audit"("p_profile_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."profile_approval_audit"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select *
  from public.profile_approval_audit a
  where public.app_is_admin()   -- only admins
    and a.profile_id = p_profile_id
  order by a.created_at desc
  limit p_limit
  offset p_offset;
$$;


ALTER FUNCTION "public"."admin_get_profile_approval_audit"("p_profile_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_jobs_pending"("_limit" integer, "_offset" integer) RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "is_active" boolean, "is_approved" boolean, "is_rejected" boolean, "created_at" timestamp with time zone, "user_id" "uuid", "posted_by" "uuid", "created_by" "uuid", "user_first_name" "text", "user_last_name" "text", "user_email" "text", "user_avatar_url" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select j.id, j.title, j.description,
         j.is_active, j.is_approved, coalesce(j.is_rejected,false),
         j.created_at, j.user_id, j.posted_by, j.created_by,
         p.first_name, p.last_name, p.email, p.avatar_url
  from public.jobs j
  left join public.profiles p on p.id = j.user_id
  where coalesce(j.is_approved,false) = false
    and coalesce(j.is_rejected,false) = false
  order by j.created_at desc
  limit _limit offset _offset
$$;


ALTER FUNCTION "public"."admin_list_jobs_pending"("_limit" integer, "_offset" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "full_name" "text",
    "avatar_url" "text",
    "graduation_year" integer,
    "degree" "text",
    "major" "text",
    "current_company" "text",
    "current_position" "text",
    "location" "text",
    "bio" "text",
    "linkedin_url" "text",
    "twitter_url" "text",
    "website_url" "text",
    "is_verified" boolean DEFAULT false,
    "is_mentor" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "mentor_availability" "text",
    "mentor_topics" "text"[],
    "mentor_status" "text" DEFAULT 'pending'::"text",
    "mentee_status" "text" DEFAULT 'pending'::"text",
    "alumni_verification_status" "text" DEFAULT 'pending'::"text",
    "verification_document_url" "text",
    "verification_notes" "text",
    "verification_reviewed_by" "uuid",
    "verification_reviewed_at" timestamp with time zone,
    "department" "text",
    "phone" "text",
    "github_url" "text",
    "skills" "jsonb" DEFAULT '[]'::"jsonb",
    "account_type" "text",
    "student_id" "text",
    "is_employer" boolean DEFAULT false,
    "company_name" "text",
    "company_website" "text",
    "industry" "text",
    "phone_number" "text",
    "is_admin" boolean DEFAULT false,
    "role" "public"."app_role_enum" DEFAULT 'alumni'::"public"."app_role_enum" NOT NULL,
    "job_title" "text",
    "years_experience" integer,
    "current_location" "text",
    "degree_program" "text",
    "current_job_title" "text",
    "major_specialization" "text",
    "biography" "text",
    "privacy_level" "text" DEFAULT 'public'::"text",
    "is_online" boolean DEFAULT false,
    "last_seen" timestamp with time zone,
    "username" "text",
    "about" "text",
    "headline" "text",
    "company" "text",
    "experience" "text",
    "specialization" "text",
    "achievements" "jsonb" DEFAULT '[]'::"jsonb",
    "interests" "jsonb" DEFAULT '[]'::"jsonb",
    "languages" "text"[] DEFAULT '{}'::"text"[],
    "social_links" "jsonb" DEFAULT '{}'::"jsonb",
    "verified" boolean DEFAULT false NOT NULL,
    "batch_year" integer,
    "resume_url" "text",
    "wants_job_alerts" boolean DEFAULT false,
    "website" "text",
    "is_available_for_mentorship" boolean DEFAULT false,
    "mentorship_topics" "text"[],
    "date_of_birth" "date",
    "company_location" "text",
    "primary_role" "text",
    "batch" "text",
    "is_profile_complete" boolean GENERATED ALWAYS AS ((("email" IS NOT NULL) AND ("first_name" IS NOT NULL) AND ("last_name" IS NOT NULL) AND ("graduation_year" IS NOT NULL) AND ("degree_program" IS NOT NULL) AND ("current_job_title" IS NOT NULL) AND ("company_name" IS NOT NULL) AND ("avatar_url" IS NOT NULL))) STORED,
    "show_in_directory" boolean DEFAULT true,
    "privacy_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "rejection_comment" "text",
    "rejected_by" "uuid",
    "rejection_date" timestamp with time zone,
    "admin_notes" "text",
    "clarification_comment" "text",
    "rejection_reason" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "is_approved" boolean DEFAULT false NOT NULL,
    "verified_at" timestamp with time zone,
    "degree_code" "text",
    "education" "jsonb" DEFAULT '[]'::"jsonb",
    "work_experience" "jsonb" DEFAULT '[]'::"jsonb",
    "positions" "jsonb" DEFAULT '[]'::"jsonb",
    "profession" "text",
    "location_city" "text",
    "location_country" "text",
    "company_size" "text",
    "approval_status" "public"."profile_approval_status" DEFAULT 'pending'::"public"."profile_approval_status" NOT NULL,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text",
    "extra" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "verified_by" "uuid",
    "approved_at" timestamp with time zone,
    "approval_reason" "text",
    "department_id" "uuid",
    "avatar_path" "text",
    "expected_graduation_year" integer,
    "approval_reviewed_by" "uuid",
    "approval_reviewed_at" timestamp with time zone,
    "avatar_source" "text",
    "avatar_storage_bucket" "text",
    "max_mentees" integer DEFAULT 5 NOT NULL,
    "is_data_purged" boolean DEFAULT false,
    CONSTRAINT "approval_status_valid" CHECK (("approval_status" = ANY (ARRAY['approved'::"public"."profile_approval_status", 'pending'::"public"."profile_approval_status", 'rejected'::"public"."profile_approval_status"]))),
    CONSTRAINT "avatar_source_valid" CHECK (("avatar_source" = ANY (ARRAY['supabase'::"text", 'oauth'::"text", 'custom_url'::"text"]))),
    CONSTRAINT "chk_avatar_url_format" CHECK ((("avatar_url" IS NULL) OR (("avatar_url" ~ '^https?://.+'::"text") AND ("length"("avatar_url") <= 2048)))),
    CONSTRAINT "chk_email_lower" CHECK (("email" = "lower"("email"))),
    CONSTRAINT "chk_email_lower_no_co" CHECK ((("email" = "lower"("email")) AND ("email" !~* '\.co$'::"text"))),
    CONSTRAINT "chk_email_not_co" CHECK (("email" !~* '\.co$'::"text")),
    CONSTRAINT "chk_first_name_fmt" CHECK ((("first_name" IS NULL) OR (("length"("btrim"("first_name")) >= 1) AND ("length"("btrim"("first_name")) <= 100)))),
    CONSTRAINT "chk_last_name_fmt" CHECK ((("last_name" IS NULL) OR (("length"("btrim"("last_name")) >= 1) AND ("length"("btrim"("last_name")) <= 100)))),
    CONSTRAINT "chk_linkedin_url" CHECK ((("linkedin_url" IS NULL) OR ("linkedin_url" ~* '^(https?://)?(www\.)?linkedin\.com/.*$'::"text"))),
    CONSTRAINT "chk_phone_e164" CHECK (("phone" ~ '^\+?[0-9]{7,15}$'::"text")),
    CONSTRAINT "chk_profiles_expected_grad_year_range" CHECK ((("expected_graduation_year" IS NULL) OR (("expected_graduation_year" >= 1900) AND ("expected_graduation_year" <= 2100)))),
    CONSTRAINT "ck_profiles_achievements_array" CHECK ((("achievements" IS NULL) OR ("jsonb_typeof"("achievements") = 'array'::"text"))),
    CONSTRAINT "ck_profiles_interests_array" CHECK ((("interests" IS NULL) OR ("jsonb_typeof"("interests") = 'array'::"text"))),
    CONSTRAINT "ck_profiles_is_approved_consistent" CHECK (("is_approved" = ("approval_status" = 'approved'::"public"."profile_approval_status"))),
    CONSTRAINT "ck_profiles_linkedin_url_pattern" CHECK ((("linkedin_url" IS NULL) OR ("linkedin_url" ~* '^https://(www\\.)?linkedin\\.com/(in|pub|company|school)/.+'::"text"))),
    CONSTRAINT "ck_profiles_skills_array" CHECK ((("skills" IS NULL) OR ("jsonb_typeof"("skills") = 'array'::"text"))),
    CONSTRAINT "ck_profiles_social_links_object" CHECK ((("social_links" IS NULL) OR ("jsonb_typeof"("social_links") = 'object'::"text"))),
    CONSTRAINT "profiles_alumni_verification_status_check" CHECK (("alumni_verification_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "profiles_approval_status_valid" CHECK (("approval_status" = ANY (ARRAY['pending'::"public"."profile_approval_status", 'approved'::"public"."profile_approval_status", 'rejected'::"public"."profile_approval_status"]))),
    CONSTRAINT "profiles_avatar_source_check" CHECK (("avatar_source" = ANY (ARRAY['supabase'::"text", 'oauth'::"text", 'custom_url'::"text"]))),
    CONSTRAINT "profiles_check_max_mentees" CHECK ((("max_mentees" > 0) AND ("max_mentees" <= 50))),
    CONSTRAINT "profiles_mentee_status_check" CHECK (("mentee_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "profiles_mentor_status_check" CHECK (("mentor_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"]))),
    CONSTRAINT "profiles_phone_ck" CHECK ((("phone" IS NULL) OR ("phone" ~ '^[0-9+()\\-\\s]{7,20}$'::"text"))),
    CONSTRAINT "valid_role" CHECK (("role" = ANY (ARRAY['student'::"public"."app_role_enum", 'alumni'::"public"."app_role_enum", 'employer'::"public"."app_role_enum", 'admin'::"public"."app_role_enum", 'super_admin'::"public"."app_role_enum"])))
);

ALTER TABLE ONLY "public"."profiles" REPLICA IDENTITY FULL;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."mentor_status" IS 'Status of mentor role verification';



COMMENT ON COLUMN "public"."profiles"."mentee_status" IS 'Status of mentee role verification';



COMMENT ON COLUMN "public"."profiles"."alumni_verification_status" IS 'Status of alumni verification';



COMMENT ON COLUMN "public"."profiles"."verification_document_url" IS 'URL to verification document uploaded by user';



COMMENT ON COLUMN "public"."profiles"."verification_notes" IS 'Notes from admin regarding verification';



COMMENT ON COLUMN "public"."profiles"."verification_reviewed_by" IS 'Admin who reviewed the verification';



COMMENT ON COLUMN "public"."profiles"."verification_reviewed_at" IS 'When the verification was reviewed';



COMMENT ON COLUMN "public"."profiles"."avatar_source" IS 'Source of avatar: supabase (uploaded to our storage), oauth (Google/LinkedIn), custom_url (external URL)';



COMMENT ON COLUMN "public"."profiles"."avatar_storage_bucket" IS 'Storage bucket name if avatar_source = supabase (avatars, profile-images, etc.)';



CREATE OR REPLACE FUNCTION "public"."admin_list_profiles_for_approval"("p_status" "public"."profile_approval_status" DEFAULT NULL::"public"."profile_approval_status", "p_role" "public"."app_role_enum" DEFAULT NULL::"public"."app_role_enum", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."profiles"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  -- Only admins can call this
  select *
  from public.profiles p
  where public.app_is_admin()
    and (p_status is null or p.approval_status = p_status)
    and (p_role   is null or p.role            = p_role)
  order by p.created_at desc
  limit p_limit
  offset p_offset;
$$;


ALTER FUNCTION "public"."admin_list_profiles_for_approval"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_profiles_for_approval"("p_status" "public"."profile_approval_status" DEFAULT NULL::"public"."profile_approval_status", "p_role" "public"."app_role_enum" DEFAULT NULL::"public"."app_role_enum", "p_search" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."profiles"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select *
  from public.profiles p
  where public.app_is_admin()  -- only admins/super_admins
    and (p_status is null or p.approval_status = p_status)
    and (p_role   is null or p.role            = p_role)
    and (
      p_search is null
      or p_search = ''
      or p.full_name    ilike '%' || p_search || '%'
      or p.email        ilike '%' || p_search || '%'
      or p.first_name   ilike '%' || p_search || '%'
      or p.last_name    ilike '%' || p_search || '%'
    )
  order by p.created_at desc
  limit p_limit
  offset p_offset;
$$;


ALTER FUNCTION "public"."admin_list_profiles_for_approval"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_search" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_user_logins" AS
 SELECT "p"."id",
    "p"."first_name",
    "p"."last_name",
    "u"."last_sign_in_at"
   FROM ("auth"."users" "u"
     JOIN "public"."profiles" "p" ON (("p"."id" = "u"."id")));


ALTER TABLE "public"."admin_user_logins" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_user_logins"() RETURNS SETOF "public"."admin_user_logins"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$ select * from admin_user_logins $$;


ALTER FUNCTION "public"."admin_list_user_logins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_list_users_with_last_login"("p_search" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "role" "text", "last_sign_in_at" timestamp with time zone, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.is_admin = true OR p.role IN ('admin','super_admin'))
  ) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE='42501';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id,
      p.email,
      p.full_name,
      COALESCE((p.role)::text, CASE WHEN p.is_admin THEN 'admin' ELSE 'alumni' END) AS role,
      u.last_sign_in_at,
      u.created_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE
      p_search IS NULL
      OR p.email ILIKE '%' || p_search || '%'
      OR p.full_name ILIKE '%' || p_search || '%'
  )
  SELECT *
  FROM base
  ORDER BY COALESCE(base.last_sign_in_at, base.created_at) DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."admin_list_users_with_last_login"("p_search" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_log_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_type" "text", "p_target_id" "uuid", "p_description" "text", "p_before" "jsonb" DEFAULT NULL::"jsonb", "p_after" "jsonb" DEFAULT NULL::"jsonb", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  INSERT INTO public.admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    description,
    metadata
  )
  VALUES (
    p_admin_id,
    p_action_type,
    p_target_type,
    p_target_id,
    p_description,
    jsonb_strip_nulls(
      jsonb_build_object(
        'before', p_before,
        'after',  p_after,
        'reason', p_reason
      )
    )
  );
$$;


ALTER FUNCTION "public"."admin_log_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_type" "text", "p_target_id" "uuid", "p_description" "text", "p_before" "jsonb", "p_after" "jsonb", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_pending_counts"() RETURNS "jsonb"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select jsonb_build_object(
    'jobs',    (select count(*) from public.jobs   where coalesce(is_rejected,false)=false and coalesce(is_approved,false)=false and fc_is_admin()),
    'events',  (select count(*) from public.events where approval_status = 'pending' and fc_is_admin()),
    'groups',  (select count(*) from public.groups where coalesce(is_rejected,false)=false and coalesce(is_approved,false)=false and fc_is_admin()),
    'content', (select count(*) from public.content_approvals where status = 'pending' and fc_is_admin())
  );
$$;


ALTER FUNCTION "public"."admin_pending_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_pending_feed"() RETURNS "jsonb"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with j as (
    select id, title, created_at
    from public.jobs
    where coalesce(is_rejected,false)=false and coalesce(is_approved,false)=false and fc_is_admin()
    order by created_at desc limit 10
  ),
  e as (
    select id, title, created_at
    from public.events
    where approval_status = 'pending' and fc_is_admin()
    order by created_at desc limit 10
  ),
  g as (
    select id, name as title, created_at
    from public.groups
    where coalesce(is_rejected,false)=false and coalesce(is_approved,false)=false and fc_is_admin()
    order by created_at desc limit 10
  ),
  c as (
    select id, content_type as title, created_at
    from public.content_approvals
    where status = 'pending' and fc_is_admin()
    order by created_at desc limit 10
  )
  select jsonb_build_object(
    'jobs',    (select jsonb_agg(to_jsonb(j)) from j),
    'events',  (select jsonb_agg(to_jsonb(e)) from e),
    'groups',  (select jsonb_agg(to_jsonb(g)) from g),
    'content', (select jsonb_agg(to_jsonb(c)) from c)
  );
$$;


ALTER FUNCTION "public"."admin_pending_feed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_purge_user_data"("target" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  caller      uuid := auth.uid();
  target_role public.app_role_enum;
BEGIN
  -- Must be logged in
  IF caller IS NULL THEN
    RAISE EXCEPTION 'unauthenticated'
      USING ERRCODE = '28000';
  END IF;

  -- Only super_admins can purge
  IF NOT public.is_super_admin(caller) THEN
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = '42501';
  END IF;

  -- No self-purge
  IF target = caller THEN
    RAISE EXCEPTION 'cannot_purge_self'
      USING ERRCODE = 'P0001';
  END IF;

  -- Target must exist
  SELECT role INTO target_role
  FROM public.profiles
  WHERE id = target;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'user_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  -- Optional safety: require soft delete first
  -- IF NOT EXISTS (
  --   SELECT 1 FROM public.profiles
  --   WHERE id = target AND coalesce(is_deleted, false) = true
  -- ) THEN
  --   RAISE EXCEPTION 'must_soft_delete_first'
  --     USING ERRCODE = 'P0001';
  -- END IF;

  -- Do the actual purge (your big cascade function)
  PERFORM public.purge_user_data(target);

  -- Mark profile as purged
  UPDATE public.profiles
  SET is_data_purged = true
  WHERE id = target;

  -- Audit in admin_actions (adjust columns if needed)
  INSERT INTO public.admin_actions (
    admin_id,
    action_type,
    target_type,
    target_id,
    description,
    details
  )
  VALUES (
    caller,
    'purge_user_data',
    'user',
    target,
    'Admin purged user-owned data',
    jsonb_build_object('target_role', target_role)
  );
END;
$$;


ALTER FUNCTION "public"."admin_purge_user_data"("target" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_request_user_delete"("target" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  is_admin boolean;
begin
  -- allow only admins / super_admins (your schema uses these roles)
  select (role in ('admin','super_admin')) into is_admin
  from public.profiles
  where id = auth.uid();

  if not coalesce(is_admin, false) then
    return json_build_object('error','Forbidden','status',403);
  end if;

  -- Log the action (admins are allowed to insert/select in admin_actions)
  insert into public.admin_actions (admin_id, action_type, target_type, target_id, description, metadata)
  values (auth.uid(), 'delete_user', 'user', target, 'Requested hard delete of user via Admin API', json_build_object('requested_at', now()));

  -- Your frontend/server will now call /api/admin/delete-user to actually delete
  return json_build_object('ok', true);
end;
$$;


ALTER FUNCTION "public"."admin_request_user_delete"("target" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_review_group"("p_group_id" "uuid", "p_action" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  if p_action = 'approve' then
    update public.groups
      set is_approved = true,
          is_rejected = false,
          approved_by = auth.uid(),
          review_notes = p_notes,
          updated_at = now()
    where id = p_group_id;

  elsif p_action = 'reject' then
    update public.groups
      set is_approved = false,
          is_rejected = true,
          approved_by = auth.uid(),
          rejection_reason = coalesce(p_notes,''),
          updated_at = now()
    where id = p_group_id;

  elsif p_action = 'reset' then
    update public.groups
      set is_approved = false,
          is_rejected = false,
          approved_by = null,
          review_notes = null,
          rejection_reason = null,
          updated_at = now()
    where id = p_group_id;
  else
    raise exception 'Invalid action';
  end if;
end $$;


ALTER FUNCTION "public"."admin_review_group"("p_group_id" "uuid", "p_action" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_revoke_super_admin"("target_user_id" "uuid", "new_role" "text" DEFAULT 'admin'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_is_super bool;
  target_role text;
BEGIN
  SELECT (p.role = 'super_admin') INTO caller_is_super
  FROM public.profiles p
  WHERE p.id = caller_id;

  IF NOT caller_is_super THEN
    RAISE EXCEPTION 'Only super_admin can revoke super_admin' USING ERRCODE='42501';
  END IF;

  IF target_user_id = caller_id THEN
    RAISE EXCEPTION 'You cannot revoke your own super_admin' USING ERRCODE='42501';
  END IF;

  SELECT role INTO target_role FROM public.profiles WHERE id = target_user_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  IF target_role <> 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Target user is not super_admin');
  END IF;

  UPDATE public.profiles
  SET role = new_role, is_admin = (new_role IN ('admin','super_admin'))
  WHERE id = target_user_id;

  INSERT INTO public.admin_actions (admin_id, action_type, target_type, target_id, description)
  VALUES (caller_id, 'revoke_super_admin', 'user', target_user_id, 'Role changed to ' || new_role);

  -- Note for UI: refresh the target user's session via client to pick up the new role
  RETURN jsonb_build_object('success', true, 'new_role', new_role);
END;
$$;


ALTER FUNCTION "public"."admin_revoke_super_admin"("target_user_id" "uuid", "new_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_approval"("tname" "text", "row_id" "uuid", "new_status" "public"."approval_status", "note" "text" DEFAULT NULL::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  actor uuid := auth.uid();
  sql text;
begin
  if not is_admin() then
    return json_build_object('error','Forbidden','status',403);
  end if;

  -- Whitelist only these three tables
  if tname not in ('events','jobs','groups') then
    return json_build_object('error','Unsupported table');
  end if;

  sql := format('update public.%I set approval_status = $1, reviewed_by = $2, reviewed_at = now() where id = $3', tname);
  execute sql using new_status, actor, row_id;

  insert into public.admin_actions (admin_id, action_type, target_type, target_id, description, metadata)
  values (actor, 'set_approval', tname, row_id,
          coalesce(note, concat('Set to ', new_status::text)),
          json_build_object('status', new_status));

  return json_build_object('ok', true);
end;
$_$;


ALTER FUNCTION "public"."admin_set_approval"("tname" "text", "row_id" "uuid", "new_status" "public"."approval_status", "note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_group_approval"("p_group_id" "uuid", "p_status" "text", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_admin_like() then
    raise exception 'Only Admin/Super Admin can change approval status';
  end if;

  if p_status not in ('approved','rejected') then
    raise exception 'Invalid status (approved|rejected only)';
  end if;

  update public.groups g
     set approval_status  = p_status,
         is_approved      = (p_status = 'approved'),
         is_rejected      = (p_status = 'rejected'),
         rejection_reason = case when p_status='rejected' then coalesce(p_reason,'') else null end,
         reviewed_by      = auth.uid(),
         reviewed_at      = now()
   where g.id = p_group_id;
end;
$$;


ALTER FUNCTION "public"."admin_set_group_approval"("p_group_id" "uuid", "p_status" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_profile_approval"("p_profile_id" "uuid", "p_status" "public"."profile_approval_status", "p_reason" "text" DEFAULT NULL::"text") RETURNS "public"."profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_decision text;
begin
  -- Map old status parameter to the new decision text
  if p_status = 'approved' then
    v_decision := 'approve';
  elsif p_status = 'rejected' then
    v_decision := 'reject';
  else
    raise exception
      'Unsupported profile_approval_status % for admin_set_profile_approval; use admin_update_profile_approval directly',
      p_status;
  end if;

  return public.admin_update_profile_approval(
    p_profile_id,
    v_decision,
    p_reason
  );
end;
$$;


ALTER FUNCTION "public"."admin_set_profile_approval"("p_profile_id" "uuid", "p_status" "public"."profile_approval_status", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_set_profile_approval"("p_profile_id" "uuid", "p_status" "public"."profile_approval_status", "p_reason" "text") IS 'Legacy compatibility wrapper. For new code, call admin_update_profile_approval(...) directly.';



CREATE OR REPLACE FUNCTION "public"."admin_set_role"("p_user" "uuid", "p_role" "text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  insert into public.user_roles(profile_id, role_id)
  select p_user, r.id from public.roles r where r.name = p_role
  on conflict (profile_id, role_id) do nothing;
$$;


ALTER FUNCTION "public"."admin_set_role"("p_user" "uuid", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_roles"("p_user_ids" "uuid"[], "p_role" "public"."app_role_enum") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update public.profiles
     set role = p_role
   where id = any(p_user_ids);
end
$$;


ALTER FUNCTION "public"."admin_set_roles"("p_user_ids" "uuid"[], "p_role" "public"."app_role_enum") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_user_role"("p_user_id" "uuid", "p_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Cast text -> enum and delegate
  PERFORM public.admin_update_user_role(
    p_user_id,
    p_role::public.app_role_enum,
    'Called via admin_set_user_role legacy wrapper'
  );
END;
$$;


ALTER FUNCTION "public"."admin_set_user_role"("p_user_id" "uuid", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_user_role"("p_user_id" "uuid", "p_role" "public"."app_role_enum") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform public.admin_update_user_role(p_user_id, p_role, NULL);
end;
$$;


ALTER FUNCTION "public"."admin_set_user_role"("p_user_id" "uuid", "p_role" "public"."app_role_enum") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_user_role_legacy"("target" "uuid", "new_role" "text", "make_admin" boolean) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- (body unchanged)
end $$;


ALTER FUNCTION "public"."admin_set_user_role_legacy"("target" "uuid", "new_role" "text", "make_admin" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_soft_delete_user"("target" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  PERFORM public.admin_soft_delete_user(target, NULL);
END;
$$;


ALTER FUNCTION "public"."admin_soft_delete_user"("target" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_soft_delete_user"("target" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  caller_id           uuid := auth.uid();
  v_old               public.profiles;
  v_super_admin_count integer;
BEGIN
  -- 1) Only super_admins may soft-delete users
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super_admin may soft-delete users'
      USING ERRCODE = '42501';
  END IF;

  -- 2) Load current profile
  SELECT * INTO v_old
  FROM public.profiles
  WHERE id = target;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found', target
      USING ERRCODE = 'P0002';
  END IF;

  -- 3) No self-delete via this RPC
  IF caller_id = target THEN
    RAISE EXCEPTION 'You cannot soft-delete your own account'
      USING ERRCODE = 'P0001';
  END IF;

  -- 4) Last-super-admin safety
  IF v_old.role = 'super_admin' THEN
    SELECT COUNT(*)
    INTO v_super_admin_count
    FROM public.profiles
    WHERE role = 'super_admin'
      AND COALESCE(is_deleted, false) = false;

    IF v_super_admin_count = 1 THEN
      RAISE EXCEPTION 'Cannot soft-delete the last super_admin'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- 5) Perform soft delete
  UPDATE public.profiles
  SET
    is_deleted = TRUE,
    is_active  = FALSE
  WHERE id = target;

  -- 6) Audit into activity_log
  INSERT INTO public.activity_log(
    description,
    activity_type,
    user_id,
    metadata
  )
  VALUES (
    'Admin soft-deleted user',
    'admin_soft_delete_user',
    caller_id,
    jsonb_build_object(
      'target_user_id', target,
      'old_role',       v_old.role,
      'reason',         p_reason
    )
  );
END;
$$;


ALTER FUNCTION "public"."admin_soft_delete_user"("target" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_toggle_active"("p_user_id" "uuid", "p_is_active" boolean, "p_reason" "text" DEFAULT NULL::"text") RETURNS "public"."profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_admin_id          uuid := auth.uid();
  v_old               public.profiles;
  v_new               public.profiles;
  v_super_admin_count integer;
BEGIN
  -- 1) Caller must be admin/super_admin
  IF NOT public.app_is_admin() THEN
    RAISE EXCEPTION 'Only admins can toggle user activity'
      USING ERRCODE = '42501';
  END IF;

  -- 2) Load current profile
  SELECT * INTO v_old
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found', p_user_id
      USING ERRCODE = 'P0002';
  END IF;

  -- 3) Last-super-admin safety: cannot deactivate the last super_admin
  IF v_old.role = 'super_admin'
     AND p_is_active = false THEN
    SELECT COUNT(*)
    INTO v_super_admin_count
    FROM public.profiles
    WHERE role = 'super_admin'
      AND COALESCE(is_deleted, false) = false
      AND COALESCE(is_active,  true)  = true;

    IF v_super_admin_count = 1 THEN
      RAISE EXCEPTION 'Cannot deactivate the last super_admin'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- 4) Self-deactivation safety
  IF v_admin_id = p_user_id AND p_is_active = false THEN
    RAISE EXCEPTION 'You cannot deactivate your own account'
      USING ERRCODE = 'P0001';
  END IF;

  -- 5) Perform update
  UPDATE public.profiles p
  SET is_active = p_is_active
  WHERE p.id = p_user_id
  RETURNING * INTO v_new;

  -- 6) Audit
  INSERT INTO public.activity_log(
    description,
    activity_type,
    user_id,
    metadata
  )
  VALUES (
    'Admin toggled user active status',
    'admin_toggle_active',
    v_admin_id,
    jsonb_build_object(
      'target_user_id', p_user_id,
      'old_is_active',  v_old.is_active,
      'new_is_active',  v_new.is_active,
      'reason',         p_reason
    )
  );

  RETURN v_new;
END;
$$;


ALTER FUNCTION "public"."admin_toggle_active"("p_user_id" "uuid", "p_is_active" boolean, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_total_profiles"() RETURNS integer
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ select count(*) from public.profiles; $$;


ALTER FUNCTION "public"."admin_total_profiles"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentors" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "expertise" "text"[],
    "mentoring_experience_years" integer,
    "max_mentees" integer DEFAULT 5,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "mentoring_capacity_hours_per_month" integer,
    "mentoring_preferences" "jsonb",
    "mentoring_statement" "text",
    "mentoring_experience_description" "text",
    CONSTRAINT "mentors_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);

ALTER TABLE ONLY "public"."mentors" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentors" OWNER TO "postgres";


COMMENT ON TABLE "public"."mentors" IS 'Stores mentor profiles and expertise';



CREATE OR REPLACE FUNCTION "public"."admin_update_mentor_status"("p_user_id" "uuid", "p_status" "text") RETURNS "public"."mentors"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_mentor public.mentors;
BEGIN
  -- 1. Only admins or super_admins can run this
  IF NOT public.is_site_admin() THEN
    RAISE EXCEPTION 'Only admins can update mentor status'
      USING ERRCODE = '42501';
  END IF;

  -- 2. Validate input
  IF p_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status
      USING ERRCODE = '22023';
  END IF;

  -- 3. Insert or update mentor row
  INSERT INTO public.mentors AS m (user_id, status)
  VALUES (p_user_id, p_status)
  ON CONFLICT (user_id) DO UPDATE
  SET status = EXCLUDED.status,
      updated_at = now()
  RETURNING * INTO v_mentor;

  -- 4. Your existing trigger (mentorship_on_mentor_status_change)
  --     will automatically run here after the update.
  RETURN v_mentor;
END;
$$;


ALTER FUNCTION "public"."admin_update_mentor_status"("p_user_id" "uuid", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_profile_approval"("p_profile_id" "uuid", "p_decision" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "public"."profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_admin_id   uuid := auth.uid();
  v_old        public.profiles;
  v_new        public.profiles;

  v_new_approval_status   public.profile_approval_status;
  v_new_alumni_status     text;
begin
  -- 1) Ensure caller is an admin / super_admin
  if not public.app_is_admin() then
    raise exception 'Only admins can update profile approval status'
      using errcode = '42501';
  end if;

  -- 2) Load existing profile
  select *
  into v_old
  from public.profiles
  where id = p_profile_id;

  if not found then
    raise exception 'Profile % not found', p_profile_id
      using errcode = 'P0002';
  end if;

  -- 3) Decide new statuses
  if p_decision = 'approve' then
    v_new_approval_status := 'approved';
    v_new_alumni_status   := 'approved';

  elsif p_decision = 'reject' then
    v_new_approval_status := 'rejected';
    v_new_alumni_status   := 'rejected';

  elsif p_decision in ('block','deactivate') then
    v_new_approval_status := v_old.approval_status;
    v_new_alumni_status   := v_old.alumni_verification_status;

  elsif p_decision in ('unblock','reactivate') then
    v_new_approval_status := v_old.approval_status;
    v_new_alumni_status   := v_old.alumni_verification_status;

  else
    raise exception
      'Invalid decision: %, expected approve/reject/block/unblock/reactivate',
      p_decision
      using errcode = '22023';
  end if;

  -- 4) Perform update
  update public.profiles p
  set
    approval_status = v_new_approval_status,
    is_approved     = (v_new_approval_status = 'approved'),
    alumni_verification_status =
      coalesce(v_new_alumni_status, p.alumni_verification_status),

    is_active =
      case
        when p_decision in ('block','deactivate') then false
        when p_decision in ('unblock','reactivate') then true
        else p.is_active
      end,

    approval_reason =
      case
        when p_decision = 'reject' then p_notes
        else p.approval_reason
      end,
    rejection_reason =
      case
        when p_decision = 'reject' then p_notes
        else p.rejection_reason
      end,
    rejected_by =
      case
        when p_decision = 'reject' then v_admin_id
        else p.rejected_by
      end,
    rejection_date =
      case
        when p_decision = 'reject' then now()
        else p.rejection_date
      end,

    verification_notes       = coalesce(p_notes, p.verification_notes),
    verification_reviewed_by = v_admin_id,
    verification_reviewed_at = now()
  where p.id = p_profile_id
  returning * into v_new;

  -- 5) Existing approval audit (kept)
  insert into public.profile_approval_audit (
    profile_id,
    admin_id,
    old_approval_status,
    new_approval_status,
    old_is_approved,
    new_is_approved,
    old_alumni_verification_status,
    new_alumni_verification_status,
    decision,
    notes
  )
  values (
    v_old.id,
    v_admin_id,
    v_old.approval_status,
    v_new.approval_status,
    v_old.is_approved,
    v_new.is_approved,
    v_old.alumni_verification_status,
    v_new.alumni_verification_status,
    p_decision,
    p_notes
  );

  -- 6) New admin_actions log with before/after snapshot
  perform public.admin_log_action(
    v_admin_id,
    'update_profile_approval',
    'profile',
    v_old.id,
    format('Profile approval %s → %s via decision %s',
           v_old.approval_status, v_new.approval_status, p_decision),
    to_jsonb(v_old),
    to_jsonb(v_new),
    p_notes
  );

  return v_new;
end;
$$;


ALTER FUNCTION "public"."admin_update_profile_approval"("p_profile_id" "uuid", "p_decision" "text", "p_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_profile_approval"("p_profile_id" "uuid", "p_decision" "text", "p_notes" "text") IS 'Canonical function for profile approval: approve/reject/block/unblock/reactivate. Writes audit rows and enforces all consistency rules. Use this for any admin-facing user approval action.';



CREATE OR REPLACE FUNCTION "public"."admin_update_user_role"("p_user_id" "uuid", "p_role" "public"."app_role_enum", "p_reason" "text" DEFAULT NULL::"text") RETURNS "public"."profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_admin_id          uuid := auth.uid();
  v_old               public.profiles;
  v_new               public.profiles;
  v_super_admin_count integer;
BEGIN
  -- 1) Ensure caller is admin / super_admin (reuse your existing helper)
  IF NOT public.app_is_admin() THEN
    RAISE EXCEPTION 'Only admins can update user roles'
      USING ERRCODE = '42501';
  END IF;

  -- 2) Load current profile
  SELECT * INTO v_old
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found', p_user_id
      USING ERRCODE = 'P0002';
  END IF;

  -- 3) Last-super-admin safety
  IF v_old.role = 'super_admin'
     AND p_role IS DISTINCT FROM 'super_admin' THEN
    SELECT COUNT(*)
    INTO v_super_admin_count
    FROM public.profiles
    WHERE role = 'super_admin'
      AND COALESCE(is_deleted, false) = false;

    IF v_super_admin_count = 1 THEN
      RAISE EXCEPTION 'Cannot demote the last super_admin'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- 4) Self-demotion safety (no "I kill myself" scenario)
  IF v_admin_id = p_user_id
     AND v_old.role = 'super_admin'
     AND p_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Super_admins cannot remove their own super_admin role'
      USING ERRCODE = 'P0001';
  END IF;

  -- 5) Perform update
  UPDATE public.profiles p
  SET role     = p_role,
      is_admin = (p_role IN ('admin','super_admin'))
  WHERE p.id = p_user_id
  RETURNING * INTO v_new;

  -- 6) Audit to activity_log (generic admin audit table you already have)
  INSERT INTO public.activity_log(
    description,
    activity_type,
    user_id,
    metadata
  )
  VALUES (
    'Admin updated user role',
    'admin_update_user_role',
    v_admin_id,
    jsonb_build_object(
      'target_user_id', p_user_id,
      'old_role',       v_old.role,
      'new_role',       v_new.role,
      'reason',         p_reason
    )
  );

  RETURN v_new;
END;
$$;


ALTER FUNCTION "public"."admin_update_user_role"("p_user_id" "uuid", "p_role" "public"."app_role_enum", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."app_is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ select public.app_is_admin_of(auth.uid()); $$;


ALTER FUNCTION "public"."app_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."app_is_admin_of"("p_user" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    -- A) role stored directly on profiles
    exists (
      select 1
      from public.profiles p
      where p.id = p_user
        and p.role in ('admin','super_admin')
    )
    or
    -- B) role via user_roles bridge
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.profile_id = p_user
        and r.name in ('admin','super_admin')
    );
$$;


ALTER FUNCTION "public"."app_is_admin_of"("p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."app_role_of"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "text"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select coalesce((select p.role::text from public.profiles p where p.id = p_user_id), 'alumni');
$$;


ALTER FUNCTION "public"."app_role_of"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_default_link_to_upcoming_sessions"("p_mentor" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  update public.mentorship_sessions s
     set meeting_url = mp.default_meeting_link
    from public.mentorship_requests r
    join public.mentor_profiles mp on mp.user_id = r.mentor_id
   where r.id = s.mentorship_request_id
     and r.mentor_id = p_mentor
     and s.start_time >= now()
     and coalesce(s.meeting_url, '') = '';
$$;


ALTER FUNCTION "public"."apply_default_link_to_upcoming_sessions"("p_mentor" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_event"("p_event_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- 1) Update the event
  update public.events
  set approval_status = 'approved',
      approved_at = now()
  where id = p_event_id;

  -- 2) Resolve the moderation record
  update public.content_approvals
  set decision = 'approved',
      resolved_at = now(),
      resolved_by = auth.uid()
  where content_type = 'event'
    and content_id = p_event_id
    and resolved_at is null;
end;
$$;


ALTER FUNCTION "public"."approve_event"("p_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_group_member"("p_group_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT public.can_manage_group(p_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  UPDATE public.group_members
  SET status = 'active'
  WHERE group_id = p_group_id
    AND user_id  = p_user_id
    AND status   = 'pending';
END;
$$;


ALTER FUNCTION "public"."approve_group_member"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_job"("p_job_id" "uuid", "p_approved" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role   text;
  v_status public.approval_status;
BEGIN
  -- Only admin/super_admin allowed
  v_role := public.current_role_text();

  IF coalesce(v_role, '') NOT IN ('admin','super_admin') THEN
    RAISE EXCEPTION 'Only admins and super_admins can approve jobs';
  END IF;

  -- Decide the enum state
  v_status := CASE
                WHEN coalesce(p_approved, true)
                  THEN 'approved'::public.approval_status
                ELSE 'pending'::public.approval_status
              END;

  UPDATE public.jobs
  SET is_approved     = coalesce(p_approved, true),
      approval_status = v_status,
      is_rejected     = CASE
                          WHEN coalesce(p_approved, true)
                            THEN false
                          ELSE is_rejected
                        END,
      reviewed_by     = auth.uid(),
      reviewed_at     = now()
  WHERE id = p_job_id;
END;
$$;


ALTER FUNCTION "public"."approve_job"("p_job_id" "uuid", "p_approved" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."are_connected"("a" "uuid", "b" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1 from public.connections c
    where (
      (c.requester_id = a and c.recipient_id = b)
      or (c.requester_id = b and c.recipient_id = a)
    )
    and c.status = 'accepted'
  );
$$;


ALTER FUNCTION "public"."are_connected"("a" "uuid", "b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."are_users_connected"("a" "uuid", "b" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.connections c
    where (
      (c.requester_id = a and c.recipient_id = b)
      or (c.requester_id = b and c.recipient_id = a)
    )
    and c.status in ('accepted','connected')
  );
$$;


ALTER FUNCTION "public"."are_users_connected"("a" "uuid", "b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  role_id_val UUID;
BEGIN
  -- Get role ID with fully qualified column names
  SELECT roles.id INTO role_id_val FROM roles WHERE roles.name = role_name;
  
  -- Check if role exists
  IF role_id_val IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Assign role to user with fully qualified column names
  INSERT INTO user_roles (profile_id, role_id)
  VALUES (profile_uuid, role_id_val)
  ON CONFLICT (profile_id, role_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."assign_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_user_role"("profile_uuid" "uuid", "role_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  role_id UUID;
BEGIN
  -- Get role ID
  SELECT id INTO role_id FROM roles WHERE name = role_name;
  
  -- Check if role exists
  IF role_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Assign role to user
  INSERT INTO user_roles (profile_id, role_id)
  VALUES (profile_uuid, role_id)
  ON CONFLICT (profile_id, role_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."assign_user_role"("profile_uuid" "uuid", "role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."attach_user_to_batch_group"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_year int;
  v_dept text;
  v_group_name text;
  v_norm text;
  v_group_id uuid;
begin
  -- Pull data from profiles
  select graduation_year, department
    into v_year, v_dept
  from public.profiles
  where id = p_user_id;

  if v_year is null or v_dept is null then
    return; -- nothing to attach
  end if;

  v_group_name := 'Batch ' || v_year::text || ' - ' || v_dept;
  v_norm := lower(regexp_replace(btrim(v_group_name), '\s+',' ', 'g'));

  -- Prevent races on same group key during concurrent approvals
  perform pg_advisory_xact_lock(hashtext(v_norm));

  -- Try to find existing active group first
  select g.id into v_group_id
  from public.groups g
  where g.name_norm = v_norm and g.is_archived = false
  limit 1;

  -- If missing, insert; if a concurrent insert wins, catch and re-select
  if v_group_id is null then
    begin
      insert into public.groups (name, description, is_private, created_by)
      values (v_group_name, 'Auto-created batch group', false, p_user_id)
      returning id into v_group_id;
    exception when unique_violation then
      select g.id into v_group_id
      from public.groups g
      where g.name_norm = v_norm and g.is_archived = false
      limit 1;
    end;
  end if;

  -- Ensure membership
  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, p_user_id, 'member')
  on conflict (group_id, user_id) do nothing;
end
$$;


ALTER FUNCTION "public"."attach_user_to_batch_group"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_assign_batch_group_for_profile"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_grad_year int;
  v_dept text;
  v_group_id uuid;
BEGIN
  SELECT graduation_year, department INTO v_grad_year, v_dept
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_grad_year IS NULL THEN
    RETURN;
  END IF;

  -- Try names in common patterns
  SELECT id INTO v_group_id FROM public.groups
  WHERE is_approved = true AND (
    name = format('Batch %s %s', v_grad_year::text, COALESCE(v_dept, '')) OR
    name = format('%s %s', COALESCE(v_dept, ''), v_grad_year::text) OR
    name = format('Batch %s', v_grad_year::text)
  )
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_group_id IS NULL THEN
    RETURN; -- No matching group; do nothing (no implicit group creation)
  END IF;

  -- Insert membership if not exists
  INSERT INTO public.group_members (group_id, user_id)
  SELECT v_group_id, p_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = v_group_id AND gm.user_id = p_user_id
  );
END;
$$;


ALTER FUNCTION "public"."auto_assign_batch_group_for_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_assign_batch_group_for_profile_trg"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- call your existing helper with the current row's id
  PERFORM public.auto_assign_batch_group_for_profile(NEW.id);
  RETURN NEW;  -- for AFTER triggers the return value is ignored, but RETURN NEW is conventional
END;
$$;


ALTER FUNCTION "public"."auto_assign_batch_group_for_profile_trg"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_confirm_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Set the email_confirmed_at timestamp to now for new users
  UPDATE auth.users 
  SET email_confirmed_at = NOW() 
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_confirm_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_conversation_on_match"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM public.create_conversation_for_mentorship(NEW.mentor_id, NEW.mentee_id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_conversation_on_match"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."backfill_profile_emails"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Copy email from auth.users into profiles.email where missing
  update public.profiles p
  set email = u.email
  from auth.users u
  where p.id = u.id
    and (p.email is null or p.email = '');
end;
$$;


ALTER FUNCTION "public"."backfill_profile_emails"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."block_applications_for_quick_link"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare app_url text;
begin
  select public.coalesce_application_url(j.apply_url, j.application_url, j.external_url)
  into app_url
  from public.jobs j
  where j.id = new.job_id;

  if public.is_valid_application_target(app_url) then
    raise exception 'This job is a Quick-Link job; applications must be submitted externally.';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."block_applications_for_quick_link"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."block_direct_role_updates"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION
      'Direct role updates are forbidden. Use admin_update_user_role() / admin_set_user_role().';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."block_direct_role_updates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bump_conversation_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update conversations
    set last_message_at = new.created_at
  where id = new.thread_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."bump_conversation_last_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_comment_group"("p_group_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    CASE
      WHEN public.is_platform_admin(p_user_id) THEN TRUE     -- super powers
      WHEN public.is_employer(p_user_id)       THEN FALSE    -- employers never comment
      ELSE public.is_member_of_group(p_user_id, p_group_id)  -- must be an active member
    END;
$$;


ALTER FUNCTION "public"."can_comment_group"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_comment_on_post"("p_post_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with base as (
    select p.group_id, g.is_private, public.app_role_of(p_user_id) as role
    from public.group_posts p
    join public.groups g on g.id = p.group_id
    where p.id = p_post_id
  )
  select
    (select role <> 'employer' from base) and
    case
      when (select is_private from base)
        then public.is_member_of_group(p_user_id, (select group_id from base))
      else (select role in ('admin','super_admin','alumni') from base)
    end;
$$;


ALTER FUNCTION "public"."can_comment_on_post"("p_post_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_employer_view_profile"("p_target_id" "uuid", "p_user" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.job_applications ja
    join public.jobs j on j.id = ja.job_id
    where ja.applicant_id = p_target_id
      and public.job_is_owned_by_user(ja.job_id, p_user)
  );
$$;


ALTER FUNCTION "public"."can_employer_view_profile"("p_target_id" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_manage_group"("p_group_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select public.is_admin_like(p_user_id)
         or exists (
           select 1
           from public.group_members m
           where m.group_id = p_group_id
             and m.user_id  = p_user_id
             and m.status   = 'active'
             and m.role in ('owner','admin')
         );
$$;


ALTER FUNCTION "public"."can_manage_group"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_post_group"("p_group_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select case
    when public.is_platform_admin(p_user_id) then true
    when public.is_employer(p_user_id)       then false
    when exists (
      select 1 from public.groups g
      where g.id = p_group_id
        and coalesce(g.is_archived,false)=false
        and coalesce(g.is_admin_only_posts,false)=true
    ) then public.is_group_admin(p_group_id, p_user_id)       -- admin-only mode
    else public.is_member_of_group(p_group_id, p_user_id)     -- normal mode: any member
  end;
$$;


ALTER FUNCTION "public"."can_post_group"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_read_group"("p_group_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select public.app_role_of(p_user_id) <> 'employer'
         and ( (select not g.is_private from public.groups g where g.id = p_group_id)
               or public.is_member_of_group(p_user_id, p_group_id) );
$$;


ALTER FUNCTION "public"."can_read_group"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_read_post"("p_post_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select public.can_read_group(p.group_id, p_user_id)
  from public.group_posts p
  where p.id = p_post_id;
$$;


ALTER FUNCTION "public"."can_read_post"("p_post_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_read_resume"("p_path" "text") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE
      (
        a.resume_path = p_path
        OR a.resume_url = p_path
      )
      AND (
        a.applicant_id = auth.uid()
        OR j.created_by = auth.uid()
        OR j.posted_by  = auth.uid()
        OR COALESCE(
             NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
             'alumni'
           ) IN ('admin','super_admin')
      )
  );
$$;


ALTER FUNCTION "public"."can_read_resume"("p_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_submit_event_feedback"("p_event_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select
    (exists (
      select 1
      from public.events e
      where e.id = p_event_id
        and now() >= coalesce(e.end_at, e.end_date)
    ))
    and exists (
      select 1 from public.event_rsvps r
      where r.event_id = p_event_id and r.user_id = auth.uid()
        and lower(coalesce(r.attendance_status,'')) in ('going','attended','checked_in')
    );
$$;


ALTER FUNCTION "public"."can_submit_event_feedback"("p_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_applications"("_job_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = _job_id
      AND (j.posted_by = auth.uid() OR public.is_admin(auth.uid()))
  );
$$;


ALTER FUNCTION "public"."can_view_applications"("_job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_group"("p_group_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  with g as (select * from public.groups where id = p_group_id)
  select case
    when public.is_platform_admin(p_user_id) then true
    when public.is_employer(p_user_id)       then false
    when exists (select 1 from g where is_private = false and coalesce(is_archived,false)=false and coalesce(is_approved,true)=true) then true
    else public.is_member_of_group(p_group_id, p_user_id)
  end;
$$;


ALTER FUNCTION "public"."can_view_group"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_bookmark_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM job_bookmarks WHERE user_id = NEW.user_id
  ) >= 3 THEN
    RAISE EXCEPTION 'You can only bookmark up to 3 jobs';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_bookmark_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_bookmarked_jobs_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.bookmarked_jobs
    WHERE user_id = NEW.user_id
  ) >= 3 THEN
    RAISE EXCEPTION 'You can only bookmark up to 3 jobs';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_bookmarked_jobs_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_event_completed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_end timestamptz;
begin
  select
    coalesce(e.end_at, e.end_date)  -- your schema has both; end_at preferred
  into v_end
  from public.events e
  where e.id = new.event_id;

  if v_end is null then
    raise exception 'Cannot submit feedback: event % has no end time set', new.event_id;
  end if;

  if now() < v_end then
    raise exception 'Cannot submit feedback: event % has not ended yet (ends at %)', new.event_id, v_end;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."check_event_completed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_permission_bypass_rls"("profile_uuid" "uuid", "permission_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.profile_id = profile_uuid AND p.name = permission_name
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$;


ALTER FUNCTION "public"."check_user_permission_bypass_rls"("profile_uuid" "uuid", "permission_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  has_role BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.profile_id = profile_uuid AND r.name = role_name
  ) INTO has_role;
  
  RETURN has_role;
END;
$$;


ALTER FUNCTION "public"."check_user_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    'alumni'
  );
$$;


ALTER FUNCTION "public"."claim_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."coalesce_application_url"("apply_url" "text", "application_url" "text", "external_url" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select coalesce(nullif(apply_url,''), nullif(application_url,''), nullif(external_url,''));
$$;


ALTER FUNCTION "public"."coalesce_application_url"("apply_url" "text", "application_url" "text", "external_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."companies_set_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."companies_set_created_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."connection_accept"("p_connection_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  update public.connections
  set status = 'accepted', updated_at = now()
  where id = p_connection_id
    and (requester_id = auth.uid() or recipient_id = auth.uid());
  -- triggers on connections will handle dm_threads
end;
$$;


ALTER FUNCTION "public"."connection_accept"("p_connection_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."connections_fill_defaults"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_trigger_context text;
BEGIN
  -- Detect if this insert came from a server-side trigger
  BEGIN
    v_trigger_context := current_setting('myapp.trigger_context', true);
  EXCEPTION
    WHEN others THEN
      v_trigger_context := NULL;
  END;

  -- Skip default-filling logic for server-triggered inserts
  IF v_trigger_context IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Normal client insert logic
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- If requester_id not set, fill it
  IF NEW.requester_id IS NULL THEN
    NEW.requester_id := v_uid;
  END IF;

  -- Default status
  IF NEW.status IS NULL THEN
    NEW.status := 'pending';
  END IF;

  -- Prevent self connection
  IF NEW.requester_id = NEW.recipient_id THEN
    RAISE EXCEPTION 'Cannot connect to yourself';
  END IF;

  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."connections_fill_defaults"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."connections_notify"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Keep it simple: notify with only real columns
  perform pg_notify(
    'connections',
    json_build_object(
      'id',           NEW.id,
      'status',       NEW.status,
      'requester_id', NEW.requester_id,
      'recipient_id', NEW.recipient_id,
      'op',           TG_OP
    )::text
  );
  return NEW;
end
$$;


ALTER FUNCTION "public"."connections_notify"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_super_admins"() RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
  select count(*)::int from public.profiles where role = 'super_admin';
$$;


ALTER FUNCTION "public"."count_super_admins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_connection_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  requester_name text;
  recipient_name text;
begin
  if new.requester_id is null or new.recipient_id is null then
    return new; -- safety; do nothing
  end if;

  select p.full_name into requester_name from public.profiles p where p.id = new.requester_id;
  select p.full_name into recipient_name from public.profiles p where p.id = new.recipient_id;

  -- INSERT: pending request → notify recipient
  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into public.notifications (recipient_id, sender_id, type, title, message, link)
    values (
      new.recipient_id,
      new.requester_id,
      'system',
      'New Connection Request',
      coalesce(requester_name, 'An alumnus') || ' sent you a connection request.',
      '/alumni/' || new.requester_id::text
    );
    return new;
  end if;

  -- UPDATE: accepted/connected → notify requester
  if tg_op = 'UPDATE' and new.status in ('accepted','connected') and new.status is distinct from old.status then
    insert into public.notifications (recipient_id, sender_id, type, title, message, link)
    values (
      new.requester_id,
      new.recipient_id,
      'system',
      'Connection Accepted',
      coalesce(recipient_name, 'The recipient') || ' accepted your connection request.',
      '/alumni/' || new.recipient_id::text
    );
    return new;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."create_connection_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_conversation_for_mentorship"("mentor_uuid" "uuid", "mentee_uuid" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Check if a conversation already exists between them
  SELECT c.id INTO conv_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = mentor_uuid
  JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = mentee_uuid
  LIMIT 1;

  -- If no conversation exists, create one
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO conv_id;

    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES
      (conv_id, mentor_uuid),
      (conv_id, mentee_uuid);
  END IF;

  RETURN conv_id;
END;
$$;


ALTER FUNCTION "public"."create_conversation_for_mentorship"("mentor_uuid" "uuid", "mentee_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_event_with_agenda"("event_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_event_id uuid;
    result jsonb;
BEGIN
    -- First insert the event without the agenda
    INSERT INTO public.events (
        title,
        description,
        start_date,
        end_date,
        location,
        is_virtual,
        creator_id,
        organizer_id,
        is_published,
        created_at,
        updated_at
    ) VALUES (
        event_data->>'title',
        event_data->>'description',
        (event_data->>'start_date')::timestamptz,
        (event_data->>'end_date')::timestamptz,
        event_data->>'location',
        (event_data->>'is_virtual')::boolean,
        (event_data->>'creator_id')::uuid,
        (event_data->>'creator_id')::uuid,
        (event_data->>'is_published')::boolean,
        COALESCE((event_data->>'created_at')::timestamptz, now()),
        now()
    ) RETURNING id INTO new_event_id;

    ----------------------------------------------------------------------
    -- Organizer / creator wiring
    ----------------------------------------------------------------------

    -- Prefer explicit organizer_id if provided; otherwise fall back to creator_id
    IF event_data ? 'organizer_id' AND event_data->>'organizer_id' IS NOT NULL THEN
        UPDATE public.events
        SET organizer_id = (event_data->>'organizer_id')::uuid
        WHERE id = new_event_id;
    ELSIF event_data ? 'creator_id' AND event_data->>'creator_id' IS NOT NULL THEN
        UPDATE public.events
        SET organizer_id = (event_data->>'creator_id')::uuid
        WHERE id = new_event_id;
    END IF;

    -- Keep creator_id aligned if provided
    IF event_data ? 'creator_id' AND event_data->>'creator_id' IS NOT NULL THEN
        UPDATE public.events
        SET creator_id = (event_data->>'creator_id')::uuid
        WHERE id = new_event_id;
    END IF;

    -- Organizer display fields from payload
    IF event_data ? 'organizer_name' AND event_data->>'organizer_name' IS NOT NULL THEN
        UPDATE public.events
        SET organizer_name = event_data->>'organizer_name'
        WHERE id = new_event_id;
    END IF;

    IF event_data ? 'organizer_email' AND event_data->>'organizer_email' IS NOT NULL THEN
        UPDATE public.events
        SET organizer_email = event_data->>'organizer_email'
        WHERE id = new_event_id;
    END IF;

    IF event_data ? 'organizer_phone' AND event_data->>'organizer_phone' IS NOT NULL THEN
        UPDATE public.events
        SET organizer_phone = event_data->>'organizer_phone'
        WHERE id = new_event_id;
    END IF;

    ----------------------------------------------------------------------
    -- Existing optional fields logic (unchanged)
    ----------------------------------------------------------------------

    -- Then update the agenda separately
    IF event_data->>'agenda' IS NOT NULL THEN
        UPDATE public.events 
        SET agenda = event_data->>'agenda'
        WHERE id = new_event_id;
    END IF;
    
    -- Add other optional fields if present
    IF event_data->>'cost' IS NOT NULL THEN
        UPDATE public.events 
        SET cost = event_data->>'cost'
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'sponsors' IS NOT NULL THEN
        UPDATE public.events 
        SET sponsors = event_data->>'sponsors'
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'virtual_meeting_link' IS NOT NULL THEN
        UPDATE public.events 
        SET virtual_meeting_link = event_data->>'virtual_meeting_link'
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'event_type' IS NOT NULL THEN
        UPDATE public.events 
        SET event_type = event_data->>'event_type'
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'max_attendees' IS NOT NULL THEN
        UPDATE public.events 
        SET max_attendees = (event_data->>'max_attendees')::INTEGER
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'registration_deadline' IS NOT NULL THEN
        UPDATE public.events 
        SET registration_deadline = (event_data->>'registration_deadline')::TIMESTAMP WITH TIME ZONE
        WHERE id = new_event_id;
    END IF;
    
    IF event_data->>'image_url' IS NOT NULL THEN
        UPDATE public.events 
        SET featured_image_url = event_data->>'image_url'
        WHERE id = new_event_id;
    END IF;
    
    -- Return the created event
    SELECT row_to_json(e)::jsonb INTO result
    FROM public.events e
    WHERE id = new_event_id;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."create_event_with_agenda"("event_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_group_and_add_admin"("group_name" "text", "group_description" "text" DEFAULT ''::"text", "group_is_private" boolean DEFAULT false, "group_tags" "text"[] DEFAULT '{}'::"text"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_group_id   uuid;
  v_uid        uuid := auth.uid();
  v_role_txt   text := public.current_role_text(v_uid);
  v_visibility public.group_visibility_enum;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- allow alumni/admin/super_admin or any admin-like flag
  if not public.is_admin_like(v_uid)
     and coalesce(v_role_txt,'') not in ('alumni','admin','super_admin')
  then
    raise exception 'Not allowed to create groups';
  end if;

  v_visibility := case when coalesce(group_is_private,false)
                       then 'private'::public.group_visibility_enum
                       else 'public' ::public.group_visibility_enum
                  end;

  insert into public.groups(
    name, description, created_by, is_private, tags, visibility
  )
  values (
    trim(group_name),
    nullif(trim(group_description),''),
    v_uid,
    coalesce(group_is_private,false),
    case when group_tags is null or array_length(group_tags,1) is null
         then null else group_tags end,
    v_visibility
  )
  returning id into v_group_id;

  -- Creator becomes ADMIN; use a status label your schema accepts (most schemas use 'active')
  insert into public.group_members (group_id, user_id, role, status)
  values (v_group_id, v_uid, 'admin', 'active');

  return v_group_id;
end;
$$;


ALTER FUNCTION "public"."create_group_and_add_admin"("group_name" "text", "group_description" "text", "group_is_private" boolean, "group_tags" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_new_event"("event_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "sql"
    AS $$
    SELECT public.create_event_with_agenda(event_data);
$$;


ALTER FUNCTION "public"."create_new_event"("event_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("user_id" "uuid", "notification_title" "text", "notification_message" "text", "notification_link" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN public.create_notification(user_id, notification_title, notification_message, notification_link, 'system');
END
$$;


ALTER FUNCTION "public"."create_notification"("user_id" "uuid", "notification_title" "text", "notification_message" "text", "notification_link" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("target_profile_id" "uuid", "notif_title" "text", "notif_message" "text", "notif_link" "text", "notif_type" "text" DEFAULT 'system'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_type text := replace(btrim(lower(coalesce(notif_type,'system'))),'-','_');
  v_id   uuid;
BEGIN
  IF v_type NOT IN (
    'system','message',
    'event','event_created','event_published','event_updated',
    'job','job_posted','job_approved','job_applied',
    'application','application_status',
    'mentorship','group','connection',
    'resume','alert'
  ) THEN
    v_type := 'system';
  END IF;

  INSERT INTO public.notifications (profile_id, title, message, link, type)
  VALUES (coalesce(target_profile_id, auth.uid()), notif_title, notif_message, notif_link, v_type)
  RETURNING id INTO v_id;

  RETURN v_id;
END
$$;


ALTER FUNCTION "public"."create_notification"("target_profile_id" "uuid", "notif_title" "text", "notif_message" "text", "notif_link" "text", "notif_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("recipient_id" "uuid", "sender_id" "uuid", "event_id" "uuid", "type" "text", "message" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE nid uuid;
BEGIN
  INSERT INTO public.notifications (recipient_id, sender_id, event_id, type, message)
  VALUES (recipient_id, sender_id, event_id, type, message)
  RETURNING id INTO nid;
  RETURN nid;
END$$;


ALTER FUNCTION "public"."create_notification"("recipient_id" "uuid", "sender_id" "uuid", "event_id" "uuid", "type" "text", "message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_body" "text", "p_link" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  insert into public.notifications (recipient_id, type, title, body, link, metadata)
  values (
    p_recipient_id,
    p_type::public.notification_type_enum,
    p_title,
    p_body,
    p_link,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id;
$$;


ALTER FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_body" "text", "p_link" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_or_update_mentor_profile"("p_expertise" "text"[] DEFAULT '{}'::"text"[], "p_mentoring_statement" "text" DEFAULT NULL::"text", "p_max_mentees" integer DEFAULT NULL::integer, "p_availability" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_existing boolean;
  v_row public.mentors;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000';
  END IF;

  SELECT TRUE INTO v_existing FROM public.mentors WHERE user_id = v_uid;

  IF v_existing THEN
    UPDATE public.mentors
       SET expertise          = COALESCE(p_expertise, expertise),
           mentoring_statement= COALESCE(p_mentoring_statement, mentoring_statement),
           max_mentees        = COALESCE(p_max_mentees, max_mentees),
           availability       = COALESCE(p_availability, availability)
     WHERE user_id = v_uid
     RETURNING * INTO v_row;
  ELSE
    INSERT INTO public.mentors (user_id, expertise, mentoring_statement, max_mentees, availability, status)
    VALUES (v_uid, p_expertise, p_mentoring_statement, p_max_mentees, p_availability, 'pending')
    RETURNING * INTO v_row;
  END IF;

  RETURN to_jsonb(v_row);
END
$$;


ALTER FUNCTION "public"."create_or_update_mentor_profile"("p_expertise" "text"[], "p_mentoring_statement" "text", "p_max_mentees" integer, "p_availability" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_relationship_on_accept"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    insert into mentorship_relationships (mentor_id, mentee_id, status, start_date)
    values (new.mentor_id, new.mentee_id, 'active', now())
    on conflict do nothing;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."create_relationship_on_accept"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_role"() RETURNS "public"."app_role_enum"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.claim_role()::public.app_role_enum;
$$;


ALTER FUNCTION "public"."current_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_role_text"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $_$
declare
  v_role text;
  id_col text;
  role_col text;
  has_is_active boolean;
  roles_table_exists boolean;
  sql text;
begin
  -- Does public.roles exist?
  select exists(
    select 1
    from information_schema.tables
    where table_schema='public' and table_name='roles'
  ) into roles_table_exists;

  if roles_table_exists then
    -- Pick the id column: profile_id or user_id
    select case
      when exists(
        select 1 from information_schema.columns
        where table_schema='public' and table_name='roles' and column_name='profile_id'
      ) then 'profile_id'
      when exists(
        select 1 from information_schema.columns
        where table_schema='public' and table_name='roles' and column_name='user_id'
      ) then 'user_id'
      else null
    end into id_col;

    -- Pick the text role column among common variants
    select case
      when exists(select 1 from information_schema.columns where table_schema='public' and table_name='roles' and column_name='role') then 'role'
      when exists(select 1 from information_schema.columns where table_schema='public' and table_name='roles' and column_name='role_name') then 'role_name'
      when exists(select 1 from information_schema.columns where table_schema='public' and table_name='roles' and column_name='role_type') then 'role_type'
      when exists(select 1 from information_schema.columns where table_schema='public' and table_name='roles' and column_name='role_key') then 'role_key'
      when exists(select 1 from information_schema.columns where table_schema='public' and table_name='roles' and column_name='system_role') then 'system_role'
      else null
    end into role_col;

    -- Is there an is_active column?
    select exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='roles' and column_name='is_active'
    ) into has_is_active;

    -- If we found both columns, query roles dynamically
    if id_col is not null and role_col is not null then
      sql := format($q$
        select %1$I::text
        from public.roles
        where %2$I = $1 %3$s
        order by case %1$I
          when 'super_admin' then 1
          when 'admin' then 2
          when 'employer' then 3
          else 99
        end
        limit 1
      $q$,
      role_col, id_col,
      case when has_is_active then 'and coalesce(is_active, true)' else '' end);

      execute sql into v_role using p_user_id;
    end if;
  end if;

  -- Fallback: profiles.role (enum/text) → else 'alumni'
  if v_role is not null then
    return v_role;
  end if;

  return coalesce(
    (select p.role::text from public.profiles p where p.id = p_user_id and p.role is not null),
    'alumni'
  );
end
$_$;


ALTER FUNCTION "public"."current_role_text"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_can_edit_job"("p_job_id" "uuid", "p_user" "uuid") RETURNS TABLE("flag" "text", "result" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select 'matches_posted_by'::text, exists(select 1 from jobs j where j.id = p_job_id and j.posted_by = p_user)
  union all
  select 'matches_user_id', exists(select 1 from jobs j where j.id = p_job_id and j.user_id   = p_user)
  union all
  select 'matches_created_by', exists(select 1 from jobs j where j.id = p_job_id and j.created_by = p_user)
  union all
  select 'is_company_owner', exists(
           select 1 from jobs j join companies c on c.id = j.company_id
           where j.id = p_job_id and c.created_by = p_user)
  union all
  select 'is_admin', exists(select 1 from profiles p where p.id = p_user and p.role in ('admin','super_admin'));
$$;


ALTER FUNCTION "public"."debug_can_edit_job"("p_job_id" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_avatar"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated'
      USING ERRCODE = '28000';
  END IF;

  UPDATE public.profiles
  SET
    avatar_url = NULL,
    avatar_source = NULL,
    avatar_storage_bucket = NULL
  WHERE id = v_user_id;
END;
$$;


ALTER FUNCTION "public"."delete_user_avatar"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deny_employer_directory"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF (SELECT role FROM profiles WHERE id = auth.uid()) = 'employer' THEN
        RAISE EXCEPTION 'Employers cannot access directory';
    END IF;
END;
$$;


ALTER FUNCTION "public"."deny_employer_directory"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "company_name" "text",
    "location" "text",
    "job_type" "text",
    "description" "text",
    "requirements" "text",
    "salary_range" "text",
    "application_url" "text",
    "contact_email" "text",
    "expires_at" timestamp with time zone,
    "posted_by" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "education_required" "text",
    "required_skills" "text",
    "deadline" timestamp with time zone,
    "experience_required" "text",
    "education_level" "text",
    "external_url" "text",
    "industry" "text",
    "application_instructions" "text",
    "user_id" "uuid",
    "is_approved" boolean DEFAULT false,
    "company_id" "uuid",
    "apply_url" "text",
    "is_verified" boolean DEFAULT false NOT NULL,
    "created_by" "uuid",
    "primary_role" "text",
    "approval_status" "public"."approval_status" DEFAULT 'pending'::"public"."approval_status" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "is_rejected" boolean DEFAULT false,
    "rejection_reason" "text",
    "application_deadline" timestamp with time zone,
    "department" "text",
    "experience_level" "text",
    "salary_min" bigint,
    "salary_max" bigint,
    "skills" "text"[],
    "status" "text" DEFAULT 'draft'::"text",
    "open_at" timestamp with time zone,
    "close_at" timestamp with time zone,
    "logo_url" "text",
    "source_type" "text" GENERATED ALWAYS AS (
CASE
    WHEN (COALESCE("apply_url", "application_url", "external_url") IS NOT NULL) THEN 'quick_link'::"text"
    ELSE 'in_app'::"text"
END) STORED,
    CONSTRAINT "chk_jobs_can_open" CHECK ((("status" <> 'open'::"text") OR (("title" IS NOT NULL) AND ("job_type" IS NOT NULL) AND ("location" IS NOT NULL) AND (COALESCE("length"(TRIM(BOTH FROM "description")), 0) > 0) AND (("application_url" IS NOT NULL) OR ("contact_email" IS NOT NULL))))),
    CONSTRAINT "chk_jobs_ready_when_active" CHECK ((("status" <> 'active'::"text") OR (((COALESCE(NULLIF("btrim"("application_url"), ''::"text"), NULLIF("btrim"("external_url"), ''::"text")) IS NOT NULL) AND ("application_deadline" IS NOT NULL) AND (COALESCE("length"("btrim"("title")), 0) > 0)) OR ((COALESCE("length"("btrim"("title")), 0) > 0) AND (COALESCE("length"("btrim"("job_type")), 0) > 0) AND (COALESCE("length"("btrim"("location")), 0) > 0) AND (COALESCE("length"("btrim"("description")), 0) > 0) AND (("contact_email" IS NOT NULL) OR ("apply_url" IS NOT NULL)))))),
    CONSTRAINT "jobs_application_url_check" CHECK ((("application_url" IS NULL) OR ("application_url" ~* '^(https://|mailto:)'::"text"))),
    CONSTRAINT "jobs_application_url_valid" CHECK ((("application_url" IS NULL) OR ("application_url" ~* '^(https://|mailto:)'::"text"))),
    CONSTRAINT "jobs_external_target_at_most_one" CHECK (((((("apply_url" IS NOT NULL))::integer + (("application_url" IS NOT NULL))::integer) + (("external_url" IS NOT NULL))::integer) <= 1)),
    CONSTRAINT "jobs_salary_max_nonneg" CHECK ((("salary_max" IS NULL) OR ("salary_max" >= 0))),
    CONSTRAINT "jobs_salary_min_le_max" CHECK ((("salary_min" IS NULL) OR ("salary_max" IS NULL) OR ("salary_min" <= "salary_max"))),
    CONSTRAINT "jobs_salary_min_nonneg" CHECK ((("salary_min" IS NULL) OR ("salary_min" >= 0))),
    CONSTRAINT "jobs_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'closed'::"text", 'draft'::"text"]))),
    CONSTRAINT "valid_status" CHECK (("is_active" = ANY (ARRAY[true, false])))
);

ALTER TABLE ONLY "public"."jobs" REPLICA IDENTITY FULL;

ALTER TABLE ONLY "public"."jobs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."jobs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."jobs"."is_rejected" IS 'Flag to mark a job post as rejected by an admin.';



COMMENT ON COLUMN "public"."jobs"."rejection_reason" IS 'Reason provided by the admin for rejecting a job post.';



CREATE OR REPLACE FUNCTION "public"."derive_job_state"("j" "public"."jobs") RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    CASE
      -- Rejected always wins
      WHEN j.is_rejected IS TRUE
        OR j.approval_status = 'rejected'
        THEN 'rejected'

      -- Draft (not yet submitted)
      WHEN j.status = 'draft'
        AND COALESCE(j.is_active, FALSE) = FALSE
        AND COALESCE(j.is_approved, FALSE) = FALSE
        THEN 'draft'

      -- Pending Review
      WHEN j.approval_status = 'pending'
        AND COALESCE(j.is_approved, FALSE) = FALSE
        AND COALESCE(j.is_rejected, FALSE) = FALSE
        THEN 'pending_review'

      -- Approved but not yet open (scheduled)
      WHEN j.approval_status = 'approved'
        AND COALESCE(j.is_approved, TRUE) = TRUE
        AND COALESCE(j.is_active, TRUE) = TRUE
        AND j.open_at IS NOT NULL
        AND j.open_at > now()
        THEN 'approved_scheduled'

      -- Closed due to time (expired)
      WHEN j.approval_status = 'approved'
        AND COALESCE(j.is_approved, TRUE) = TRUE
        AND (
          COALESCE(j.close_at, j.deadline, j.application_deadline, j.expires_at) < now()
        )
        THEN 'expired'

      -- Explicitly closed/filled
      WHEN j.status = 'closed'
        OR COALESCE(j.is_active, TRUE) = FALSE
        THEN 'closed_filled'

      -- Live (default success state)
      WHEN j.approval_status = 'approved'
        AND COALESCE(j.is_approved, TRUE) = TRUE
        AND COALESCE(j.is_active, TRUE) = TRUE
        THEN 'live'

      -- Fallback
      ELSE 'unknown'
    END;
$$;


ALTER FUNCTION "public"."derive_job_state"("j" "public"."jobs") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dm_get_or_create_thread"("u1" "uuid", "u2" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare a uuid; b uuid; tid uuid;
begin
  if u1 is null or u2 is null then
    raise exception 'Both participants required';
  end if;
  if u1 = u2 then
    raise exception 'Cannot start a thread with yourself';
  end if;

  a := least(u1,u2);
  b := greatest(u1,u2);

  select id into tid
  from public.dm_threads
  where user_a = a and user_b = b
  limit 1;

  if tid is null then
    insert into public.dm_threads (user_a, user_b) values (a, b)
    returning id into tid;
  end if;

  -- Ensure membership rows (required by send_dm_message)
  insert into public.dm_participants(thread_id, user_id)
  values (tid, a), (tid, b)
  on conflict (thread_id, user_id) do nothing;

  return tid;
end$$;


ALTER FUNCTION "public"."dm_get_or_create_thread"("u1" "uuid", "u2" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dm_get_or_create_thread_with"("peer_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.dm_get_or_create_thread(auth.uid(), peer_id)
$$;


ALTER FUNCTION "public"."dm_get_or_create_thread_with"("peer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dm_mark_thread_read"("p_thread_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  update dm_messages
     set read_at = now()
   where thread_id = p_thread_id
     and sender_id <> p_user_id
     and read_at is null;
$$;


ALTER FUNCTION "public"."dm_mark_thread_read"("p_thread_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dm_threads_insert_participants"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.dm_participants(thread_id, user_id)
  values (new.id, new.user_a), (new.id, new.user_b)
  on conflict (thread_id, user_id) do nothing;
  return new;
end$$;


ALTER FUNCTION "public"."dm_threads_insert_participants"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dm_threads_touch_after_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  update public.dm_threads t
     set last_message_at = new.created_at,
         last_message_excerpt = left(coalesce(new.body,''), 180)
   where t.id = new.thread_id;
  return null;
end$$;


ALTER FUNCTION "public"."dm_threads_touch_after_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."drop_all_policies"("target_table" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = target_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, target_table);
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."drop_all_policies"("target_table" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."echo_test"("p_text" "text") RETURNS "text"
    LANGUAGE "sql"
    AS $$ SELECT p_text $$;


ALTER FUNCTION "public"."echo_test"("p_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_admin_moderation_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT (role IN ('admin','super_admin')) INTO is_admin
  FROM public.profiles WHERE id = auth.uid();

  IF NOT COALESCE(is_admin,false) THEN
    IF NEW.is_approved     IS DISTINCT FROM OLD.is_approved
       OR NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
      RAISE EXCEPTION 'Only admins can change moderation fields';
    END IF;
  END IF;

  RETURN NEW;
END $$;


ALTER FUNCTION "public"."enforce_admin_moderation_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_at_least_one_admin"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_admins integer;
  v_gid    uuid;
BEGIN
  -- Determine the affected group_id
  IF TG_OP = 'DELETE' THEN
    v_gid := OLD.group_id;
  ELSE
    v_gid := NEW.group_id;
  END IF;

  -- Count active admins/owners
  SELECT count(*) INTO v_admins
  FROM public.group_members
  WHERE group_id = v_gid
    AND status   = 'active'
    AND role IN ('owner','admin');

  IF v_admins = 0 THEN
    RAISE EXCEPTION 'At least one admin must remain in each group';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."enforce_at_least_one_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_at_least_one_admin_deferred"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_admins integer;
BEGIN
  SELECT count(*) INTO v_admins
  FROM public.group_members
  WHERE group_id = NEW.group_id
    AND status   = 'active'
    AND role IN ('owner','admin');

  IF v_admins = 0 THEN
    RAISE EXCEPTION 'At least one admin must remain in each group';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_at_least_one_admin_deferred"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_avatar_upload_rate"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.avatar_upload_log
  WHERE user_id = p_user_id
    AND uploaded_at > now() - interval '1 hour';

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Too many avatar uploads. Please wait before trying again.'
      USING ERRCODE = '42901'; -- custom / generic code
  END IF;
END;
$$;


ALTER FUNCTION "public"."enforce_avatar_upload_rate"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_feedback_after_end"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if now() <= (select end_date from public.events where id = new.event_id) then
    raise exception 'Feedback allowed only after the event ends';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_feedback_after_end"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_job_admin_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_role text;
BEGIN
  -- Get the user's effective role based on auth.uid()
  v_role := public.current_role_text();

  -- Only 'admin' and 'super_admin' can change approval/review fields
  IF coalesce(v_role, '') NOT IN ('admin', 'super_admin') THEN
    IF (TG_OP = 'UPDATE') THEN
      IF (NEW.is_approved       IS DISTINCT FROM OLD.is_approved)
      OR (NEW.approval_status   IS DISTINCT FROM OLD.approval_status)
      OR (NEW.reviewed_by       IS DISTINCT FROM OLD.reviewed_by)
      OR (NEW.reviewed_at       IS DISTINCT FROM OLD.reviewed_at)
      OR (NEW.is_rejected       IS DISTINCT FROM OLD.is_rejected)
      OR (NEW.rejection_reason  IS DISTINCT FROM OLD.rejection_reason)
      OR (NEW.is_verified       IS DISTINCT FROM OLD.is_verified)
      THEN
        RAISE EXCEPTION 'Only admins and super_admins can modify approval/review columns on jobs';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_job_admin_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_requester_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Allow both mentee (requester) and mentor to update
  if tg_op = 'UPDATE' then
    if auth.uid() <> new.requester_id
       and auth.uid() <> new.mentor_id
       and not is_admin(auth.uid()) then
      raise exception 'Unauthorized mentorship request update';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."enforce_requester_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_notification_event"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_idempotency_key" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  IF p_recipient_id IS NULL THEN
    RAISE EXCEPTION 'Recipient cannot be NULL' USING ERRCODE = '23502';
  END IF;

  -- Idempotency guard
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_notification_id
    FROM public.notification_events
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN v_notification_id;
    END IF;
  END IF;

  -- Insert into notification_events (audit trail)
  INSERT INTO public.notification_events(
    recipient_id,
    event_type,
    title,
    message,
    link,
    metadata,
    idempotency_key
  )
  VALUES (
    p_recipient_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_metadata,
    p_idempotency_key
  )
  RETURNING id INTO v_notification_id;

  -- Also insert into main notifications table
  INSERT INTO public.notifications(
    id,
    recipient_id,
    type,
    title,
    message,
    link,
    metadata,
    is_read,
    created_at
  )
  VALUES (
    v_notification_id,
    p_recipient_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_metadata,
    false,
    now()
  );

  RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."enqueue_notification_event"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb", "p_idempotency_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_notification_event"("p_event_type" "public"."notification_type_enum", "p_module" "public"."notification_module", "p_actor_profile_id" "uuid", "p_entity_table" "text", "p_entity_id" "uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_idempotency_key" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_actor_profile_id IS NULL THEN
    RAISE EXCEPTION 'Actor profile ID is required';
  END IF;

  -- Optional idempotency: if a row with same key exists, return it
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_id
    FROM public.notification_events
    WHERE idempotency_key = p_idempotency_key;

    IF v_id IS NOT NULL THEN
      RETURN v_id;
    END IF;
  END IF;

  INSERT INTO public.notification_events (
    event_type,
    module,
    actor_profile_id,
    entity_table,
    entity_id,
    metadata,
    idempotency_key
  ) VALUES (
    p_event_type,
    p_module,
    p_actor_profile_id,
    lower(p_entity_table),
    p_entity_id,
    COALESCE(p_metadata, '{}'::jsonb),
    p_idempotency_key
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."enqueue_notification_event"("p_event_type" "public"."notification_type_enum", "p_module" "public"."notification_module", "p_actor_profile_id" "uuid", "p_entity_table" "text", "p_entity_id" "uuid", "p_metadata" "jsonb", "p_idempotency_key" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."enqueue_notification_event"("p_event_type" "public"."notification_type_enum", "p_module" "public"."notification_module", "p_actor_profile_id" "uuid", "p_entity_table" "text", "p_entity_id" "uuid", "p_metadata" "jsonb", "p_idempotency_key" "text") IS 'Modules call this when something notification-worthy happens. Fan-out happens separately.';



CREATE OR REPLACE FUNCTION "public"."enqueue_user_hard_delete"("target_user_id" "uuid", "reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = caller_id
      AND (p.is_admin = true OR p.role IN ('admin','super_admin'))
  ) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE='42501';
  END IF;

  INSERT INTO public.deletion_queue (user_id, reason)
  VALUES (target_user_id, reason);

  INSERT INTO public.admin_actions (admin_id, action_type, target_type, target_id, description)
  VALUES (caller_id, 'enqueue_hard_delete', 'user', target_user_id, COALESCE(reason, 'Enqueue hard delete'));

  RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."enqueue_user_hard_delete"("target_user_id" "uuid", "reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_connection_on_mentorship_accept"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.status = 'accepted' and (old.status is distinct from new.status) then
    insert into connections (requester_id, recipient_id, status, updated_at)
    values (new.mentee_id, new.mentor_id, 'accepted', now())
    on conflict (requester_id, recipient_id) do update
      set status = 'accepted', updated_at = now();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."ensure_connection_on_mentorship_accept"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_dm_thread_for_mentorship"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_thread uuid;
BEGIN
  -- We only act when both sides are present
  IF NEW.mentor_id IS NULL OR NEW.mentee_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- If already linked, no work
  IF NEW.dm_thread_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Create or reuse a DM thread for this mentor/mentee pair
  v_thread := public.dm_get_or_create_thread(NEW.mentor_id, NEW.mentee_id);

  NEW.dm_thread_id := v_thread;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_dm_thread_for_mentorship"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_dm_thread_with"("p_other" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_me     uuid := auth.uid();
  v_thread uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  v_thread := public.get_or_create_dm_thread(v_me, p_other);

  INSERT INTO public.dm_participants(thread_id, user_id)
  VALUES (v_thread, v_me)
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  INSERT INTO public.dm_participants(thread_id, user_id)
  VALUES (v_thread, p_other)
  ON CONFLICT (thread_id, user_id) DO NOTHING;

  RETURN v_thread;
END;
$$;


ALTER FUNCTION "public"."ensure_dm_thread_with"("p_other" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_dm_thread_with"("p_other_user_id" "uuid", "p_context_type" "text", "p_context_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_thread_id uuid;
BEGIN
  -- Reuse the existing 1-arg helper that knows how to
  -- find/create a DM thread between the current user and p_other_user_id.
  v_thread_id := public.ensure_dm_thread_with(p_other_user_id);

  -- For now we ignore p_context_type / p_context_id.
  -- Later, if you add columns on dm_threads, you can store them here.

  RETURN v_thread_id;
END;
$$;


ALTER FUNCTION "public"."ensure_dm_thread_with"("p_other_user_id" "uuid", "p_context_type" "text", "p_context_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_employer_company"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_company_id uuid;
  v_name text;
  v_logo text;
begin
  select
    coalesce(p.company_name, 'My Company'),
    p.logo_url
  into v_name, v_logo
  from public.profiles p
  where p.id = auth.uid();

  select id
  into v_company_id
  from public.companies
  where created_by = auth.uid()
  order by created_at
  limit 1;

  if v_company_id is null then
    insert into public.companies(name, logo_url, created_by)
    values (coalesce(v_name, 'My Company'), v_logo, auth.uid())
    returning id into v_company_id;
  else
    if v_logo is not null and btrim(v_logo) <> '' then
      update public.companies
         set logo_url = coalesce(logo_url, v_logo)
       where id = v_company_id;
    end if;
  end if;

  return v_company_id;
end
$$;


ALTER FUNCTION "public"."ensure_employer_company"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_jsonb_array_from_text"("input" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
declare
  v jsonb;
begin
  if input is null or btrim(input) = '' then
    return '[]'::jsonb;
  end if;

  -- Try parse as JSON first
  begin
    v := input::jsonb;
  exception when others then
    -- Fallback: split comma-separated text into array
    v := to_jsonb(regexp_split_to_array(input, '\s*,\s*'));
  end;

  if jsonb_typeof(v) <> 'array' then
    v := jsonb_build_array(v);
  end if;
  return v;
end
$$;


ALTER FUNCTION "public"."ensure_jsonb_array_from_text"("input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_profile_for_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    split_part(
      coalesce(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'display_name',
        NEW.email
      ),
      ' ',
      1
    ),
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_profile_for_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_thread_for_connection"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (
       (TG_OP = 'INSERT' AND NEW.status IN ('accepted','connected'))
       OR
       (TG_OP = 'UPDATE'
        AND NEW.status IN ('accepted','connected')
        AND (OLD.status IS DISTINCT FROM NEW.status))
     )
  THEN
    INSERT INTO public.dm_threads (user_a, user_b)
    VALUES (
      LEAST(NEW.requester_id, NEW.recipient_id),
      GREATEST(NEW.requester_id, NEW.recipient_id)
    )
    ON CONFLICT (user_a, user_b) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_thread_for_connection"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."event_changes_broadcast"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  ev_id uuid := COALESCE(NEW.id, OLD.id);
  gid   uuid;
  topic text;
BEGIN
  FOR gid IN
    SELECT eg.group_id FROM public.event_groups eg WHERE eg.event_id = ev_id
  LOOP
    topic := 'group:' || gid::text;
    PERFORM pg_notify(
      'event_updates',
      json_build_object('topic', topic, 'op', TG_OP, 'event_id', ev_id)::text
    );
  END LOOP;

  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."event_changes_broadcast"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."events_set_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.created_by := OLD.created_by; -- lock ownership
  END IF;
  RETURN NEW;
END$$;


ALTER FUNCTION "public"."events_set_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fc_assert_not_employer_for_directory"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (SELECT role FROM profiles WHERE id = auth.uid()) = 'employer' THEN
    RAISE EXCEPTION 'Employers cannot access the directory';
  END IF;
END;
$$;


ALTER FUNCTION "public"."fc_assert_not_employer_for_directory"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fc_has_applied_to_job"("p_job_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.job_applications ja
    where ja.job_id = p_job_id
      and ja.applicant_id = coalesce(p_user_id, auth.uid())
  );
$$;


ALTER FUNCTION "public"."fc_has_applied_to_job"("p_job_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fc_is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(public.app_is_admin(), false);
$$;


ALTER FUNCTION "public"."fc_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fc_is_admin"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(public.app_is_admin_of(p_user_id), false);
$$;


ALTER FUNCTION "public"."fc_is_admin"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fc_is_employer"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ select public.current_role_text() = 'employer'; $$;


ALTER FUNCTION "public"."fc_is_employer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fc_is_employer_approved"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = COALESCE(p_user_id, auth.uid())
      AND p.role = 'employer'
      AND p.approval_status = 'approved'
  );
$$;


ALTER FUNCTION "public"."fc_is_employer_approved"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fc_is_fully_approved"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = COALESCE(p_user_id, auth.uid())
      -- core approval
      AND p.approval_status = 'approved'
      -- safety flags
      AND COALESCE(p.is_deleted, false) = false
      AND COALESCE(p.is_active,  true)  = true
      -- profile completeness (degree + department always required)
      AND p.degree_code IS NOT NULL
      AND p.department_id IS NOT NULL
      -- graduation requirement, role-aware:
      AND (
        -- Alumni: allow graduation_year OR expected_graduation_year
        (p.role = 'alumni'::public.app_role_enum
         AND (p.graduation_year IS NOT NULL OR p.expected_graduation_year IS NOT NULL))
        -- Students: still require expected_graduation_year
        OR (p.role = 'student'::public.app_role_enum
            AND p.expected_graduation_year IS NOT NULL)
        -- Other roles: no extra graduation-year requirement
        OR (p.role NOT IN ('alumni'::public.app_role_enum, 'student'::public.app_role_enum))
      )
  );
$$;


ALTER FUNCTION "public"."fc_is_fully_approved"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fc_is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT public.is_site_admin();
$$;


ALTER FUNCTION "public"."fc_is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fc_is_super_admin"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT public.is_super_admin(p_user_id);
$$;


ALTER FUNCTION "public"."fc_is_super_admin"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_or_create_conversation"("other_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_conversation_id UUID;
  v_current_user_id UUID := auth.uid();
BEGIN
  IF v_current_user_id = other_user_id THEN
    RETURN NULL;
  END IF;

  SELECT cp1.conversation_id INTO v_conversation_id
  FROM conversation_participants AS cp1
  JOIN conversation_participants AS cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_current_user_id AND cp2.user_id = other_user_id
  AND (
    SELECT COUNT(*)
    FROM conversation_participants
    WHERE conversation_id = cp1.conversation_id
  ) = 2
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO conversations DEFAULT VALUES
  RETURNING id INTO v_conversation_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, v_current_user_id), (v_conversation_id, other_user_id);

  RETURN v_conversation_id;
END;
$$;


ALTER FUNCTION "public"."find_or_create_conversation"("other_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."format_inr"("val" bigint) RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE s text := val::text; res text;
BEGIN
  IF val IS NULL THEN RETURN NULL; END IF;
  IF length(s) <= 3 THEN RETURN s; END IF;
  res := right(s, 3); s := left(s, length(s) - 3);
  WHILE length(s) > 2 LOOP
    res := right(s, 2) || ',' || res;
    s := left(s, length(s) - 2);
  END LOOP;
  IF length(s) > 0 THEN res := s || ',' || res; END IF;
  RETURN res;
END;
$$;


ALTER FUNCTION "public"."format_inr"("val" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_analytics_summary"("p_period" "text" DEFAULT '30d'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_is_admin boolean;
  v_period_start timestamptz;
  v_result jsonb;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Explicit admin check against profiles.role enum
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_admin_id
      AND p.role IN ('admin','super_admin')
      AND COALESCE(p.is_deleted, false) = false
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- Period window
  v_period_start := CASE p_period
    WHEN '7d'  THEN now() - interval '7 days'
    WHEN '30d' THEN now() - interval '30 days'
    WHEN '90d' THEN now() - interval '90 days'
    WHEN '1y'  THEN now() - interval '1 year'
    ELSE now() - interval '30 days'
  END;

  -- Log the call (no PII in parameters)
  INSERT INTO public.admin_analytics_audit_log (admin_id, function_name, parameters)
  VALUES (v_admin_id, 'get_admin_analytics_summary', jsonb_build_object('period', p_period));

  -- Build analytics JSON
  v_result := jsonb_build_object(
    'period', p_period,
    'generated_at', now(),

    'users', jsonb_build_object(
      'total_profiles', (
        SELECT count(*)::int FROM public.profiles p
        WHERE COALESCE(p.is_deleted, false) = false
      ),
      'approved_alumni', (
        SELECT count(*)::int FROM public.profiles p
        WHERE p.role = 'alumni'
          AND p.approval_status = 'approved'
          AND COALESCE(p.is_deleted, false) = false
      ),
      'approved_students', (
        SELECT count(*)::int FROM public.profiles p
        WHERE p.role = 'student'
          AND p.approval_status = 'approved'
          AND COALESCE(p.is_deleted, false) = false
      ),
      'approved_employers', (
        SELECT count(*)::int FROM public.profiles p
        WHERE p.role = 'employer'
          AND p.approval_status = 'approved'
          AND COALESCE(p.is_deleted, false) = false
      ),
      'pending_approvals', (
        SELECT count(*)::int FROM public.profiles p
        WHERE p.approval_status = 'pending'
          AND COALESCE(p.is_deleted, false) = false
      ),
      'active_users_period', (
        SELECT count(DISTINCT l.user_id)::int
        FROM public.user_activity_logs l
        WHERE l.created_at >= v_period_start
      )
    ),

    'events', jsonb_build_object(
      'total_events', (SELECT count(*)::int FROM public.events),
      'upcoming_events', (
        SELECT count(*)::int
        FROM public.events e
        WHERE e.start_date >= CURRENT_DATE
          AND e.is_published = true
      ),
      'total_rsvps', (SELECT count(*)::int FROM public.event_attendees),
      'rsvps_period', (
        SELECT count(*)::int
        FROM public.event_attendees ea
        WHERE ea.created_at >= v_period_start
      )
    ),

    'jobs', jsonb_build_object(
      'total_jobs', (SELECT count(*)::int FROM public.jobs),
      'active_jobs', (
        SELECT count(*)::int
        FROM public.jobs j
        WHERE j.is_active = true
          AND j.is_approved = true
      ),
      'total_applications', (SELECT count(*)::int FROM public.job_applications),
      'applications_period', (
        SELECT count(*)::int
        FROM public.job_applications ja
        WHERE ja.created_at >= v_period_start
      )
    ),

    'networking', jsonb_build_object(
      'total_connections', (
        SELECT count(*)::int
        FROM public.connections c
        WHERE c.status = 'accepted'
      ),
      'total_groups', (
        SELECT count(*)::int
        FROM public.groups g
        WHERE g.is_approved = true
      ),
      'total_group_members', (SELECT count(*)::int FROM public.group_members)
    ),

    'mentorship', jsonb_build_object(
      'active_mentorships', (
        SELECT count(*)::int
        FROM public.mentorships m
        WHERE m.status = 'accepted'
      ),
      'pending_requests', (
        SELECT count(*)::int
        FROM public.mentorship_requests mr
        WHERE mr.status = 'pending'
      )
    ),

    'messaging', jsonb_build_object(
      'total_messages', (SELECT count(*)::int FROM public.messages),
      'messages_period', (
        SELECT count(*)::int
        FROM public.messages m
        WHERE m.created_at >= v_period_start
      )
    )
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_admin_analytics_summary"("p_period" "text") OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_profile_metrics" AS
 WITH "base" AS (
         SELECT "p"."id",
            "p"."role",
            "p"."approval_status",
            COALESCE("p"."is_deleted", false) AS "is_deleted",
            COALESCE("p"."is_active", true) AS "is_active",
            COALESCE("p"."show_in_directory", true) AS "show_in_directory",
            ("p"."role" = 'employer'::"public"."app_role_enum") AS "is_employer"
           FROM "public"."profiles" "p"
        )
 SELECT ( SELECT "count"(*) AS "count"
           FROM "base") AS "total_profiles",
    ( SELECT "count"(*) AS "count"
           FROM "base"
          WHERE (("base"."approval_status" = 'approved'::"public"."profile_approval_status") AND ("base"."is_active" = true) AND ("base"."is_deleted" = false) AND ("base"."show_in_directory" = true) AND ("base"."is_employer" = false) AND ("base"."role" <> 'student'::"public"."app_role_enum"))) AS "approved_visible_alumni",
    ( SELECT "count"(*) AS "count"
           FROM "base"
          WHERE (("base"."approval_status" = 'approved'::"public"."profile_approval_status") AND ("base"."is_active" = true) AND ("base"."is_deleted" = false) AND ("base"."show_in_directory" = true) AND ("base"."role" = 'student'::"public"."app_role_enum"))) AS "approved_visible_students",
    ( SELECT "count"(*) AS "count"
           FROM "base"
          WHERE (("base"."approval_status" = 'approved'::"public"."profile_approval_status") AND ("base"."is_active" = true) AND ("base"."is_deleted" = false) AND ("base"."is_employer" = true))) AS "approved_employers",
    ( SELECT "count"(*) AS "count"
           FROM "base"
          WHERE ("base"."approval_status" = 'pending'::"public"."profile_approval_status")) AS "pending_profiles",
    ( SELECT "count"(*) AS "count"
           FROM "base"
          WHERE ("base"."approval_status" = 'rejected'::"public"."profile_approval_status")) AS "rejected_profiles",
    ( SELECT "count"(*) AS "count"
           FROM "base"
          WHERE (("base"."show_in_directory" = false) AND ("base"."is_deleted" = false))) AS "hidden_profiles",
    ( SELECT "count"(*) AS "count"
           FROM "base"
          WHERE ("base"."is_deleted" = true)) AS "deleted_profiles";


ALTER TABLE "public"."admin_profile_metrics" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_profile_metrics"() RETURNS "public"."admin_profile_metrics"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT *
  FROM public.admin_profile_metrics
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_admin_profile_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_user_grid"("p_search" "text" DEFAULT NULL::"text", "p_role" "public"."app_role_enum" DEFAULT NULL::"public"."app_role_enum", "p_status" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "role" "public"."app_role_enum", "approval_status" "public"."profile_approval_status", "is_active" boolean, "is_deleted" boolean, "is_approved" boolean, "alumni_verification_status" "text", "last_sign_in_at" timestamp with time zone, "created_at" timestamp with time zone, "total_count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    p.id,
    p.email,
    COALESCE(p.full_name, p.first_name || ' ' || p.last_name) AS full_name,
    p.role,
    p.approval_status,
    COALESCE(p.is_active,  true)  AS is_active,
    COALESCE(p.is_deleted, false) AS is_deleted,
    COALESCE(p.is_approved, false) AS is_approved,
    p.alumni_verification_status,
    u.last_sign_in_at,
    p.created_at,
    COUNT(*) OVER () AS total_count
  FROM auth.users u
  JOIN public.profiles p
    ON p.id = u.id
  WHERE
    -- Admin guard
    public.app_is_admin()

    -- Role filter
    AND (p_role IS NULL OR p.role = p_role)

    -- Status filter
    AND (
      p_status IS NULL OR p_status = '' OR
      CASE p_status
        WHEN 'pending'  THEN p.approval_status = 'pending'
        WHEN 'approved' THEN p.approval_status = 'approved'
                           AND COALESCE(p.is_deleted,false) = false
        WHEN 'rejected' THEN p.approval_status = 'rejected'
        WHEN 'blocked'  THEN COALESCE(p.is_active,false) = false
                           AND COALESCE(p.is_deleted,false) = false
        WHEN 'deleted'  THEN COALESCE(p.is_deleted,false) = true
        ELSE TRUE
      END
    )

    -- Search filter
    AND (
      p_search IS NULL OR p_search = '' OR
      p.full_name ILIKE '%' || p_search || '%' OR
      p.email     ILIKE '%' || p_search || '%'
    )
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;


ALTER FUNCTION "public"."get_admin_user_grid"("p_search" "text", "p_role" "public"."app_role_enum", "p_status" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_user_grid"("p_status" "public"."profile_approval_status" DEFAULT NULL::"public"."profile_approval_status", "p_role" "public"."app_role_enum" DEFAULT NULL::"public"."app_role_enum", "p_search" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "first_name" "text", "last_name" "text", "role" "text", "is_admin" boolean, "is_super_admin" boolean, "approval_status" "public"."profile_approval_status", "is_active" boolean, "is_deleted" boolean, "is_profile_complete" boolean, "profile_created_at" timestamp with time zone, "profile_updated_at" timestamp with time zone, "auth_created_at" timestamp with time zone, "last_sign_in_at" timestamp with time zone, "degree_code" "text", "department_id" "uuid", "department_name" "text", "degree_program" "text", "graduation_year" integer, "expected_graduation_year" integer, "company_name" "text", "current_job_title" "text", "location_city" "text", "location_country" "text", "is_employer" boolean, "is_mentor" boolean, "last_seen" timestamp with time zone, "total_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN
  -- Strict admin/super_admin guard
  IF NOT public.app_is_admin() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id,
      p.email,
      p.full_name,
      p.first_name,
      p.last_name,
      p.role::text AS role,
      (p.role IN ('admin','super_admin') OR COALESCE(p.is_admin, false)) AS is_admin,
      (p.role = 'super_admin') AS is_super_admin,
      p.approval_status,
      p.is_active,
      p.is_deleted,
      p.is_profile_complete,
      p.created_at AS profile_created_at,
      p.updated_at AS profile_updated_at,
      u.created_at AS auth_created_at,
      u.last_sign_in_at,
      p.degree_code,
      p.department_id,
      d.name AS department_name,
      p.degree_program,
      p.graduation_year,
      p.expected_graduation_year,
      p.company_name,
      p.current_job_title,
      p.location_city,
      p.location_country,
      COALESCE(p.is_employer, false) AS is_employer,
      COALESCE(p.is_mentor, false)   AS is_mentor,
      p.last_seen
    FROM public.profiles p
    JOIN auth.users u
      ON u.id = p.id
    LEFT JOIN public.departments d
      ON d.id = p.department_id
    WHERE
      (p_status IS NULL OR p.approval_status = p_status)
      AND (p_role   IS NULL OR p.role            = p_role)
      AND (
        p_search IS NULL OR p_search = '' OR
        p.full_name        ILIKE '%' || p_search || '%' OR
        p.email            ILIKE '%' || p_search || '%' OR
        p.first_name       ILIKE '%' || p_search || '%' OR
        p.last_name        ILIKE '%' || p_search || '%' OR
        p.company_name     ILIKE '%' || p_search || '%' OR
        p.location_city    ILIKE '%' || p_search || '%' OR
        p.location_country ILIKE '%' || p_search || '%'
      )
  ),
  counted AS (
    SELECT
      base.*,
      COUNT(*) OVER () AS total_count
    FROM base
  )
  SELECT *
  FROM counted
  ORDER BY profile_created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_admin_user_grid"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_search" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_users"() RETURNS TABLE("id" "uuid", "email" "text", "last_sign_in_at" timestamp with time zone, "full_name" "text", "role" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT u.id, u.email, u.last_sign_in_at, p.full_name, p.role
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE get_user_role(auth.uid()) IN ('admin','super_admin');
$$;


ALTER FUNCTION "public"."get_admin_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_profiles_count_by_role_admin"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  -- Only admin/super_admin can call this
  SELECT CASE
    WHEN public._is_admin(auth.uid()) THEN
      jsonb_build_object(
        'alumni', jsonb_build_object(
          'total',    COUNT(*) FILTER (WHERE p.role = 'alumni'),
          'pending',  COUNT(*) FILTER (WHERE p.role = 'alumni' AND p.approval_status = 'pending'),
          'approved', COUNT(*) FILTER (WHERE p.role = 'alumni' AND p.approval_status = 'approved'),
          'rejected', COUNT(*) FILTER (WHERE p.role = 'alumni' AND p.approval_status = 'rejected')
        ),
        'student', jsonb_build_object(
          'total',    COUNT(*) FILTER (WHERE p.role = 'student'),
          'pending',  COUNT(*) FILTER (WHERE p.role = 'student' AND p.approval_status = 'pending'),
          'approved', COUNT(*) FILTER (WHERE p.role = 'student' AND p.approval_status = 'approved'),
          'rejected', COUNT(*) FILTER (WHERE p.role = 'student' AND p.approval_status = 'rejected')
        ),
        'employer', jsonb_build_object(
          'total',    COUNT(*) FILTER (WHERE p.role = 'employer'),
          'pending',  COUNT(*) FILTER (WHERE p.role = 'employer' AND p.approval_status = 'pending'),
          'approved', COUNT(*) FILTER (WHERE p.role = 'employer' AND p.approval_status = 'approved'),
          'rejected', COUNT(*) FILTER (WHERE p.role = 'employer' AND p.approval_status = 'rejected')
        )
      )
    ELSE
      NULL  -- Non-admins get nothing
  END
  FROM public.profiles p
  WHERE COALESCE(p.is_deleted, false) = false
    AND COALESCE(p.is_active, true) = true;
$$;


ALTER FUNCTION "public"."get_all_profiles_count_by_role_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_all_profiles_count_by_role_admin"() IS 'Admin/Super Admin only: returns all profile counts by role and approval status (pending/approved/rejected). Non-admins get NULL.';



CREATE OR REPLACE FUNCTION "public"."get_alumni_approved_count"() RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT count(*)
  FROM public.profiles p
  WHERE p.role = 'alumni'
    AND p.approval_status = 'approved'
    AND COALESCE(p.is_deleted, false) = false
    AND COALESCE(p.is_active, true) = true;
$$;


ALTER FUNCTION "public"."get_alumni_approved_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_application_count"("p_job_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select count(*)::int
  from public.job_applications ja
  where ja.job_id = p_job_id
    and (
      ja.applicant_id = auth.uid()
      or public.fc_is_admin()
      or exists (
        select 1 from public.jobs j
        where j.id = p_job_id
          and (j.posted_by = auth.uid() or j.created_by = auth.uid())
      )
    );
$$;


ALTER FUNCTION "public"."get_application_count"("p_job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_applications_for_job"("p_job_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("application_id" "uuid", "applicant_id" "uuid", "resume_url" "text", "cover_letter" "text", "status" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select a.id, a.applicant_id, a.resume_url, a.cover_letter, a.status, a.created_at
  from public.job_applications a
  where a.job_id = p_job_id
  order by a.created_at desc
  offset greatest(p_offset,0)
  limit  greatest(p_limit,1);
$$;


ALTER FUNCTION "public"."get_applications_for_job"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_applications_for_job_v2"("p_job_id" "uuid", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "applicant_id" "uuid", "job_id" "uuid", "status" "text", "created_at" timestamp with time zone, "applicant_name" "text", "applicant_email" "text", "resume_url" "text", "total_count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  with role_name as (
    select coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', 'alumni'
    ) as r
  ),
  owner_ok as (
    select 1
    from public.jobs j, role_name rn
    where j.id = p_job_id
      and (
        rn.r in ('admin','super_admin')
        or j.created_by = auth.uid()
        or j.posted_by  = auth.uid()
      )
  ),
  base as (
    select
      a.id, a.applicant_id, a.job_id, a.status, a.created_at, a.resume_url,
      coalesce(p.full_name, concat_ws(' ', p.first_name, p.last_name)) as applicant_name,
      p.email as applicant_email
    from public.job_applications a
    join owner_ok ok on true
    left join public.profiles p on p.id = a.applicant_id
    where a.job_id = p_job_id
  )
  select
    b.id, b.applicant_id, b.job_id, b.status, b.created_at,
    b.applicant_name, b.applicant_email, b.resume_url,
    count(*) over() as total_count
  from base b
  order by b.created_at desc
  limit greatest(p_limit,0) offset greatest(p_offset,0);
$$;


ALTER FUNCTION "public"."get_applications_for_job_v2"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bell_unread_count"() RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_count bigint;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM public.bell_notifications bn
  WHERE bn.recipient_id = v_uid
    AND bn.is_read = FALSE;

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."get_bell_unread_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_company_jobs_with_bookmarks"("p_company_id" "uuid", "p_search_query" "text" DEFAULT NULL::"text", "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_limit" integer DEFAULT 10, "p_offset" integer DEFAULT 0) RETURNS SETOF "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
  v_user_id UUID;
  v_query TEXT;
  v_is_bookmarked_query TEXT;
BEGIN
  -- Get current authenticated user ID
  v_user_id := auth.uid();

  -- Create the query to fetch jobs from specified company
  v_query := '
    SELECT 
      j.*,
      c.name as company_name,
      c.logo_url as company_logo_url,
      COALESCE(a.count, 0) as applicant_count,
      EXISTS(SELECT 1 FROM job_bookmarks jb WHERE jb.job_id = j.id AND jb.user_id = $1) as is_bookmarked,
      COUNT(*) OVER() as total_count
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    LEFT JOIN (
      SELECT job_id, COUNT(*) as count
      FROM job_applications
      GROUP BY job_id
    ) a ON a.job_id = j.id
    WHERE j.company_id = $2
  ';

  -- Add search query condition if provided
  IF p_search_query IS NOT NULL AND p_search_query <> '' THEN
    v_query := v_query || ' AND (
      j.title ILIKE ''%' || p_search_query || '%'' OR
      j.description ILIKE ''%' || p_search_query || '%'' OR
      j.location ILIKE ''%' || p_search_query || '%'' OR
      c.name ILIKE ''%' || p_search_query || '%''
    )';
  END IF;

  -- Add sorting
  v_query := v_query || ' ORDER BY ' || p_sort_by || ' ' || p_sort_order;

  -- Add pagination
  v_query := v_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  -- Execute the query and return results
  RETURN QUERY EXECUTE v_query USING v_user_id, p_company_id;
END;
$_$;


ALTER FUNCTION "public"."get_company_jobs_with_bookmarks"("p_company_id" "uuid", "p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_connection_peers"() RETURNS TABLE("peer_id" "uuid", "status" "text", "direction" "text", "first_name" "text", "last_name" "text", "avatar_url" "text", "degree_program" "text", "department" "text", "graduation_year" integer, "company_name" "text", "current_job_title" "text", "location" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with edges as (
    select
      case when c.requester_id = auth.uid() then c.recipient_id else c.requester_id end as peer_id,
      c.status,
      case
        when c.status = 'accepted' then 'accepted'
        when c.recipient_id = auth.uid() then 'received'
        else 'sent'
      end as direction
    from public.connections c
    where c.requester_id = auth.uid() or c.recipient_id = auth.uid()
  )
  select
    e.peer_id,
    e.status,
    e.direction,
    p.first_name, p.last_name, p.avatar_url,
    p.degree_program, p.department, p.graduation_year,
    p.company_name, p.current_job_title, p.location
  from edges e
  join public.profiles p on p.id = e.peer_id;
$$;


ALTER FUNCTION "public"."get_connection_peers"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_connection_status"("user_1_id" "uuid", "user_2_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  connection_status text;
BEGIN
  SELECT status INTO connection_status
  FROM connections
  WHERE (requester_id = user_1_id AND recipient_id = user_2_id)
     OR (requester_id = user_2_id AND recipient_id = user_1_id)
  LIMIT 1;

  IF connection_status IS NULL THEN
    RETURN 'idle';
  ELSE
    RETURN connection_status;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_connection_status"("user_1_id" "uuid", "user_2_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_connections_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  connection_count INTEGER;
BEGIN
  -- Count connections where the user is either the requester or recipient
  -- and the connection status is 'accepted'
  SELECT COUNT(*) INTO connection_count
  FROM public.connections
  WHERE (requester_id = p_user_id OR recipient_id = p_user_id)
  AND status = 'accepted';
  
  RETURN connection_count;
END;
$$;


ALTER FUNCTION "public"."get_connections_count"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_connections_count"("p_user_id" "uuid") IS 'Returns the count of accepted connections for a specific user';



CREATE OR REPLACE FUNCTION "public"."get_current_user_flags"() RETURNS TABLE("id" "uuid", "role" "text", "approval_status" "text", "is_fully_approved" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    p.id,
    p.role::text,
    p.approval_status::text,
    public.fc_is_fully_approved(p.id) as is_fully_approved
  from public.profiles p
  where p.id = auth.uid();
$$;


ALTER FUNCTION "public"."get_current_user_flags"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  result jsonb;
BEGIN
  -- admin/super_admin check
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role IN ('admin','super_admin') OR is_admin = true)
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access dashboard statistics';
  END IF;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT count(*) FROM auth.users),
    'activeJobs', (SELECT count(*) FROM jobs WHERE is_active = true AND is_approved = true),
    'pendingApplications', (SELECT count(*) FROM job_applications WHERE status = 'submitted'),
    'totalApplications', (SELECT count(*) FROM job_applications),
    'messagesToday', (SELECT count(*) FROM messages WHERE created_at >= CURRENT_DATE),
    'usersByRole', (
      SELECT jsonb_object_agg(role_counts.role, role_counts.count)
      FROM (
        SELECT role, count(*) AS count
        FROM profiles
        GROUP BY role
      ) AS role_counts
    ),
    'recentActivity', (
      SELECT jsonb_agg(activity_data)
      FROM (
        SELECT id, description, activity_type, created_at
        FROM activity_log
        ORDER BY created_at DESC
        LIMIT 10
      ) AS activity_data
    ),
    'lastUpdated', now()
  ) INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_dashboard_stats"() IS 'Returns statistics for the admin dashboard';



CREATE OR REPLACE FUNCTION "public"."get_dashboard_summary_for_user"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_viewer uuid := auth.uid();
  v_target uuid := COALESCE(p_user_id, v_viewer);
  v_role   text;
  v_is_deleted boolean;
  v_result jsonb;
BEGIN
  -- Require authentication
  IF v_viewer IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Users can only request their own summary
  IF v_target <> v_viewer THEN
    RAISE EXCEPTION 'Access denied: cannot view other users'' dashboard summary';
  END IF;

  -- Get role & deletion flag
  SELECT role, COALESCE(is_deleted, false)
  INTO v_role, v_is_deleted
  FROM public.profiles
  WHERE id = v_target;

  IF v_is_deleted OR v_role IS NULL THEN
    RAISE EXCEPTION 'User not found or deleted';
  END IF;

  -- Build JSON summary
  v_result := jsonb_build_object(
    'user_id', v_target,
    'role', v_role,

    'counts', jsonb_build_object(
      'total_alumni', (
        SELECT count(*)::int
        FROM public.profiles p
        WHERE p.role = 'alumni'
          AND p.approval_status = 'approved'
          AND COALESCE(p.is_deleted, false) = false
          AND COALESCE(p.is_active, true) = true
      ),
      'total_students', (
        SELECT count(*)::int
        FROM public.profiles p
        WHERE p.role = 'student'
          AND p.approval_status = 'approved'
          AND COALESCE(p.is_deleted, false) = false
          AND COALESCE(p.is_active, true) = true
      ),
      'total_employers', (
        SELECT count(*)::int
        FROM public.profiles p
        WHERE p.role = 'employer'
          AND p.approval_status = 'approved'
          AND COALESCE(p.is_deleted, false) = false
          AND COALESCE(p.is_active, true) = true
      ),
      'my_connections', (
        SELECT count(*)::int
        FROM public.connections c
        WHERE (c.requester_id = v_target OR c.recipient_id = v_target)
          AND c.status = 'accepted'
      ),
      'upcoming_events', (
        SELECT count(*)::int
        FROM public.events e
        WHERE e.start_date >= CURRENT_DATE
          AND e.is_published = true
          AND e.approval_status = 'approved'
      ),
      'active_jobs', (
        SELECT count(*)::int
        FROM public.jobs j
        WHERE j.is_active = true
          AND j.is_approved = true
      ),
      'unread_messages', (
        SELECT count(*)::int
        FROM public.messages m
        WHERE m.recipient_id = v_target
          AND m.read_at IS NULL
      )
    ),

    'upcoming_events_list', (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'title', e.title,
            'start_date', e.start_date,
            'start_time', e.start_time,       -- alias from start_at
            'location', e.location,
            'event_type', e.event_type
          )
          ORDER BY e.start_date ASC, e.start_time ASC
        ),
        '[]'::jsonb
      )
      FROM (
        SELECT
          id,
          title,
          start_date,
          start_at AS start_time,            -- ← FIX: alias real column
          location,
          event_type
        FROM public.events
        WHERE start_date >= CURRENT_DATE
          AND is_published = true
          AND approval_status = 'approved'
        ORDER BY start_date ASC, start_at ASC
        LIMIT 3
      ) e
    ),

    'recommended_jobs_list', (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', j.id,
            'title', j.title,
            'company_name', COALESCE(c.name, j.company_name),
            'location', j.location,
            'salary_range',
              CASE 
                WHEN j.salary_min IS NOT NULL AND j.salary_max IS NOT NULL THEN
                  j.salary_min::text || ' - ' || j.salary_max::text
                WHEN j.salary_min IS NOT NULL THEN
                  'From ' || j.salary_min::text
                ELSE
                  'Not specified'
              END,
            'created_at', j.created_at
          )
          ORDER BY j.created_at DESC
        ),
        '[]'::jsonb
      )
      FROM (
        SELECT id, title, company_id, company_name, location,
               salary_min, salary_max, created_at
        FROM public.jobs
        WHERE is_active = true
          AND is_approved = true
        ORDER BY created_at DESC
        LIMIT 3
      ) j
      LEFT JOIN public.companies c ON c.id = j.company_id
    ),

    'role_data',
      CASE 
        WHEN v_role = 'employer' THEN
          jsonb_build_object(
            'my_active_jobs', (
              SELECT count(*)::int
              FROM public.jobs j
              WHERE j.created_by = v_target
                AND j.is_active = true
            ),
            'my_total_applications', (
              SELECT count(*)::int
              FROM public.job_applications ja
              JOIN public.jobs j ON j.id = ja.job_id
              WHERE j.created_by = v_target
            )
          )
        WHEN v_role IN ('student', 'alumni') THEN
          jsonb_build_object(
            'my_applications', (
              SELECT count(*)::int
              FROM public.job_applications ja
              WHERE ja.applicant_id = v_target
            ),
            'my_pending_applications', (
              SELECT count(*)::int
              FROM public.job_applications ja
              WHERE ja.applicant_id = v_target
                AND ja.status = 'pending'
            )
          )
        ELSE '{}'::jsonb
      END
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_summary_for_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_directory_cards"("p_search" "text", "p_limit" integer, "p_offset" integer) RETURNS TABLE("id" "uuid", "full_name" "text", "graduation_year" integer, "degree_program" "text", "department" "text", "current_title" "text", "company_name" "text", "location" "text", "avatar_url" "text", "role" "public"."app_role_enum", "is_employer" boolean, "connection_status" "text", "connection_pending_side" "text", "is_available_for_mentorship" boolean, "mentor_status" "text", "mentor_expertise" "text"[], "mentor_preferences" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
WITH base AS (
  SELECT *
  FROM public.get_directory_profiles_search(p_search, p_limit, p_offset)
)
SELECT
  b.id,
  card.full_name,
  b.graduation_year,
  b.degree_program,
  b.department,
  card.current_title,
  b.company_name,
  b.location,
  p.avatar_url,
  b.role,
  b.is_employer,
  conn.status       AS connection_status,
  conn.pending_side AS connection_pending_side,
  md.is_available_for_mentorship,
  md.mentor_status,
  md.expertise      AS mentor_expertise,
  md.mentoring_preferences AS mentor_preferences
FROM base b
JOIN public.profiles p
  ON p.id = b.id
LEFT JOIN public.v_profiles_directory_card       card ON card.id           = b.id
LEFT JOIN public.v_directory_connection_states   conn ON conn.other_user_id = b.id
LEFT JOIN public.mentors_directory               md   ON md.id             = b.id;
$$;


ALTER FUNCTION "public"."get_directory_cards"("p_search" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_directory_profile"("p_id" "uuid") RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "graduation_year" integer, "degree_program" "text", "department" "text", "current_job_title" "text", "company_name" "text", "location" "text", "avatar_url" "text", "is_employer" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select p.id, p.first_name, p.last_name, p.graduation_year, p.degree_program,
         p.department, p.current_job_title, p.company_name, p.location,
         p.avatar_url, (p.role = 'employer') as is_employer
  from public.profiles p
  where p.id = p_id
    and coalesce(p.is_deleted,false) = false
    and coalesce(p.show_in_directory,true) = true;
$$;


ALTER FUNCTION "public"."get_directory_profile"("p_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."degrees" (
    "code" "text" NOT NULL,
    "label" "text" NOT NULL
);


ALTER TABLE "public"."degrees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "degree_code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text" GENERATED ALWAYS AS ("btrim"("regexp_replace"("lower"("name"), '[^a-z0-9]+'::"text", '-'::"text", 'g'::"text"), '-'::"text")) STORED
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."directory_profiles_base" AS
 SELECT "p"."id",
    "p"."first_name",
    "p"."last_name",
    "p"."full_name",
    "p"."graduation_year",
    COALESCE("deg"."label", "p"."degree_program", "p"."degree") AS "degree_program",
    COALESCE("dept"."name", "p"."department") AS "department",
    COALESCE(NULLIF("p"."current_job_title", ''::"text"), NULLIF("p"."job_title", ''::"text")) AS "current_job_title",
    COALESCE(NULLIF("p"."company_name", ''::"text"), NULLIF("p"."current_company", ''::"text"), NULLIF("p"."company", ''::"text")) AS "company_name",
    COALESCE(NULLIF("p"."location", ''::"text"), NULLIF(TRIM(BOTH FROM ((COALESCE("p"."location_city", ''::"text") ||
        CASE
            WHEN (("p"."location_city" <> ''::"text") AND ("p"."location_country" <> ''::"text")) THEN ', '::"text"
            ELSE ''::"text"
        END) || COALESCE("p"."location_country", ''::"text"))), ''::"text")) AS "location",
    "p"."location_city",
    "p"."location_country",
    "p"."avatar_url",
    ("p"."role" = 'employer'::"public"."app_role_enum") AS "is_employer",
    "p"."role",
    "p"."approval_status",
    COALESCE("p"."is_deleted", false) AS "is_deleted",
    COALESCE("p"."is_active", true) AS "is_active",
    COALESCE("p"."show_in_directory", true) AS "show_in_directory"
   FROM (("public"."profiles" "p"
     LEFT JOIN "public"."degrees" "deg" ON (("deg"."code" = "p"."degree_code")))
     LEFT JOIN "public"."departments" "dept" ON (("dept"."id" = "p"."department_id")));


ALTER TABLE "public"."directory_profiles_base" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_directory_profiles"() RETURNS SETOF "public"."directory_profiles_base"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role     text    := public.get_user_role();
  v_is_admin boolean := public.app_is_admin();
BEGIN
  -- Employers should not see the people directory at all
  IF v_role = 'employer' THEN
    RETURN;
  END IF;

  IF v_is_admin THEN
    -- Admins / Super Admins see ALL profiles
    RETURN QUERY
      SELECT * FROM public.directory_profiles_base;
  ELSE
    -- Alumni / students / other non-admins:
    -- only active, visible, approved, non-employer profiles
    RETURN QUERY
      SELECT *
      FROM public.directory_profiles_base
      WHERE
        is_employer        = false
        AND show_in_directory = true
        AND is_deleted     = false
        AND is_active      = true
        AND approval_status = 'approved'::public.profile_approval_status;
  END IF;
END
$$;


ALTER FUNCTION "public"."get_directory_profiles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_directory_profiles"("p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."directory_profiles_base"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT *
  FROM public.directory_profiles_base
  WHERE
    -- 🔒 block employers here
    (SELECT role FROM public.profiles WHERE id = auth.uid()) <> 'employer'
  -- keep your existing filters/order if you had them
  OFFSET p_offset
  LIMIT  p_limit;
$$;


ALTER FUNCTION "public"."get_directory_profiles"("p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_directory_profiles_search"("p_search" "text", "p_limit" integer, "p_offset" integer) RETURNS SETOF "public"."directory_profiles_base"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role     text    := public.get_user_role();
  v_is_admin boolean := public.app_is_admin();
BEGIN
  -- Employers should not see the people directory at all
  IF v_role = 'employer' THEN
    RETURN;
  END IF;

  IF v_is_admin THEN
    -- Admins / Super Admins: search across ALL profiles
    RETURN QUERY
      SELECT *
      FROM public.directory_profiles_base dp
      WHERE
        (
          COALESCE(p_search, '') = ''
          OR dp.full_name ILIKE '%' || p_search || '%'
          OR (COALESCE(dp.first_name, '') || ' ' || COALESCE(dp.last_name, ''))
               ILIKE '%' || p_search || '%'
        )
      ORDER BY dp.last_name NULLS LAST, dp.first_name NULLS LAST
      LIMIT p_limit OFFSET p_offset;
  ELSE
    -- Alumni / students / other non-admins:
    -- only active, visible, approved, non-employer profiles
    RETURN QUERY
      SELECT *
      FROM public.directory_profiles_base dp
      WHERE
        dp.is_employer = false
        AND dp.show_in_directory = true
        AND dp.is_deleted = false
        AND dp.is_active = true
        AND dp.approval_status = 'approved'::public.profile_approval_status
        AND (
          COALESCE(p_search, '') = ''
          OR dp.full_name ILIKE '%' || p_search || '%'
          OR (COALESCE(dp.first_name, '') || ' ' || COALESCE(dp.last_name, ''))
               ILIKE '%' || p_search || '%'
        )
      ORDER BY dp.last_name NULLS LAST, dp.first_name NULLS LAST
      LIMIT p_limit OFFSET p_offset;
  END IF;
END
$$;


ALTER FUNCTION "public"."get_directory_profiles_search"("p_search" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer) RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "full_name" "text", "graduation_year" integer, "degree_program" "text", "department" "text", "current_job_title" "text", "company_name" "text", "location" "text", "location_city" "text", "location_country" "text", "avatar_url" "text", "role" "text", "approval_status" "text", "is_active" boolean, "is_deleted" boolean, "show_in_directory" boolean, "total_count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT *
  FROM public.get_directory_profiles_secure(
    p_search,
    p_limit,
    p_offset,
    'name',
    'asc'
  );
$$;


ALTER FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer) IS 'Get directory profiles for secure view, ordered by first name (then full_name), never by last_name.';



CREATE OR REPLACE FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer, "p_sort_field" "text", "p_sort_dir" "text") RETURNS TABLE("id" "uuid", "first_name" "text", "last_name" "text", "full_name" "text", "graduation_year" integer, "degree_program" "text", "department" "text", "current_job_title" "text", "company_name" "text", "location" "text", "location_city" "text", "location_country" "text", "avatar_url" "text", "role" "text", "approval_status" "text", "is_active" boolean, "is_deleted" boolean, "show_in_directory" boolean, "total_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role       text    := public.get_user_role();
  v_is_admin   boolean := public.app_is_admin();
  v_sort_field text    := lower(coalesce(nullif(p_sort_field, ''), 'name'));
  v_sort_dir   text    := case
                             when lower(p_sort_dir) in ('asc','desc') then lower(p_sort_dir)
                             else 'asc'
                           end;
BEGIN
  -- Employers: do not show people directory at all
  IF v_role = 'employer' THEN
    RETURN;
  END IF;

  -- ADMIN / SUPER_ADMIN
  IF v_is_admin THEN

    IF v_sort_field = 'graduation_year' THEN
      -- Sort by graduation year globally (Newest/Oldest), tie-breaker by first name
      IF v_sort_dir = 'desc' THEN
        RETURN QUERY
        SELECT *
        FROM (
          SELECT
            d.id,
            d.first_name,
            d.last_name,
            d.full_name,
            d.graduation_year,
            d.degree_program,
            d.department,
            d.current_job_title,
            d.company_name,
            d.location,
            d.location_city,
            d.location_country,
            d.avatar_url,
            d.role::text,
            d.approval_status::text,
            d.is_active,
            d.is_deleted,
            d.show_in_directory,
            COUNT(*) OVER () AS total_count
          FROM public.directory_profiles_public AS d
          WHERE
            COALESCE(p_search, '') = ''
            OR d.full_name ILIKE '%' || p_search || '%'
            OR (COALESCE(d.first_name, '') || ' ' || COALESCE(d.last_name, ''))
                 ILIKE '%' || p_search || '%'
        ) counted
        ORDER BY
          counted.graduation_year DESC,
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      ELSE
        RETURN QUERY
        SELECT *
        FROM (
          SELECT
            d.id,
            d.first_name,
            d.last_name,
            d.full_name,
            d.graduation_year,
            d.degree_program,
            d.department,
            d.current_job_title,
            d.company_name,
            d.location,
            d.location_city,
            d.location_country,
            d.avatar_url,
            d.role::text,
            d.approval_status::text,
            d.is_active,
            d.is_deleted,
            d.show_in_directory,
            COUNT(*) OVER () AS total_count
          FROM public.directory_profiles_public AS d
          WHERE
            COALESCE(p_search, '') = ''
            OR d.full_name ILIKE '%' || p_search || '%'
            OR (COALESCE(d.first_name, '') || ' ' || COALESCE(d.last_name, ''))
                 ILIKE '%' || p_search || '%'
        ) counted
        ORDER BY
          counted.graduation_year ASC,
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      END IF;

    ELSE
      -- Sort by name globally (A–Z / Z–A) using first_name as primary, fallback full_name
      IF v_sort_dir = 'desc' THEN
        RETURN QUERY
        SELECT *
        FROM (
          SELECT
            d.id,
            d.first_name,
            d.last_name,
            d.full_name,
            d.graduation_year,
            d.degree_program,
            d.department,
            d.current_job_title,
            d.company_name,
            d.location,
            d.location_city,
            d.location_country,
            d.avatar_url,
            d.role::text,
            d.approval_status::text,
            d.is_active,
            d.is_deleted,
            d.show_in_directory,
            COUNT(*) OVER () AS total_count
          FROM public.directory_profiles_public AS d
          WHERE
            COALESCE(p_search, '') = ''
            OR d.full_name ILIKE '%' || p_search || '%'
            OR (COALESCE(d.first_name, '') || ' ' || COALESCE(d.last_name, ''))
                 ILIKE '%' || p_search || '%'
        ) counted
        ORDER BY
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) DESC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') DESC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      ELSE
        RETURN QUERY
        SELECT *
        FROM (
          SELECT
            d.id,
            d.first_name,
            d.last_name,
            d.full_name,
            d.graduation_year,
            d.degree_program,
            d.department,
            d.current_job_title,
            d.company_name,
            d.location,
            d.location_city,
            d.location_country,
            d.avatar_url,
            d.role::text,
            d.approval_status::text,
            d.is_active,
            d.is_deleted,
            d.show_in_directory,
            COUNT(*) OVER () AS total_count
          FROM public.directory_profiles_public AS d
          WHERE
            COALESCE(p_search, '') = ''
            OR d.full_name ILIKE '%' || p_search || '%'
            OR (COALESCE(d.first_name, '') || ' ' || COALESCE(d.last_name, ''))
                 ILIKE '%' || p_search || '%'
        ) counted
        ORDER BY
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      END IF;
    END IF;

  ELSE
    -- NORMAL USERS: only active, visible profiles

    IF v_sort_field = 'graduation_year' THEN
      IF v_sort_dir = 'desc' THEN
        RETURN QUERY
        SELECT *
        FROM (
          SELECT
            d.id,
            d.first_name,
            d.last_name,
            d.full_name,
            d.graduation_year,
            d.degree_program,
            d.department,
            d.current_job_title,
            d.company_name,
            d.location,
            d.location_city,
            d.location_country,
            d.avatar_url,
            d.role::text,
            d.approval_status::text,
            d.is_active,
            d.is_deleted,
            d.show_in_directory,
            COUNT(*) OVER () AS total_count
          FROM public.directory_profiles_public AS d
          WHERE
            d.is_deleted = false
            AND d.is_active = true
            AND d.show_in_directory = true
            AND (
              COALESCE(p_search, '') = ''
              OR d.full_name ILIKE '%' || p_search || '%'
              OR (COALESCE(d.first_name, '') || ' ' || COALESCE(d.last_name, ''))
                   ILIKE '%' || p_search || '%'
            )
        ) counted
        ORDER BY
          counted.graduation_year DESC,
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      ELSE
        RETURN QUERY
        SELECT *
        FROM (
          SELECT
            d.id,
            d.first_name,
            d.last_name,
            d.full_name,
            d.graduation_year,
            d.degree_program,
            d.department,
            d.current_job_title,
            d.company_name,
            d.location,
            d.location_city,
            d.location_country,
            d.avatar_url,
            d.role::text,
            d.approval_status::text,
            d.is_active,
            d.is_deleted,
            d.show_in_directory,
            COUNT(*) OVER () AS total_count
          FROM public.directory_profiles_public AS d
          WHERE
            d.is_deleted = false
            AND d.is_active = true
            AND d.show_in_directory = true
            AND (
              COALESCE(p_search, '') = ''
              OR d.full_name ILIKE '%' || p_search || '%'
              OR (COALESCE(d.first_name, '') || ' ' || COALESCE(d.last_name, ''))
                   ILIKE '%' || p_search || '%'
            )
        ) counted
        ORDER BY
          counted.graduation_year ASC,
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      END IF;

    ELSE
      IF v_sort_dir = 'desc' THEN
        RETURN QUERY
        SELECT *
        FROM (
          SELECT
            d.id,
            d.first_name,
            d.last_name,
            d.full_name,
            d.graduation_year,
            d.degree_program,
            d.department,
            d.current_job_title,
            d.company_name,
            d.location,
            d.location_city,
            d.location_country,
            d.avatar_url,
            d.role::text,
            d.approval_status::text,
            d.is_active,
            d.is_deleted,
            d.show_in_directory,
            COUNT(*) OVER () AS total_count
          FROM public.directory_profiles_public AS d
          WHERE
            d.is_deleted = false
            AND d.is_active = true
            AND d.show_in_directory = true
            AND (
              COALESCE(p_search, '') = ''
              OR d.full_name ILIKE '%' || p_search || '%'
              OR (COALESCE(d.first_name, '') || ' ' || COALESCE(d.last_name, ''))
                   ILIKE '%' || p_search || '%'
            )
        ) counted
        ORDER BY
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) DESC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') DESC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      ELSE
        RETURN QUERY
        SELECT *
        FROM (
          SELECT
            d.id,
            d.first_name,
            d.last_name,
            d.full_name,
            d.graduation_year,
            d.degree_program,
            d.department,
            d.current_job_title,
            d.company_name,
            d.location,
            d.location_city,
            d.location_country,
            d.avatar_url,
            d.role::text,
            d.approval_status::text,
            d.is_active,
            d.is_deleted,
            d.show_in_directory,
            COUNT(*) OVER () AS total_count
          FROM public.directory_profiles_public AS d
          WHERE
            d.is_deleted = false
            AND d.is_active = true
            AND d.show_in_directory = true
            AND (
              COALESCE(p_search, '') = ''
              OR d.full_name ILIKE '%' || p_search || '%'
              OR (COALESCE(d.first_name, '') || ' ' || COALESCE(d.last_name, ''))
                   ILIKE '%' || p_search || '%'
            )
        ) counted
        ORDER BY
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      END IF;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer, "p_sort_field" "text", "p_sort_dir" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer, "p_sort_field" "text", "p_sort_dir" "text") IS 'Get directory profiles for secure view with sort parameters (name/graduation_year + asc/desc).';



CREATE OR REPLACE FUNCTION "public"."get_directory_profiles_secure_count"("p_search" "text") RETURNS bigint
    LANGUAGE "sql"
    AS $$
  SELECT COUNT(*)
  FROM public.directory_profiles_public AS d
  WHERE
    -- If you haven’t wired search yet, this still works:
    p_search IS NULL
    OR trim(p_search) = ''
    OR lower(d.full_name) LIKE '%' || lower(p_search) || '%'
    OR lower(coalesce(d.company_name, ''))      LIKE '%' || lower(p_search) || '%'
    OR lower(coalesce(d.degree_program, ''))    LIKE '%' || lower(p_search) || '%'
    OR lower(coalesce(d.department, ''))        LIKE '%' || lower(p_search) || '%';
$$;


ALTER FUNCTION "public"."get_directory_profiles_secure_count"("p_search" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_directory_role_counts"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT jsonb_build_object(
    'alumni',   COUNT(*) FILTER (
                   WHERE p.role = 'alumni'
                     AND p.approval_status = 'approved'
                     AND COALESCE(p.is_deleted, false) = false
                     AND COALESCE(p.is_active, true) = true
                     AND COALESCE(p.show_in_directory, true) = true
                 ),
    'student',  COUNT(*) FILTER (
                   WHERE p.role = 'student'
                     AND p.approval_status = 'approved'
                     AND COALESCE(p.is_deleted, false) = false
                     AND COALESCE(p.is_active, true) = true
                     AND COALESCE(p.show_in_directory, true) = true
                 ),
    'employer', COUNT(*) FILTER (
                   WHERE p.role = 'employer'
                     AND p.approval_status = 'approved'
                     AND COALESCE(p.is_deleted, false) = false
                     AND COALESCE(p.is_active, true) = true
                     AND COALESCE(p.show_in_directory, true) = true
                 )
  )
  FROM public.profiles p;
$$;


ALTER FUNCTION "public"."get_directory_role_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event_attendance_counts"("p_event_ids" "uuid"[]) RETURNS TABLE("event_id" "uuid", "total_attendees" integer)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT e.id AS event_id,
         COALESCE(COUNT(r.*) FILTER (WHERE LOWER(r.attendance_status) = 'going'), 0) AS total_attendees
  FROM UNNEST(p_event_ids) AS e(id)
  LEFT JOIN public.event_rsvps r ON r.event_id = e.id
  GROUP BY e.id
$$;


ALTER FUNCTION "public"."get_event_attendance_counts"("p_event_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_expired_jobs_admin"("p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0, "p_search" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "company_id" "uuid", "company_name" "text", "company_logo_url" "text", "location" "text", "job_type" "text", "experience_level" "text", "department" "text", "application_deadline" timestamp with time zone, "deadline" timestamp with time zone, "expires_at" timestamp with time zone, "status" "text", "is_active" boolean, "is_approved" boolean, "posted_by" "uuid", "created_by" "uuid", "created_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
with me as (select auth.uid() as uid),
gate as (
  -- ✅ Gate: only admin/super_admin
  select exists (
    select 1 from public.profiles p
    where p.id = (select uid from me)
      and p.role in ('admin','super_admin')
  ) as ok
),
base as (
  select 
    j.id, j.title, j.description, j.company_id,
    coalesce(c.name, j.company_name) as company_name,
    c.logo_url as company_logo_url,
    j.location, j.job_type, j.experience_level, j.department,
    j.application_deadline, j.deadline, j.expires_at,
    j.status, j.is_active, j.is_approved,
    j.posted_by, j.created_by, j.created_at
  from public.jobs j
  left join public.companies c on c.id = j.company_id
  where (
    (j.application_deadline is not null and j.application_deadline < now()) or
    (j.deadline             is not null and j.deadline             < now()) or
    (j.expires_at           is not null and j.expires_at           < now())
  )
  and (
    p_search is null or p_search = '' or
    j.title ilike ('%'||p_search||'%') or
    coalesce(c.name, j.company_name, '') ilike ('%'||p_search||'%')
  )
)
select *
from base
where (select ok from gate)         -- ✅ final guard
order by coalesce(deadline, application_deadline, expires_at) desc nulls last
offset greatest(p_offset,0)
limit greatest(p_limit,1);
$$;


ALTER FUNCTION "public"."get_expired_jobs_admin"("p_limit" integer, "p_offset" integer, "p_search" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_job_applications_for_owner"("p_job_id" "uuid", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("application_id" "uuid", "applicant_id" "uuid", "applicant_name" "text", "applicant_email" "text", "resume_url" "text", "status" "text", "applied_at" timestamp with time zone, "total_count" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with raw as (
    select
      a.id as application_id,
      coalesce( (to_jsonb(a)->>'user_id')::uuid,
                (to_jsonb(a)->>'applicant_id')::uuid ) as applicant_id,
      a.job_id,
      coalesce( to_jsonb(a)->>'resume_url', to_jsonb(a)->>'resume') as resume_url,
      coalesce( to_jsonb(a)->>'status', 'submitted') as status,
      a.created_at as applied_at
    from public.job_applications a
    join public.jobs j on j.id = a.job_id
    where a.job_id = p_job_id
      and (
        j.posted_by = auth.uid()
        or exists (select 1 from public.profiles p
                   where p.id = auth.uid() and p.role in ('admin','super_admin'))
      )
  ), base as (
    select
      r.application_id,
      r.applicant_id,
      pr.full_name as applicant_name,
      pr.email as applicant_email,
      r.resume_url,
      r.status,
      r.applied_at
    from raw r
    left join public.profiles pr on pr.id = r.applicant_id
  )
  select *, count(*) over() as total_count
  from base
  order by applied_at desc
  limit p_limit offset p_offset;
$$;


ALTER FUNCTION "public"."get_job_applications_for_owner"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_job_details"("p_id" "uuid") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "company_name" "text", "company_logo_url" "text", "location" "text", "job_type" "text", "department" "text", "experience_level" "text", "industry" "text", "status" "text", "is_active" boolean, "is_approved" boolean, "is_rejected" boolean, "deadline" timestamp with time zone, "application_deadline" timestamp with time zone, "expires_at" timestamp with time zone, "posted_by" "uuid", "created_by" "uuid", "user_id" "uuid", "company_id" "uuid", "salary_min" bigint, "salary_max" bigint, "salary_range" "text", "salary_display_inr" "text", "skills" "text"[], "requirements" "text", "application_url" "text", "apply_url" "text", "external_url" "text", "source_type" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT
    j.id,
    j.title,
    j.description,
    COALESCE(j.company_name, c.name)    AS company_name,
    COALESCE(j.logo_url,     c.logo_url) AS company_logo_url,
    j.location,
    j.job_type,
    j.department,
    j.experience_level,
    j.industry,
    j.status,
    j.is_active,
    j.is_approved,
    j.is_rejected,
    COALESCE(j.deadline, j.application_deadline) AS deadline,
    j.application_deadline,
    j.expires_at,
    j.posted_by,
    j.created_by,
    j.user_id,
    j.company_id,
    j.salary_min,
    j.salary_max,
    j.salary_range,
    CASE
      WHEN j.salary_min IS NOT NULL AND j.salary_max IS NOT NULL THEN
        '₹' || to_char(j.salary_min, 'FM999,999,999')
        || ' – ₹' || to_char(j.salary_max, 'FM999,999,999')
      WHEN j.salary_min IS NOT NULL THEN
        'From ₹' || to_char(j.salary_min, 'FM999,999,999')
      WHEN j.salary_max IS NOT NULL THEN
        'Up to ₹' || to_char(j.salary_max, 'FM999,999,999')
      ELSE NULL
    END                                 AS salary_display_inr,
    j.skills,
    j.requirements,
    j.application_url,
    j.apply_url,
    j.external_url,
    j.source_type
  FROM public.jobs j
  LEFT JOIN public.companies c ON c.id = j.company_id
  WHERE j.id = p_id
    AND (
      -- Admins can see all (use unified helper, not raw JWT claim)
      get_user_role(auth.uid()) IN ('admin','super_admin')
      -- Job owners
      OR j.posted_by = auth.uid()
      OR j.created_by = auth.uid()
      -- Publicly visible live jobs
      OR (
        COALESCE(j.is_active, true)
        AND j.is_approved
        AND (
          COALESCE(j.deadline, j.application_deadline) IS NULL
          OR COALESCE(j.deadline, j.application_deadline) >= now()
        )
      )
      -- Applicants to this job
      OR EXISTS (
        SELECT 1
        FROM public.job_applications ja
        WHERE ja.job_id = j.id
          AND ja.applicant_id = auth.uid()
      )
    );
$$;


ALTER FUNCTION "public"."get_job_details"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_job_for_edit"("p_job_id" "uuid") RETURNS "public"."jobs"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select j.*
    from public.jobs j
   where j.id = p_job_id
     and (
           j.posted_by = auth.uid()
        or j.user_id = auth.uid()
        or exists (
             select 1 from public.companies c
              where c.id = j.company_id
                and c.created_by = auth.uid()
          )
        or public.is_admin()
     )
  limit 1
$$;


ALTER FUNCTION "public"."get_job_for_edit"("p_job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_jobs_feed"("p_search_query" "text" DEFAULT NULL::"text", "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_limit" integer DEFAULT 12, "p_offset" integer DEFAULT 0, "p_department" "text" DEFAULT NULL::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
declare
  v_sort_col text;
  v_sort_dir text;
  q text;
  result json;
begin
  v_sort_col := case lower(p_sort_by)
                  when 'deadline' then 'application_deadline'
                  when 'title'    then 'title'
                  else 'created_at'
                end;

  v_sort_dir := case lower(p_sort_order) when 'asc' then 'ASC' else 'DESC' end;

  q := format($f$
    with base as (
      select j.*, c.name as company_name, c.logo_url as company_logo_url,
             coalesce(a.count,0) as applicant_count,
             exists(select 1 from job_bookmarks jb
                    where jb.job_id=j.id and jb.user_id=auth.uid()) as is_bookmarked
      from public.jobs j
      left join public.companies c on c.id=j.company_id
      left join (select job_id, count(*) as count from public.job_applications group by job_id) a
             on a.job_id=j.id
      where (
        get_user_role(auth.uid()) in ('admin','super_admin')
        or (j.is_approved = true and (j.is_active is null or j.is_active = true))
        or j.posted_by = auth.uid()
      )
      and (%s)
      %s
    ),
    paged as (
      select * from base
      order by %I %s
      limit $2 offset $3
    )
    select json_build_object(
      'items',       coalesce(json_agg(paged order by %I %s), '[]'::json),
      'total_count', coalesce((select count(*) from base), 0)
    )
    from paged;
  $f$,
    case when p_search_query is null or p_search_query=''
         then 'true'
         else format(
           'title ilike %1$L or coalesce(company_name, %1$L) ilike %1$L or coalesce(location, '''') ilike %1$L',
           '%'||p_search_query||'%')
    end,
    case when p_department is null or p_department='' then '' else 'and department = '||quote_literal(p_department) end,
    v_sort_col, v_sort_dir,
    v_sort_col, v_sort_dir
  );

  execute q into result using p_limit, p_offset;
  if result is null then
    result := json_build_object('items', '[]'::json, 'total_count', 0);
  end if;

  return result;
end;
$_$;


ALTER FUNCTION "public"."get_jobs_feed"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer, "p_department" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "is_public" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid",
    "applicant_id" "uuid" DEFAULT "auth"."uid"(),
    "resume_url" "text",
    "cover_letter" "text",
    "status" "text" DEFAULT 'submitted'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "job_owner" "uuid",
    "resume_path" "text",
    CONSTRAINT "job_applications_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'reviewed'::"text", 'interviewing'::"text", 'offered'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."job_applications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_jobs_feed_inr" AS
 SELECT "j"."id",
    "j"."title",
    "j"."created_at",
    "j"."updated_at",
    "j"."location",
    "j"."job_type",
    "j"."experience_level",
    "j"."salary_min",
    "j"."salary_max",
    NULL::timestamp with time zone AS "application_deadline",
    "j"."is_active",
    NULL::boolean AS "is_approved",
    "j"."application_url",
    NULL::"text" AS "source_type",
    "j"."company_id",
    "c"."name" AS "company_name",
    COALESCE("j"."logo_url", "c"."logo_url") AS "company_logo_url",
    COALESCE("a"."applicant_count", (0)::bigint) AS "applicant_count",
        CASE
            WHEN (("j"."salary_min" IS NOT NULL) AND ("j"."salary_max" IS NOT NULL)) THEN (("to_char"("j"."salary_min", 'FM999,999,999'::"text") || ' - '::"text") || "to_char"("j"."salary_max", 'FM999,999,999'::"text"))
            WHEN ("j"."salary_min" IS NOT NULL) THEN ('From '::"text" || "to_char"("j"."salary_min", 'FM999,999,999'::"text"))
            WHEN ("j"."salary_max" IS NOT NULL) THEN ('Up to '::"text" || "to_char"("j"."salary_max", 'FM999,999,999'::"text"))
            ELSE NULL::"text"
        END AS "salary_range",
        CASE
            WHEN (("j"."salary_min" IS NOT NULL) AND ("j"."salary_max" IS NOT NULL)) THEN ((('₹'::"text" || "to_char"("j"."salary_min", 'FM999,999,999'::"text")) || ' – ₹'::"text") || "to_char"("j"."salary_max", 'FM999,999,999'::"text"))
            WHEN ("j"."salary_min" IS NOT NULL) THEN ('From ₹'::"text" || "to_char"("j"."salary_min", 'FM999,999,999'::"text"))
            WHEN ("j"."salary_max" IS NOT NULL) THEN ('Up to ₹'::"text" || "to_char"("j"."salary_max", 'FM999,999,999'::"text"))
            ELSE NULL::"text"
        END AS "salary_display",
        CASE
            WHEN (("j"."salary_min" IS NOT NULL) AND ("j"."salary_max" IS NOT NULL)) THEN ((('₹'::"text" || "to_char"("j"."salary_min", 'FM999,999,999'::"text")) || ' – ₹'::"text") || "to_char"("j"."salary_max", 'FM999,999,999'::"text"))
            WHEN ("j"."salary_min" IS NOT NULL) THEN ('From ₹'::"text" || "to_char"("j"."salary_min", 'FM999,999,999'::"text"))
            WHEN ("j"."salary_max" IS NOT NULL) THEN ('Up to ₹'::"text" || "to_char"("j"."salary_max", 'FM999,999,999'::"text"))
            ELSE NULL::"text"
        END AS "salary_display_inr"
   FROM (("public"."jobs" "j"
     LEFT JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")))
     LEFT JOIN ( SELECT "job_applications"."job_id",
            "count"(*) AS "applicant_count"
           FROM "public"."job_applications"
          GROUP BY "job_applications"."job_id") "a" ON (("a"."job_id" = "j"."id")))
  WHERE (COALESCE("j"."is_active", true) AND (("j"."status" IS NULL) OR ("j"."status" = 'active'::"text")) AND (("j"."open_at" IS NULL) OR ("j"."open_at" <= "now"())) AND (("j"."close_at" IS NULL) OR ("j"."close_at" >= "now"())));


ALTER TABLE "public"."v_jobs_feed_inr" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_jobs_public_v5"("p_search" "text" DEFAULT NULL::"text", "p_location" "text" DEFAULT NULL::"text", "p_job_type" "text" DEFAULT NULL::"text", "p_experience_level" "text" DEFAULT NULL::"text", "p_offset" integer DEFAULT 0, "p_limit" integer DEFAULT 20) RETURNS SETOF "public"."v_jobs_feed_inr"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select *
  from public.v_jobs_feed_inr v
  where
    (p_search is null
      or v.title ilike '%'||p_search||'%'
      or v.company_name ilike '%'||p_search||'%')
    and (p_location is null or v.location ilike '%'||p_location||'%')
    and (p_job_type is null or v.job_type = p_job_type)
    and (p_experience_level is null or v.experience_level = p_experience_level)
  order by v.created_at desc
  offset greatest(p_offset,0)
  limit greatest(p_limit,1);
$$;


ALTER FUNCTION "public"."get_jobs_public_v5"("p_search" "text", "p_location" "text", "p_job_type" "text", "p_experience_level" "text", "p_offset" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_jobs_public_v5"("p_search_query" "text" DEFAULT NULL::"text", "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_limit" integer DEFAULT 12, "p_offset" integer DEFAULT 0, "p_department" "text" DEFAULT NULL::"text", "p_job_type" "text" DEFAULT NULL::"text", "p_experience_level" "text" DEFAULT NULL::"text", "p_location" "text" DEFAULT NULL::"text", "p_industry" "text" DEFAULT NULL::"text", "p_salary_min" integer DEFAULT NULL::integer, "p_salary_max" integer DEFAULT NULL::integer, "p_posted_since_days" integer DEFAULT NULL::integer) RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "company_id" "uuid", "company_name" "text", "company_logo_url" "text", "application_url" "text", "external_url" "text", "apply_url" "text", "source_type" "text", "application_deadline" timestamp with time zone, "deadline" timestamp with time zone, "status" "text", "department" "text", "job_type" "text", "experience_level" "text", "industry" "text", "location" "text", "salary_min" integer, "salary_max" integer, "skills" "text"[], "is_active" boolean, "is_approved" boolean, "created_at" timestamp with time zone, "total_count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
WITH base AS (
  SELECT
    j.id,
    j.title,
    j.description,
    j.company_id,
    COALESCE(c.name, j.company_name) AS company_name,
    c.logo_url                       AS company_logo_url,
    j.application_url,
    j.external_url,
    j.apply_url,
    CASE
      WHEN COALESCE(j.apply_url, j.application_url, j.external_url) IS NOT NULL THEN
        CASE
          WHEN j.apply_url IS NOT NULL OR j.application_url IS NOT NULL THEN 'in_app'
          ELSE 'quick_link'
        END
      ELSE NULL
    END                               AS source_type,
    j.application_deadline,
    j.deadline,
    j.status,
    j.department,
    j.job_type,
    j.experience_level,
    j.industry,
    j.location,
    j.salary_min,
    j.salary_max,
    j.skills,                         -- NEW
    j.is_active,
    j.is_approved,
    j.created_at
  FROM public.jobs j
  LEFT JOIN public.companies c ON c.id = j.company_id
  WHERE
    j.is_active = TRUE
    AND j.is_approved = TRUE
    AND (p_department       IS NULL OR j.department       = p_department)
    AND (p_job_type         IS NULL OR j.job_type         = p_job_type)
    AND (p_experience_level IS NULL OR j.experience_level = p_experience_level)
    AND (p_location         IS NULL OR j.location ILIKE ('%' || p_location || '%'))
    AND (p_industry         IS NULL OR j.industry         = p_industry)
    AND (
      (p_salary_min IS NULL AND p_salary_max IS NULL) OR
      (
        (j.salary_min IS NOT NULL OR j.salary_max IS NOT NULL) AND
        (p_salary_min IS NULL OR COALESCE(j.salary_max, j.salary_min) >= p_salary_min) AND
        (p_salary_max IS NULL OR COALESCE(j.salary_min, j.salary_max) <= p_salary_max)
      )
    )
    AND (
      p_posted_since_days IS NULL OR
      j.created_at >= (now() - make_interval(days => p_posted_since_days))
    )
    AND (
      p_search_query IS NULL OR (
        j.title ILIKE ('%' || p_search_query || '%')
        OR j.description ILIKE ('%' || p_search_query || '%')
        OR COALESCE(c.name, j.company_name) ILIKE ('%' || p_search_query || '%')
        OR j.location ILIKE ('%' || p_search_query || '%')
        OR EXISTS (
          SELECT 1
          FROM unnest(j.skills) AS s(skill)
          WHERE s.skill ILIKE ('%' || p_search_query || '%')
        )
      )
    )
),
counted AS (
  SELECT b.*, count(*) OVER () AS total_count
  FROM base b
)
SELECT *
FROM counted
ORDER BY
  CASE WHEN p_sort_by IN ('created_at') AND p_sort_order = 'asc'  THEN created_at          END ASC  NULLS LAST,
  CASE WHEN p_sort_by IN ('created_at') AND p_sort_order = 'desc' THEN created_at          END DESC NULLS LAST,
  CASE WHEN p_sort_by IN ('title')      AND p_sort_order = 'asc'  THEN title               END ASC  NULLS LAST,
  CASE WHEN p_sort_by IN ('title')      AND p_sort_order = 'desc' THEN title               END DESC NULLS LAST,
  CASE WHEN p_sort_by IN ('deadline')   AND p_sort_order = 'asc'  THEN application_deadline END ASC  NULLS LAST,
  CASE WHEN p_sort_by IN ('deadline')   AND p_sort_order = 'desc' THEN application_deadline END DESC NULLS LAST
OFFSET p_offset
LIMIT  p_limit;
$$;


ALTER FUNCTION "public"."get_jobs_public_v5"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer, "p_department" "text", "p_job_type" "text", "p_experience_level" "text", "p_location" "text", "p_industry" "text", "p_salary_min" integer, "p_salary_max" integer, "p_posted_since_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_jobs_with_bookmark_flag"() RETURNS TABLE("id" "uuid", "title" "text", "company_name" "text", "location" "text", "status" "text", "open_at" timestamp with time zone, "close_at" timestamp with time zone, "required_skills" "jsonb", "is_bookmarked" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
        select
          j.id,
          j.title,
          j.company_name,
          j.location,
          j.status,
          j.open_at,
          j.close_at,
          coalesce(public.reqskills_to_jsonb(j.required_skills), '[]'::jsonb) as required_skills,
          (jb.user_id is not null) as is_bookmarked
        from public.jobs j
        left join public.job_bookmarks jb
          on jb.job_id = j.id and jb.user_id = auth.uid()
        where j.status = 'active'
          and (j.open_at  is null or now() >= j.open_at)
          and (j.close_at is null or now() <= j.close_at)
        order by j.id desc
      $$;


ALTER FUNCTION "public"."get_jobs_with_bookmark_flag"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_jobs_with_bookmarks"("p_search_query" "text" DEFAULT ''::"text", "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_limit" integer DEFAULT 12, "p_offset" integer DEFAULT 0) RETURNS SETOF "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_user_id    uuid := auth.uid();
  v_is_admin   boolean := EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_user_id
      AND (p.is_admin = true OR p.role IN ('admin','super_admin'))
  );
  v_sort_by    text;
  v_sort_order text;
  v_where      text := '';
  v_sql        text;
BEGIN
  -- Whitelist sort fields/direction
  v_sort_by := CASE lower(p_sort_by)
    WHEN 'created_at'      THEN 'created_at'
    WHEN 'title'           THEN 'title'
    WHEN 'location'        THEN 'location'
    WHEN 'applicant_count' THEN 'applicant_count'
    ELSE 'created_at'
  END;

  v_sort_order := CASE lower(p_sort_order)
    WHEN 'asc' THEN 'ASC'
    ELSE 'DESC'
  END;

  IF p_search_query IS NOT NULL AND length(btrim(p_search_query)) > 0 THEN
    v_where := '
      WHERE ( title ILIKE ''%'' || $2 || ''%''
           OR description ILIKE ''%'' || $2 || ''%''
           OR location ILIKE ''%'' || $2 || ''%''
           OR company_name ILIKE ''%'' || $2 || ''%'' )';
  END IF;

  v_sql := format($f$
    WITH base AS (
      SELECT
        j.*,
        c.name     AS company_name,
        c.logo_url AS company_logo_url,
        COALESCE(a.count, 0) AS applicant_count,
        EXISTS (
          SELECT 1 FROM public.job_bookmarks jb
          WHERE jb.job_id = j.id AND jb.user_id = $1
        ) AS is_bookmarked
      FROM public.jobs j
      LEFT JOIN public.companies c ON c.id = j.company_id
      LEFT JOIN (
        SELECT job_id, COUNT(*) AS count
        FROM public.job_applications
        GROUP BY job_id
      ) a ON a.job_id = j.id
      WHERE %s
    ),
    filtered AS (
      SELECT * FROM base
      %s
    )
    SELECT (to_jsonb(f) || jsonb_build_object('total_count', COUNT(*) OVER ()))::json
    FROM filtered f
    ORDER BY %I %s
    LIMIT $3 OFFSET $4
  $f$,
    CASE WHEN v_is_admin THEN 'TRUE'
         ELSE '(j.is_approved = TRUE AND j.is_active = TRUE) OR j.posted_by = $1'
    END,
    v_where,
    v_sort_by, v_sort_order
  );

  RETURN QUERY EXECUTE v_sql USING v_user_id, p_search_query, p_limit, p_offset;
END;
$_$;


ALTER FUNCTION "public"."get_jobs_with_bookmarks"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_jobs_with_bookmarks_v2"("p_search_query" "text" DEFAULT ''::"text", "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_limit" integer DEFAULT 12, "p_offset" integer DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v_user_id    uuid := auth.uid();
  v_is_admin   boolean := EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_user_id
      AND (p.is_admin = true OR p.role IN ('admin','super_admin'))
  );

  sort_col   text := CASE lower(p_sort_by)
                       WHEN 'created_at' THEN 'created_at'
                       WHEN 'deadline'   THEN 'deadline'
                       WHEN 'title'      THEN 'title'
                       ELSE 'created_at'
                     END;
  sort_dir   text := CASE lower(p_sort_order)
                       WHEN 'asc' THEN 'ASC'
                       ELSE 'DESC'
                     END;

  where_search text := '';
  v_sql        text;
  out_json     jsonb;
BEGIN
  IF p_search_query IS NOT NULL AND length(btrim(p_search_query)) > 0 THEN
    where_search := '
      AND (
           j.title       ILIKE ''%'' || $2 || ''%''
        OR j.description ILIKE ''%'' || $2 || ''%''
        OR j.location    ILIKE ''%'' || $2 || ''%''
        OR c.name        ILIKE ''%'' || $2 || ''%''
      )';
  END IF;

  v_sql := format($f$
    WITH filtered AS (
      SELECT
        j.*,
        c.name     AS company_name,
        c.logo_url AS company_logo_url,
        COALESCE(a.count, 0) AS applicant_count,
        EXISTS (
          SELECT 1 FROM public.job_bookmarks jb
          WHERE jb.job_id = j.id AND jb.user_id = $1
        ) AS is_bookmarked
      FROM public.jobs j
      LEFT JOIN public.companies c ON c.id = j.company_id
      LEFT JOIN (
        SELECT job_id, COUNT(*) AS count
        FROM public.job_applications
        GROUP BY job_id
      ) a ON a.job_id = j.id
      WHERE %s %s
    ),
    paged AS (
      SELECT * FROM filtered
      ORDER BY %I %s
      LIMIT $3 OFFSET $4
    )
    SELECT jsonb_build_object(
      'items',       COALESCE(jsonb_agg(to_jsonb(p)), '[]'::jsonb),
      'total_count', (SELECT COUNT(*) FROM filtered)
    )
    FROM paged p;
  $f$,
    CASE WHEN v_is_admin
         THEN 'TRUE'
         ELSE '(j.is_approved = TRUE AND j.is_active = TRUE) OR j.posted_by = $1'
    END,
    where_search,
    sort_col, sort_dir
  );

  EXECUTE v_sql INTO out_json USING v_user_id, p_search_query, p_limit, p_offset;

  IF out_json IS NULL THEN
    out_json := jsonb_build_object('items', '[]'::jsonb, 'total_count', 0);
  END IF;

  RETURN out_json;
END
$_$;


ALTER FUNCTION "public"."get_jobs_with_bookmarks_v2"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_latest_message"("p_conversation_id" "uuid") RETURNS TABLE("message_id" "uuid", "content" "text", "sender_id" "uuid", "sender_name" "text", "created_at" timestamp with time zone, "message_type" character varying, "attachment_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS message_id,
    m.content,
    m.sender_id,
    p.full_name AS sender_name,
    m.created_at,
    m.message_type,
    m.attachment_url
  FROM
    messages m
    JOIN profiles p ON m.sender_id = p.id
  WHERE
    m.conversation_id = p_conversation_id
  ORDER BY
    m.created_at DESC
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_latest_message"("p_conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_membership_map"("p_user" "uuid", "p_group_ids" "uuid"[]) RETURNS TABLE("group_id" "uuid", "is_member" boolean, "is_admin" boolean)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT g.id,
         EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = g.id AND gm.user_id = p_user)              AS is_member,
         (public.is_admin(p_user) OR public.is_group_admin(p_user, g.id))                                            AS is_admin
  FROM public.groups g
  WHERE g.id = ANY(p_group_ids)
$$;


ALTER FUNCTION "public"."get_membership_map"("p_user" "uuid", "p_group_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mentor_contact"("mentor_uuid" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  allowed boolean := false;
  v jsonb := '{}'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Accepted request or active/accepted relationship
  select exists (
    select 1
    from public.mentorship_requests rq
    where rq.mentor_id = mentor_uuid
      and rq.mentee_id = auth.uid()
      and rq.status = 'accepted'
    union
    select 1
    from public.mentorship_relationships rel
    where rel.mentor_id = mentor_uuid
      and rel.mentee_id = auth.uid()
      and rel.status in ('active','accepted')
  ) into allowed;

  if not allowed then
    raise exception 'Access denied: no accepted/active mentorship with this mentor';
  end if;

  -- Return ONLY safe contact info (extend when ready)
  select jsonb_build_object(
    'default_meeting_link', mp.default_meeting_link
  )
  into v
  from public.mentor_profiles mp
  where mp.user_id = mentor_uuid;

  return coalesce(v, '{}'::jsonb);
end;
$$;


ALTER FUNCTION "public"."get_mentor_contact"("mentor_uuid" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentorship_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "program_id" "uuid",
    "mentor_id" "uuid",
    "mentee_id" "uuid",
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "start_date" timestamp with time zone DEFAULT "now"(),
    "end_date" timestamp with time zone,
    "dm_thread_id" "uuid",
    CONSTRAINT "mentorship_relationships_check_end_after_start" CHECK ((("end_date" IS NULL) OR ("end_date" > "start_date"))),
    CONSTRAINT "mentorship_relationships_no_self_mentee" CHECK ((("mentor_id" IS NULL) OR ("mentee_id" IS NULL) OR ("mentor_id" <> "mentee_id"))),
    CONSTRAINT "mentorship_relationships_status_allowed" CHECK ((("status" IS NULL) OR ("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'terminated'::"text", 'terminated_by_user'::"text", 'terminated_by_system'::"text"]))))
);

ALTER TABLE ONLY "public"."mentorship_relationships" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentorship_relationships" OWNER TO "postgres";


COMMENT ON COLUMN "public"."mentorship_relationships"."status" IS 'Allowed statuses: active | completed | terminated | terminated_by_user | terminated_by_system (enforced by CHECK constraint).';



COMMENT ON COLUMN "public"."mentorship_relationships"."dm_thread_id" IS 'Canonical DM thread for this mentorship (mentor_id ↔ mentee_id). Created/maintained by ensure_dm_thread_for_mentorship().';



CREATE OR REPLACE VIEW "public"."v_mentors_public" AS
 SELECT "m"."id",
    "m"."user_id",
    "m"."status",
    "m"."expertise",
    "m"."created_at",
    "p"."full_name",
    "p"."avatar_url",
    "p"."location",
    "p"."is_available_for_mentorship",
    "p"."approval_status",
    "m"."mentoring_experience_years",
    "m"."max_mentees",
    "m"."updated_at",
    "m"."mentoring_capacity_hours_per_month",
    "m"."mentoring_preferences",
    "m"."mentoring_statement",
    "m"."mentoring_experience_description",
    COALESCE("rel"."active_mentees_count", (0)::bigint) AS "current_mentees_count"
   FROM (("public"."mentors" "m"
     JOIN "public"."profiles" "p" ON (("p"."id" = "m"."user_id")))
     LEFT JOIN ( SELECT "mentorship_relationships"."mentor_id",
            "count"(DISTINCT "mentorship_relationships"."mentee_id") AS "active_mentees_count"
           FROM "public"."mentorship_relationships"
          WHERE (("mentorship_relationships"."status" = 'active'::"text") AND ("mentorship_relationships"."end_date" IS NULL))
          GROUP BY "mentorship_relationships"."mentor_id") "rel" ON (("rel"."mentor_id" = "m"."user_id")))
  WHERE (("m"."status" = 'approved'::"text") AND ("p"."approval_status" = 'approved'::"public"."profile_approval_status"));


ALTER TABLE "public"."v_mentors_public" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mentors_for_current_mentee"("p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."v_mentors_public"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  -- Later you can add filters / compatibility. For now, just wrap the view.
  SELECT *
  FROM public.v_mentors_public
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION "public"."get_mentors_for_current_mentee"("p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_expired_jobs"("p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0, "p_search" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "title" "text", "company_name" "text", "location" "text", "job_type" "text", "deadline" timestamp with time zone, "is_approved" boolean, "is_active" boolean, "created_at" timestamp with time zone, "total_count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with mine as (
    select j.id, j.title,
           coalesce(c.name, j.company_name) as company_name,
           j.location, j.job_type,
           coalesce(j.deadline, j.application_deadline, j.expires_at) as deadline,
           j.is_approved, j.is_active, j.created_at
    from public.jobs j
    left join public.companies c on c.id = j.company_id
    where (j.posted_by = auth.uid() or j.created_by = auth.uid())
      and coalesce(j.deadline, j.application_deadline, j.expires_at) < now()
      and (
        p_search is null
        or j.title ilike '%'||p_search||'%'
        or coalesce(c.name, j.company_name) ilike '%'||p_search||'%'
      )
  )
  select *, count(*) over() as total_count
  from mine
  order by deadline desc nulls last
  limit p_limit offset p_offset;
$$;


ALTER FUNCTION "public"."get_my_expired_jobs"("p_limit" integer, "p_offset" integer, "p_search" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_posted_jobs"() RETURNS SETOF "public"."jobs"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select j.*
  from public.get_my_posted_jobs_v2(50,0,null,'created_at','desc') s
  join public.jobs j on j.id = s.id;
$$;


ALTER FUNCTION "public"."get_my_posted_jobs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_posted_jobs"("user_id" "uuid") RETURNS TABLE("id" "uuid", "title" "text", "company_name" "text", "location" "text", "job_type" "text", "salary_range" "text", "description" "text", "posted_by" "uuid", "company_id" "uuid", "created_at" timestamp with time zone, "is_active" boolean, "is_approved" boolean, "external_url" "text", "contact_email" "text")
    LANGUAGE "sql"
    AS $$
  SELECT
    id,
    title,
    company_name,
    location,
    job_type,
    salary_range,
    description,
    posted_by,
    company_id,
    created_at,
    is_active,
    is_approved,
    external_url,
    contact_email
  FROM jobs
  WHERE posted_by = user_id
  ORDER BY created_at DESC;
$$;


ALTER FUNCTION "public"."get_my_posted_jobs"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_posted_jobs"("p_status" "text" DEFAULT NULL::"text", "p_offset" integer DEFAULT 0, "p_limit" integer DEFAULT 50) RETURNS SETOF "public"."jobs"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select *
  from public.jobs j
  where j.posted_by = auth.uid()
    and (p_status is null or j.status = p_status)
  order by j.created_at desc
  offset greatest(p_offset,0)
  limit  greatest(p_limit,1);
$$;


ALTER FUNCTION "public"."get_my_posted_jobs"("p_status" "text", "p_offset" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_posted_jobs"("p_search_query" "text" DEFAULT NULL::"text", "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" "text", "company_name" "text", "company_logo_url" "text", "location" "text", "job_type" "text", "experience_level" "text", "salary_min" bigint, "salary_max" bigint, "application_deadline" timestamp with time zone, "is_active" boolean, "is_approved" boolean, "created_at" timestamp with time zone, "application_url" "text", "source_type" "text", "applicant_count" bigint, "is_bookmarked" boolean, "total_count" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  with base as (
    select
      j.id,
      j.title,
      coalesce(c.name, j.company_name)         as company_name,
      c.logo_url                               as company_logo_url,
      j.location,
      j.job_type,
      j.experience_level,
      j.salary_min,
      j.salary_max,
      j.application_deadline,
      coalesce(j.is_active,  true)             as is_active,
      coalesce(j.is_approved,false)            as is_approved,
      j.created_at,
      public.coalesce_application_url(j.apply_url, j.application_url, j.external_url) as application_url,
      case
        when public.coalesce_application_url(j.apply_url, j.application_url, j.external_url) is not null
          then 'quick_link' else 'in_app'
      end                                        as source_type
    from public.jobs j
    left join public.companies c on c.id = j.company_id
    where j.posted_by = auth.uid()   -- employers see their own posts
      and (
        p_search_query is null or p_search_query = '' or
        j.title ilike '%'||p_search_query||'%' or
        coalesce(c.name, j.company_name) ilike '%'||p_search_query||'%'
      )
  )
  select
    b.id,
    b.title,
    b.company_name,
    b.company_logo_url,
    b.location,
    b.job_type,
    b.experience_level,
    b.salary_min,
    b.salary_max,
    b.application_deadline,
    b.is_active,
    b.is_approved,
    b.created_at,
    b.application_url,
    b.source_type,
    public.in_app_applicant_count(b.id, b.source_type) as applicant_count,
    exists (
      select 1 from public.job_bookmarks jb
      where jb.job_id = b.id and jb.user_id = auth.uid()
    ) as is_bookmarked,
    count(*) over() as total_count
  from base b
  order by
    case when p_sort_by='created_at' and p_sort_order='desc' then b.created_at end desc,
    case when p_sort_by='created_at' and p_sort_order='asc'  then b.created_at end asc
  limit p_limit offset p_offset;
$$;


ALTER FUNCTION "public"."get_my_posted_jobs"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_posted_jobs_for"("p_user_id" "uuid", "p_status" "text" DEFAULT NULL::"text", "p_offset" integer DEFAULT 0, "p_limit" integer DEFAULT 50) RETURNS SETOF "public"."jobs"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select *
  from public.jobs j
  where j.posted_by = p_user_id
    and (p_status is null or j.status = p_status)
  order by j.created_at desc
  offset greatest(p_offset,0)
  limit  greatest(p_limit,1);
$$;


ALTER FUNCTION "public"."get_my_posted_jobs_for"("p_user_id" "uuid", "p_status" "text", "p_offset" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_posted_jobs_paged"("p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" "text", "company_id" "uuid", "company_name" "text", "company_logo_url" "text", "is_approved" boolean, "is_active" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "total_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
WITH mine AS (
  SELECT
    j.id,
    j.title,
    j.company_id,
    COALESCE(c.name, j.company_name) AS company_name,  -- full form OR quick link
    c.logo_url                       AS company_logo_url,
    j.is_approved,
    j.is_active,
    j.created_at,
    j.updated_at
  FROM public.jobs j
  LEFT JOIN public.companies c ON c.id = j.company_id
  WHERE
    j.posted_by = auth.uid()
    OR j.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.companies c2
      WHERE c2.id = j.company_id AND c2.created_by = auth.uid()
    )
),
paged AS (
  SELECT
    m.*,
    COUNT(*) OVER() AS total_count
  FROM mine m
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset
)
SELECT * FROM paged;
$$;


ALTER FUNCTION "public"."get_my_posted_jobs_paged"("p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_posted_jobs_v2"("p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0, "p_search" "text" DEFAULT NULL::"text", "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_dir" "text" DEFAULT 'desc'::"text") RETURNS TABLE("id" "uuid", "title" "text", "company_name" "text", "deadline" timestamp with time zone, "is_approved" boolean, "is_active" boolean, "created_at" timestamp with time zone, "total_count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  with role_name as (
    select coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', 'alumni'
    ) as r
  ),
  mine as (
    select *
    from public.jobs j, role_name rn
    where (rn.r in ('admin','super_admin'))
       or (j.created_by = auth.uid() or j.posted_by = auth.uid())
  ),
  filtered as (
    select * from mine
    where p_search is null
       or title ilike '%'||p_search||'%'
       or company_name ilike '%'||p_search||'%'
       or coalesce(location,'') ilike '%'||p_search||'%'
  ),
  numbered as (
    select *, count(*) over() as total_count from filtered
  )
  select id, title, company_name, deadline, is_approved, is_active, created_at, total_count
  from numbered
  order by
    case when p_sort_by='deadline'   and p_sort_dir='asc'  then deadline end asc nulls last,
    case when p_sort_by='deadline'   and p_sort_dir='desc' then deadline end desc nulls last,
    case when p_sort_by='created_at' and p_sort_dir='asc'  then created_at end asc nulls last,
    case when p_sort_by='created_at' and p_sort_dir='desc' then created_at end desc nulls last,
    id desc
  limit greatest(p_limit,0) offset greatest(p_offset,0);
$$;


ALTER FUNCTION "public"."get_my_posted_jobs_v2"("p_limit" integer, "p_offset" integer, "p_search" "text", "p_sort_by" "text", "p_sort_dir" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_posted_jobs_v2"("p_search_query" "text" DEFAULT NULL::"text", "p_sort_by" "text" DEFAULT 'created_at'::"text", "p_sort_order" "text" DEFAULT 'desc'::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" "text", "company_id" "uuid", "company_name" "text", "company_logo_url" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "is_active" boolean, "is_approved" boolean, "application_url" "text", "source_type" "text", "total_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  with mine as (
    select
      j.id,
      j.title,
      j.company_id,
      coalesce(c.name, j.company_name) as company_name,
      c.logo_url                      as company_logo_url,
      j.created_at,
      j.updated_at,
      j.is_active,
      j.is_approved,
      public.coalesce_application_url(j.apply_url, j.application_url, j.external_url) as application_url,
      public.job_source_type(j.apply_url, j.application_url, j.external_url)          as source_type
    from public.jobs j
    left join public.companies c on c.id = j.company_id
    where j.posted_by = auth.uid()
      and (
        p_search_query is null or p_search_query = '' or
        j.title ilike '%'||p_search_query||'%' or
        coalesce(c.name, j.company_name, '') ilike '%'||p_search_query||'%'
      )
  )
  select
    *,
    count(*) over() as total_count
  from mine
  order by
    case when p_sort_by='created_at' and p_sort_order='desc' then created_at end desc,
    case when p_sort_by='created_at' and p_sort_order='asc'  then created_at end asc,
    case when p_sort_by='title'      and p_sort_order='desc' then title      end desc,
    case when p_sort_by='title'      and p_sort_order='asc'  then title      end asc
  limit p_limit offset p_offset;
$$;


ALTER FUNCTION "public"."get_my_posted_jobs_v2"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Important: This function assumes the 'profiles' table and 'role' column exist.
  -- It fetches the role for the currently authenticated user.
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_role text;
  v_is_admin boolean;
BEGIN
  IF p_user_id IS NULL THEN RETURN 'anon'; END IF;

  SELECT role, is_admin INTO v_role, v_is_admin
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN RETURN 'anon'; END IF;
  IF v_is_admin THEN RETURN 'admin'; END IF;
  IF v_role IS NULL OR trim(v_role) = '' OR v_role = 'user' THEN RETURN 'alumni'; END IF;

  RETURN v_role;
END;
$$;


ALTER FUNCTION "public"."get_user_role"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_bell_worthy"("p_role" "text", "p_type" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_role text := lower(coalesce(p_role, 'alumni'));
  v_type text := lower(coalesce(p_type, 'system'));
BEGIN
  IF v_role IN ('', 'anon', 'user') THEN
    v_role := 'alumni';
  END IF;

  IF v_type IN (
    'rsvp_confirmation',
    'application_submitted',
    'mentorship_reminder',
    'generic_toast'
  ) THEN
    RETURN FALSE;
  END IF;

  IF v_role IN ('alumni', 'student') THEN
    IF v_type IN (
      'connection', 'connection_request',
      'message', 'chat_message',
      'job', 'job_posted', 'job_approved', 'job_applied',
      'application', 'application_status',
      'event', 'event_created', 'event_published',
      'mentorship',
      'system', 'alert'
    ) THEN RETURN TRUE; ELSE RETURN FALSE; END IF;
  END IF;

  IF v_role = 'employer' THEN
    IF v_type IN (
      'connection', 'connection_request',
      'message', 'chat_message',
      'job', 'job_posted', 'job_approved', 'job_applied',
      'application', 'application_status',
      'event', 'event_published',
      'system', 'alert'
    ) THEN RETURN TRUE; ELSE RETURN FALSE; END IF;
  END IF;

  IF v_role = 'mentor' THEN
    IF v_type IN (
      'mentorship',
      'message', 'chat_message',
      'event',
      'system', 'alert'
    ) THEN RETURN TRUE; ELSE RETURN FALSE; END IF;
  END IF;

  IF v_role IN ('admin', 'super_admin') THEN
    IF v_type IN ('alert', 'system') THEN
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;

  IF v_type IN (
    'connection', 'connection_request',
    'message', 'chat_message',
    'job', 'job_posted', 'job_approved', 'job_applied',
    'application', 'application_status',
    'event', 'event_created', 'event_published',
    'mentorship',
    'system', 'alert'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."is_bell_worthy"("p_role" "text", "p_type" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "notification_type" "text" NOT NULL,
    "email_enabled" boolean DEFAULT true,
    "push_enabled" boolean DEFAULT true,
    "in_app_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text",
    "message" "text" NOT NULL,
    "link" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "type" "text" DEFAULT 'system'::"text" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "sender_id" "uuid",
    "event_id" "uuid",
    "profile_id" "uuid",
    "read_at" timestamp with time zone,
    "user_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "body" "text",
    "module" "public"."notification_module",
    "type_enum" "public"."notification_type_enum",
    "idempotency_key" "text",
    CONSTRAINT "chk_notifications_type" CHECK (("btrim"("lower"("type")) = ANY (ARRAY['system'::"text", 'message'::"text", 'event'::"text", 'event_created'::"text", 'event_published'::"text", 'event_updated'::"text", 'job'::"text", 'job_posted'::"text", 'job_approved'::"text", 'job_applied'::"text", 'application'::"text", 'application_status'::"text", 'mentorship'::"text", 'group'::"text", 'connection'::"text", 'resume'::"text", 'alert'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Stores user notifications for the alumni management system';



CREATE OR REPLACE VIEW "public"."bell_notifications" AS
 SELECT "n"."id",
    "n"."recipient_id",
    "n"."type",
    "n"."title",
    "n"."message",
    "n"."link",
    "n"."metadata",
    "n"."is_read",
    "n"."read_at",
    "n"."created_at"
   FROM ("public"."notifications" "n"
     LEFT JOIN "public"."notification_preferences" "p" ON ((("p"."user_id" = "n"."recipient_id") AND ("p"."notification_type" = "n"."type"))))
  WHERE ((COALESCE("p"."in_app_enabled", true) = true) AND (NOT ("lower"(COALESCE("n"."title", ''::"text")) ~~ 'rsvp confirmed%'::"text")) AND "public"."is_bell_worthy"("public"."get_user_role"("n"."recipient_id"), "n"."type", "n"."metadata"))
  ORDER BY "n"."created_at" DESC;


ALTER TABLE "public"."bell_notifications" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_notifications_paginated"("p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS SETOF "public"."bell_notifications"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT *
  FROM public.bell_notifications
  WHERE recipient_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION "public"."get_notifications_paginated"("p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_conversation"("target_user_id" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  a uuid := auth.uid();
  b uuid := target_user_id;
  hash text;
  conv_id bigint;
begin
  if a is null or b is null or a = b then
    raise exception 'Invalid participants';
  end if;

  if a::text < b::text then
    hash := a::text || '|' || b::text;
  else
    hash := b::text || '|' || a::text;
  end if;

  select id into conv_id from public.conversations where peer_hash = hash;
  if conv_id is null then
    insert into public.conversations (is_group, peer_hash)
    values (false, hash)
    returning id into conv_id;

    insert into public.conversation_members (conversation_id, user_id) values (conv_id, a);
    insert into public.conversation_members (conversation_id, user_id) values (conv_id, b);
  end if;

  return conv_id;
end
$$;


ALTER FUNCTION "public"."get_or_create_conversation"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_conversation"("user_1_id" "uuid", "user_2_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare conv_id uuid;
begin
  if user_1_id = user_2_id then
    raise exception 'Cannot create a conversation with yourself';
  end if;

  select c.id into conv_id
  from conversations c
  join conversation_participants p1 on p1.conversation_id = c.id and p1.user_id = user_1_id
  join conversation_participants p2 on p2.conversation_id = c.id and p2.user_id = user_2_id
  limit 1;

  if conv_id is not null then return conv_id; end if;

  insert into conversations default values returning id into conv_id;
  insert into conversation_participants (conversation_id, user_id)
  values (conv_id, user_1_id), (conv_id, user_2_id)
  on conflict do nothing;

  return conv_id;
end;
$$;


ALTER FUNCTION "public"."get_or_create_conversation"("user_1_id" "uuid", "user_2_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_conversation_id"("target_user_id" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.get_or_create_conversation(target_user_id)::text;
$$;


ALTER FUNCTION "public"."get_or_create_conversation_id"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_dm_thread"("p_user1" "uuid", "p_user2" "uuid") RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.dm_get_or_create_thread(p_user1, p_user2);
$$;


ALTER FUNCTION "public"."get_or_create_dm_thread"("p_user1" "uuid", "p_user2" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_approvals"("content_type" "text" DEFAULT 'all'::"text", "limit_count" integer DEFAULT 50) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result jsonb;
  query_text text;
  conditions text := '';
BEGIN
  -- Check if user is admin or super_admin
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'super_admin')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Only administrators can view pending approvals'
    );
  END IF;

  -- Add condition for content_type if not 'all'
  IF content_type != 'all' THEN
    conditions := format('AND content_type = %L', content_type);
  END IF;

  -- Query to get pending approvals from various tables
  query_text := format('
    WITH pending_items AS (
      -- Events pending approval
      SELECT
        events.id as content_id,
        ''events'' as table_name,
        ''event'' as content_type,
        events.title,
        events.description,
        events.created_by,
        events.created_at,
        profiles.full_name as created_by_name
      FROM public.events
      LEFT JOIN public.profiles ON events.created_by = profiles.id
      WHERE events.is_approved = false
      AND events.rejection_reason IS NULL

      UNION ALL

      -- Jobs pending approval
      SELECT
        jobs.id as content_id,
        ''jobs'' as table_name,
        ''job'' as content_type,
        jobs.title,
        jobs.description,
        jobs.created_by,
        jobs.created_at,
        profiles.full_name as created_by_name
      FROM public.jobs
      LEFT JOIN public.profiles ON jobs.created_by = profiles.id
      WHERE jobs.is_approved = false
      AND jobs.rejection_reason IS NULL

      UNION ALL

      -- Groups pending approval
      SELECT
        groups.id as content_id,
        ''groups'' as table_name,
        ''group'' as content_type,
        groups.name as title,
        groups.description,
        groups.created_by,
        groups.created_at,
        profiles.full_name as created_by_name
      FROM public.groups
      LEFT JOIN public.profiles ON groups.created_by = profiles.id
      WHERE groups.is_approved = false
      AND groups.rejection_reason IS NULL

      -- Add other tables as needed
    )
    SELECT jsonb_agg(row_to_json(pending_items))
    FROM pending_items
    WHERE true %s
    ORDER BY created_at DESC
    LIMIT %s
  ', conditions, limit_count);

  EXECUTE query_text INTO result;
  
  -- Handle case when no results are found
  IF result IS NULL THEN
    result := jsonb_build_array();
  END IF;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_pending_approvals"("content_type" "text", "limit_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_pending_approvals"("content_type" "text", "limit_count" integer) IS 'Gets content pending approval. Only admins can call this function';



CREATE OR REPLACE FUNCTION "public"."get_pending_connections_count"() RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  has_recipient boolean;
  has_target    boolean;
  result        bigint;
begin
  select exists(
           select 1 from information_schema.columns
           where table_schema='public' and table_name='connections' and column_name='recipient_id'
         )
    into has_recipient;

  select exists(
           select 1 from information_schema.columns
           where table_schema='public' and table_name='connections' and column_name='target_id'
         )
    into has_target;

  if has_recipient then
    execute $q$
      select count(*)::bigint
      from public.connections
      where recipient_id = auth.uid()
        and status = 'pending'
    $q$ into result;
  elsif has_target then
    execute $q$
      select count(*)::bigint
      from public.connections
      where target_id = auth.uid()
        and status = 'pending'
    $q$ into result;
  else
    -- fallback: count any pending edges I’m part of
    execute $q$
      select count(*)::bigint
      from public.connections
      where status = 'pending'
        and (requester_id = auth.uid()
             or coalesce((to_jsonb(public.connections)->>'recipient_id')::uuid, '00000000-0000-0000-0000-000000000000'::uuid) = auth.uid()
             or coalesce((to_jsonb(public.connections)->>'target_id')::uuid, '00000000-0000-0000-0000-000000000000'::uuid) = auth.uid())
    $q$ into result;
  end if;

  return coalesce(result, 0);
end;
$_$;


ALTER FUNCTION "public"."get_pending_connections_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_content"() RETURNS TABLE("data" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if user is admin/super_admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_admin = true)
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access pending content';
  END IF;

  -- Pending jobs
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', j.id,
    'title', j.title,
    'content_type', 'job',
    'created_at', j.created_at,
    'name', p.full_name,
    'user_id', j.posted_by,
    'status', CASE WHEN j.is_approved THEN 'approved' WHEN NOT j.is_active THEN 'inactive' ELSE 'pending' END,
    'content', j.description
  ) AS data
  FROM jobs j
  JOIN profiles p ON j.posted_by = p.id
  WHERE j.is_approved = false AND j.is_active = true;
  
  -- Pending events
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'content_type', 'event',
    'created_at', e.created_at,
    'name', p.full_name,
    'user_id', e.created_by,
    'status', e.status,
    'content', e.description
  ) AS data
  FROM events e
  JOIN profiles p ON e.created_by = p.id
  WHERE e.status = 'pending_approval';
  
  -- Pending group posts
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', gp.id,
    'title', COALESCE(gp.title, 'Group Post'),
    'content_type', 'group_post',
    'created_at', gp.created_at,
    'name', p.full_name,
    'user_id', gp.user_id,
    'status', gp.status,
    'content', gp.content
  ) AS data
  FROM group_posts gp
  JOIN profiles p ON gp.user_id = p.id
  WHERE gp.status = 'pending_approval'
  ORDER BY gp.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_pending_content"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_contact_details"("target_user_id" "uuid") RETURNS TABLE("profile_id" "uuid", "email" "text", "phone_number" "text", "has_private_email" boolean, "has_private_phone" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_viewer_id   uuid   := auth.uid();
  v_is_admin    boolean := public.app_is_admin();
  v_email_mode  text;
  v_phone_mode  text;
BEGIN
  -- If viewer is not authenticated → reveal nothing
  IF v_viewer_id IS NULL THEN
    RETURN QUERY
    SELECT target_user_id, NULL::text, NULL::text, true, true;
    RETURN;
  END IF;

  -- If self or admin → reveal full contact
  IF v_viewer_id = target_user_id OR v_is_admin THEN
    RETURN QUERY
    SELECT
      p.id AS profile_id,
      p.email,
      COALESCE(p.phone_number, p.phone) AS phone_number,
      false AS has_private_email,
      false AS has_private_phone
    FROM public.profiles p
    WHERE p.id = target_user_id;
    RETURN;
  END IF;

  -- Must be connected
  IF NOT public.are_users_connected(v_viewer_id, target_user_id) THEN
    RETURN QUERY
    SELECT target_user_id, NULL::text, NULL::text, true, true;
    RETURN;
  END IF;

  -- Fetch privacy settings
  SELECT
    COALESCE(p.privacy_settings ->> 'email', 'connections'),
    COALESCE(p.privacy_settings ->> 'phone', 'connections')
  INTO v_email_mode, v_phone_mode
  FROM public.profiles p
  WHERE p.id = target_user_id;

  -- Enforce privacy settings
  RETURN QUERY
  SELECT
    p.id AS profile_id,
    CASE WHEN v_email_mode IN ('public', 'connections') THEN p.email ELSE NULL END AS email,
    CASE WHEN v_phone_mode IN ('public', 'connections')
         THEN COALESCE(p.phone_number, p.phone) ELSE NULL END AS phone_number,
    (v_email_mode NOT IN ('public','connections')) AS has_private_email,
    (v_phone_mode NOT IN ('public','connections')) AS has_private_phone
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$;


ALTER FUNCTION "public"."get_profile_contact_details"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_for_employer"("p_target_id" "uuid", "p_user" "uuid" DEFAULT "auth"."uid"()) RETURNS TABLE("id" "uuid", "full_name" "text", "headline" "text", "current_company" "text", "current_title" "text", "avatar_url" "text", "city" "text", "country" "text", "linkedin_url" "text", "email" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    p.id,

    -- name (TEXT via ->>)
    coalesce(
      to_jsonb(p)->>'full_name',
      to_jsonb(p)->>'name',
      nullif(trim(concat_ws(' ',
        to_jsonb(p)->>'first_name',
        to_jsonb(p)->>'last_name'
      )), '')
    ) as full_name,

    -- headline/title/bio (TEXT)
    coalesce(
      to_jsonb(p)->>'headline',
      to_jsonb(p)->>'title',
      to_jsonb(p)->>'bio'
    ) as headline,

    -- company/employer/organization (TEXT)
    coalesce(
      to_jsonb(p)->>'current_company',
      to_jsonb(p)->>'company',
      to_jsonb(p)->>'organization',
      to_jsonb(p)->>'employer'
    ) as current_company,

    -- job title/designation (TEXT)
    coalesce(
      to_jsonb(p)->>'current_title',
      to_jsonb(p)->>'job_title',
      to_jsonb(p)->>'designation',
      to_jsonb(p)->>'title'
    ) as current_title,

    -- avatar/image (TEXT)
    coalesce(
      to_jsonb(p)->>'avatar_url',
      to_jsonb(p)->>'image_url',
      to_jsonb(p)->>'profile_image_url',
      to_jsonb(p)->>'avatar'
    ) as avatar_url,

    -- location (TEXT)
    coalesce(
      to_jsonb(p)->>'city',
      to_jsonb(p)->>'current_city'
    ) as city,
    coalesce(
      to_jsonb(p)->>'country',
      to_jsonb(p)->>'current_country'
    ) as country,

    -- socials / email (TEXT)
    coalesce(
      to_jsonb(p)->>'linkedin_url',
      to_jsonb(p)->>'linkedin',
      to_jsonb(p)->>'linkedin_profile'
    ) as linkedin_url,
    coalesce(
      to_jsonb(p)->>'email',
      to_jsonb(p)->>'contact_email'
    ) as email

  from public.profiles p
  where p.id = p_target_id
    and public.can_employer_view_profile(p_target_id, p_user);
$$;


ALTER FUNCTION "public"."get_profile_for_employer"("p_target_id" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recent_activity"("p_limit" integer DEFAULT 5) RETURNS TABLE("activity_type" "text", "title" "text", "ref_id" "uuid", "url" "text", "created_at" timestamp with time zone, "meta" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with u as (select auth.uid() as uid)
  select
    l.action::text                          as activity_type,
    -- Construct a human-friendly title from action + route
    (initcap(replace(l.action, '_',' ')) ||
      case when coalesce(l.route,'') <> '' then ' • ' || l.route else '' end
    )::text                                  as title,
    null::uuid                               as ref_id,
    null::text                               as url,
    l.created_at                             as created_at,
    coalesce(l.meta, '{}'::jsonb)            as meta
  from public.user_activity_logs l
  join u on l.user_id = u.uid
  order by l.created_at desc
  limit greatest(p_limit,1);
$$;


ALTER FUNCTION "public"."get_recent_activity"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_role_by_name"("role_name" "text") RETURNS TABLE("id" "uuid", "name" "text", "description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY SELECT r.id, r.name, r.description FROM roles r WHERE r.name = role_name;
END;
$$;


ALTER FUNCTION "public"."get_role_by_name"("role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_role_counts_for_user"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  is_admin_user boolean;
  result jsonb;
BEGIN
  -- Check if caller is admin
  is_admin_user := public._is_admin(auth.uid());

  IF is_admin_user THEN
    -- Admin sees ALL profiles with breakdown
    result := public.get_all_profiles_count_by_role_admin();
  ELSE
    -- Non-admin sees only approved, directory-visible counts
    result := public.get_directory_role_counts();
  END IF;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_role_counts_for_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_role_counts_for_user"() IS 'Returns role counts based on caller privileges: admins see all (pending/approved/rejected), others see only approved directory-visible counts.';



CREATE OR REPLACE FUNCTION "public"."get_role_id_by_name"("role_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  role_id UUID;
BEGIN
  SELECT id INTO role_id FROM roles WHERE name = role_name;
  RETURN role_id;
END;
$$;


ALTER FUNCTION "public"."get_role_id_by_name"("role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_roles"() RETURNS TABLE("id" "uuid", "name" "text", "description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY SELECT r.id, r.name, r.description FROM roles r;
END;
$$;


ALTER FUNCTION "public"."get_roles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_signed_avatar_url"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  -- Simple, safe version:
  -- Just return whatever is in profiles.avatar_url for this user.
  SELECT avatar_url
  FROM public.profiles
  WHERE id = p_user_id;
$$;


ALTER FUNCTION "public"."get_signed_avatar_url"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_signed_avatar_url"("p_user_id" "uuid") IS 'Returns avatar_url from profiles for the given user. For now this is a direct URL (public bucket or OAuth/custom).';



CREATE OR REPLACE FUNCTION "public"."get_signed_avatar_urls"("p_user_ids" "uuid"[]) RETURNS TABLE("user_id" "uuid", "avatar_url" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  -- Simple batch version:
  -- Returns (user_id, avatar_url) rows for all given ids.
  SELECT id AS user_id, avatar_url
  FROM public.profiles
  WHERE id = ANY (p_user_ids);
$$;


ALTER FUNCTION "public"."get_signed_avatar_urls"("p_user_ids" "uuid"[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_signed_avatar_urls"("p_user_ids" "uuid"[]) IS 'Batch avatar lookup. Returns avatar_url as stored for each user_id.';



CREATE OR REPLACE FUNCTION "public"."get_table_columns"("table_name" "text") RETURNS TABLE("column_name" "text", "data_type" "text", "is_nullable" boolean, "column_default" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.column_name::text,
    c.data_type::text,
    (c.is_nullable = 'YES')::boolean,
    c.column_default::text
  FROM
    information_schema.columns c
  WHERE
    c.table_schema = 'public'
    AND c.table_name = table_name
  ORDER BY
    c.ordinal_position;
END;
$$;


ALTER FUNCTION "public"."get_table_columns"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_total_alumni"("include_nonpublic" boolean DEFAULT false) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_count bigint;
begin
  select count(*) into v_count
  from public.profiles p
  where p.is_approved is true
    and p.role in ('alumni')           -- add 'student','mentor' if they should be included
    and (include_nonpublic or coalesce(p.is_public, true) is true);
  return v_count;
end;
$$;


ALTER FUNCTION "public"."get_total_alumni"("include_nonpublic" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_types"("tname" "text") RETURNS TABLE("column_name" "text", "data_type" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT column_name::text, data_type::text FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = %L ORDER BY ordinal_position',
    tname
  );
END;
$$;


ALTER FUNCTION "public"."get_types"("tname" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_message_count"("conv_id" "uuid", "user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  count_val INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count_val
  FROM messages
  WHERE conversation_id = conv_id
    AND sender_id != user_id
    AND read_at IS NULL;
  
  RETURN count_val;
END;
$$;


ALTER FUNCTION "public"."get_unread_message_count"("conv_id" "uuid", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notifications_count"() RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select count(*)::int from public.notifications n
  where n.user_id = auth.uid() and n.read_at is null;
$$;


ALTER FUNCTION "public"."get_unread_notifications_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notifications_count"("profile_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM public.notifications
  WHERE profile_id = profile_uuid AND is_read = FALSE;
  
  RETURN count;
END;
$$;


ALTER FUNCTION "public"."get_unread_notifications_count"("profile_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notifications_count_by_type"() RETURNS TABLE("type" "text", "unread_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select n.type::text, count(*)::bigint
  from public.notifications n
  where n.recipient_id = auth.uid()
    and coalesce(n.is_read, false) = false
  group by n.type
  order by n.type;
$$;


ALTER FUNCTION "public"."get_unread_notifications_count_by_type"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_notifications_count_by_type"("type_filter" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_count integer := 0;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  IF type_filter IS NULL OR type_filter = '' OR lower(type_filter) = 'all' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.notifications n
    WHERE n.recipient_id = v_uid
      AND COALESCE(n.is_read, false) = false;
  ELSE
    SELECT COUNT(*) INTO v_count
    FROM public.notifications n
    WHERE n.recipient_id = v_uid
      AND COALESCE(n.is_read, false) = false
      AND n.type = type_filter;
  END IF;

  RETURN v_count;
END
$$;


ALTER FUNCTION "public"."get_unread_notifications_count_by_type"("type_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_analytics"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  viewer uuid := coalesce(p_user_id, auth.uid());
  is_admin boolean := exists (
    select 1 from public.profiles p
    where p.id = viewer and p.role in ('admin','superadmin')
  );
  out_json jsonb;
begin
  if is_admin then
    select jsonb_build_object(
      'totalUsers',       (select count(*) from public.profiles),
      'activeUsers30d',   (select count(distinct user_id) from public.user_activity_logs where created_at >= now() - interval '30 days'),
      'jobsPosted',       (select count(*) from public.jobs),
      'activeJobs',       (select count(*) from public.jobs where status = 'active'),
      'usersByRole',      (select jsonb_object_agg(role, cnt) from (
                             select role, count(*)::int cnt
                             from public.profiles group by role
                           ) r)
    ) into out_json;
    return out_json;
  end if;

  -- Per-user view
  select jsonb_build_object(
    'applications',      (select count(*) from public.job_applications ja where ja.applicant_id = viewer),
    'jobsPosted',        (select count(*) from public.jobs j where j.created_by = viewer),
    'activeJobs',        (select count(*) from public.jobs j where j.created_by = viewer and j.status='active'),
    'messagesSent',      (select count(*) from public.messages m where m.sender_id = viewer),
    'messagesReceived',  (select count(*) from public.messages m where m.recipient_id = viewer),
    'lastActivity',      (select max(created_at) from public.user_activity_logs where user_id = viewer)
  ) into out_json;

  return out_json;
end;
$$;


ALTER FUNCTION "public"."get_user_analytics"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_analytics_old_109720"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if user is admin/super_admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_admin = true)
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access analytics';
  END IF;

  SELECT jsonb_build_object(
    'registrationsByDate', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', to_char(created_at::date, 'YYYY-MM-DD'),
          'count', count(*)
        )
      )
      FROM auth.users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY created_at::date
      ORDER BY created_at::date
    ),
    'activeUsersByDay', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', to_char(last_sign_in_at::date, 'YYYY-MM-DD'),
          'count', count(*)
        )
      )
      FROM auth.users
      WHERE last_sign_in_at >= NOW() - INTERVAL '30 days'
      GROUP BY last_sign_in_at::date
      ORDER BY last_sign_in_at::date
    ),
    'userGrowth', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'month', to_char(month_date, 'YYYY-MM'),
          'count', user_count
        )
      )
      FROM (
        SELECT 
          date_trunc('month', created_at) as month_date,
          count(*) as user_count
        FROM auth.users
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month_date
        ORDER BY month_date
      ) monthly_growth
    )
  ) INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_user_analytics_old_109720"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_analytics_old_109720"() IS 'Returns analytics data about user registrations and activities for admin dashboard';



CREATE OR REPLACE FUNCTION "public"."get_user_conversations"() RETURNS TABLE("conversation_id" "uuid", "last_updated" timestamp with time zone, "participants" "jsonb", "last_message_content" "text", "last_message_created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH user_conversations AS (
        -- Get all conversations the current user is a part of
        SELECT cp.conversation_id
        FROM public.conversation_participants cp
        WHERE cp.user_id = auth.uid()
    ),
    conversation_participants_details AS (
        -- Get details of all participants in those conversations, excluding the current user
        SELECT
            cp.conversation_id,
            jsonb_agg(jsonb_build_object('id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url)) AS participants
        FROM public.conversation_participants cp
        JOIN public.profiles p ON cp.user_id = p.id
        WHERE cp.conversation_id IN (SELECT uc.conversation_id FROM user_conversations)
          AND cp.user_id <> auth.uid()
        GROUP BY cp.conversation_id
    ),
    last_messages AS (
        -- Get the last message for each conversation using a window function
        SELECT
            m.conversation_id,
            m.content,
            m.created_at
        FROM (
            SELECT
                m.conversation_id,
                m.content,
                m.created_at,
                ROW_NUMBER() OVER(PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
            FROM public.messages m
            WHERE m.conversation_id IN (SELECT uc.conversation_id FROM user_conversations)
        ) m
        WHERE m.rn = 1
    )
    -- Final SELECT to join everything together
    SELECT
        c.id AS conversation_id,
        c.updated_at AS last_updated,
        cpd.participants,
        lm.content AS last_message_content,
        lm.created_at AS last_message_created_at
    FROM public.conversations c
    JOIN user_conversations uc ON c.id = uc.conversation_id
    LEFT JOIN conversation_participants_details cpd ON c.id = cpd.conversation_id
    LEFT JOIN last_messages lm ON c.id = lm.conversation_id
    ORDER BY c.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_conversations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_conversations_v2"("p_user_id" "uuid") RETURNS TABLE("conversation_id" "uuid", "last_message_at" timestamp with time zone, "created_at" timestamp with time zone, "participant_id" "uuid", "participant_name" "text", "participant_avatar" "text", "is_online" boolean, "unread_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH user_conversations AS (
    SELECT cp.conversation_id
    FROM conversation_participants cp
    WHERE cp.user_id = p_user_id
  )
  SELECT
    c.id,
    c.last_message_at,
    c.created_at,
    other_participant.user_id,
    p.full_name,
    p.avatar_url,
    COALESCE(p.is_online, FALSE),
    (
      SELECT COUNT(*)
      FROM public.messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id != p_user_id
        AND m.read_at IS NULL
    ) AS unread_count
  FROM conversations c
  JOIN user_conversations uc ON c.id = uc.conversation_id
  JOIN conversation_participants other_participant ON c.id = other_participant.conversation_id AND other_participant.user_id != p_user_id
  JOIN profiles p ON other_participant.user_id = p.id
  ORDER BY c.last_message_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_conversations_v2"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_permissions"("profile_uuid" "uuid") RETURNS TABLE("permission_name" "text", "permission_description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT permissions.name, permissions.description
  FROM permissions
  WHERE permissions.id IN (
    SELECT permission_id 
    FROM role_permissions
    WHERE role_permissions.role_id IN (
      SELECT role_id 
      FROM user_roles
      WHERE user_roles.profile_id = profile_uuid
    )
  );
END;
$$;


ALTER FUNCTION "public"."get_user_permissions"("profile_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_permissions_bypass_rls"("profile_uuid" "uuid") RETURNS TABLE("permission_name" "text", "permission_description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.description
  FROM permissions p
  JOIN role_permissions rp ON p.id = rp.permission_id
  JOIN user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.profile_id = profile_uuid;
END;
$$;


ALTER FUNCTION "public"."get_user_permissions_bypass_rls"("profile_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce((select role::text from public.profiles where id = auth.uid()), 'alumni')
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_roles_bypass_rls"("profile_uuid" "uuid") RETURNS TABLE("role_name" "text", "role_description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, r.description
  FROM roles r
  JOIN user_roles ur ON r.id = ur.role_id
  WHERE ur.profile_id = profile_uuid;
END;
$$;


ALTER FUNCTION "public"."get_user_roles_bypass_rls"("profile_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_view_columns"("view_name" "text") RETURNS TABLE("column_name" "text", "data_type" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.attname::text,
    pg_catalog.format_type(a.atttypid, a.atttypmod)
  FROM
    pg_catalog.pg_attribute a
  JOIN
    pg_catalog.pg_class c ON a.attrelid = c.oid
  WHERE
    c.relname = view_name
    AND a.attnum > 0
    AND NOT a.attisdropped;
END;
$$;


ALTER FUNCTION "public"."get_view_columns"("view_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."group_admin_set_membership"("p_group_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_role" "text" DEFAULT 'member'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- only group admins (or platform admins)
  if not (public.is_group_admin(p_group_id, auth.uid()) or public.is_platform_admin(auth.uid())) then
    raise exception 'Not authorized';
  end if;

  -- never allow employers to be in groups
  if public.is_employer(p_user_id) then
    raise exception 'Employers cannot be added to groups';
  end if;

  -- upsert the membership request row to desired status
  insert into public.group_memberships (group_id, user_id, status, role)
  values (p_group_id, p_user_id, p_status, p_role)
  on conflict (group_id, user_id)
  do update set status = excluded.status, role = excluded.role, created_at = now();

  -- sync active membership table
  if lower(p_status) = 'approved' then
    insert into public.group_members (group_id, user_id, role)
    values (p_group_id, p_user_id, coalesce(p_role,'member'))
    on conflict (group_id, user_id) do update
      set role = excluded.role;  -- allow promote/demote on approve
  else
    -- rejected or removed: ensure not present as active member
    delete from public.group_members
    where group_id = p_group_id and user_id = p_user_id;
  end if;
end $$;


ALTER FUNCTION "public"."group_admin_set_membership"("p_group_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."groups_sync_visibility"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.visibility := case when new.is_private then 'private' else 'public' end;
  return new;
end $$;


ALTER FUNCTION "public"."groups_sync_visibility"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_groups_moderation_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  v_is_site_admin boolean := public.is_admin(auth.uid());
  v_is_group_admin boolean := public.is_group_admin(auth.uid(), coalesce(new.id, old.id));
begin
  -- Approval gate: ONLY site admins may change approval fields
  if (new.is_approved      is distinct from old.is_approved)
     or (new.approval_status is distinct from old.approval_status) then
    if not v_is_site_admin then
      raise exception 'Only site admins can change approval fields';
    end if;
  end if;

  -- Archive gate: site admins OR group admins may toggle archive
  if (new.is_archived is distinct from old.is_archived) then
    if not (v_is_site_admin or v_is_group_admin) then
      raise exception 'Only site admins or group admins can archive/unarchive a group';
    end if;
  end if;

  -- Name normalization keeps in sync (in case caller missed it)
  if new.name is distinct from old.name then
    new.name_norm := lower(trim(new.name));
  end if;

  return new;
end $$;


ALTER FUNCTION "public"."guard_groups_moderation_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_jobs_defaults"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.posted_by IS NULL THEN NEW.posted_by := auth.uid(); END IF;
  IF NEW.is_active IS NULL THEN NEW.is_active := TRUE;      END IF;
  RETURN NEW;
END $$;


ALTER FUNCTION "public"."handle_jobs_defaults"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_mentor_rejection"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Turn off availability
  update profiles
     set is_available_for_mentorship = false
   where id = new.user_id;

  -- Auto-cancel pending requests
  update mentorship_requests
     set status = 'cancelled_by_system'
   where mentor_id = new.user_id
     and status = 'pending';

  -- Terminate active relationships
  update mentorship_relationships
     set status = 'terminated_by_system',
         end_date = now()
   where mentor_id = new.user_id
     and status = 'active';

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_mentor_rejection"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  oauth_avatar_url text;
BEGIN
  -- Try to grab avatar URL from OAuth providers
  oauth_avatar_url := COALESCE(
    new.raw_user_meta_data->>'avatar_url', -- some providers
    new.raw_user_meta_data->>'picture'     -- Google
  );

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    approval_status,
    show_in_directory,
    is_deleted,
    created_at,
    avatar_url
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    COALESCE(NULLIF(new.raw_user_meta_data->>'role', '')::app_role_enum, 'alumni'),
    'pending',
    true,
    false,
    NOW(),
    oauth_avatar_url
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Creates profile on user signup. Extracts OAuth avatar URL from raw_user_meta_data (Google picture, LinkedIn avatar_url). NOTE: OAuth URLs expire; frontend should later download and re-upload to our storage.';



CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("user_id" "uuid", "permission_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  has_perm boolean;
BEGIN
  SELECT CASE
           WHEN role = 'super_admin' THEN true
           WHEN role = 'admin' AND permission_name NOT IN ('assign_super_admin') THEN true
           WHEN role = 'employer' AND permission_name IN ('post_job', 'manage_company') THEN true
           WHEN role = 'alumni'   AND permission_name IN ('apply_job', 'attend_event', 'send_message') THEN true
           WHEN role = 'student'  AND permission_name IN ('apply_job', 'attend_event', 'send_message') THEN true
           ELSE false
         END
    INTO has_perm
  FROM public.profiles
  WHERE id = user_id;

  RETURN COALESCE(has_perm, false);
END;
$$;


ALTER FUNCTION "public"."has_permission"("user_id" "uuid", "permission_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."has_permission"("user_id" "uuid", "permission_name" "text") IS 'Checks if a user has a specific permission based on their role';



CREATE OR REPLACE FUNCTION "public"."in_app_applicant_count"("p_job_id" "uuid", "p_source" "text") RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select case
           when p_source = 'in_app'
             then (select count(*)::bigint
                   from public.job_applications ja
                   where ja.job_id = p_job_id)
           else 0::bigint
         end;
$$;


ALTER FUNCTION "public"."in_app_applicant_count"("p_job_id" "uuid", "p_source" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."init_my_notification_prefs"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid uuid := auth.uid();
  t public.notification_type_enum;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  foreach t in array enum_range(null::public.notification_type_enum)
  loop
    insert into public.notification_preferences(user_id, type)
    values (v_uid, t)
    on conflict (user_id, type) do nothing;
  end loop;
end;
$$;


ALTER FUNCTION "public"."init_my_notification_prefs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invite_member_by_email"("p_group_id" "uuid", "p_email" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_user uuid; v_role text; v_is_private boolean; v_status text;
begin
  if not public.can_manage_group(p_group_id, auth.uid()) then
    raise exception 'Not permitted';
  end if;

  select id, role::text into v_user, v_role
  from public.profiles
  where lower(email)=lower(p_email);

  if v_user is null then raise exception 'User not found'; end if;
  if v_role='employer' then raise exception 'Employers cannot be invited to groups'; end if;

  select is_private into v_is_private from public.groups where id=p_group_id;
  v_status := case when v_is_private then 'pending' else 'active' end;

  insert into public.group_members (group_id,user_id,role,status)
  values (p_group_id, v_user, 'member', v_status)
  on conflict (group_id,user_id) do update set status=excluded.status;

  return v_status;
end; $$;


ALTER FUNCTION "public"."invite_member_by_email"("p_group_id" "uuid", "p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select public.is_user_admin(p_user_id) or public.fc_is_admin();
$$;


ALTER FUNCTION "public"."is_admin"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_like"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce((select role in ('admin','super_admin')
                   from public.profiles
                   where id = auth.uid()), false)
$$;


ALTER FUNCTION "public"."is_admin_like"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_like"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select coalesce((
    select (p.role in ('admin','super_admin')) or coalesce(p.is_admin,false)
    from public.profiles p
    where p.id = p_user_id
  ), false);
$$;


ALTER FUNCTION "public"."is_admin_like"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_connected"("a" "uuid", "b" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.connections c
    where c.status = 'accepted'
      and (
        (c.requester_id = a and c.recipient_id = b) or
        (c.requester_id = b and c.recipient_id = a)
      )
  );
$$;


ALTER FUNCTION "public"."is_connected"("a" "uuid", "b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_conversation_participant"("p_conversation_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id
      AND cp.user_id        = p_user_id
  );
$$;


ALTER FUNCTION "public"."is_conversation_participant"("p_conversation_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_employer"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$ select coalesce(public.current_role_text(p_user_id) = 'employer', false) $$;


ALTER FUNCTION "public"."is_employer"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_employer_user"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists(select 1 from public.profiles p where p.id = p_user_id and p.role = 'employer');
$$;


ALTER FUNCTION "public"."is_employer_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_admin"("p_group_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select
    public.is_platform_admin(p_user_id)
    or exists (
      select 1
      from public.group_members m
      where m.group_id = p_group_id and m.user_id = p_user_id and m.role = 'admin'
    );
$$;


ALTER FUNCTION "public"."is_group_admin"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_manager"("p_group_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_exists boolean;
begin
  select exists(
    select 1
    from public.group_memberships
    where group_id = p_group_id
      and user_id  = auth.uid()
      and role     in ('owner','admin')
      and status   = 'approved'
  ) into v_exists;
  return v_exists;
end $$;


ALTER FUNCTION "public"."is_group_manager"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_member"("p_group_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_exists boolean;
begin
  select exists(
    select 1
    from public.group_memberships
    where group_id = p_group_id
      and user_id = auth.uid()
      and status  = 'approved'
  ) into v_exists;
  return v_exists;
end $$;


ALTER FUNCTION "public"."is_group_member"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_member"("p_user_id" "uuid", "p_group_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id  = p_user_id
  );
END;
$$;


ALTER FUNCTION "public"."is_group_member"("p_user_id" "uuid", "p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_member_of_group"("p_group_id" "uuid", "p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."is_member_of_group"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_mentee_below_program_limit"("p_mentee_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  WITH active_relationships AS (
    SELECT DISTINCT mentor_id
    FROM public.mentorship_relationships
    WHERE mentee_id = p_mentee_id
      AND status = 'active'
  ),
  pending_or_accepted_requests AS (
    SELECT DISTINCT mentor_id
    FROM public.mentorship_requests
    WHERE mentee_id = p_mentee_id
      AND status IN ('pending', 'accepted')
  ),
  all_programs AS (
    SELECT mentor_id FROM active_relationships
    UNION
    SELECT mentor_id FROM pending_or_accepted_requests
  )
  SELECT COUNT(*) < 5
  FROM all_programs;
$$;


ALTER FUNCTION "public"."is_mentee_below_program_limit"("p_mentee_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_mentor_selectable"("p_mentor_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  -- From profiles
  v_profile_approved    boolean;
  v_profile_deleted     boolean;
  v_profile_active      boolean;
  v_profile_available   boolean;
  v_profile_max_mentees integer;

  -- From mentors
  v_has_mentor_row      boolean := false;
  v_mentor_status       text;
  v_mentor_max_mentees  integer;

  -- Capacity
  v_max_mentees         integer;
  v_current_mentees     integer;
BEGIN
  -- 1) Basic profile health
  SELECT
    (approval_status = 'approved')         AS profile_approved,
    COALESCE(is_deleted, false)           AS profile_deleted,
    COALESCE(is_active, true)             AS profile_active,
    COALESCE(is_available_for_mentorship, false) AS profile_available,
    max_mentees
  INTO
    v_profile_approved,
    v_profile_deleted,
    v_profile_active,
    v_profile_available,
    v_profile_max_mentees
  FROM public.profiles
  WHERE id = p_mentor_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT v_profile_approved OR v_profile_deleted OR NOT v_profile_active THEN
    RETURN false;
  END IF;

  -- 2) Mentor row must exist and be approved
  SELECT
    TRUE,
    status,
    max_mentees
  INTO
    v_has_mentor_row,
    v_mentor_status,
    v_mentor_max_mentees
  FROM public.mentors
  WHERE user_id = p_mentor_id;

  IF NOT v_has_mentor_row THEN
    RETURN false;
  END IF;

  IF v_mentor_status <> 'approved' THEN
    RETURN false;
  END IF;

  -- 3) Availability: use profiles.is_available_for_mentorship as the single toggle
  IF NOT v_profile_available THEN
    RETURN false;
  END IF;

  -- 4) Capacity: prefer mentors.max_mentees, fallback to profiles.max_mentees, then 5
  v_max_mentees := COALESCE(v_mentor_max_mentees, v_profile_max_mentees, 5);

  SELECT COUNT(*)
  INTO v_current_mentees
  FROM public.mentorship_relationships
  WHERE mentor_id = p_mentor_id
    AND status = 'active';

  IF v_current_mentees >= v_max_mentees THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."is_mentor_selectable"("p_mentor_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_platform_admin"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$ select coalesce(public.current_role_text(p_user_id) in ('admin','super_admin'), false) $$;


ALTER FUNCTION "public"."is_platform_admin"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_profile_verified"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(
    (select p.is_verified from public.profiles p where p.id = uid),
    (select p.is_approved from public.profiles p where p.id = uid),
    (select (p.approval_status = 'approved') from public.profiles p where p.id = uid),
    false
  );
$$;


ALTER FUNCTION "public"."is_profile_verified"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_site_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
  );
$$;


ALTER FUNCTION "public"."is_site_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
  );
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"("uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'super_admin'
  );
$$;


ALTER FUNCTION "public"."is_super_admin"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_admin"("p_user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT public.app_is_admin_of(p_user_id)
$$;


ALTER FUNCTION "public"."is_user_admin"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_valid_application_target"("t" "text") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $_$
  select
    case
      when t is null then false
      when t ~* '^(https?://).+' then true
      when t ~* '^(mailto:).+'   then true
      when t ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then true
      else false
    end
$_$;


ALTER FUNCTION "public"."is_valid_application_target"("t" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."job_is_owned_by_me"("p_job_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.jobs j
    where j.id = p_job_id
      and (j.posted_by = auth.uid() or j.created_by = auth.uid())
  );
$$;


ALTER FUNCTION "public"."job_is_owned_by_me"("p_job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."job_is_owned_by_user"("p_job_id" "uuid", "p_user" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists(
    select 1
    from public.jobs j
    where j.id = p_job_id
      and coalesce(
            (to_jsonb(j)->>'employer_id')::uuid,
            (to_jsonb(j)->>'owner_id')::uuid,
            (to_jsonb(j)->>'created_by')::uuid,
            (to_jsonb(j)->>'posted_by')::uuid
          ) = p_user
  );
$$;


ALTER FUNCTION "public"."job_is_owned_by_user"("p_job_id" "uuid", "p_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."job_source_type"("apply_url" "text", "application_url" "text", "external_url" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $_$
  select case
    when public.is_valid_application_target(public.coalesce_application_url($1,$2,$3)) then 'quick_link'
    else 'in_app'
  end
$_$;


ALTER FUNCTION "public"."job_source_type"("apply_url" "text", "application_url" "text", "external_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jobs_before_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.posted_by is null then
    new.posted_by := auth.uid();
  end if;

  -- No longer copy profile.avatar_url into companies.logo_url here.
  return new;
end
$$;


ALTER FUNCTION "public"."jobs_before_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jobs_before_insert_company"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.company_id is null then
    new.company_id := public.ensure_employer_company();
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."jobs_before_insert_company"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jobs_normalize_external_targets"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
begin
  -- trim blanks to NULL
  if new.apply_url is not null and btrim(new.apply_url) = '' then new.apply_url := null; end if;
  if new.application_url is not null and btrim(new.application_url) = '' then new.application_url := null; end if;
  if new.external_url is not null and btrim(new.external_url) = '' then new.external_url := null; end if;

  -- if a bare email ends up in application_url, convert to mailto:
  if new.application_url ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    new.application_url := 'mailto:' || new.application_url;
  end if;

  return new;
end$_$;


ALTER FUNCTION "public"."jobs_normalize_external_targets"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jobs_set_creator"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  if new.posted_by is null then
    new.posted_by := auth.uid();
  end if;
  if new.status is null then
    new.status := 'pending'; -- change to 'published' if you prefer
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."jobs_set_creator"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jobs_set_logo_url"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_company_logo text;
BEGIN
  -- 1. If caller explicitly set logo_url, respect it
  IF NEW.logo_url IS NOT NULL AND btrim(NEW.logo_url) <> '' THEN
    RETURN NEW;
  END IF;

  -- 2. Otherwise, if company_id is present, copy company logo
  IF NEW.company_id IS NOT NULL THEN
    SELECT c.logo_url
    INTO v_company_logo
    FROM public.companies c
    WHERE c.id = NEW.company_id;

    IF v_company_logo IS NOT NULL AND btrim(v_company_logo) <> '' THEN
      NEW.logo_url := v_company_logo;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."jobs_set_logo_url"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jobs_set_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.created_by is null then new.created_by := auth.uid(); end if;
  if new.posted_by  is null then new.posted_by  := auth.uid(); end if;
  return new;
end$$;


ALTER FUNCTION "public"."jobs_set_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jobs_set_salary_range"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.salary_min IS NULL AND NEW.salary_max IS NULL THEN
    IF TG_OP = 'INSERT' AND NEW.salary_range IS NULL THEN
      NEW.salary_range := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.salary_min IS NOT NULL AND NEW.salary_max IS NOT NULL THEN
    NEW.salary_range := '₹' || public.format_inr(NEW.salary_min) || ' - ₹' || public.format_inr(NEW.salary_max);
  ELSIF NEW.salary_min IS NOT NULL THEN
    NEW.salary_range := '₹' || public.format_inr(NEW.salary_min) || '+';
  ELSE
    NEW.salary_range := 'Up to ₹' || public.format_inr(NEW.salary_max);
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."jobs_set_salary_range"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."jobs_sync_flags_from_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.approval_status = 'approved' THEN
    NEW.is_approved := true;
    NEW.is_rejected := false;
  ELSIF NEW.approval_status = 'rejected' THEN
    NEW.is_approved := false;
    NEW.is_rejected := true;
  ELSE
    NEW.is_approved := false;
    NEW.is_rejected := false;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."jobs_sync_flags_from_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_group_v2"("p_group_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_role text := public.app_role_of(auth.uid());
  v_is_private boolean;
begin
  if v_role = 'employer' then
    raise exception 'Employers cannot join groups';
  end if;

  select g.is_private into v_is_private
  from public.groups g
  where g.id = p_group_id;

  if exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = auth.uid() and m.status = 'active'
  ) then
    return 'active';
  end if;

  if exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = auth.uid() and m.status = 'pending'
  ) then
    return 'pending';
  end if;

  insert into public.group_members (group_id, user_id, role, status)
  values (p_group_id, auth.uid(), 'member', case when v_is_private then 'pending' else 'active' end)
  on conflict (group_id, user_id) do nothing;

  return case when v_is_private then 'pending' else 'active' end;
end;
$$;


ALTER FUNCTION "public"."join_group_v2"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_group"("p_group_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_is_admin boolean; v_admins int;
begin
  select exists(
    select 1 from public.group_members
    where group_id=p_group_id and user_id=auth.uid()
      and status='active' and role in ('owner','admin')
  ) into v_is_admin;

  if v_is_admin then
    select count(*) into v_admins
    from public.group_members
    where group_id=p_group_id and status='active' and role in ('owner','admin');
    if v_admins<=1 then
      raise exception 'You are the last admin; assign another admin before leaving';
    end if;
  end if;

  delete from public.group_members
  where group_id=p_group_id and user_id=auth.uid();
end; $$;


ALTER FUNCTION "public"."leave_group"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_pending_members"("p_group_id" "uuid") RETURNS TABLE("user_id" "uuid", "requested_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select m.user_id, m.created_at
  from public.group_members m
  where m.group_id=p_group_id and m.status='pending'
    and public.can_manage_group(p_group_id, auth.uid());
$$;


ALTER FUNCTION "public"."list_pending_members"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_tables"() RETURNS TABLE("table_name" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select table_name
    from information_schema.tables
   where table_schema = 'public'
     and table_type = 'BASE TABLE';
$$;


ALTER FUNCTION "public"."list_tables"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_connection_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if tg_op = 'update' and old.status is distinct from new.status then
    insert into activity_log(user_id, activity_type, description, metadata, created_at)
    values (
      coalesce(new.requester_id, old.requester_id),
      'connection_'||lower(new.status),
      'Connection status changed',
      jsonb_build_object('connection_id', new.id, 'recipient_id', new.recipient_id, 'requester_id', new.requester_id),
      now()
    );
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."log_connection_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_group_leave"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into activity_log(user_id, activity_type, description, metadata, created_at)
  values (old.user_id, 'group_left', 'Left a group',
          jsonb_build_object('group_id', old.group_id, 'group_name', (select name from groups where id = old.group_id)),
          now());
  return old;
end$$;


ALTER FUNCTION "public"."log_group_leave"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_profile_approval_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Legacy trigger now a no-op: admin_update_profile_approval writes full audit rows.
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_profile_approval_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_profile_approval_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_changed_by uuid;
BEGIN
  -- Try to get current user id, if available
  BEGIN
    v_changed_by := auth.uid();
  EXCEPTION
    WHEN others THEN
      v_changed_by := NULL;
  END;

  IF (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
     OR (COALESCE(OLD.is_active, false) IS DISTINCT FROM COALESCE(NEW.is_active, false))
     OR (COALESCE(OLD.is_deleted, false) IS DISTINCT FROM COALESCE(NEW.is_deleted, false))
     OR (COALESCE(OLD.show_in_directory, true) IS DISTINCT FROM COALESCE(NEW.show_in_directory, true))
  THEN
    INSERT INTO public.profile_approval_log (
      profile_id,
      changed_by,
      old_approval_status,
      new_approval_status,
      old_is_active,
      new_is_active,
      old_is_deleted,
      new_is_deleted,
      old_show_in_directory,
      new_show_in_directory
    )
    VALUES (
      NEW.id,
      v_changed_by,
      OLD.approval_status,
      NEW.approval_status,
      OLD.is_active,
      NEW.is_active,
      OLD.is_deleted,
      NEW.is_deleted,
      OLD.show_in_directory,
      NEW.show_in_directory
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_profile_approval_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_my_notifications_as_read"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  update public.notifications
     set is_read = true
   where recipient_id = auth.uid() and is_read = false;
$$;


ALTER FUNCTION "public"."mark_all_my_notifications_as_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.notifications
     SET is_read = true,
         read_at = now()
   WHERE recipient_id = auth.uid()
     AND is_read = false;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.messages
    SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id <> p_user_id
    AND read_at IS NULL;
END;
$$;


ALTER FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_as_read"("notification_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  success BOOLEAN;
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE, updated_at = NOW()
  WHERE id = notification_uuid AND profile_id = auth.uid();
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$;


ALTER FUNCTION "public"."mark_notification_as_read"("notification_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.notifications
     SET is_read = true, read_at = now()
   WHERE id = p_notification_id
     AND (recipient_id = auth.uid() OR public.fc_is_admin(auth.uid()) OR public.fc_is_super_admin(auth.uid()));
END;
$$;


ALTER FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentors_upsert_current"("p_expertise" "text"[], "p_mentoring_experience_years" integer, "p_max_mentees" integer, "p_mentoring_capacity_hours_per_month" integer, "p_mentoring_preferences" "jsonb", "p_mentoring_statement" "text", "p_mentoring_experience_description" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  -- Basic sanity checks
  IF p_max_mentees IS NOT NULL AND p_max_mentees < 0 THEN
    RAISE EXCEPTION 'max_mentees cannot be negative'
      USING ERRCODE = '22003';
  END IF;

  IF p_mentoring_experience_years IS NOT NULL AND p_mentoring_experience_years < 0 THEN
    RAISE EXCEPTION 'experience years cannot be negative'
      USING ERRCODE = '22003';
  END IF;

  INSERT INTO public.mentors (
    user_id,
    expertise,
    mentoring_experience_years,
    max_mentees,
    mentoring_capacity_hours_per_month,
    mentoring_preferences,
    mentoring_statement,
    mentoring_experience_description
  )
  VALUES (
    v_user_id,
    p_expertise,
    p_mentoring_experience_years,
    p_max_mentees,
    p_mentoring_capacity_hours_per_month,
    p_mentoring_preferences,
    p_mentoring_statement,
    p_mentoring_experience_description
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    expertise                        = EXCLUDED.expertise,
    mentoring_experience_years       = EXCLUDED.mentoring_experience_years,
    max_mentees                      = EXCLUDED.max_mentees,
    mentoring_capacity_hours_per_month = EXCLUDED.mentoring_capacity_hours_per_month,
    mentoring_preferences            = EXCLUDED.mentoring_preferences,
    mentoring_statement              = EXCLUDED.mentoring_statement,
    mentoring_experience_description = EXCLUDED.mentoring_experience_description,
    updated_at                       = now();
  -- NOTE: we deliberately do NOT touch `status` (pending/approved/rejected)
END;
$$;


ALTER FUNCTION "public"."mentors_upsert_current"("p_expertise" "text"[], "p_mentoring_experience_years" integer, "p_max_mentees" integer, "p_mentoring_capacity_hours_per_month" integer, "p_mentoring_preferences" "jsonb", "p_mentoring_statement" "text", "p_mentoring_experience_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentorship_mark_user_unavailable"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- 1) Turn off availability
  UPDATE public.profiles
     SET is_available_for_mentorship = false
   WHERE id = p_user_id;

  -- 2) Auto-cancel pending mentorship requests where this user is mentor
  UPDATE public.mentorship_requests
     SET status = 'cancelled_by_system'
   WHERE mentor_id = p_user_id
     AND status = 'pending';

  -- 3) Terminate active mentorship relationships where this user is mentor
  UPDATE public.mentorship_relationships
     SET status = 'terminated_by_system',
         end_date = now()
   WHERE mentor_id = p_user_id
     AND status = 'active';

  -- nothing to return
END;
$$;


ALTER FUNCTION "public"."mentorship_mark_user_unavailable"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentorship_on_mentor_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.status IN ('rejected') 
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.mentorship_mark_user_unavailable(NEW.user_id);
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."mentorship_on_mentor_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentorship_on_profile_deactivated"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- When a profile becomes non-approved or deleted, mark user unavailable
  PERFORM public.mentorship_mark_user_unavailable(OLD.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."mentorship_on_profile_deactivated"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentorship_open_chat"("p_relationship_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_actor_id  uuid := auth.uid();
  v_rel       public.mentorship_relationships%ROWTYPE;
  v_other_id  uuid;
  v_conv_id   uuid;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  -- Load relationship
  SELECT *
  INTO v_rel
  FROM public.mentorship_relationships
  WHERE id = p_relationship_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mentorship relationship not found';
  END IF;

  -- Must be active
  IF v_rel.status <> 'active' THEN
    RAISE EXCEPTION 'Mentorship relationship is not active'
      USING ERRCODE = '42501';
  END IF;

  -- Only mentor/mentee (or admin) can open chat
  IF NOT public.is_site_admin()
     AND v_actor_id <> v_rel.mentor_id
     AND v_actor_id <> v_rel.mentee_id THEN
    RAISE EXCEPTION 'You are not a participant in this mentorship relationship'
      USING ERRCODE = '42501';
  END IF;

  -- Figure out the "other party"
  IF v_actor_id = v_rel.mentor_id THEN
    v_other_id := v_rel.mentee_id;
  ELSE
    v_other_id := v_rel.mentor_id;
  END IF;

  -- Ensure / create DM thread (currently stubbed)
  v_conv_id := public.ensure_dm_thread_with(
    v_other_id,
    'mentorship',
    p_relationship_id
  );

  RETURN v_conv_id;
END;
$$;


ALTER FUNCTION "public"."mentorship_open_chat"("p_relationship_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentorship_relationship_end"("p_relationship_id" "uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_rel     public.mentorship_relationships;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  SELECT *
  INTO v_rel
  FROM public.mentorship_relationships
  WHERE id = p_relationship_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mentorship relationship not found'
      USING ERRCODE = 'P0002';
  END IF;

  -- Only mentor or mentee (or admin via is_user_admin) can end
  IF NOT (v_user_id = v_rel.mentor_id
          OR v_user_id = v_rel.mentee_id
          OR is_user_admin(v_user_id)) THEN
    RAISE EXCEPTION 'Not authorized to end this mentorship'
      USING ERRCODE = '42501';
  END IF;

  IF v_rel.status <> 'active' THEN
    RAISE EXCEPTION 'Only active mentorships can be ended'
      USING ERRCODE = '40900';
  END IF;

  UPDATE public.mentorship_relationships
  SET status   = 'terminated_by_user',
      end_date = now()
  WHERE id = v_rel.id;

  -- Optional: insert into an audit log table for mentoring history
  -- INSERT INTO mentorship_relationship_audit(...) VALUES (...);
END;
$$;


ALTER FUNCTION "public"."mentorship_relationship_end"("p_relationship_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentorship_request_cancel"("p_request_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_req     public.mentorship_requests;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT *
  INTO v_req
  FROM public.mentorship_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_req.mentee_id <> v_user_id THEN
    RAISE EXCEPTION 'You can only cancel your own requests'
      USING ERRCODE = '42501';
  END IF;

  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending requests can be cancelled'
      USING ERRCODE = '40900';
  END IF;

  UPDATE public.mentorship_requests
  SET status       = 'cancelled_by_user',
      responded_at = now(),
      updated_at   = now()
  WHERE id = v_req.id;
END;
$$;


ALTER FUNCTION "public"."mentorship_request_cancel"("p_request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentorship_request_create"("p_mentor_id" "uuid", "p_message" "text", "p_goals" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_mentee_id     uuid := auth.uid();
  v_mentee_ok     boolean;
  v_mentor_ok     boolean;
  v_programs_ok   boolean;
  -- 🔧 use the column's type, not a hard-coded enum name
  v_existing      public.mentorship_requests.status%TYPE;
  v_request_id    uuid;
BEGIN
  IF v_mentee_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  -- 1) Mentee must be approved & active
  SELECT (approval_status = 'approved'
          AND COALESCE(is_deleted, false) = false
          AND COALESCE(is_active, true) = true)
  INTO v_mentee_ok
  FROM public.profiles
  WHERE id = v_mentee_id;

  IF NOT v_mentee_ok THEN
    RAISE EXCEPTION 'Mentee profile not eligible for mentorship';
  END IF;

  -- 2) NEW RULE: mentee cannot be in more than 5 mentorship programs
  --    (pending + active, counted per distinct mentor)
  v_programs_ok := public.is_mentee_below_program_limit(v_mentee_id);
  IF NOT v_programs_ok THEN
    RAISE EXCEPTION 'You have reached the maximum of 5 mentorship programs (active or pending).'
      USING ERRCODE = 'P0001';
  END IF;

  -- 3) Mentor must be selectable (approved, visible, not blocked, etc.)
  v_mentor_ok := public.is_mentor_selectable(p_mentor_id);
  IF NOT v_mentor_ok THEN
    RAISE EXCEPTION 'Mentor not available for selection';
  END IF;

  -- 4) Check for existing pending/accepted request with this mentor
  SELECT status INTO v_existing
  FROM public.mentorship_requests
  WHERE mentee_id = v_mentee_id
    AND mentor_id = p_mentor_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_existing IN ('pending', 'accepted') THEN
    RAISE EXCEPTION 'You already have a mentorship request in progress with this mentor.';
  END IF;

  -- 5) Create new request
  INSERT INTO public.mentorship_requests (
    mentee_id,
    mentor_id,
    status,
    message,
    goals
  ) VALUES (
    v_mentee_id,
    p_mentor_id,
    'pending',
    p_message,
    p_goals
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;


ALTER FUNCTION "public"."mentorship_request_create"("p_mentor_id" "uuid", "p_message" "text", "p_goals" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentorship_request_respond"("p_request_id" "uuid", "p_new_status" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_action public.mentorship_request_status;
  v_norm   text := lower(p_new_status);
BEGIN
  IF p_new_status IS NULL THEN
    RAISE EXCEPTION 'Status is required'
      USING ERRCODE = '22023';
  END IF;

  -- Normalize and validate incoming status text
  IF v_norm = 'accepted' THEN
    v_action := 'accepted';
  ELSIF v_norm = 'rejected' THEN
    v_action := 'rejected';
  ELSIF v_norm = 'cancelled' OR v_norm = 'cancelled_by_user' THEN
    v_action := 'cancelled_by_user';
  ELSIF v_norm = 'cancelled_by_system' THEN
    v_action := 'cancelled_by_system';
  ELSE
    RAISE EXCEPTION 'Invalid mentorship request status: %', p_new_status
      USING ERRCODE = '23514';
  END IF;

  -- Delegate to canonical brain (enum-based)
  RETURN public.mentorship_request_respond_v2(p_request_id, v_action, NULL);
END;
$$;


ALTER FUNCTION "public"."mentorship_request_respond"("p_request_id" "uuid", "p_new_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentorship_request_respond_v2"("p_request_id" "uuid", "p_action" "public"."mentorship_request_status", "p_reason" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_current_user_id uuid := auth.uid();
  v_req             public.mentorship_requests%ROWTYPE;
  v_relationship_id uuid;
BEGIN
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  -- 1) Load request
  SELECT *
  INTO v_req
  FROM public.mentorship_requests r
  WHERE r.id = p_request_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mentorship request not found';
  END IF;

  -- 2) Ensure caller has permission
  IF v_current_user_id NOT IN (v_req.mentor_id, v_req.mentee_id)
     AND NOT public.is_site_admin()
  THEN
    RAISE EXCEPTION 'You are not allowed to respond to this request';
  END IF;

  -- 3) Only handle from pending
  IF v_req.status <> 'pending'::public.mentorship_request_status THEN
    RAISE EXCEPTION 'Only pending requests can be updated';
  END IF;

  -- 4) Branch by action
  IF p_action = 'accepted'::public.mentorship_request_status THEN
    -- Only mentor (or admin) should be able to accept
    IF v_current_user_id <> v_req.mentor_id AND NOT public.is_site_admin() THEN
      RAISE EXCEPTION 'Only the mentor can accept a request';
    END IF;

    UPDATE public.mentorship_requests
    SET status       = 'accepted',
        responded_at = now()
    WHERE id = p_request_id;

    INSERT INTO public.mentorship_relationships (
      mentor_id,
      mentee_id,
      status,
      start_date
    )
    VALUES (
      v_req.mentor_id,
      v_req.mentee_id,
      'active',
      now()
    )
    ON CONFLICT (mentor_id, mentee_id)
    WHERE mentorship_relationships.status = 'active'
      AND mentorship_relationships.end_date IS NULL
    DO UPDATE
    SET updated_at = now()
    RETURNING id
    INTO v_relationship_id;

    PERFORM public.mentorship_open_chat(v_relationship_id);

    RETURN v_relationship_id;

  ELSIF p_action = 'rejected'::public.mentorship_request_status THEN
    IF v_current_user_id <> v_req.mentor_id AND NOT public.is_site_admin() THEN
      RAISE EXCEPTION 'Only the mentor can reject a request';
    END IF;

    UPDATE public.mentorship_requests
    SET status       = 'rejected',
        responded_at = now()
    WHERE id = p_request_id;

    RETURN NULL;

  ELSIF p_action = 'cancelled'::public.mentorship_request_status THEN
    IF v_current_user_id <> v_req.mentee_id AND NOT public.is_site_admin() THEN
      RAISE EXCEPTION 'Only the mentee can cancel a request';
    END IF;

    UPDATE public.mentorship_requests
    SET status       = 'cancelled_by_user',
        responded_at = now()
    WHERE id = p_request_id;

    RETURN NULL;

  ELSE
    RAISE EXCEPTION 'Unsupported mentorship request action: %', p_action;
  END IF;
END;
$$;


ALTER FUNCTION "public"."mentorship_request_respond_v2"("p_request_id" "uuid", "p_action" "public"."mentorship_request_status", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentorship_request_update_status"("p_request_id" "uuid", "p_new_status" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_relationship_id uuid;
BEGIN
  -- Delegate to the new canonical brain
  v_relationship_id := public.mentorship_request_respond(p_request_id, p_new_status);
  RETURN v_relationship_id;
END;
$$;


ALTER FUNCTION "public"."mentorship_request_update_status"("p_request_id" "uuid", "p_new_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mentorship_toggle_availability"("p_next" boolean) RETURNS "public"."profiles"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_user uuid := auth.uid();
  v_prof public.profiles;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  UPDATE public.profiles
  SET is_available_for_mentorship = p_next
  WHERE id = v_user
  RETURNING * INTO v_prof;

  RETURN v_prof;
END;
$$;


ALTER FUNCTION "public"."mentorship_toggle_availability"("p_next" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."moderate_content"("p_content_id" "uuid", "p_content_type" "text", "p_action" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if user is admin/super_admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_admin = true)
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can moderate content';
  END IF;
  
  -- Check valid action
  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid action: Must be "approve" or "reject"';
  END IF;
  
  -- Handle different content types
  CASE p_content_type
    WHEN 'job' THEN
      IF p_action = 'approve' THEN
        UPDATE jobs SET status = 'active' WHERE id = p_content_id;
      ELSE
        UPDATE jobs SET status = 'rejected' WHERE id = p_content_id;
      END IF;
      
    WHEN 'event' THEN
      IF p_action = 'approve' THEN
        UPDATE events SET status = 'active' WHERE id = p_content_id;
      ELSE
        UPDATE events SET status = 'rejected' WHERE id = p_content_id;
      END IF;
      
    WHEN 'group_post' THEN
      IF p_action = 'approve' THEN
        UPDATE group_posts SET status = 'approved' WHERE id = p_content_id;
      ELSE
        UPDATE group_posts SET status = 'rejected' WHERE id = p_content_id;
      END IF;
      
    ELSE
      RAISE EXCEPTION 'Unsupported content type: %', p_content_type;
  END CASE;
  
  -- Log the moderation action
  INSERT INTO public.activity_log (
    description,
    activity_type,
    user_id,
    metadata
  ) VALUES (
    p_action || 'd ' || p_content_type || ' (ID: ' || p_content_id || ')',
    'content_moderation',
    auth.uid(),
    jsonb_build_object(
      'content_id', p_content_id,
      'content_type', p_content_type,
      'action', p_action
    )
  );
END;
$$;


ALTER FUNCTION "public"."moderate_content"("p_content_id" "uuid", "p_content_type" "text", "p_action" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."moderate_content"("p_content_id" "uuid", "p_content_type" "text", "p_action" "text") IS 'Approves or rejects content and logs the moderation action';



CREATE OR REPLACE FUNCTION "public"."moderate_content"("content_table" "text", "content_id" "uuid", "is_approved" boolean, "rejection_reason" "text" DEFAULT ''::"text", "content_type" "text" DEFAULT 'content'::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result json;
  admin_user_id uuid;
  content_json json;
BEGIN
  -- Check if user is admin or super_admin
  SELECT id INTO admin_user_id
  FROM public.profiles
  WHERE id = auth.uid()
  AND (role = 'admin' OR role = 'super_admin');

  IF admin_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only administrators can approve or reject content'
    );
  END IF;

  -- Build dynamic SQL to update the content
  EXECUTE format('
    UPDATE public.%I
    SET 
      is_approved = %L,
      approved_by = %L,
      approved_at = %L,
      rejection_reason = %L,
      updated_at = now()
    WHERE id = %L
    RETURNING to_json(%I.*)',
    content_table,
    is_approved,
    CASE WHEN is_approved THEN admin_user_id ELSE NULL END,
    CASE WHEN is_approved THEN now() ELSE NULL END,
    CASE WHEN NOT is_approved THEN rejection_reason ELSE NULL END,
    content_id,
    content_table
  ) INTO content_json;

  IF content_json IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', format('Content with ID %s not found in table %s', content_id, content_table)
    );
  END IF;

  -- OPTIONAL: Create notification for content owner if applicable (keep or remove based on your design)
  BEGIN
    EXECUTE format('
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data,
        created_at
      )
      SELECT 
        created_by, 
        %L, 
        %L, 
        %L, 
        %L, 
        now()
      FROM public.%I
      WHERE id = %L',
      CASE WHEN is_approved THEN 'content_approved' ELSE 'content_rejected' END,
      CASE WHEN is_approved THEN format('Your %s was approved', content_type) ELSE format('Your %s was rejected', content_type) END,
      CASE WHEN is_approved THEN format('Your %s has been approved by an administrator', content_type) ELSE format('Your %s was rejected: %s', content_type, rejection_reason) END,
      json_build_object('content_id', content_id, 'content_type', content_type),
      content_table,
      content_id
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Failed to create notification for content moderation: %', SQLERRM;
  END;

  result := json_build_object(
    'success', true,
    'message', format('Content has been %s', CASE WHEN is_approved THEN 'approved' ELSE 'rejected' END),
    'content', content_json
  );

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."moderate_content"("content_table" "text", "content_id" "uuid", "is_approved" boolean, "rejection_reason" "text", "content_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."moderate_content"("content_table" "text", "content_id" "uuid", "is_approved" boolean, "rejection_reason" "text", "content_type" "text") IS 'Moderates content for approval workflow. Only admins can call this function';



CREATE OR REPLACE FUNCTION "public"."normalize_group_name"("p" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE PARALLEL SAFE
    AS $$
  SELECT CASE
           WHEN p IS NULL THEN NULL
           ELSE regexp_replace(lower(trim(p)), '[^a-z0-9]+','-','g')
         END
$$;


ALTER FUNCTION "public"."normalize_group_name"("p" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."normalize_social_link"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  _t text;
  _u text;
BEGIN
  _t := lower(btrim(NEW.type::text));
  _u := btrim(NEW.url);

  -- prepend https:// if missing
  IF _u !~* '^[a-z]+://' THEN
    _u := 'https://' || _u;
  END IF;

  -- optional: drop trailing slash
  IF right(_u, 1) = '/' THEN
    _u := left(_u, length(_u) - 1);
  END IF;

  -- Map aliases
  IF _t IN ('twitter') THEN
    _t := 'x';
  END IF;

  NEW.type := _t::social_type;  -- cast back to your domain/enum type
  NEW.url  := _u;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."normalize_social_link"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notifications_ensure_recipient"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.recipient_id IS NULL THEN
    NEW.recipient_id := COALESCE(NEW.profile_id, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notifications_ensure_recipient"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_id uuid := gen_random_uuid();
  v_allowed boolean := public.should_deliver_in_app(p_recipient_id, coalesce(nullif(p_type,''),'system'));
begin
  if not v_allowed then
    return null;
  end if;

  insert into public.notifications(id, recipient_id, type, title, message, link, metadata)
  values (
    v_id,
    p_recipient_id,
    coalesce(nullif(p_type,''),'system'),
    left(coalesce(p_title,''), 200),
    left(coalesce(p_message,''), 1000),
    nullif(p_link,''),
    coalesce(p_metadata, '{}'::jsonb)
  );
  return v_id;
exception
  when check_violation then
    -- fallback to 'system' if type fails CHECK constraint
    insert into public.notifications(id, recipient_id, type, title, message, link, metadata)
    values (
      v_id,
      p_recipient_id,
      'system',
      left(coalesce(p_title,''), 200),
      left(coalesce(p_message,''), 1000),
      nullif(p_link,''),
      jsonb_build_object('original_type', p_type) || coalesce(p_metadata,'{}'::jsonb)
    );
    return v_id;
end;
$$;


ALTER FUNCTION "public"."notify"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_admin_on_event_create"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO public.admin_notifications (notification_type, entity_type, entity_id, message, created_by)
  VALUES (
    'event_created',
    'events',
    NEW.id,
    'New event created: ' || COALESCE(NEW.title::text, 'Untitled'),
    COALESCE(NEW.created_by, NEW.user_id)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_admin_on_event_create"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_admins_on_event"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  admin_rec record;
  creator_name text;
  event_link text;
begin
  event_link := '/events/' || new.id::text;

  select trim(coalesce(first_name,'') || ' ' || coalesce(last_name,''))
  into creator_name
  from public.profiles
  where id = new.organizer_id;

  for admin_rec in
    select id
    from public.profiles
    where (is_admin = true or role in ('admin','super_admin'))
      and coalesce(is_deleted,false) = false
  loop
    insert into public.notifications (
      recipient_id, title, message, type, link, is_read, created_at
    ) values (
      admin_rec.id,
      'New event created',
      coalesce(creator_name, new.organizer_id::text) || ' created: ' || new.title,
      'event',                    -- <— changed to singular
      event_link,
      false,
      now()
    );
  end loop;

  return new;
end;
$$;


ALTER FUNCTION "public"."notify_admins_on_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_admins_on_group_post_report"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  admin_rec RECORD;
  msg text;
BEGIN
  msg := COALESCE(NEW.reason, 'A post was reported')
       || ' (report id: ' || NEW.id || ')';
  FOR admin_rec IN
    SELECT id AS profile_id
    FROM public.profiles
    WHERE is_admin = true OR role IN ('admin','super_admin')
  LOOP
    PERFORM public.create_notification(
      admin_rec.profile_id,
      'Group post reported',
      msg,
      '/admin/reports/groups/' || NEW.id,
      'group'
    );
  END LOOP;
  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."notify_admins_on_group_post_report"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_chat_message"("p_recipient" "uuid", "p_thread" "uuid", "p_preview" "text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  insert into public.notifications (user_id, type, title, body, link, metadata)
  values (
    p_recipient,
    'chat_message',
    'New message',
    coalesce(p_preview, 'You have a new message.'),
    '/messages?tab=chats&open=' || p_thread,
    jsonb_build_object('thread_id', p_thread)
  );
$$;


ALTER FUNCTION "public"."notify_chat_message"("p_recipient" "uuid", "p_thread" "uuid", "p_preview" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_connection_approved"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.status = 'accepted' then
    insert into notifications (profile_id, recipient_id, title, message, link)
    values (
      new.requester_id,
      new.requester_id,
      'Connection Accepted',
      'Your connection request was accepted.',
      '/messages?tab=connections' -- changed from '/connections'
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_connection_approved"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_connection_request"("p_recipient" "uuid", "p_requester" "uuid", "p_edge" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  insert into public.notifications (user_id, type, title, body, link, metadata)
  values (
    p_recipient,
    'connection_request',
    'New Connection Request',
    'Someone sent you a connection request.',
    '/messages?tab=connections',
    jsonb_build_object('requester_id', p_requester, 'connection_id', p_edge)
  );
$$;


ALTER FUNCTION "public"."notify_connection_request"("p_recipient" "uuid", "p_requester" "uuid", "p_edge" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_dm_participants"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  rec record;
begin
  for rec in
    select user_id
    from public.dm_participants
    where thread_id = new.thread_id
      and user_id <> new.sender_id
  loop
    -- If you have a notifications table, insert here; otherwise no-op
    -- insert into public.notifications(user_id, type, payload)
    -- values (rec.user_id, 'dm_message', jsonb_build_object('thread_id', new.thread_id, 'message_id', new.id));
    perform 1;
  end loop;
  return new;
end$$;


ALTER FUNCTION "public"."notify_dm_participants"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_event"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF p_recipient_id IS NULL THEN
    RAISE NOTICE 'Skipping notify_event(): null recipient';
    RETURN;
  END IF;

  INSERT INTO public.notifications (
      id, recipient_id, type, title, message, link, metadata,
      is_read, created_at
  )
  VALUES (
      gen_random_uuid(), p_recipient_id, p_type,
      p_title, p_message, p_link, p_metadata,
      FALSE, now()
  )
  ON CONFLICT DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."notify_event"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_event_rsvp"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.notifications (profile_id, recipient_id, title, message, link, type, event_id, metadata)
  values (
    new.user_id,
    new.user_id,
    'RSVP Confirmed',
    'You are registered for the event.',
    '/events/' || new.event_id,
    'event',
    new.event_id,
    jsonb_build_object('attendance_status', new.attendance_status)
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_event_rsvp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_events_due_in_24h"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_count int;
begin
  with upcoming as (
    select e.id,
           coalesce(
             nullif(to_jsonb(e)->>'start_time','')::timestamptz,
             (nullif(to_jsonb(e)->>'date','')::date + coalesce(nullif(to_jsonb(e)->>'time','')::time, time '00:00'))::timestamptz
           ) as starts_at
    from public.events e
  ), target as (
    select id from upcoming
    where starts_at between now() + interval '23 hours 30 minutes'
                        and     now() + interval '24 hours 30 minutes'
  ), ins as (
    select public.notify_event_reminders_24h(t.id) from target t
  )
  select count(*) into v_count from target;
  return v_count;
end;
$$;


ALTER FUNCTION "public"."notify_events_due_in_24h"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_interview_invite"("p_application_id" "uuid", "p_when" timestamp with time zone, "p_link" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_applicant uuid;
  v_job uuid;
  v_id uuid;
begin
  select coalesce(ja.applicant_id, ja.user_id), ja.job_id
  into v_applicant, v_job
  from public.job_applications ja
  where ja.id = p_application_id;

  if v_applicant is null then return null; end if;

  v_id := public.notify(
    v_applicant, 'application_status',
    'Interview invitation',
    'You have been invited to an interview.',
    coalesce(p_link, '/jobs/' || coalesce(v_job::text,'')),
    jsonb_build_object('job_id', v_job, 'when', p_when, 'kind', 'interview_invite')
  );
  return v_id;
end;
$$;


ALTER FUNCTION "public"."notify_interview_invite"("p_application_id" "uuid", "p_when" timestamp with time zone, "p_link" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_job_application"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_job_owner uuid;
BEGIN
  SELECT posted_by INTO v_job_owner
  FROM public.jobs
  WHERE id = NEW.job_id;

  IF v_job_owner IS NOT NULL THEN
    INSERT INTO public.notifications
      (profile_id, recipient_id, type, title, message, link, created_at)
    VALUES
      (
        COALESCE(auth.uid(), NEW.applicant_id), -- actor
        v_job_owner,                            -- recipient (poster)
        'job',                                  -- ✅ allowed by your CHECK
        'New Job Application',
        'A candidate applied to your job.',
        '/jobs/' || NEW.job_id,
        now()
      );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_job_application"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_job_application_submitted"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.notifications
    (profile_id, recipient_id, type, title, message, link, is_read, created_at)
  values
    (
      new.applicant_id,              -- actor
      new.applicant_id,              -- recipient (the applicant themself)
      'job_applied',                 -- ✅ allowed by chk_notifications_type
      'Application submitted',
      'Your job application has been submitted.',
      '/jobs/' || new.job_id,
      false,
      now()
    );
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_job_application_submitted"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_job_applied"("p_job_id" "uuid", "p_applicant" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT created_by INTO v_owner FROM public.jobs WHERE id = p_job_id;
  IF v_owner IS NOT NULL THEN
    PERFORM public.notify_event(
      v_owner,
      'job_applied',
      'New Job Application',
      format('A new application has been submitted for your job post.'),
      '/jobs/%s',  -- link placeholder
      jsonb_build_object('job_id', p_job_id, 'applicant_id', p_applicant)
    );
  END IF;
END;
$$;


ALTER FUNCTION "public"."notify_job_applied"("p_job_id" "uuid", "p_applicant" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_mentorship_request"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.notifications (recipient_id, sender_id, type, title, message, link, profile_id)
  values (new.mentor_id, new.mentee_id, 'mentorship',
          'New mentorship request', 'You have a new mentorship request.',
          '/mentorship/requests', new.mentee_id);
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_mentorship_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_mentorship_sessions_due_in_2h"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare v_count int := 0;
begin
  if not exists (select 1 from information_schema.tables
                 where table_schema='public' and table_name='mentorship_sessions') then
    return 0;
  end if;

  with s as (
    select
      ms.id,
      coalesce(
        nullif(to_jsonb(ms)->>'start_at','')::timestamptz,
        nullif(to_jsonb(ms)->>'start_time','')::timestamptz
      ) as starts_at,
      ms.mentor_id,
      ms.mentee_id
    from public.mentorship_sessions ms
  ), target as (
    select * from s
    where starts_at between now() + interval '90 minutes'
                        and     now() + interval '150 minutes'
  ), sent as (
    -- prevent duplicates by metadata unique marker
    select n.metadata->>'session_id' as sid, n.recipient_id
    from public.notifications n
    where n.type='mentorship' and n.metadata->>'kind'='session_reminder_2h'
  ), todo as (
    select t.id, t.starts_at, t.mentor_id, t.mentee_id
    from target t
    where not exists (select 1 from sent s where s.sid = t.id::text)
  )
  select count(*) into v_count from todo;

  -- notify both mentor and mentee
  perform public.notify(
    todo.mentor_id, 'mentorship',
    'Mentorship session in ~2 hours',
    'Reminder: your mentorship session starts soon.',
    '/mentorship',
    jsonb_build_object('kind','session_reminder_2h','session_id',todo.id,'start',todo.starts_at)
  )
  from todo where todo.mentor_id is not null;

  perform public.notify(
    todo.mentee_id, 'mentorship',
    'Mentorship session in ~2 hours',
    'Reminder: your mentorship session starts soon.',
    '/mentorship',
    jsonb_build_object('kind','session_reminder_2h','session_id',todo.id,'start',todo.starts_at)
  )
  from todo where todo.mentee_id is not null;

  return v_count;
end;
$$;


ALTER FUNCTION "public"."notify_mentorship_sessions_due_in_2h"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_connection_request"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (profile_id, recipient_id, title, message, link)
    VALUES (
      NEW.recipient_id,  -- profile_id (legacy)
      NEW.recipient_id,  -- recipient_id (canonical)
      'New Connection Request',
      'You have a new connection request.',
      '/connections'
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_new_connection_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  participant_1_id UUID;
  participant_2_id UUID;
BEGIN
  -- Get the conversation participants
  SELECT participant_1, participant_2 INTO participant_1_id, participant_2_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Update unread count for the other participant (not the sender)
  -- This is used for notification badges
  IF participant_1_id = NEW.sender_id THEN
    -- Sender is participant 1, notify participant 2
    PERFORM pg_notify(
      'new_message',
      json_build_object(
        'user_id', participant_2_id,
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id,
        'message_id', NEW.id
      )::text
    );
  ELSE
    -- Sender is participant 2, notify participant 1
    PERFORM pg_notify(
      'new_message',
      json_build_object(
        'user_id', participant_1_id,
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id,
        'message_id', NEW.id
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_new_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_on_job_application"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO public.notifications (
    profile_id,  -- Add this
    recipient_id,  -- Or keep if needed
    type,
    message,
    is_read,
    created_at
  ) VALUES (
    NEW.applicant_id,  -- Change from NEW.user_id
    NEW.applicant_id,  -- Change from NEW.user_id
    'job_application',
    'New job application received',
    false,
    now()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_on_job_application"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_on_request_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare 
  msg text;
begin
  if new.status is distinct from old.status then
    msg := case new.status
      when 'accepted' then 'Your mentorship request was accepted.'
      when 'rejected' then 'Your mentorship request was rejected.'
      else 'Your mentorship request status changed to: '
           || coalesce(new.status::text, '(unknown)')
    end;

    insert into public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      link,
      profile_id
    )
    values (
      new.mentee_id,
      new.mentor_id,
      'mentorship',
      'Mentorship request update',
      msg,
      '/mentorship/requests',
      new.mentor_id
    );
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."notify_on_request_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_profile_verification"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO notifications (profile_id, title, message, link)
  SELECT id, 'Verification Successful', 'Your alumni profile was verified.', '/profile'
  FROM profiles
  WHERE is_verified = true AND NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE profile_id = profiles.id AND title = 'Verification Successful'
  );
END;
$$;


ALTER FUNCTION "public"."notify_profile_verification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_request_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  perform 1;
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_request_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_requests_on_rejection"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into notifications(user_id, type, message, created_at)
  select mentee_id, 'mentorship_request_cancelled',
         'Your mentorship request was cancelled because the mentor is no longer eligible.',
         now()
  from mentorship_requests
  where mentor_id = new.user_id and status = 'cancelled_by_system';
  return new;
end;
$$;


ALTER FUNCTION "public"."notify_requests_on_rejection"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_mentorship_request_status"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Ensure status is one of the allowed enum values
  IF NEW.status NOT IN (
    'pending',
    'accepted',
    'rejected',
    'cancelled_by_user',
    'cancelled_by_system'
  ) THEN
    RAISE EXCEPTION 'Invalid mentorship request status: %', NEW.status
      USING ERRCODE = '23514';
  END IF;

  -- Disallow reverting back to pending from any other state
  IF OLD.status IS NOT NULL
     AND OLD.status <> 'pending'
     AND NEW.status = 'pending' THEN
    RAISE EXCEPTION 'Cannot revert mentorship request back to pending'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."on_mentorship_request_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."policy_exists"("_schemaname" "text", "_tablename" "text", "_policyname" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists(
    select 1 from pg_policies
    where schemaname=_schemaname and tablename=_tablename and policyname=_policyname
  );
$$;


ALTER FUNCTION "public"."policy_exists"("_schemaname" "text", "_tablename" "text", "_policyname" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_early_event_feedback"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare ends_at timestamptz;
begin
  select end_date into ends_at from events where id = new.event_id;
  if now() < ends_at then
    raise exception 'Feedback is only allowed after the event ends.';
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."prevent_early_event_feedback"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_no_admins"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE remaining_admins int;
BEGIN
  -- Only act when an admin row is being deleted or demoted
  IF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
    SELECT COUNT(*) INTO remaining_admins
    FROM public.group_members
    WHERE group_id = OLD.group_id AND user_id <> OLD.user_id AND role = 'admin';
    IF remaining_admins = 0 THEN
      RAISE EXCEPTION 'Each group must have at least one admin';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin' THEN
    SELECT COUNT(*) INTO remaining_admins
    FROM public.group_members
    WHERE group_id = NEW.group_id AND user_id <> NEW.user_id AND role = 'admin';
    IF remaining_admins = 0 THEN
      RAISE EXCEPTION 'Each group must have at least one admin';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END$$;


ALTER FUNCTION "public"."prevent_no_admins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_notification_event_mentorship_v1"("p_event_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_event          public.notification_events;
  v_request        public.mentorship_requests;
  v_recipient_id   uuid;
  v_title          text;
  v_message        text;
  v_link           text;
BEGIN
  SELECT *
  INTO v_event
  FROM public.notification_events
  WHERE id = p_event_id
    AND module = 'mentorship';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Mark as processed at the end
  SELECT *
  INTO v_request
  FROM public.mentorship_requests
  WHERE id = v_event.entity_id;

  IF NOT FOUND THEN
    UPDATE public.notification_events
      SET processed_at = now()
    WHERE id = p_event_id;
    RETURN;
  END IF;

  -- Handle a few key mentorship event types
  IF v_event.event_type = 'mentorship_request' THEN
    v_recipient_id := v_request.mentor_id;
    v_title        := 'New mentorship request';
    v_message      := 'You have a new mentorship request from a mentee.';
    v_link         := '/mentorship/requests';
  ELSIF v_event.event_type = 'mentorship_status' THEN
    -- Notify the mentee about status change
    v_recipient_id := v_request.mentee_id;
    v_title        := 'Your mentorship request was updated';
    v_message      := 'Your mentorship request status changed to: ' || v_request.status::text;
    v_link         := '/mentorship';
  ELSE
    -- Other mentorship event types can be added later
    UPDATE public.notification_events
      SET processed_at = now()
    WHERE id = p_event_id;
    RETURN;
  END IF;

  -- Call existing notify() RPC (assumed to exist), with idempotency
  PERFORM public.notify(
    v_recipient_id,
    v_event.event_type::text,
    v_title,
    v_message,
    v_link,
    v_event.metadata,
    v_event.id::text             -- use event id as idempotency key
  );

  UPDATE public.notification_events
    SET processed_at = now()
  WHERE id = p_event_id;
END;
$$;


ALTER FUNCTION "public"."process_notification_event_mentorship_v1"("p_event_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."process_notification_event_mentorship_v1"("p_event_id" "uuid") IS 'Minimal fan-out: turns mentorship notification_events into per-recipient notifications via notify().';



CREATE OR REPLACE FUNCTION "public"."profiles_after_update_avatar"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Decoupled: changing profile.avatar_url no longer updates companies.logo_url
  return new;
end
$$;


ALTER FUNCTION "public"."profiles_after_update_avatar"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."profiles_normalize_names"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.first_name is not null then
    -- trim ends and collapse internal whitespace
    new.first_name := regexp_replace(btrim(new.first_name), '\s+', ' ', 'g');
  end if;

  if new.last_name is not null then
    new.last_name  := regexp_replace(btrim(new.last_name),  '\s+', ' ', 'g');
  end if;

  return new;
end
$$;


ALTER FUNCTION "public"."profiles_normalize_names"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."profiles_prevent_self_approval_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- If caller is NOT an admin, and any approval / verification /
  -- activation fields changed, block the update.
  if not public.app_is_admin() and (
       new.approval_status             is distinct from old.approval_status
    or new.is_approved                is distinct from old.is_approved
    or new.alumni_verification_status is distinct from old.alumni_verification_status
    or new.is_active                  is distinct from old.is_active
  ) then
    raise exception 'You are not allowed to change approval/activation fields on your profile';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."profiles_prevent_self_approval_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."profiles_set_full_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
    begin
      if (new.full_name is null or btrim(new.full_name) = '') then
        new.full_name := btrim(coalesce(new.first_name,'') || ' ' || coalesce(new.last_name,''));
      end if;
      return new;
    end
    $$;


ALTER FUNCTION "public"."profiles_set_full_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_jobs_admin_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_role text;
BEGIN
  v_role := public.current_role_text();

  -- Again, only 'admin' and 'super_admin' can touch these fields
  IF coalesce(v_role, '') NOT IN ('admin', 'super_admin') THEN
    IF (NEW.is_approved IS DISTINCT FROM OLD.is_approved)
       OR (coalesce(NEW.is_rejected,false) IS DISTINCT FROM coalesce(OLD.is_rejected,false))
       OR (NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by)
       OR (NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at) THEN
      RAISE EXCEPTION 'Admin fields on jobs are read-only for non-admins';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."protect_jobs_admin_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_mentors_admin_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF get_user_role(auth.uid()) NOT IN ('admin','super_admin') THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Only admin can change mentor status';
    END IF;
  END IF;
  RETURN NEW;
END$$;


ALTER FUNCTION "public"."protect_mentors_admin_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_profile_admin_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if not public.app_is_admin() then
    if (new.role             is distinct from old.role)
       or (new.approval_status is distinct from old.approval_status)
       or (new.is_deleted       is distinct from old.is_deleted) then
      raise exception 'modifying admin-only columns is not allowed';
    end if;
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."protect_profile_admin_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."public_directory_count"() RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
  SELECT count(*)::integer
  FROM public.public_profiles_view_v2;
$$;


ALTER FUNCTION "public"."public_directory_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_notifications_admin"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT (public.fc_is_admin() OR public.fc_is_super_admin()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.notifications
   WHERE p_user_id IS NULL OR recipient_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."purge_notifications_admin"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purge_user_data"("uid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Messaging & groups
  delete from public.messages where sender_id = uid or recipient_id = uid;
  delete from public.conversation_participants where user_id = uid;
  delete from public.connections where requester_id = uid or recipient_id = uid;
  delete from public.group_members where user_id = uid;

  -- Events
  delete from public.event_attendees where user_id = uid;
  delete from public.event_feedback where user_id = uid;

  -- Jobs
  delete from public.job_applications where applicant_id = uid;
  delete from public.job_bookmarks where user_id = uid;
  delete from public.job_alerts where user_id = uid;

  -- Mentorship
  delete from public.mentorship_requests where mentee_id = uid or mentor_id = uid;

  -- Resumes/notifications
  delete from public.user_resumes where user_id = uid;
  delete from public.notifications where profile_id = uid;

  -- Finally, the profile
  delete from public.profiles where id = uid;
end;
$$;


ALTER FUNCTION "public"."purge_user_data"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_group_member"("p_group_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT public.can_manage_group(p_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  DELETE FROM public.group_members
  WHERE group_id = p_group_id
    AND user_id  = p_user_id
    AND status   IN ('pending');
END;
$$;


ALTER FUNCTION "public"."reject_group_member"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_connection"("p_connection_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  conn record;
  me uuid := auth.uid();
begin
  select id, requester_id, recipient_id, status
  into conn
  from public.connections
  where id = p_connection_id;

  if not found then
    raise exception 'Connection not found' using errcode = 'P0002';
  end if;

  if conn.requester_id <> me and conn.recipient_id <> me then
    raise exception 'Not permitted' using errcode = '42501';
  end if;

  -- Normalize behavior:
  -- pending & requester clicks -> cancel (update to allowed value)
  if conn.status = 'pending' and conn.requester_id = me then
    update public.connections
       set status = 'cancelled',
           updated_at = now()
     where id = conn.id;
    return;
  end if;

  -- pending & recipient clicks -> decline (update)
  if conn.status = 'pending' and conn.recipient_id = me then
    update public.connections
       set status = 'declined',
           updated_at = now()
     where id = conn.id;
    return;
  end if;

  -- accepted/connected -> delete the connection
  if conn.status in ('accepted','connected') then
    delete from public.connections where id = conn.id;
    return;
  end if;

  -- For any other terminal states, just no-op
  return;
end
$$;


ALTER FUNCTION "public"."remove_connection"("p_connection_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_connection"("p_user" "uuid", "p_other" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_rows integer := 0;
begin
  -- Delete any existing accepted/connected connections in either direction.
  delete from public.connections c
   where ((c.requester_id = p_user and c.recipient_id = p_other)
       or (c.requester_id = p_other and c.recipient_id = p_user))
     and c.status in ('accepted','connected');

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;


ALTER FUNCTION "public"."remove_connection"("p_user" "uuid", "p_other" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_member"("p_group_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_admins int;
BEGIN
  IF NOT public.can_manage_group(p_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  SELECT count(*) INTO v_admins
  FROM public.group_members
  WHERE group_id = p_group_id
    AND status   = 'active'
    AND role IN ('owner','admin');

  IF v_admins <= 1
     AND EXISTS (
       SELECT 1
       FROM public.group_members
       WHERE group_id = p_group_id
         AND user_id  = p_user_id
         AND role IN ('owner','admin')
     )
  THEN
    RAISE EXCEPTION 'At least one admin must remain';
  END IF;

  DELETE FROM public.group_members
  WHERE group_id = p_group_id
    AND user_id  = p_user_id;
END;
$$;


ALTER FUNCTION "public"."remove_member"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  role_id_val UUID;
BEGIN
  -- Get role ID with fully qualified column names
  SELECT roles.id INTO role_id_val FROM roles WHERE roles.name = role_name;
  
  -- Check if role exists
  IF role_id_val IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Remove role from user with fully qualified column names
  DELETE FROM user_roles
  WHERE user_roles.profile_id = profile_uuid AND user_roles.role_id = role_id_val;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."remove_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_user_role"("profile_uuid" "uuid", "role_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  role_id UUID;
BEGIN
  -- Get role ID
  SELECT id INTO role_id FROM roles WHERE name = role_name;
  
  -- Check if role exists
  IF role_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Remove role from user
  DELETE FROM user_roles
  WHERE profile_id = profile_uuid AND role_id = role_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."remove_user_role"("profile_uuid" "uuid", "role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reqskills_to_jsonb"("sk" "text"[]) RETURNS "jsonb"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select to_jsonb(sk)
$$;


ALTER FUNCTION "public"."reqskills_to_jsonb"("sk" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reqskills_to_jsonb"("sk" "jsonb") RETURNS "jsonb"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select case when jsonb_typeof(sk) = 'array' then sk else jsonb_build_array(sk) end
$$;


ALTER FUNCTION "public"."reqskills_to_jsonb"("sk" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reqskills_to_jsonb"("sk" "text") RETURNS "jsonb"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select public.ensure_jsonb_array_from_text(sk)
$$;


ALTER FUNCTION "public"."reqskills_to_jsonb"("sk" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."connections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "requester_id" "uuid",
    "recipient_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "addressee_id" "uuid",
    CONSTRAINT "connections_no_self" CHECK (("requester_id" <> "recipient_id")),
    CONSTRAINT "connections_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'cancelled'::"text", 'removed'::"text"]))),
    CONSTRAINT "different_requester_recipient" CHECK (("requester_id" <> "recipient_id"))
);

ALTER TABLE ONLY "public"."connections" REPLICA IDENTITY FULL;


ALTER TABLE "public"."connections" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_connection"("p_recipient" "uuid") RETURNS "public"."connections"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare r public.connections;
begin
  insert into public.connections (requester_id, recipient_id, status)
  values (auth.uid(), p_recipient, 'pending')
  on conflict on constraint uniq_connections_pair do update
    set updated_at = now()
  returning * into r;
  return r;
end$$;


ALTER FUNCTION "public"."request_connection"("p_recipient" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_connection_for_job"("p_job_id" "uuid") RETURNS TABLE("connection_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_owner uuid;
  v_id uuid;
  v_status text;
begin
  select posted_by into v_owner from public.jobs where id = p_job_id;

  if v_owner is null or v_owner = auth.uid() then
    raise exception 'Invalid or self connection';
  end if;

  insert into public.connections (requester_id, recipient_id, status)
  values (auth.uid(), v_owner, 'pending')
  on conflict do nothing
  returning id, status into v_id, v_status;

  if v_id is null then
    select id, status
    into v_id, v_status
    from public.connections
    where requester_id = auth.uid()
      and recipient_id = v_owner
    limit 1;
  end if;

  return query select v_id, v_status;
end;
$$;


ALTER FUNCTION "public"."request_connection_for_job"("p_job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_connection_to_user"("p_recipient_id" "uuid") RETURNS TABLE("connection_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_id uuid;
  v_status text;
begin
  if p_recipient_id is null or p_recipient_id = auth.uid() then
    raise exception 'Invalid or self connection';
  end if;

  insert into public.connections (requester_id, recipient_id, status)
  values (auth.uid(), p_recipient_id, 'pending')
  on conflict do nothing
  returning id, status into v_id, v_status;

  if v_id is null then
    select id, status
    into v_id, v_status
    from public.connections
    where requester_id = auth.uid()
      and recipient_id = p_recipient_id
    limit 1;
  end if;

  return query select v_id, v_status;
end;
$$;


ALTER FUNCTION "public"."request_connection_to_user"("p_recipient_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."respond_connection"("p_connection_id" "uuid", "p_action" "text") RETURNS TABLE("connection_id" "uuid", "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_new_status text;
begin
  if lower(p_action) not in ('accept','reject') then
    raise exception 'Action must be accept or reject';
  end if;

  v_new_status := case when lower(p_action)='accept' then 'connected' else 'rejected' end;

  update public.connections
  set status = v_new_status
  where id = p_connection_id
    and recipient_id = auth.uid()         -- only the recipient can decide
  returning id, status into connection_id, status;

  if connection_id is null then
    raise exception 'Not allowed or not found';
  end if;

  return;
end;
$$;


ALTER FUNCTION "public"."respond_connection"("p_connection_id" "uuid", "p_action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rsvp_to_event"("event_id" "uuid", "response" "text" DEFAULT 'going'::"text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid uuid := auth.uid();
  v_event_title text;
  v_capacity int;
  v_going_count int;
  v_allow_waitlist boolean := false;
  v_is_waitlisted boolean := false;
  v_attendee_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Pull what we need from events; adapt to your actual column names if different.
  select
    coalesce(e.title, 'Event') as title,
    e.max_attendees,
    coalesce(e.allow_waitlist, false)
  into v_event_title, v_capacity, v_allow_waitlist
  from public.events e
  where e.id = event_id;

  if not found then
    raise exception 'Event not found';
  end if;

  -- Count confirmed (adjust filters to your schema)
  select count(*)
    into v_going_count
  from public.event_attendees a
  where a.event_id = event_id
    and coalesce(a.is_waitlisted,false) = false
    and a.status in ('going','attending');

  if v_capacity is not null and v_going_count >= v_capacity then
    if v_allow_waitlist then
      v_is_waitlisted := true;
    else
      raise exception 'Event is full';
    end if;
  end if;

  -- Insert/Upsert attendee (adjust columns to your table)
  insert into public.event_attendees (id, event_id, user_id, status, is_waitlisted)
  values (gen_random_uuid(), event_id, v_uid, response, v_is_waitlisted)
  on conflict (event_id, user_id) do update
    set status = excluded.status,
        is_waitlisted = excluded.is_waitlisted
  returning id into v_attendee_id;

  -- Notify the user (bypasses RLS via SECURITY DEFINER)
  perform public.create_notification(
    v_uid,
    'event',
    case when v_is_waitlisted then 'Added to waitlist' else 'RSVP confirmed' end,
    v_event_title || case when v_is_waitlisted then ' — you are on the waitlist' else ' — see you there!' end,
    '/events/' || event_id::text,
    jsonb_build_object('event_id', event_id, 'attendee_id', v_attendee_id, 'status', response, 'waitlist', v_is_waitlisted)
  );

  return json_build_object(
    'attendee_id', v_attendee_id,
    'is_waitlisted', v_is_waitlisted
  );
end;
$$;


ALTER FUNCTION "public"."rsvp_to_event"("event_id" "uuid", "response" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rsvp_to_event"("p_event_id" "uuid", "p_attendee_id" "uuid", "p_attendance_status_text" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO event_rsvps (event_id, user_id, attendance_status)
  VALUES (p_event_id, p_attendee_id, p_attendance_status_text)
  ON CONFLICT (event_id, user_id) DO
  UPDATE SET attendance_status = EXCLUDED.attendance_status;
END;
$$;


ALTER FUNCTION "public"."rsvp_to_event"("p_event_id" "uuid", "p_attendee_id" "uuid", "p_attendance_status_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_to_jsonb"("_txt" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE outv jsonb;
BEGIN
  IF _txt IS NULL THEN
    RETURN NULL;
  END IF;
  outv := _txt::jsonb;         -- try parsing as JSON
  RETURN outv;
EXCEPTION WHEN others THEN
  RETURN to_jsonb(_txt);       -- fallback: keep as JSON string
END
$$;


ALTER FUNCTION "public"."safe_to_jsonb"("_txt" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sanitize_job_urls"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
begin
  if new.application_url is not null then
    new.application_url := nullif(btrim(new.application_url), '');
  end if;
  if new.apply_url is not null then
    new.apply_url := nullif(btrim(new.apply_url), '');
  end if;
  if new.external_url is not null then
    -- also clear boolean-ish junk
    if lower(btrim(new.external_url)) in ('true','false','t','f','1','0') then
      new.external_url := null;
    else
      new.external_url := nullif(btrim(new.external_url), '');
    end if;
  end if;

  -- convert bare email to mailto:
  declare u text := public.coalesce_application_url(new.apply_url, new.application_url, new.external_url);
  begin
    if u ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
      if new.application_url is not null then
        new.application_url := 'mailto:'||u;
      elsif new.apply_url is not null then
        new.apply_url := 'mailto:'||u;
      else
        new.external_url := 'mailto:'||u;
      end if;
    end if;
  end;

  return new;
end;
$_$;


ALTER FUNCTION "public"."sanitize_job_urls"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sanitize_profile_role"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.role is null then new.role := 'alumni'; end if;
  return new;
end $$;


ALTER FUNCTION "public"."sanitize_profile_role"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "venue" "text",
    "is_virtual" boolean DEFAULT false,
    "virtual_link" "text",
    "organizer_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "featured_image_url" "text",
    "is_featured" boolean DEFAULT false,
    "category" "text" DEFAULT 'General'::"text" NOT NULL,
    "max_attendees" integer,
    "is_published" boolean DEFAULT false,
    "tags" "text"[],
    "slug" "text",
    "agenda" "jsonb",
    "event_type" "text" DEFAULT 'networking'::"text",
    "cost" "text",
    "sponsors" "text",
    "registration_url" "text",
    "registration_deadline" timestamp with time zone,
    "created_by" "uuid",
    "creator_id" "uuid",
    "virtual_meeting_link" "text",
    "user_id" "uuid",
    "is_approved" boolean DEFAULT false,
    "reminder_sent" boolean DEFAULT false,
    "address" "text",
    "organizer_email" "text",
    "organizer_name" "text",
    "organizer_phone" "text",
    "price" numeric,
    "price_type" "text",
    "long_description" "text",
    "requirements" "text"[],
    "amenities" "text"[],
    "gallery" "text"[],
    "status" "text" DEFAULT 'pending'::"text",
    "additional_info" "text",
    "requires_approval" boolean DEFAULT true,
    "is_public" boolean DEFAULT true,
    "registration_required" boolean DEFAULT true,
    "updated_by" "uuid",
    "location" "text",
    "rejection_reason" "text",
    "approval_status" "public"."approval_status" DEFAULT 'pending'::"public"."approval_status" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "group_id" "uuid",
    "short_description" "text",
    "is_rejected" boolean DEFAULT false,
    "start_at" timestamp with time zone,
    "end_at" timestamp with time zone,
    "featured_image_path" "text",
    CONSTRAINT "ck_events_is_approved_consistent" CHECK (("is_approved" = ("approval_status" = 'approved'::"public"."approval_status")))
);

ALTER TABLE ONLY "public"."events" REPLICA IDENTITY FULL;


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."events"."is_published" IS 'Whether the event is published and visible to users';



COMMENT ON COLUMN "public"."events"."agenda" IS 'Event agenda or schedule of activities';



COMMENT ON COLUMN "public"."events"."is_approved" IS 'DEPRECATED: use approval_status';



COMMENT ON COLUMN "public"."events"."rejection_reason" IS 'Reason provided by the admin for rejecting an event.';



COMMENT ON COLUMN "public"."events"."is_rejected" IS 'DEPRECATED: use approval_status';



CREATE OR REPLACE FUNCTION "public"."search_events"("q" "text") RETURNS SETOF "public"."events"
    LANGUAGE "sql" STABLE
    AS $$
  select * from events
  where to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(location,'')) @@ plainto_tsquery('simple', q);
$$;


ALTER FUNCTION "public"."search_events"("q" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_events"("p_query" "text", "p_status" "text" DEFAULT NULL::"text", "p_type" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."events"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT *
  FROM public.events
  WHERE (p_query IS NULL OR (
    title ILIKE '%'||p_query||'%' OR
    description ILIKE '%'||p_query||'%' OR
    COALESCE(location, venue, '') ILIKE '%'||p_query||'%' OR
    EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%'||p_query||'%')
  ))
  AND (p_status IS NULL OR status = p_status)
  AND (p_type   IS NULL OR event_type = p_type)
  ORDER BY start_date DESC;
$$;


ALTER FUNCTION "public"."search_events"("p_query" "text", "p_status" "text", "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."self_set_role"("p_role" "public"."app_role_enum") RETURNS "public"."profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_old     public.profiles;
  v_new     public.profiles;
BEGIN
  -- Must be logged in
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized'
      USING ERRCODE = '42501';
  END IF;

  -- Only allow non-privileged role choices
  IF p_role NOT IN ('alumni','student','employer') THEN
    RAISE EXCEPTION 'Invalid self-service role'
      USING ERRCODE = 'P0001';
  END IF;

  -- Load current profile
  SELECT *
  INTO v_old
  FROM public.profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found', v_user_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Block deleted or blocked accounts from changing roles
  IF COALESCE(v_old.is_deleted, false)
     OR COALESCE(v_old.is_active, true) = false THEN
    RAISE EXCEPTION 'Cannot change role for deleted or blocked account'
      USING ERRCODE = 'P0001';
  END IF;

  -- Update role
  UPDATE public.profiles p
  SET role = p_role
  WHERE p.id = v_user_id
  RETURNING * INTO v_new;

  -- NOTE: if you want logging, we can later wire this to admin_log_action()
  -- or a dedicated activity_log table; skipped here to avoid schema mismatches.

  RETURN v_new;
END;
$$;


ALTER FUNCTION "public"."self_set_role"("p_role" "public"."app_role_enum") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_dm_message"("p_thread_id" "uuid", "p_content" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_message_id uuid;
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM profiles
  WHERE id = auth.uid();

  -- 1) Block employers entirely
  IF v_role = 'employer' THEN
    RAISE EXCEPTION 'Employers cannot use direct messaging';
  END IF;

  -- 2) Block non-fully-approved community users
  IF NOT public.fc_is_fully_approved(auth.uid()) THEN
    RAISE EXCEPTION 'User not approved for messaging';
  END IF;

  -- 3) TODO: optionally check user is part of this thread / connection exists

  -- 4) Insert message
  INSERT INTO dm_messages (thread_id, sender_id, content)
  VALUES (p_thread_id, auth.uid(), p_content)
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;


ALTER FUNCTION "public"."send_dm_message"("p_thread_id" "uuid", "p_content" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dm_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "read_at" timestamp with time zone,
    "client_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "dm_messages_body_check" CHECK (("length"("body") > 0))
);

ALTER TABLE ONLY "public"."dm_messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."dm_messages" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_dm_message"("p_thread_id" "uuid", "p_body" "text", "p_client_id" "text" DEFAULT NULL::"text", "p_meta" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "public"."dm_messages"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v         public.dm_messages;
  v_user_a  uuid;
  v_user_b  uuid;
  v_other   uuid;
BEGIN
  -- Validate thread exists and participants
  SELECT t.user_a, t.user_b
  INTO v_user_a, v_user_b
  FROM public.dm_threads t
  WHERE t.id = p_thread_id;

  IF v_user_a IS NULL THEN
    RAISE EXCEPTION 'Thread not found';
  END IF;

  -- The sender must be a participant
  IF auth.uid() NOT IN (v_user_a, v_user_b) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  -- Determine the other participant
  v_other := CASE
    WHEN auth.uid() = v_user_a THEN v_user_b
    ELSE v_user_a
  END;

  -- HARD backend rule:
  -- No active connection → No messaging
  IF NOT public.are_connected(auth.uid(), v_other) THEN
    RAISE EXCEPTION 'Not connected';
  END IF;

  -- Insert or update idempotent message
  INSERT INTO public.dm_messages (thread_id, sender_id, body, client_id, metadata)
  VALUES (p_thread_id, auth.uid(), p_body, p_client_id, p_meta)
  ON CONFLICT (thread_id, sender_id, client_id)
  DO UPDATE SET body = EXCLUDED.body, metadata = EXCLUDED.metadata
  RETURNING * INTO v;

  RETURN v;
END;
$$;


ALTER FUNCTION "public"."send_dm_message"("p_thread_id" "uuid", "p_body" "text", "p_client_id" "text", "p_meta" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_application_status"("p_application_id" "uuid", "p_status" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_job_id uuid;
BEGIN
  -- Fetch job_id for this application
  SELECT job_id
  INTO v_job_id
  FROM public.job_applications
  WHERE id = p_application_id;

  IF v_job_id IS NULL THEN
    RAISE EXCEPTION 'Application not found for id: %', p_application_id;
  END IF;

  -- Use the existing helper to check if current user can view/manage applications for this job
  IF NOT public.can_view_applications(v_job_id) THEN
    RAISE EXCEPTION 'You are not allowed to update applications for this job';
  END IF;

  -- Proceed with the update
  UPDATE public.job_applications
  SET
    status     = p_status,
    updated_at = now()
  WHERE id = p_application_id;
END;
$$;


ALTER FUNCTION "public"."set_application_status"("p_application_id" "uuid", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_comment_author_and_guard"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if tg_op = 'INSERT' then
    new.author_id := auth.uid();
  elsif tg_op = 'UPDATE' then
    -- block changing post/author/created_at
    if new.post_id <> old.post_id then
      raise exception 'Cannot change post_id of a comment';
    end if;
    if new.author_id <> old.author_id then
      raise exception 'Cannot change author_id of a comment';
    end if;
    if new.created_at <> old.created_at then
      new.created_at := old.created_at;
    end if;
    -- mark edits
    if new.content is distinct from old.content then
      new.is_edited := true;
      new.edited_at := now();
    end if;
  end if;
  return new;
end
$$;


ALTER FUNCTION "public"."set_comment_author_and_guard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_company_logo_from_poster"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  poster uuid;
  dp text;
begin
  poster := coalesce(new.posted_by, new.user_id, new.created_by);

  if poster is null or new.company_id is null then
    return new;
  end if;

  if exists (
    select 1
    from public.companies c
    where c.id = new.company_id
      and (c.logo_url is null or c.logo_url = '')
  ) then
    select p.logo_url
    into dp
    from public.profiles p
    where p.id = poster;

    if dp is not null and btrim(dp) <> '' then
      update public.companies c
      set logo_url = dp
      where c.id = new.company_id
        and (c.logo_url is null or c.logo_url = '');
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."set_company_logo_from_poster"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_company_on_job_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_company_id uuid;
begin
  if new.company_id is null then
    select c.id
    into v_company_id
    from public.companies c
    where c.created_by = auth.uid()
    order by c.created_at asc
    limit 1;

    if v_company_id is null then
      insert into public.companies(name, created_by, logo_url)
      values (
        'My Company',
        auth.uid(),
        (select logo_url from public.profiles where id = auth.uid())
      )
      returning id into v_company_id;
    end if;

    new.company_id := v_company_id;
  end if;

  return new;
end
$$;


ALTER FUNCTION "public"."set_company_on_job_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_group_creator_as_admin"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role, status)
  VALUES (NEW.id, auth.uid(), 'admin', 'active')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_group_creator_as_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_group_member_user_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_group_member_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_job_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  select posted_by into new.job_owner from jobs where id = new.job_id;
  return new;
end $$;


ALTER FUNCTION "public"."set_job_owner"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_job_owner_default"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.posted_by IS NULL THEN
    NEW.posted_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_job_owner_default"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_member_role"("p_group_id" "uuid", "p_user_id" "uuid", "p_role" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_admins int;
BEGIN
  IF NOT public.can_manage_group(p_group_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;

  IF p_role NOT IN ('member','admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF p_role = 'member' THEN
    SELECT count(*) INTO v_admins
    FROM public.group_members
    WHERE group_id = p_group_id
      AND status   = 'active'
      AND role IN ('owner','admin');

    IF v_admins <= 1
       AND EXISTS (
         SELECT 1
         FROM public.group_members
         WHERE group_id = p_group_id
           AND user_id  = p_user_id
           AND role IN ('owner','admin')
       )
    THEN
      RAISE EXCEPTION 'At least one admin must remain';
    END IF;
  END IF;

  UPDATE public.group_members
  SET role = p_role
  WHERE group_id = p_group_id
    AND user_id  = p_user_id
    AND status   = 'active';
END;
$$;


ALTER FUNCTION "public"."set_member_role"("p_group_id" "uuid", "p_user_id" "uuid", "p_role" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = now();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."should_deliver_in_app"("p_user_id" "uuid", "p_type" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
declare
  v_ok boolean := true;
begin
  -- If the prefs table exists, consult it; otherwise default allow.
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name   = 'notification_preferences'
  ) then
    -- prefer exact match on type; then allow-all ('all' / '*'); else default true
    select case
      when exists (
        select 1
        from public.notification_preferences np
        where np.user_id = p_user_id
          and lower(np.notification_type) = lower(p_type)
          and coalesce(np.in_app_enabled, true) = false
      ) then false
      when exists (
        select 1
        from public.notification_preferences np
        where np.user_id = p_user_id
          and lower(np.notification_type) in ('all','*')
          and coalesce(np.in_app_enabled, true) = false
      ) then false
      else true
    end
    into v_ok;
  end if;

  return v_ok;
end;
$$;


ALTER FUNCTION "public"."should_deliver_in_app"("p_user_id" "uuid", "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_or_get_conversation"("other_user" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  conv_id uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if me = other_user then
    raise exception 'cannot DM self';
  end if;

  if not public.is_connected(me, other_user) then
    raise exception 'not connected';
  end if;

  -- normalized pair to enforce A-B uniqueness
  a := least(me, other_user);
  b := greatest(me, other_user);

  select id into conv_id
  from public.conversations
  where participant_1 = a and participant_2 = b
  limit 1;

  if conv_id is null then
    insert into public.conversations (id, participant_1, participant_2, created_at, updated_at, last_message_at)
    values (gen_random_uuid(), a, b, now(), now(), now())
    returning id into conv_id;
  end if;

  return conv_id;
end;
$$;


ALTER FUNCTION "public"."start_or_get_conversation"("other_user" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_company_logo_from_avatar"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- No longer syncing companies.logo_url from profile.avatar_url
  return null;
end
$$;


ALTER FUNCTION "public"."sync_company_logo_from_avatar"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_company_logo_from_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_logo text;
begin
  if new.company_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.companies c
    where c.id = new.company_id
      and c.created_by = auth.uid()
  ) then
    return new;
  end if;

  select p.logo_url
  into v_logo
  from public.profiles p
  where p.id = auth.uid()
    and p.role = 'employer';

  if v_logo is not null and btrim(v_logo) <> '' then
    update public.companies
       set logo_url = coalesce(logo_url, v_logo)
     where id = new.company_id;
  end if;

  return new;
end
$$;


ALTER FUNCTION "public"."sync_company_logo_from_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_event_is_approved"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.is_approved := (new.approval_status = 'approved');
  return new;
end;
$$;


ALTER FUNCTION "public"."sync_event_is_approved"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_is_approved_from_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.is_approved := (NEW.approval_status = 'approved'::public.profile_approval_status);
  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."sync_is_approved_from_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_membership_to_members"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    INSERT INTO public.group_members (group_id, user_id, role, status)
    VALUES (NEW.group_id, NEW.user_id, NEW.role::text, 'active')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_membership_to_members"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_resume_profile_to_job_alert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_freq text;
BEGIN
  -- If there's no user_id, nothing to sync
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Normalise frequency to allowed values: daily / weekly / immediate
  v_freq := COALESCE(NEW.job_alert_frequency, 'daily');
  IF v_freq NOT IN ('daily', 'weekly', 'immediate') THEN
    v_freq := 'daily';
  END IF;

  -- Upsert a single canonical alert row keyed by (user_id, alert_name)
  INSERT INTO public.job_alerts AS ja (
    user_id,
    alert_name,
    keywords,
    locations,
    is_active,
    frequency,
    alert_frequency,
    created_at
  )
  VALUES (
    NEW.user_id,
    'profile-default',
    COALESCE(NEW.job_alert_keywords, ARRAY[]::text[]),
    COALESCE(NEW.preferred_locations, ARRAY[]::text[]),
    COALESCE(NEW.job_alert_active, true),
    v_freq,
    v_freq,
    now()
  )
  ON CONFLICT (user_id, alert_name)
  DO UPDATE SET
    keywords        = EXCLUDED.keywords,
    locations       = EXCLUDED.locations,
    is_active       = EXCLUDED.is_active,
    frequency       = EXCLUDED.frequency,
    alert_frequency = EXCLUDED.alert_frequency,
    updated_at      = now();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_resume_profile_to_job_alert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_connections_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if tg_op = 'INSERT' then
    if new.created_at is null then new.created_at := now(); end if;
    new.updated_at := now();
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."tg_connections_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at := now();
  return new;
end$$;


ALTER FUNCTION "public"."tg_set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."to_app_role"("p" "text") RETURNS "public"."app_role_enum"
    LANGUAGE "plpgsql" STABLE
    AS $$
declare v app_role_enum;
begin
  if p is null or btrim(p) = '' then
    return 'alumni';
  end if;
  begin
    v := lower(p)::app_role_enum;
    return v;
  exception when others then
    return 'alumni';
  end;
end;
$$;


ALTER FUNCTION "public"."to_app_role"("p" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_job_bookmark"("p_job_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Safety: must be logged in
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated'
      USING ERRCODE = '28000';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.job_bookmarks
    WHERE user_id = auth.uid()
      AND job_id = p_job_id
  )
  INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.job_bookmarks
    WHERE user_id = auth.uid()
      AND job_id = p_job_id;

    RETURN FALSE; -- now unbookmarked
  ELSE
    INSERT INTO public.job_bookmarks(user_id, job_id)
    VALUES (auth.uid(), p_job_id)
    ON CONFLICT (job_id, user_id) DO NOTHING;

    RETURN TRUE; -- now bookmarked
  END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_job_bookmark"("p_job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_attach_user_to_batch_group"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  PERFORM public.attach_user_to_batch_group(NEW.id);
  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."trg_attach_user_to_batch_group"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_event_attendee_invite_or_rsvp_notify"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user uuid := nullif(to_jsonb(new)->>'user_id','')::uuid;
  v_eid  uuid := nullif(to_jsonb(new)->>'event_id','')::uuid;
  v_status text := to_jsonb(new)->>'status';
  v_title text; v_msg text;
begin
  if v_user is null then return new; end if;

  if v_status = 'invited' then
    v_title := 'Event invitation';
    v_msg   := 'You have been invited to an event.';
  elsif v_status in ('registered','confirmed','rsvp','going') or v_status is null then
    -- default path when you insert without status → RSVP
    v_title := 'RSVP confirmed';
    v_msg   := 'You are registered for the event.';
  else
    return new;
  end if;

  perform public.notify(
    v_user, 'event', v_title, v_msg,
    '/events/' || coalesce(v_eid::text,''),
    jsonb_build_object('event_id', v_eid, 'status', v_status)
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."trg_event_attendee_invite_or_rsvp_notify"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_events_update_broadcast"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_eid uuid := nullif(to_jsonb(new)->>'id','')::uuid;
  v_old_status text := to_jsonb(old)->>'status';
  v_new_status text := to_jsonb(new)->>'status';
  v_old_ts timestamptz;
  v_new_ts timestamptz;
  v_reason text;
begin
  -- Try to resolve event start timestamp from common columns
  v_old_ts := coalesce(
    nullif(to_jsonb(old)->>'start_time','')::timestamptz,
    (nullif(to_jsonb(old)->>'date','')::date + coalesce(nullif(to_jsonb(old)->>'time','')::time, time '00:00'))::timestamptz
  );
  v_new_ts := coalesce(
    nullif(to_jsonb(new)->>'start_time','')::timestamptz,
    (nullif(to_jsonb(new)->>'date','')::date + coalesce(nullif(to_jsonb(new)->>'time','')::time, time '00:00'))::timestamptz
  );

  if v_eid is null then return new; end if;

  if v_new_status in ('cancelled','canceled','postponed') and v_new_status is distinct from v_old_status then
    v_reason := 'Event ' || v_new_status;
  elsif v_new_ts is distinct from v_old_ts then
    v_reason := 'Event time updated';
  else
    return new;
  end if;

  insert into public.notifications (id, recipient_id, type, title, message, link, metadata)
  select
    gen_random_uuid(),
    ea.user_id,
    'event',
    v_reason,
    'Please check the event details.',
    '/events/' || v_eid::text,
    jsonb_build_object('event_id', v_eid, 'old_time', v_old_ts, 'new_time', v_new_ts, 'status', v_new_status)
  from public.event_attendees ea
  where ea.event_id = v_eid;

  return new;
end;
$$;


ALTER FUNCTION "public"."trg_events_update_broadcast"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_groups_add_owner_membership"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.group_memberships (group_id, user_id, role, status)
  values (new.id, new.created_by, 'owner', 'approved')
  on conflict (group_id, user_id) do nothing;
  return new;
end $$;


ALTER FUNCTION "public"."trg_groups_add_owner_membership"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_groups_set_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_uid uuid := COALESCE(
    NEW.created_by,
    auth.uid(),
    NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
  );
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Cannot determine created_by (no JWT, NEW.created_by not provided)'
      USING ERRCODE = '23502', DETAIL = 'missing_created_by';
  END IF;

  NEW.created_by := v_uid;
  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."trg_groups_set_created_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_groups_set_name_norm"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.name_norm := normalize_group_name(NEW.name);
  RETURN NEW;
END $$;


ALTER FUNCTION "public"."trg_groups_set_name_norm"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_groups_stamp_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- when turning approval ON, stamp approver + time
  if (new.is_approved = true and (old.is_approved is distinct from true)) then
    new.approved_by := auth.uid();
    new.approved_at := now();
  end if;
  return new;
end $$;


ALTER FUNCTION "public"."trg_groups_stamp_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_process_notification_event_mentorship"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.module = 'mentorship' THEN
    PERFORM public.process_notification_event_mentorship_v1(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_process_notification_event_mentorship"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_last_message_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update the conversation's last_message_at timestamp if conversation_id is not null
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_last_message_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_published_status"("event_id" "uuid", "status_value" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    is_published_value BOOLEAN;
    result JSONB;
BEGIN
    -- Convert status string to boolean is_published value
    IF status_value = 'published' THEN
        is_published_value := TRUE;
    ELSE
        is_published_value := FALSE;
    END IF;
    
    -- Update the event status
    UPDATE public.events 
    SET 
        is_published = is_published_value,
        updated_at = now()
    WHERE id = event_id;
    
    -- Return the updated event
    SELECT row_to_json(e)::jsonb INTO result
    FROM public.events e
    WHERE id = event_id;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."update_event_published_status"("event_id" "uuid", "status_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_event_status_rpc"("event_id" "uuid", "new_status" "text") RETURNS "jsonb"
    LANGUAGE "sql"
    AS $$
    SELECT public.update_event_published_status(event_id, new_status);
$$;


ALTER FUNCTION "public"."update_event_status_rpc"("event_id" "uuid", "new_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_full_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Do NOT change the case; just set full_name.
  new.full_name := trim(coalesce(new.first_name,'') || ' ' || coalesce(new.last_name,''));
  return new;
end;
$$;


ALTER FUNCTION "public"."update_full_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_timestamp_on_avatar_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url) THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profile_timestamp_on_avatar_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_avatar"("p_file_path" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_full_url text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated'
      USING ERRCODE = '28000';
  END IF;

  -- Enforce upload rate limit (5 per hour)
  PERFORM public.enforce_avatar_upload_rate(v_user_id);

  -- Construct full public URL for the avatars bucket
  v_full_url :=
    'https://gvbtfolcizkzihforqte.supabase.co/storage/v1/object/public/avatars/'
    || p_file_path;

  UPDATE public.profiles
  SET
    avatar_url            = v_full_url,
    avatar_source         = 'supabase',
    avatar_storage_bucket = 'avatars'
  WHERE id = v_user_id;

  -- Log this upload
  INSERT INTO public.avatar_upload_log (user_id)
  VALUES (v_user_id);
END;
$$;


ALTER FUNCTION "public"."update_user_avatar"("p_file_path" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_user_avatar"("p_file_path" "text") IS 'Updates the current user''s avatar metadata after an upload to avatars bucket.';



CREATE OR REPLACE FUNCTION "public"."update_user_role"("user_id" "uuid", "new_role" "text") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  admin_user_id uuid;
  target_user_role text;
  admin_user_role text;
  result json;
BEGIN
  -- Check if user is admin or super_admin
  SELECT id, role INTO admin_user_id, admin_user_role
  FROM public.profiles
  WHERE id = auth.uid()
  AND (role = 'admin' OR role = 'super_admin');

  IF admin_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only administrators can update user roles'
    );
  END IF;

  -- Get target user's current role
  SELECT role INTO target_user_role
  FROM public.profiles
  WHERE id = user_id;

  -- Super admin role check - only super_admin can assign super_admin
  IF new_role = 'super_admin' AND admin_user_role != 'super_admin' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only super administrators can assign the super admin role'
    );
  END IF;

  -- Update the user's role
  UPDATE public.profiles
  SET role = new_role,
      updated_at = now()
  WHERE id = user_id
  RETURNING to_json(profiles.*) INTO result;

  RETURN json_build_object(
    'success', true,
    'message', format('User role updated to %s', new_role),
    'user', result
  );
END;
$$;


ALTER FUNCTION "public"."update_user_role"("user_id" "uuid", "new_role" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_user_role"("user_id" "uuid", "new_role" "text") IS 'Updates a user''s role. Only admins can call this function';



CREATE OR REPLACE FUNCTION "public"."upsert_degree_by_code"("p_code" "text", "p_label" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.degrees (code, label)
  values (p_code, coalesce(p_label, p_code))
  on conflict (code) do update
    set label = coalesce(excluded.label, public.degrees.label);

  return p_code;
end $$;


ALTER FUNCTION "public"."upsert_degree_by_code"("p_code" "text", "p_label" "text") OWNER TO "postgres";


CREATE PROCEDURE "public"."upsert_department"(IN "p_degree_code" "text", IN "p_dept" "text", IN "p_degree_label" "text" DEFAULT NULL::"text")
    LANGUAGE "plpgsql"
    AS $$
declare
  v_code text;
begin
  v_code := public.upsert_degree_by_code(p_degree_code, p_degree_label);

  insert into public.departments (degree_code, name)
  values (v_code, p_dept)
  on conflict (degree_code, name) do update
    set name = excluded.name;
end $$;


ALTER PROCEDURE "public"."upsert_department"(IN "p_degree_code" "text", IN "p_dept" "text", IN "p_degree_label" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."social_links" (
    "id" bigint NOT NULL,
    "profile_id" "uuid",
    "type" "public"."social_type" NOT NULL,
    "url" "text" NOT NULL,
    CONSTRAINT "chk_social_domain" CHECK ((("lower"(("type")::"text") = ANY (ARRAY['linkedin'::"text", 'github'::"text", 'x'::"text", 'instagram'::"text", 'facebook'::"text", 'website'::"text"])) AND (("lower"(("type")::"text") = 'website'::"text") OR (("lower"("url") ~ '^https?://([a-z0-9-]+\.)*linkedin\.com/.*'::"text") AND ("lower"(("type")::"text") = 'linkedin'::"text")) OR (("lower"("url") ~ '^https?://([a-z0-9-]+\.)*github\.com/.*'::"text") AND ("lower"(("type")::"text") = 'github'::"text")) OR (("lower"("url") ~ '^https?://([a-z0-9-]+\.)*(x\.com|twitter\.com)/.*'::"text") AND ("lower"(("type")::"text") = 'x'::"text")) OR (("lower"("url") ~ '^https?://([a-z0-9-]+\.)*instagram\.com/.*'::"text") AND ("lower"(("type")::"text") = 'instagram'::"text")) OR (("lower"("url") ~ '^https?://([a-z0-9-]+\.)*facebook\.com/.*'::"text") AND ("lower"(("type")::"text") = 'facebook'::"text")))))
);


ALTER TABLE "public"."social_links" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_social_link"("p_profile_id" "uuid", "p_type_text" "text", "p_url_text" "text") RETURNS "public"."social_links"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  _row public.social_links;
BEGIN
  -- Let trigger do most normalization; we still map aliases defensively
  IF lower(p_type_text) = 'twitter' THEN
    p_type_text := 'x';
  END IF;

  INSERT INTO public.social_links (profile_id, type, url)
  VALUES (p_profile_id, (lower(btrim(p_type_text))::social_type), btrim(p_url_text))
  ON CONFLICT (profile_id, type)
  DO UPDATE SET url = EXCLUDED.url
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;


ALTER FUNCTION "public"."upsert_social_link"("p_profile_id" "uuid", "p_type_text" "text", "p_url_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_activity_logs_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Copy alias into canonical when provided
  IF NEW.meta IS NOT NULL THEN
    NEW.metadata := NEW.meta;
  END IF;
  IF NEW.ua IS NOT NULL THEN
    NEW.user_agent := NEW.ua;
  END IF;

  -- Mirror canonical back to alias when alias not provided
  IF NEW.meta IS NULL AND NEW.metadata IS NOT NULL THEN
    NEW.meta := NEW.metadata;
  END IF;
  IF NEW.ua IS NULL AND NEW.user_agent IS NOT NULL THEN
    NEW.ua := NEW.user_agent;
  END IF;

  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."user_activity_logs_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_permission"("profile_uuid" "uuid", "permission_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM permissions 
    WHERE permissions.name = permission_name
    AND permissions.id IN (
      SELECT permission_id 
      FROM role_permissions
      WHERE role_permissions.role_id IN (
        SELECT role_id 
        FROM user_roles
        WHERE user_roles.profile_id = profile_uuid
      )
    )
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$;


ALTER FUNCTION "public"."user_has_permission"("profile_uuid" "uuid", "permission_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_role"("profile_uuid" "uuid", "role_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  has_role BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM roles 
    WHERE roles.name = role_name
    AND roles.id IN (
      SELECT role_id 
      FROM user_roles
      WHERE user_roles.profile_id = profile_uuid
    )
  ) INTO has_role;
  
  RETURN has_role;
END;
$$;


ALTER FUNCTION "public"."user_has_role"("profile_uuid" "uuid", "role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_profile_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
begin
  -- normalize email
  if new.email is not null then
    new.email := lower(btrim(new.email));
    if new.email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
      raise exception 'Invalid email format' using errcode='22000';
    end if;
  end if;

  -- sanitize names (letters, spaces, dot, hyphen, apostrophe)
  if new.first_name is not null then
    new.first_name := nullif(regexp_replace(btrim(new.first_name), '[^[:alpha:] .''-]', '', 'g'), '');
  end if;
  if new.last_name is not null then
    new.last_name := nullif(regexp_replace(btrim(new.last_name),  '[^[:alpha:] .''-]', '', 'g'), '');
  end if;

  -- normalize + validate phone (E.164-ish)
  if new.phone is not null then
    new.phone := regexp_replace(new.phone, '[^0-9+]', '', 'g');
    if new.phone !~ '^\+?\d{7,15}$' then
      raise exception 'Phone number must be 7-15 digits with optional leading +' using errcode='22000';
    end if;
  end if;

  return new;
end;
$_$;


ALTER FUNCTION "public"."validate_profile_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_social_links"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.social_links ?| ARRAY(
     SELECT unnest(ak) FROM (VALUES (ARRAY['linkedin','github','website','instagram','facebook','x'])) v(ak)
  ) IS FALSE AND NEW.social_links <> '{}'::jsonb THEN
     RAISE EXCEPTION 'Only linkedin, github, website, instagram, facebook, x allowed';
  END IF;
  RETURN NEW;
END; $$;


ALTER FUNCTION "public"."validate_social_links"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."whoami_role"() RETURNS "public"."app_role_enum"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select role from public.profiles where id = auth.uid()
$$;


ALTER FUNCTION "public"."whoami_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer DEFAULT (1024 * 1024)) RETURNS SETOF "realtime"."wal_rls"
    LANGUAGE "plpgsql"
    AS $$
declare
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

columns realtime.wal_column[];
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text" DEFAULT 'ROW'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) RETURNS "text"
    LANGUAGE "sql"
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) RETURNS SETOF "realtime"."wal_rls"
    LANGUAGE "sql"
    SET "log_min_messages" TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "realtime"."quote_wal2json"("entity" "regclass") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION "realtime"."quote_wal2json"("entity" "regclass") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "realtime"."subscription_check_filters"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION "realtime"."subscription_check_filters"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "realtime"."to_regrole"("role_name" "text") RETURNS "regrole"
    LANGUAGE "sql" IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION "realtime"."to_regrole"("role_name" "text") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "realtime"."topic"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION "realtime"."topic"() OWNER TO "supabase_realtime_admin";


CREATE OR REPLACE FUNCTION "storage"."add_prefixes"("_bucket_id" "text", "_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION "storage"."add_prefixes"("_bucket_id" "text", "_name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_leaf_prefixes"("bucket_ids" "text"[], "names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION "storage"."delete_leaf_prefixes"("bucket_ids" "text"[], "names" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_prefix"("_bucket_id" "text", "_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION "storage"."delete_prefix"("_bucket_id" "text", "_name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_prefix_hierarchy_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION "storage"."delete_prefix_hierarchy_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."enforce_bucket_name_length"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION "storage"."enforce_bucket_name_length"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_level"("name" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION "storage"."get_level"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_prefix"("name" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION "storage"."get_prefix"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_prefixes"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION "storage"."get_prefixes"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."lock_top_prefixes"("bucket_ids" "text"[], "names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION "storage"."lock_top_prefixes"("bucket_ids" "text"[], "names" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_delete_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."objects_delete_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_insert_prefix_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_insert_prefix_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."objects_update_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_level_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_update_level_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_prefix_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_update_prefix_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."prefixes_delete_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."prefixes_delete_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."prefixes_insert_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."prefixes_insert_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_legacy_v1"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search_legacy_v1"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v1_optimised"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search_v1_optimised"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "start_after" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text", "sort_column" "text" DEFAULT 'name'::"text", "sort_column_after" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer, "levels" integer, "start_after" "text", "sort_order" "text", "sort_column" "text", "sort_column_after" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "year" integer,
    "url" "text",
    "achievement_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "achievements_achievement_type_check" CHECK (("achievement_type" = ANY (ARRAY['professional'::"text", 'academic'::"text", 'personal'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "description" "text" NOT NULL,
    "activity_type" "text" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_actions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "action_type" "text" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid",
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_analytics_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "function_name" "text" NOT NULL,
    "parameters" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_analytics_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_deletion_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "target_user_id" "uuid" NOT NULL,
    "deletion_type" "text" NOT NULL,
    "reason" "text",
    "context" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "admin_deletion_audit_log_deletion_type_check" CHECK (("deletion_type" = ANY (ARRAY['soft_delete'::"text", 'purge'::"text", 'auth_delete'::"text"])))
);


ALTER TABLE "public"."admin_deletion_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_invalid_degree_programs_audit" (
    "id" "uuid" NOT NULL,
    "old_degree_program" "text",
    "snapshot_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_invalid_degree_programs_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notification_type" "text" DEFAULT 'event_created'::"text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "message" "text",
    "created_by" "uuid",
    "is_read" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."admin_notifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."admin_profiles_view" AS
 SELECT "profiles"."id",
    "profiles"."full_name",
    "profiles"."email",
    "profiles"."phone",
    "profiles"."phone_number",
    "profiles"."current_job_title",
    "profiles"."company_name",
    "profiles"."location"
   FROM "public"."profiles";


ALTER TABLE "public"."admin_profiles_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."alumni_directory_public" AS
 SELECT "p"."id",
    COALESCE("p"."full_name", "concat_ws"(' '::"text", "p"."first_name", "p"."last_name")) AS "full_name",
    "p"."avatar_url",
    "p"."degree_program",
    "p"."graduation_year",
    "p"."current_job_title",
    "p"."company_name",
    "p"."location_city",
    "p"."location_country",
    "p"."achievements"
   FROM "public"."profiles" "p"
  WHERE (("p"."role" = 'alumni'::"public"."app_role_enum") OR (EXISTS ( SELECT 1
           FROM "public"."mentors" "m"
          WHERE (("m"."user_id" = "p"."id") AND ("m"."status" = 'approved'::"text")))));


ALTER TABLE "public"."alumni_directory_public" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."avatar_oauth_backup" (
    "id" "uuid",
    "email" "text",
    "first_name" "text",
    "last_name" "text",
    "full_name" "text",
    "avatar_url" "text",
    "graduation_year" integer,
    "degree" "text",
    "major" "text",
    "current_company" "text",
    "current_position" "text",
    "location" "text",
    "bio" "text",
    "linkedin_url" "text",
    "twitter_url" "text",
    "website_url" "text",
    "is_verified" boolean,
    "is_mentor" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "mentor_availability" "text",
    "mentor_topics" "text"[],
    "mentor_status" "text",
    "mentee_status" "text",
    "alumni_verification_status" "text",
    "verification_document_url" "text",
    "verification_notes" "text",
    "verification_reviewed_by" "uuid",
    "verification_reviewed_at" timestamp with time zone,
    "department" "text",
    "phone" "text",
    "github_url" "text",
    "skills" "jsonb",
    "account_type" "text",
    "student_id" "text",
    "is_employer" boolean,
    "company_name" "text",
    "company_website" "text",
    "industry" "text",
    "phone_number" "text",
    "is_admin" boolean,
    "role" "public"."app_role_enum",
    "job_title" "text",
    "years_experience" integer,
    "current_location" "text",
    "degree_program" "text",
    "current_job_title" "text",
    "major_specialization" "text",
    "biography" "text",
    "privacy_level" "text",
    "is_online" boolean,
    "last_seen" timestamp with time zone,
    "username" "text",
    "about" "text",
    "headline" "text",
    "company" "text",
    "experience" "text",
    "specialization" "text",
    "achievements" "jsonb",
    "interests" "jsonb",
    "languages" "text"[],
    "social_links" "jsonb",
    "verified" boolean,
    "batch_year" integer,
    "resume_url" "text",
    "wants_job_alerts" boolean,
    "website" "text",
    "is_available_for_mentorship" boolean,
    "mentorship_topics" "text"[],
    "date_of_birth" "date",
    "company_location" "text",
    "primary_role" "text",
    "batch" "text",
    "is_profile_complete" boolean,
    "show_in_directory" boolean,
    "privacy_settings" "jsonb",
    "rejection_comment" "text",
    "rejected_by" "uuid",
    "rejection_date" timestamp with time zone,
    "admin_notes" "text",
    "clarification_comment" "text",
    "rejection_reason" "text",
    "is_deleted" boolean,
    "deleted_at" timestamp with time zone,
    "deleted_by" "uuid",
    "is_approved" boolean,
    "verified_at" timestamp with time zone,
    "degree_code" "text",
    "education" "jsonb",
    "work_experience" "jsonb",
    "positions" "jsonb",
    "profession" "text",
    "location_city" "text",
    "location_country" "text",
    "company_size" "text",
    "approval_status" "public"."profile_approval_status",
    "is_hidden" boolean,
    "visibility" "text",
    "extra" "jsonb",
    "is_active" boolean,
    "verified_by" "uuid",
    "approved_at" timestamp with time zone,
    "approval_reason" "text",
    "department_id" "uuid",
    "avatar_path" "text",
    "expected_graduation_year" integer,
    "approval_reviewed_by" "uuid",
    "approval_reviewed_at" timestamp with time zone,
    "avatar_source" "text",
    "avatar_storage_bucket" "text"
);


ALTER TABLE "public"."avatar_oauth_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."avatar_upload_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."avatar_upload_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_bad_conversations_20250905" (
    "conversation_id" "uuid",
    "conversation_created_at" timestamp with time zone,
    "conversation_updated_at" timestamp with time zone,
    "last_message_at" timestamp with time zone,
    "participant_1" "uuid",
    "participant_2" "uuid",
    "message_id" "uuid",
    "sender_id" "uuid",
    "recipient_id" "uuid",
    "content" "text",
    "message_created_at" timestamp with time zone,
    "message_updated_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "client_id" "uuid"
);


ALTER TABLE "public"."backup_bad_conversations_20250905" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backup_bad_conversations_20250905_json" (
    "conversation_id" "uuid",
    "conversation" "json",
    "message" "json"
);


ALTER TABLE "public"."backup_bad_conversations_20250905_json" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_attendees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "attendance_status" "text" DEFAULT 'registered'::"text" NOT NULL,
    "check_in_time" timestamp with time zone,
    "attendee_id" "uuid",
    "registration_date" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "is_waitlisted" boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY "public"."event_attendees" REPLICA IDENTITY FULL;


ALTER TABLE "public"."event_attendees" OWNER TO "postgres";


COMMENT ON TABLE "public"."event_attendees" IS 'Tracks user RSVPs for events.';



COMMENT ON COLUMN "public"."event_attendees"."attendance_status" IS 'The attendance status of the user for the event.';



CREATE OR REPLACE VIEW "public"."event_attendance_counts" WITH ("security_invoker"='true') AS
 SELECT "e"."id" AS "event_id",
    "count"(*) FILTER (WHERE ("ea"."attendance_status" = ANY (ARRAY['registered'::"text", 'going'::"text", 'checked_in'::"text"]))) AS "total_attendees"
   FROM ("public"."events" "e"
     LEFT JOIN "public"."event_attendees" "ea" ON (("ea"."event_id" = "e"."id")))
  WHERE ("e"."approval_status" = 'approved'::"public"."approval_status")
  GROUP BY "e"."id";


ALTER TABLE "public"."event_attendance_counts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."basic_event_metrics" AS
 SELECT "e"."id",
    "e"."title",
    "e"."start_date",
    "e"."end_date",
    "c"."total_attendees"
   FROM ("public"."events" "e"
     LEFT JOIN "public"."event_attendance_counts" "c" ON (("c"."event_id" = "e"."id")))
  ORDER BY "e"."start_date" DESC;


ALTER TABLE "public"."basic_event_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookmarked_jobs_legacy_do_not_use" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "job_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bookmarked_jobs_legacy_do_not_use" OWNER TO "postgres";


COMMENT ON TABLE "public"."bookmarked_jobs_legacy_do_not_use" IS 'Stores user bookmarks for job listings.';



COMMENT ON COLUMN "public"."bookmarked_jobs_legacy_do_not_use"."id" IS 'Unique identifier for the bookmark entry.';



COMMENT ON COLUMN "public"."bookmarked_jobs_legacy_do_not_use"."user_id" IS 'Foreign key referencing the user (from auth.users) who made the bookmark.';



COMMENT ON COLUMN "public"."bookmarked_jobs_legacy_do_not_use"."job_id" IS 'Foreign key referencing the bookmarked job (from public.jobs).';



COMMENT ON COLUMN "public"."bookmarked_jobs_legacy_do_not_use"."created_at" IS 'Timestamp of when the bookmark was created.';



ALTER TABLE "public"."bookmarked_jobs_legacy_do_not_use" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bookmarked_jobs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."clarification_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clarification_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_approvals" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "content_type" "text" NOT NULL,
    "content_data" "jsonb",
    "creator_id" "uuid" NOT NULL,
    "reviewer_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reviewed_at" timestamp with time zone,
    "rejection_reason" "text",
    CONSTRAINT "content_approvals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."content_approvals" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_approvals" IS 'Manages the approval workflow for user-submitted content like posts, comments, etc.';



COMMENT ON COLUMN "public"."content_approvals"."content_data" IS 'JSONB blob containing the content to be reviewed, e.g., post text or comment body.';



COMMENT ON COLUMN "public"."content_approvals"."creator_id" IS 'The ID of the user who submitted the content.';



ALTER TABLE "public"."content_approvals" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."content_approvals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."content_moderation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_type" "text" NOT NULL,
    "content_id" "uuid" NOT NULL,
    "moderator_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "review_notes" "text",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_moderation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_members" (
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversation_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."conversation_participants" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "participant_1" "uuid",
    "participant_2" "uuid",
    "mentorship_relationship_id" "uuid"
);

ALTER TABLE ONLY "public"."conversations" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."csv_import_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "filename" "text" NOT NULL,
    "record_count" integer,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "target_table" "text" NOT NULL,
    "error_details" "text",
    "mapping_config" "jsonb",
    "action_type" "text"
);


ALTER TABLE "public"."csv_import_history" OWNER TO "postgres";


COMMENT ON COLUMN "public"."csv_import_history"."action_type" IS 'Describes the action being logged (e.g. export, import, failed).';



CREATE TABLE IF NOT EXISTS "public"."degree_programs" (
    "code" "text" NOT NULL,
    "label" "text" NOT NULL
);


ALTER TABLE "public"."degree_programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deletion_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone
);


ALTER TABLE "public"."deletion_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "uuid",
    "user_id" "uuid",
    "rating" integer,
    "comments" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "comment" "text",
    "rsvp_status" "text",
    CONSTRAINT "event_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."event_feedback" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."detailed_event_feedback" AS
 SELECT "ef"."id" AS "feedback_id",
    "ef"."rating",
    "ef"."comments",
    "ef"."submitted_at" AS "feedback_submitted_at",
    "ef"."event_id",
    "e"."title" AS "event_title",
    "ef"."user_id",
    "p"."full_name",
    "p"."avatar_url"
   FROM (("public"."event_feedback" "ef"
     JOIN "public"."events" "e" ON (("ef"."event_id" = "e"."id")))
     JOIN "public"."profiles" "p" ON (("ef"."user_id" = "p"."id")));


ALTER TABLE "public"."detailed_event_feedback" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."directory_profiles" AS
 SELECT "p"."id",
    "p"."email",
    "p"."first_name",
    "p"."last_name",
    "p"."full_name",
    "p"."avatar_url",
    "p"."graduation_year",
    "p"."degree",
    "p"."major",
    "p"."current_company",
    "p"."current_position",
    "p"."location",
    "p"."bio",
    "p"."linkedin_url",
    "p"."twitter_url",
    "p"."website_url",
    "p"."is_verified",
    "p"."is_mentor",
    "p"."created_at",
    "p"."updated_at",
    "p"."mentor_availability",
    "p"."mentor_topics",
    "p"."mentor_status",
    "p"."mentee_status",
    "p"."alumni_verification_status",
    "p"."verification_document_url",
    "p"."verification_notes",
    "p"."verification_reviewed_by",
    "p"."verification_reviewed_at",
    "p"."department",
    "p"."phone",
    "p"."github_url",
    "p"."skills",
    "p"."account_type",
    "p"."student_id",
    "p"."is_employer",
    "p"."company_name",
    "p"."company_website",
    "p"."industry",
    "p"."phone_number",
    "p"."is_admin",
    "p"."role",
    "p"."job_title",
    "p"."years_experience",
    "p"."current_location",
    "p"."degree_program",
    "p"."current_job_title",
    "p"."major_specialization",
    "p"."biography",
    "p"."privacy_level",
    "p"."is_online",
    "p"."last_seen",
    "p"."username",
    "p"."about",
    "p"."headline",
    "p"."company",
    "p"."experience",
    "p"."specialization",
    "p"."achievements",
    "p"."interests",
    "p"."languages",
    "p"."social_links",
    "p"."verified",
    "p"."batch_year",
    "p"."resume_url",
    "p"."wants_job_alerts",
    "p"."website",
    "p"."is_available_for_mentorship",
    "p"."mentorship_topics",
    "p"."date_of_birth",
    "p"."company_location",
    "p"."primary_role",
    "p"."batch",
    "p"."is_profile_complete",
    "p"."show_in_directory",
    "p"."privacy_settings",
    "p"."rejection_comment",
    "p"."rejected_by",
    "p"."rejection_date",
    "p"."admin_notes",
    "p"."clarification_comment",
    "p"."rejection_reason",
    "p"."is_deleted",
    "p"."deleted_at",
    "p"."deleted_by",
    "p"."is_approved",
    "p"."verified_at",
    "p"."degree_code",
    "p"."education",
    "p"."work_experience",
    "p"."positions",
    "p"."profession",
    "p"."location_city",
    "p"."location_country",
    "p"."company_size",
    "p"."approval_status",
    "p"."is_hidden",
    "p"."visibility",
    "p"."extra",
    "p"."is_active",
    "p"."verified_by",
    "p"."approved_at",
    "p"."approval_reason",
    "p"."department_id",
    "p"."avatar_path",
    "p"."expected_graduation_year",
    "p"."approval_reviewed_by",
    "p"."approval_reviewed_at"
   FROM "public"."profiles" "p"
  WHERE (("p"."role" = ANY (ARRAY['student'::"public"."app_role_enum", 'alumni'::"public"."app_role_enum", 'admin'::"public"."app_role_enum", 'super_admin'::"public"."app_role_enum"])) AND (( SELECT "profiles"."role"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"())) <> 'employer'::"public"."app_role_enum"));


ALTER TABLE "public"."directory_profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."directory_profiles_extended" AS
 SELECT "dp"."id",
    "dp"."first_name",
    "dp"."last_name",
    "dp"."full_name",
    "dp"."graduation_year",
    "dp"."degree_program",
    "dp"."department",
    "dp"."current_job_title",
    "dp"."company_name",
    "dp"."location",
    "dp"."location_city",
    "dp"."location_country",
    "dp"."avatar_url",
    "dp"."is_employer",
    "dp"."role",
    "dp"."approval_status",
    "dp"."is_deleted",
    "dp"."is_active",
    "dp"."show_in_directory",
    COALESCE("p"."graduation_year", "p"."expected_graduation_year", "p"."batch_year") AS "batch_year"
   FROM ("public"."directory_profiles_base" "dp"
     JOIN "public"."profiles" "p" ON (("p"."id" = "dp"."id")));


ALTER TABLE "public"."directory_profiles_extended" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."directory_profiles_public" AS
 SELECT "dp"."id",
    "dp"."first_name",
    "dp"."last_name",
    "dp"."full_name",
    "dp"."graduation_year",
    "dp"."degree_program",
    "dp"."department",
    "dp"."current_job_title",
    "dp"."company_name",
    "dp"."location",
    "dp"."location_city",
    "dp"."location_country",
    "dp"."avatar_url",
    "dp"."role",
    "dp"."approval_status",
    "dp"."is_active",
    "dp"."is_deleted",
    "dp"."show_in_directory"
   FROM "public"."directory_profiles_base" "dp"
  WHERE (("dp"."is_deleted" = false) AND ("dp"."is_active" = true) AND ("dp"."show_in_directory" = true) AND ("dp"."approval_status" = 'approved'::"public"."profile_approval_status") AND ("dp"."role" <> 'employer'::"public"."app_role_enum"));


ALTER TABLE "public"."directory_profiles_public" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."directory_profiles_safe" AS
 SELECT "dp"."id",
    "dp"."first_name",
    "dp"."last_name",
    "dp"."full_name",
    "dp"."graduation_year",
    "dp"."degree_program",
    "dp"."department",
    "dp"."current_job_title",
    "dp"."company_name",
    "dp"."location",
    "dp"."location_city",
    "dp"."location_country",
    "dp"."avatar_url",
    "dp"."role",
    "dp"."approval_status",
    "dp"."is_deleted",
    "dp"."is_active",
    "dp"."show_in_directory",
    "c"."email",
    "c"."phone_number",
    "c"."has_private_email",
    "c"."has_private_phone",
    "p"."expected_graduation_year",
    "p"."batch_year"
   FROM (("public"."directory_profiles_base" "dp"
     JOIN "public"."profiles" "p" ON (("p"."id" = "dp"."id")))
     JOIN LATERAL "public"."get_profile_contact_details"("dp"."id") "c"("profile_id", "email", "phone_number", "has_private_email", "has_private_phone") ON (true))
  WHERE (("dp"."is_deleted" = false) AND ("dp"."is_active" = true) AND ("dp"."show_in_directory" = true) AND ("dp"."approval_status" = 'approved'::"public"."profile_approval_status") AND ("dp"."role" <> 'employer'::"public"."app_role_enum"));


ALTER TABLE "public"."directory_profiles_safe" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dm_participants" (
    "thread_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."dm_participants" REPLICA IDENTITY FULL;


ALTER TABLE "public"."dm_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dm_threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_a" "uuid" NOT NULL,
    "user_b" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_message_at" timestamp with time zone,
    "last_message_excerpt" "text"
);

ALTER TABLE ONLY "public"."dm_threads" REPLICA IDENTITY FULL;


ALTER TABLE "public"."dm_threads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."education_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "institution_name" "text" NOT NULL,
    "degree_type" "text" NOT NULL,
    "major" "text",
    "graduation_year" integer,
    "gpa" numeric(3,2),
    "honors" "text",
    "notable_achievements" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "profile_id" "uuid",
    "degree" "text" GENERATED ALWAYS AS ("degree_type") STORED,
    "specialization" "text" GENERATED ALWAYS AS ("major") STORED
);


ALTER TABLE "public"."education_history" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."event_attendees_with_profiles" AS
 SELECT "ea"."id",
    "ea"."created_at",
    "ea"."event_id",
    "ea"."user_id",
    "ea"."attendance_status" AS "status",
    "ea"."check_in_time",
    "p"."id" AS "profile_id",
    "p"."full_name",
    "p"."avatar_url",
    "e"."title" AS "event_title",
    "e"."start_date" AS "event_start_date"
   FROM (("public"."event_attendees" "ea"
     JOIN "public"."profiles" "p" ON (("ea"."user_id" = "p"."id")))
     JOIN "public"."events" "e" ON (("ea"."event_id" = "e"."id")));


ALTER TABLE "public"."event_attendees_with_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_groups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "group_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."event_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_rsvps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "attendance_status" "text"
);


ALTER TABLE "public"."event_rsvps" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."event_stats" AS
SELECT
    NULL::"uuid" AS "event_id",
    NULL::"text" AS "title",
    NULL::timestamp with time zone AS "start_date",
    NULL::timestamp with time zone AS "end_date",
    NULL::"text" AS "location",
    NULL::boolean AS "is_virtual",
    NULL::"text" AS "category",
    NULL::boolean AS "is_featured",
    NULL::boolean AS "is_published",
    NULL::integer AS "max_attendees",
    NULL::"uuid" AS "organizer_id",
    NULL::"text" AS "organizer_name",
    NULL::bigint AS "attendee_count",
    NULL::bigint AS "spots_remaining";


ALTER TABLE "public"."event_stats" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."events_count_by_status" AS
 SELECT "events"."approval_status",
    "count"(*) AS "total"
   FROM "public"."events"
  GROUP BY "events"."approval_status";


ALTER TABLE "public"."events_count_by_status" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."events_moderation_queue" AS
 SELECT "e"."id",
    "e"."created_at",
    "e"."updated_at",
    "e"."title",
    "e"."description",
    "e"."start_date",
    "e"."end_date",
    "e"."venue",
    "e"."is_virtual",
    "e"."virtual_link",
    "e"."organizer_id",
    "e"."featured_image_url",
    "e"."is_featured",
    "e"."category",
    "e"."max_attendees",
    "e"."is_published",
    "e"."tags",
    "e"."slug",
    "e"."agenda",
    "e"."event_type",
    "e"."cost",
    "e"."sponsors",
    "e"."registration_url",
    "e"."registration_deadline",
    "e"."created_by",
    "e"."creator_id",
    "e"."virtual_meeting_link",
    "e"."user_id",
    "e"."is_approved",
    "e"."reminder_sent",
    "e"."address",
    "e"."organizer_email",
    "e"."organizer_name",
    "e"."organizer_phone",
    "e"."price",
    "e"."price_type",
    "e"."long_description",
    "e"."requirements",
    "e"."amenities",
    "e"."gallery",
    "e"."status",
    "e"."additional_info",
    "e"."requires_approval",
    "e"."is_public",
    "e"."registration_required",
    "e"."updated_by",
    "e"."location",
    "e"."rejection_reason",
    "e"."approval_status",
    "e"."reviewed_by",
    "e"."reviewed_at",
    "e"."group_id",
    "e"."short_description",
    "e"."is_rejected",
    "e"."start_at",
    "e"."end_at"
   FROM "public"."events" "e"
  WHERE (("e"."requires_approval" IS DISTINCT FROM false) AND (COALESCE("e"."approval_status", 'pending'::"public"."approval_status") = 'pending'::"public"."approval_status"));


ALTER TABLE "public"."events_moderation_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "key" "text" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "edited_at" timestamp with time zone,
    "is_edited" boolean DEFAULT false NOT NULL,
    CONSTRAINT "group_comments_content_check" CHECK (("length"("btrim"("content")) > 0))
);


ALTER TABLE "public"."group_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone GENERATED ALWAYS AS ("joined_at") STORED,
    "status" "text" DEFAULT 'active'::"text",
    CONSTRAINT "group_members_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'member'::"text"]))),
    CONSTRAINT "group_members_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'pending'::"text", 'left'::"text", 'removed'::"text"])))
);

ALTER TABLE ONLY "public"."group_members" REPLICA IDENTITY FULL;


ALTER TABLE "public"."group_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."group_members" IS 'Manages memberships and roles of users in groups.';



CREATE TABLE IF NOT EXISTS "public"."group_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "role" "public"."group_member_role_enum" DEFAULT 'member'::"public"."group_member_role_enum" NOT NULL,
    "status" "public"."membership_status_enum" DEFAULT 'pending'::"public"."membership_status_enum" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."group_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_private" boolean DEFAULT false NOT NULL,
    "group_avatar_url" "text",
    "tags" "text"[],
    "is_admin_only_posts" boolean DEFAULT false,
    "is_approved" boolean DEFAULT false NOT NULL,
    "approval_status" "public"."approval_status" DEFAULT 'pending'::"public"."approval_status" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "is_rejected" boolean DEFAULT false,
    "rejection_reason" "text",
    "name_norm" "text" GENERATED ALWAYS AS ("lower"("regexp_replace"("btrim"("name"), '\s+'::"text", ' '::"text", 'g'::"text"))) STORED,
    "is_archived" boolean DEFAULT false NOT NULL,
    "visibility" "public"."group_visibility_enum" DEFAULT 'public'::"public"."group_visibility_enum" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "review_notes" "text",
    CONSTRAINT "groups_visibility_consistency" CHECK ((("visibility" = 'private'::"public"."group_visibility_enum") = "is_private"))
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


COMMENT ON TABLE "public"."groups" IS 'Stores information about user-created networking groups.';



COMMENT ON COLUMN "public"."groups"."is_rejected" IS 'Flag to mark a group as rejected by an admin.';



COMMENT ON COLUMN "public"."groups"."rejection_reason" IS 'Reason provided by the admin for rejecting a group.';



CREATE OR REPLACE VIEW "public"."group_moderation_state" AS
 SELECT "groups"."id",
    "groups"."is_approved",
    "groups"."is_rejected",
    "groups"."approval_status",
        CASE
            WHEN "groups"."is_rejected" THEN 'rejected'::"text"
            WHEN "groups"."is_approved" THEN 'approved'::"text"
            ELSE 'pending'::"text"
        END AS "state"
   FROM "public"."groups";


ALTER TABLE "public"."group_moderation_state" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_post_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."group_post_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_post_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text",
    "has_image" boolean DEFAULT false,
    "status" "text" DEFAULT 'approved'::"text",
    "title" "text"
);


ALTER TABLE "public"."group_posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."group_posts" IS 'Stores posts, comments, and replies within networking groups.';



CREATE TABLE IF NOT EXISTS "public"."job_alerts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "alert_name" "text" NOT NULL,
    "job_titles" "text"[],
    "industries" "text"[],
    "locations" "text"[],
    "job_types" "text"[],
    "min_salary" integer,
    "keywords" "text"[],
    "frequency" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "job_type" "text",
    "location" "text",
    "max_salary" integer,
    "experience_level" "text",
    "desired_roles" "text"[],
    "desired_industries" "text"[],
    "alert_frequency" "text",
    "name" "text",
    CONSTRAINT "job_alerts_frequency_check" CHECK (("frequency" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'immediate'::"text"]))),
    CONSTRAINT "job_alerts_job_type_check" CHECK (("job_type" = ANY (ARRAY['full-time'::"text", 'part-time'::"text", 'contract'::"text", 'internship'::"text"])))
);

ALTER TABLE ONLY "public"."job_alerts" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_alerts" OWNER TO "postgres";


COMMENT ON TABLE "public"."job_alerts" IS 'trigger schema reload';



CREATE TABLE IF NOT EXISTS "public"."job_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."job_bookmarks" REPLICA IDENTITY FULL;


ALTER TABLE "public"."job_bookmarks" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."job_postings" AS
 SELECT "jobs"."id",
    "jobs"."title",
    "jobs"."company_name",
    "jobs"."location",
    "jobs"."job_type",
    "jobs"."description",
    "jobs"."requirements",
    "jobs"."salary_range",
    "jobs"."application_url",
    "jobs"."contact_email",
    "jobs"."expires_at",
    "jobs"."posted_by",
    "jobs"."is_active",
    "jobs"."created_at",
    "jobs"."updated_at",
    "jobs"."education_required",
    "jobs"."required_skills",
    "jobs"."deadline",
    "jobs"."experience_required",
    "jobs"."education_level",
    "jobs"."external_url",
    "jobs"."industry",
    "jobs"."application_instructions",
    "jobs"."user_id",
    "jobs"."is_approved",
    "jobs"."company_id",
    "jobs"."apply_url",
    "jobs"."is_verified",
    "jobs"."created_by"
   FROM "public"."jobs";


ALTER TABLE "public"."job_postings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentee_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "career_goals" "text",
    "areas_seeking_mentorship" "text"[],
    "specific_skills_to_develop" "text"[],
    "preferred_mentor_characteristics" "text"[],
    "time_commitment_available" "text",
    "preferred_communication_method" "text"[],
    "statement_of_expectations" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mentee_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."mentee_profiles" IS 'Stores detailed profiles for users who register as mentees.';



COMMENT ON COLUMN "public"."mentee_profiles"."user_id" IS 'Foreign key to the user''s main profile in public.profiles.';



COMMENT ON COLUMN "public"."mentee_profiles"."career_goals" IS 'Mentee''s stated career goals.';



COMMENT ON COLUMN "public"."mentee_profiles"."areas_seeking_mentorship" IS 'List of areas the mentee is seeking mentorship in.';



COMMENT ON COLUMN "public"."mentee_profiles"."specific_skills_to_develop" IS 'List of specific skills the mentee wants to develop.';



COMMENT ON COLUMN "public"."mentee_profiles"."preferred_mentor_characteristics" IS 'Characteristics the mentee prefers in a mentor.';



COMMENT ON COLUMN "public"."mentee_profiles"."time_commitment_available" IS 'Mentee''s available time commitment (e.g., hours per week/month).';



COMMENT ON COLUMN "public"."mentee_profiles"."preferred_communication_method" IS 'Mentee''s preferred methods of communication.';



COMMENT ON COLUMN "public"."mentee_profiles"."statement_of_expectations" IS 'Mentee''s brief statement of expectations from the mentorship.';



COMMENT ON COLUMN "public"."mentee_profiles"."created_at" IS 'Timestamp of when the mentee profile was created.';



COMMENT ON COLUMN "public"."mentee_profiles"."updated_at" IS 'Timestamp of when the mentee profile was last updated.';



CREATE TABLE IF NOT EXISTS "public"."mentees" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "career_goals" "text",
    "preferred_industry" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mentees_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'inactive'::"text"])))
);

ALTER TABLE ONLY "public"."mentees" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentees" OWNER TO "postgres";


COMMENT ON TABLE "public"."mentees" IS 'Stores mentee profiles and preferences';



CREATE TABLE IF NOT EXISTS "public"."mentor_availability" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "mentor_id" "uuid",
    "date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "is_booked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "time_range_check" CHECK (("start_time" < "end_time"))
);

ALTER TABLE ONLY "public"."mentor_availability" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentor_availability" OWNER TO "postgres";


COMMENT ON TABLE "public"."mentor_availability" IS 'Stores availability slots for mentors';



CREATE TABLE IF NOT EXISTS "public"."mentor_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "mentoring_capacity_hours" integer DEFAULT 2,
    "areas_of_expertise" "text"[],
    "mentoring_preferences" "text",
    "mentoring_experience" "text",
    "mentoring_statement" "text",
    "max_mentees" integer DEFAULT 3,
    "is_accepting_mentees" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "default_meeting_link" "text"
);

ALTER TABLE ONLY "public"."mentor_profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentor_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."mentor_profiles"."default_meeting_link" IS 'Mentor’s default meeting URL (Zoom/Meet/Teams/etc.).';



CREATE OR REPLACE VIEW "public"."mentors_directory" AS
 SELECT "p"."id",
    "p"."full_name",
    COALESCE("p"."avatar_url", '/default-avatar.svg'::"text") AS "avatar_url",
    COALESCE(NULLIF("p"."location", ''::"text"), NULLIF(TRIM(BOTH FROM ((COALESCE("p"."location_city", ''::"text") ||
        CASE
            WHEN (("p"."location_city" <> ''::"text") AND ("p"."location_country" <> ''::"text")) THEN ', '::"text"
            ELSE ''::"text"
        END) || COALESCE("p"."location_country", ''::"text"))), ''::"text")) AS "location",
    "p"."is_available_for_mentorship",
    "m"."status" AS "mentor_status",
    "m"."expertise",
    "m"."mentoring_preferences"
   FROM ("public"."mentors" "m"
     JOIN "public"."profiles" "p" ON (("p"."id" = "m"."user_id")))
  WHERE (("p"."approval_status" = 'approved'::"public"."profile_approval_status") AND ("m"."status" = 'approved'::"text") AND (COALESCE("p"."is_deleted", false) = false) AND (COALESCE("p"."is_active", true) = true) AND (COALESCE("p"."show_in_directory", true) = true) AND ("p"."role" <> 'employer'::"public"."app_role_enum"));


ALTER TABLE "public"."mentors_directory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentorship_appointments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "availability_id" "uuid",
    "mentee_id" "uuid",
    "topic" "text" NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'scheduled'::"text",
    "feedback_provided" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "meeting_url" "text",
    CONSTRAINT "mentorship_appointments_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text"])))
);

ALTER TABLE ONLY "public"."mentorship_appointments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentorship_appointments" OWNER TO "postgres";


COMMENT ON TABLE "public"."mentorship_appointments" IS 'Stores booked mentorship appointments';



CREATE TABLE IF NOT EXISTS "public"."mentorship_feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "mentorship_request_id" "uuid",
    "submitted_by" "uuid",
    "rating" integer,
    "comments" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mentorship_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);

ALTER TABLE ONLY "public"."mentorship_feedback" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentorship_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentorship_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "mentorship_request_id" "uuid",
    "sender_id" "uuid",
    "message" "text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "pinned" boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY "public"."mentorship_messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."mentorship_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."mentorship_messages" IS 'LEGACY – mentorship chat now uses conversations + messages + mentorship_relationship_id. Do not use from FE.';



CREATE TABLE IF NOT EXISTS "public"."mentorship_programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mentorship_programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentorship_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "mentee_id" "uuid",
    "mentor_id" "uuid",
    "status" "public"."mentorship_request_status",
    "message" "text",
    "goals" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone,
    CONSTRAINT "mentorship_requests_check_not_self" CHECK (("mentee_id" <> "mentor_id")),
    CONSTRAINT "mentorship_requests_no_self_mentee" CHECK ((("mentor_id" IS NULL) OR ("mentee_id" IS NULL) OR ("mentor_id" <> "mentee_id"))),
    CONSTRAINT "mentorship_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"public"."mentorship_request_status", 'accepted'::"public"."mentorship_request_status", 'rejected'::"public"."mentorship_request_status", 'cancelled_by_user'::"public"."mentorship_request_status", 'cancelled_by_system'::"public"."mentorship_request_status"])))
);

ALTER TABLE ONLY "public"."mentorship_requests" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentorship_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentorship_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "mentorship_request_id" "uuid",
    "scheduled_time" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 30,
    "meeting_url" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "status" "text"
);

ALTER TABLE ONLY "public"."mentorship_sessions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentorship_sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."mentorship_sessions"."meeting_url" IS 'Join link for this mentoring session';



CREATE OR REPLACE VIEW "public"."mentorship_stats" AS
 SELECT "count"(*) FILTER (WHERE ("mentorship_requests"."status" = 'accepted'::"public"."mentorship_request_status")) AS "total_approved",
    "count"(*) FILTER (WHERE ("mentorship_requests"."status" = 'pending'::"public"."mentorship_request_status")) AS "pending_requests",
    "count"(*) FILTER (WHERE ("mentorship_requests"."status" = 'rejected'::"public"."mentorship_request_status")) AS "rejected_requests"
   FROM "public"."mentorship_requests";


ALTER TABLE "public"."mentorship_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mentorships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mentor_id" "uuid" NOT NULL,
    "mentee_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "goals" "text",
    CONSTRAINT "mentorships_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'active'::"text", 'completed'::"text", 'declined'::"text"])))
);

ALTER TABLE ONLY "public"."mentorships" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentorships" OWNER TO "postgres";


COMMENT ON TABLE "public"."mentorships" IS 'LEGACY – replaced by mentorship_requests + mentorship_relationships. Do not use from FE.';



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    "recipient_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "client_id" "uuid",
    "client_uuid" "uuid",
    CONSTRAINT "messages_content_check" CHECK (("content" <> ''::"text"))
);

ALTER TABLE ONLY "public"."messages" REPLICA IDENTITY FULL;

ALTER TABLE ONLY "public"."messages" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."networking_group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid",
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."networking_group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."networking_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text",
    "image_url" "text",
    "visibility" "text" DEFAULT 'public'::"text",
    "admin_user_ids" "uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."networking_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "public"."notification_type_enum" NOT NULL,
    "module" "public"."notification_module" NOT NULL,
    "actor_profile_id" "uuid" NOT NULL,
    "entity_table" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "idempotency_key" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone
);


ALTER TABLE "public"."notification_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."notification_events" IS 'Canonical log of notification-worthy events before fan-out to per-recipient notifications.';



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profile_about_view" AS
 SELECT "p"."id",
    COALESCE("p"."bio", ''::"text") AS "about_display"
   FROM "public"."profiles" "p";


ALTER TABLE "public"."profile_about_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profile_achievements_view" AS
 SELECT "p"."id",
    COALESCE("p"."achievements", '[]'::"jsonb") AS "achievements",
        CASE
            WHEN ("p"."skills" IS NULL) THEN '[]'::"jsonb"
            WHEN ("jsonb_typeof"("p"."skills") = 'array'::"text") THEN "p"."skills"
            ELSE "to_jsonb"("p"."skills")
        END AS "skills"
   FROM "public"."profiles" "p";


ALTER TABLE "public"."profile_achievements_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_approval_log" (
    "id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "changed_by" "uuid",
    "old_approval_status" "public"."profile_approval_status",
    "new_approval_status" "public"."profile_approval_status",
    "old_is_active" boolean,
    "new_is_active" boolean,
    "old_is_deleted" boolean,
    "new_is_deleted" boolean,
    "old_show_in_directory" boolean,
    "new_show_in_directory" boolean,
    "notes" "text"
);


ALTER TABLE "public"."profile_approval_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."profile_approval_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."profile_approval_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."profile_approval_log_id_seq" OWNED BY "public"."profile_approval_log"."id";



CREATE OR REPLACE VIEW "public"."profile_education_view" AS
 SELECT "p"."id",
    COALESCE(
        CASE
            WHEN ("p"."education" IS NULL) THEN '[]'::"jsonb"
            WHEN ("jsonb_typeof"("p"."education") = 'array'::"text") THEN "p"."education"
            ELSE "to_jsonb"("p"."education")
        END, '[]'::"jsonb") AS "education_display"
   FROM "public"."profiles" "p";


ALTER TABLE "public"."profile_education_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profile_experience_view" AS
 SELECT "profiles"."id" AS "profile_id",
    "profiles"."years_experience"
   FROM "public"."profiles";


ALTER TABLE "public"."profile_experience_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profile_social_links" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"jsonb" AS "social_links";


ALTER TABLE "public"."profile_social_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text" GENERATED ALWAYS AS ("btrim"("regexp_replace"("lower"("name"), '[^a-z0-9]+'::"text", '-'::"text", 'g'::"text"), '-'::"text")) STORED
);


ALTER TABLE "public"."programs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_profiles_view" AS
 SELECT "profiles"."id",
    "profiles"."full_name",
    "profiles"."avatar_url",
    "profiles"."current_location",
    "profiles"."company_name",
    "profiles"."graduation_year"
   FROM "public"."profiles"
  WHERE ((COALESCE("profiles"."is_deleted", false) = false) AND (COALESCE("profiles"."show_in_directory", true) = true) AND (COALESCE(("profiles"."approval_status")::"text", 'pending'::"text") = 'approved'::"text"));


ALTER TABLE "public"."public_profiles_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_profiles_view_old" AS
 SELECT "p"."id",
    "p"."first_name",
    "p"."last_name",
    "p"."full_name",
    "p"."avatar_url",
    "p"."graduation_year",
    "p"."degree_program",
    COALESCE("p"."current_job_title", "p"."current_position", "p"."job_title") AS "current_job_title",
    COALESCE("p"."company_name", "p"."current_company", "p"."company") AS "company_name",
    COALESCE("p"."current_location", "p"."location") AS "location",
    "p"."social_links",
    "p"."headline",
    "p"."is_mentor",
    "p"."is_employer"
   FROM "public"."profiles" "p";


ALTER TABLE "public"."public_profiles_view_old" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_profiles_view_v2" AS
 SELECT "p"."id",
    "p"."full_name",
    "p"."avatar_url",
    "p"."current_location",
    "p"."company_name",
    COALESCE("p"."graduation_year", "p"."expected_graduation_year", "p"."batch_year") AS "graduation_year"
   FROM "public"."profiles" "p"
  WHERE ((COALESCE("p"."is_deleted", false) = false) AND (COALESCE("p"."show_in_directory", true) = true) AND (COALESCE(("p"."approval_status")::"text", 'pending'::"text") = 'approved'::"text"));


ALTER TABLE "public"."public_profiles_view_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "url" "text",
    "resource_type" "text" NOT NULL,
    "created_by" "uuid",
    "is_approved" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resume_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "resume_url" "text",
    "cover_letter_url" "text",
    "portfolio_link" "text",
    "linkedin_profile" "text",
    "desired_job_titles" "text"[],
    "desired_industries" "text"[],
    "preferred_locations" "text"[],
    "willing_to_relocate" boolean DEFAULT false,
    "job_alert_active" boolean DEFAULT true,
    "job_alert_frequency" "text" DEFAULT 'daily'::"text",
    "job_alert_keywords" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resume_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "role_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."social_links_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."social_links_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."social_links_id_seq" OWNED BY "public"."social_links"."id";



CREATE TABLE IF NOT EXISTS "public"."system_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alert_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_resolved" boolean DEFAULT false,
    "resolved_by" "uuid",
    "resolved_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric,
    "metric_type" "text",
    "tags" "jsonb",
    "recorded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "uuid",
    "metadata" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "route" "text",
    "meta" "jsonb",
    "ua" "text"
);


ALTER TABLE "public"."user_activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "page" "text" NOT NULL,
    "feedback_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "screenshot_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_jobs_with_bookmark" AS
 SELECT "j"."id",
    "j"."title",
    "j"."company_name",
    "j"."location",
    "j"."job_type",
    "j"."description",
    "j"."requirements",
    "j"."salary_range",
    "j"."application_url",
    "j"."contact_email",
    "j"."expires_at",
    "j"."posted_by",
    "j"."is_active",
    "j"."created_at",
    "j"."updated_at",
    "j"."education_required",
    "j"."required_skills",
    "j"."deadline",
    "j"."experience_required",
    "j"."education_level",
    "j"."external_url",
    "j"."industry",
    "j"."application_instructions",
    "j"."user_id",
    "j"."is_approved",
    "j"."company_id",
    "j"."apply_url",
    "j"."is_verified",
    "j"."created_by",
        CASE
            WHEN ("jb"."job_id" IS NOT NULL) THEN true
            ELSE false
        END AS "is_bookmarked",
    "jb"."created_at" AS "bookmarked_at",
    "jb"."user_id" AS "bookmarked_by"
   FROM ("public"."jobs" "j"
     LEFT JOIN "public"."job_bookmarks" "jb" ON (("j"."id" = "jb"."job_id")));


ALTER TABLE "public"."user_jobs_with_bookmark" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_resumes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "filename" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" integer,
    "is_primary" boolean DEFAULT false,
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "file_path" "text" NOT NULL
);


ALTER TABLE "public"."user_resumes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_can_view_post_for_current_user" AS
 SELECT "gc"."id" AS "comment_id",
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM ("public"."group_posts" "gp"
                 JOIN "public"."groups" "g" ON (("g"."id" = "gp"."group_id")))
              WHERE (("gp"."id" = "gc"."post_id") AND ("g"."is_archived" = false) AND ("g"."visibility" = 'public'::"public"."group_visibility_enum") AND ("g"."is_approved" = true)))) THEN true
            WHEN (EXISTS ( SELECT 1
               FROM (("public"."group_posts" "gp"
                 JOIN "public"."groups" "g" ON (("g"."id" = "gp"."group_id")))
                 JOIN "public"."group_members" "gm" ON ((("gm"."group_id" = "g"."id") AND ("gm"."user_id" = "auth"."uid"()))))
              WHERE (("gp"."id" = "gc"."post_id") AND ("g"."is_archived" = false)))) THEN true
            WHEN (EXISTS ( SELECT 1
               FROM "public"."profiles" "p"
              WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"public"."app_role_enum", 'super_admin'::"public"."app_role_enum"]))))) THEN true
            ELSE false
        END AS "can_view"
   FROM "public"."group_comments" "gc";


ALTER TABLE "public"."v_can_view_post_for_current_user" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_degree_department_groups" AS
 SELECT "g"."code" AS "degree_code",
    COALESCE("g"."label", "g"."code") AS "degree_label",
    "jsonb_agg"("jsonb_build_object"('id', "d"."id", 'name', "d"."name", 'slug', "d"."slug") ORDER BY "d"."name") AS "departments"
   FROM ("public"."degrees" "g"
     LEFT JOIN "public"."departments" "d" ON (("d"."degree_code" = "g"."code")))
  GROUP BY "g"."code", "g"."label"
  ORDER BY COALESCE("g"."label", "g"."code");


ALTER TABLE "public"."v_degree_department_groups" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_degrees" AS
 SELECT "degrees"."code" AS "degree_code",
    COALESCE("degrees"."label", "degrees"."code") AS "degree_label"
   FROM "public"."degrees"
  ORDER BY COALESCE("degrees"."label", "degrees"."code");


ALTER TABLE "public"."v_degrees" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_departments" AS
 SELECT "d"."id",
    "d"."degree_code",
    COALESCE("g"."label", "g"."code") AS "degree_label",
    "d"."name" AS "department_name",
    "d"."slug"
   FROM ("public"."departments" "d"
     JOIN "public"."degrees" "g" ON (("g"."code" = "d"."degree_code")))
  ORDER BY COALESCE("g"."label", "g"."code"), "d"."name";


ALTER TABLE "public"."v_departments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_directory_card_view" AS
 SELECT "dp"."id",
    "dp"."full_name",
    "dp"."first_name",
    "dp"."last_name",
    "dp"."current_job_title",
    "dp"."company_name",
    "dp"."location",
    "dp"."location_city",
    "dp"."location_country",
    "dp"."avatar_url",
    "dp"."role",
    "dp"."approval_status"
   FROM "public"."directory_profiles_base" "dp"
  WHERE (("dp"."is_deleted" = false) AND ("dp"."is_active" = true) AND ("dp"."show_in_directory" = true) AND ("dp"."approval_status" = 'approved'::"public"."profile_approval_status") AND ("dp"."role" <> 'employer'::"public"."app_role_enum"));


ALTER TABLE "public"."v_directory_card_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_directory_connection_states" AS
 SELECT "p"."id" AS "other_user_id",
    ( SELECT "c"."status"
           FROM "public"."connections" "c"
          WHERE ((LEAST("c"."requester_id", "c"."recipient_id") = LEAST("p"."id", "auth"."uid"())) AND (GREATEST("c"."requester_id", "c"."recipient_id") = GREATEST("p"."id", "auth"."uid"())))
          ORDER BY "c"."updated_at" DESC NULLS LAST, "c"."created_at" DESC
         LIMIT 1) AS "status",
    ( SELECT
                CASE
                    WHEN (("c"."status" = 'pending'::"text") AND ("c"."requester_id" = "auth"."uid"())) THEN 'sent'::"text"
                    WHEN (("c"."status" = 'pending'::"text") AND ("c"."recipient_id" = "auth"."uid"())) THEN 'received'::"text"
                    ELSE NULL::"text"
                END AS "case"
           FROM "public"."connections" "c"
          WHERE ((LEAST("c"."requester_id", "c"."recipient_id") = LEAST("p"."id", "auth"."uid"())) AND (GREATEST("c"."requester_id", "c"."recipient_id") = GREATEST("p"."id", "auth"."uid"())))
          ORDER BY "c"."updated_at" DESC NULLS LAST, "c"."created_at" DESC
         LIMIT 1) AS "pending_side",
    ( SELECT COALESCE("c"."updated_at", "c"."created_at") AS "coalesce"
           FROM "public"."connections" "c"
          WHERE ((LEAST("c"."requester_id", "c"."recipient_id") = LEAST("p"."id", "auth"."uid"())) AND (GREATEST("c"."requester_id", "c"."recipient_id") = GREATEST("p"."id", "auth"."uid"())))
          ORDER BY COALESCE("c"."updated_at", "c"."created_at") DESC
         LIMIT 1) AS "edge_ts"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" <> "auth"."uid"());


ALTER TABLE "public"."v_directory_connection_states" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_event_feedback_detailed" AS
 SELECT "ef"."event_id",
    "ef"."user_id",
    "p"."full_name" AS "attendee_name",
    "p"."email" AS "attendee_email",
    "ef"."rating",
    COALESCE(NULLIF("ef"."comment", ''::"text"), "ef"."comments") AS "comment",
    "ef"."created_at"
   FROM ("public"."event_feedback" "ef"
     JOIN "public"."profiles" "p" ON (("p"."id" = "ef"."user_id")));


ALTER TABLE "public"."v_event_feedback_detailed" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_event_organizer" AS
 SELECT "e"."id" AS "event_id",
    COALESCE("e"."organizer_id", "e"."created_by") AS "organizer_id",
    COALESCE("e"."organizer_name", "pp"."full_name") AS "name",
    "e"."organizer_email" AS "email",
    "e"."organizer_phone" AS "phone",
    "pp"."avatar_url",
    "pp"."current_location",
    "pp"."company_name",
    "pp"."graduation_year"
   FROM ("public"."events" "e"
     LEFT JOIN "public"."public_profiles_view" "pp" ON (("pp"."id" = COALESCE("e"."organizer_id", "e"."created_by"))));


ALTER TABLE "public"."v_event_organizer" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_events_with_end_at" AS
 SELECT "e"."id",
    "e"."created_at",
    "e"."updated_at",
    "e"."title",
    "e"."description",
    "e"."start_date",
    "e"."end_date",
    "e"."venue",
    "e"."is_virtual",
    "e"."virtual_link",
    "e"."organizer_id",
    "e"."featured_image_url",
    "e"."is_featured",
    "e"."category",
    "e"."max_attendees",
    "e"."is_published",
    "e"."tags",
    "e"."slug",
    "e"."agenda",
    "e"."event_type",
    "e"."cost",
    "e"."sponsors",
    "e"."registration_url",
    "e"."registration_deadline",
    "e"."created_by",
    "e"."creator_id",
    "e"."virtual_meeting_link",
    "e"."user_id",
    "e"."is_approved",
    "e"."reminder_sent",
    "e"."address",
    "e"."organizer_email",
    "e"."organizer_name",
    "e"."organizer_phone",
    "e"."price",
    "e"."price_type",
    "e"."long_description",
    "e"."requirements",
    "e"."amenities",
    "e"."gallery",
    "e"."status",
    "e"."additional_info",
    "e"."requires_approval",
    "e"."is_public",
    "e"."registration_required",
    "e"."updated_by",
    "e"."location",
    "e"."rejection_reason",
    "e"."approval_status",
    "e"."reviewed_by",
    "e"."reviewed_at",
    "e"."group_id",
    "e"."short_description",
    "e"."is_rejected",
    "e"."start_at",
    "e"."end_at",
    "e"."featured_image_path",
    COALESCE("e"."end_at", "e"."start_at") AS "computed_end_at"
   FROM "public"."events" "e";


ALTER TABLE "public"."v_events_with_end_at" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_groups_for_list" AS
 SELECT "g"."id",
    "g"."name",
    "g"."description",
    "g"."name_norm",
    "g"."group_avatar_url",
    "g"."tags",
    "g"."is_private",
    "g"."visibility",
    "g"."is_admin_only_posts",
    "g"."is_archived",
    "g"."is_approved",
    "g"."approval_status",
    "g"."created_at",
    "g"."created_by"
   FROM "public"."groups" "g"
  WHERE (("g"."is_archived" = false) AND ((("g"."is_approved" = true) AND ("g"."visibility" = 'public'::"public"."group_visibility_enum")) OR "public"."is_member_of_group"("g"."id", "auth"."uid"()) OR "public"."is_platform_admin"("auth"."uid"())));


ALTER TABLE "public"."v_groups_for_list" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_jobs_feed" AS
 SELECT "j"."id",
    "j"."title",
    "j"."created_at",
    "j"."updated_at",
    "j"."location",
    "j"."job_type",
    "j"."experience_level",
    "j"."salary_min",
    "j"."salary_max",
    "j"."application_deadline",
    "j"."is_active",
    "j"."is_approved",
    "public"."coalesce_application_url"("j"."apply_url", "j"."application_url", "j"."external_url") AS "application_url",
        CASE
            WHEN ("public"."coalesce_application_url"("j"."apply_url", "j"."application_url", "j"."external_url") IS NOT NULL) THEN 'quick_link'::"text"
            ELSE 'in_app'::"text"
        END AS "source_type",
    "c"."id" AS "company_id",
    "c"."name" AS "company_name",
    COALESCE("j"."logo_url", "c"."logo_url") AS "company_logo_url",
    ( SELECT "count"(*) AS "count"
           FROM "public"."job_applications" "a"
          WHERE ("a"."job_id" = "j"."id")) AS "applicant_count",
    "j"."salary_range",
    COALESCE("j"."salary_range",
        CASE
            WHEN (("j"."salary_min" IS NOT NULL) AND ("j"."salary_max" IS NOT NULL)) THEN ((("j"."salary_min")::"text" || ' - '::"text") || ("j"."salary_max")::"text")
            WHEN ("j"."salary_min" IS NOT NULL) THEN (("j"."salary_min")::"text" || '+'::"text")
            WHEN ("j"."salary_max" IS NOT NULL) THEN ('Up to '::"text" || ("j"."salary_max")::"text")
            ELSE NULL::"text"
        END) AS "salary_display"
   FROM ("public"."jobs" "j"
     LEFT JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")));


ALTER TABLE "public"."v_jobs_feed" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_jobs_feed_all" AS
 SELECT "j"."id",
    "j"."title",
    "j"."created_at",
    "j"."updated_at",
    "j"."posted_by",
    "j"."location",
    "j"."job_type",
    "j"."experience_level",
    "j"."salary_min",
    "j"."salary_max",
    "j"."application_deadline",
    "j"."is_active",
    "j"."is_approved",
    "public"."coalesce_application_url"("j"."apply_url", "j"."application_url", "j"."external_url") AS "application_url",
        CASE
            WHEN ("public"."coalesce_application_url"("j"."apply_url", "j"."application_url", "j"."external_url") IS NOT NULL) THEN 'quick_link'::"text"
            ELSE 'in_app'::"text"
        END AS "source_type",
    "c"."id" AS "company_id",
    COALESCE("c"."name", "j"."company_name") AS "company_name",
    COALESCE("j"."logo_url", "c"."logo_url") AS "company_logo_url",
    ( SELECT "count"(*) AS "count"
           FROM "public"."job_applications" "a"
          WHERE ("a"."job_id" = "j"."id")) AS "applicant_count"
   FROM ("public"."jobs" "j"
     LEFT JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")));


ALTER TABLE "public"."v_jobs_feed_all" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_jobs_public" AS
 SELECT "j"."id",
    "j"."title",
    "j"."company_name",
    "j"."location",
    "j"."job_type",
    "j"."description",
    "j"."requirements",
    "j"."salary_range",
    "j"."application_url",
    "j"."contact_email",
    "j"."expires_at",
    "j"."posted_by",
    "j"."is_active",
    "j"."created_at",
    "j"."updated_at",
    "j"."education_required",
    "j"."required_skills",
    "j"."deadline",
    "j"."experience_required",
    "j"."education_level",
    "j"."external_url",
    "j"."industry",
    "j"."application_instructions",
    "j"."user_id",
    "j"."is_approved",
    "j"."company_id",
    "j"."apply_url",
    "j"."is_verified",
    "j"."created_by",
    "j"."primary_role",
    "j"."approval_status",
    "j"."reviewed_by",
    "j"."reviewed_at",
    "j"."is_rejected",
    "j"."rejection_reason",
    "j"."application_deadline",
    "j"."department",
    "j"."experience_level",
    "j"."salary_min",
    "j"."salary_max",
    "j"."skills",
    "j"."status",
    "j"."open_at",
    "j"."close_at",
    COALESCE("j"."logo_url", "c"."logo_url") AS "company_logo_url"
   FROM ("public"."jobs" "j"
     LEFT JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")))
  WHERE ((COALESCE("j"."is_approved", false) = true) AND (COALESCE("j"."is_active", true) = true))
  ORDER BY "j"."created_at" DESC;


ALTER TABLE "public"."v_jobs_public" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_jobs_public_left" AS
 SELECT "j"."id",
    "j"."title",
    "j"."location",
    "j"."job_type",
    "j"."description",
    "j"."requirements",
    "j"."salary_range",
    "j"."application_url",
    "j"."apply_url",
    "j"."external_url",
    "j"."contact_email",
    "j"."expires_at",
    "j"."posted_by",
    "j"."is_active",
    "j"."created_at",
    "j"."updated_at",
    "j"."education_required",
    "j"."required_skills",
    "j"."deadline",
    "j"."experience_required",
    "j"."education_level",
    "j"."industry",
    "j"."application_instructions",
    "j"."user_id",
    "j"."is_approved",
    "j"."company_id",
    "j"."is_verified",
    "j"."created_by",
    "j"."primary_role",
    "j"."approval_status",
    "j"."reviewed_by",
    "j"."reviewed_at",
    "j"."is_rejected",
    "j"."rejection_reason",
    "j"."application_deadline",
    "j"."department",
    "j"."experience_level",
    "j"."salary_min",
    "j"."salary_max",
    "j"."skills",
    "j"."status",
    "j"."open_at",
    "j"."close_at",
    COALESCE("c"."name", "j"."company_name") AS "company_name",
    COALESCE("j"."logo_url", "c"."logo_url") AS "company_logo_url"
   FROM ("public"."jobs" "j"
     LEFT JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")))
  WHERE ((COALESCE("j"."is_approved", false) = true) AND (COALESCE("j"."is_active", true) = true));


ALTER TABLE "public"."v_jobs_public_left" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_jobs_public_with_qualification" AS
 SELECT "v"."id",
    "v"."title",
    "v"."created_at",
    "v"."updated_at",
    "v"."location",
    "v"."job_type",
    "v"."experience_level",
    "v"."salary_min",
    "v"."salary_max",
    "v"."application_deadline",
    "v"."is_active",
    "v"."is_approved",
    "v"."application_url",
    "v"."source_type",
    "v"."company_id",
    "v"."company_name",
    "v"."company_logo_url",
    "v"."applicant_count",
    "v"."salary_range",
    "v"."salary_display",
    "j"."requirements" AS "qualification"
   FROM ("public"."v_jobs_feed" "v"
     JOIN "public"."jobs" "j" ON (("j"."id" = "v"."id")));


ALTER TABLE "public"."v_jobs_public_with_qualification" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_my_applications" AS
 SELECT "a"."id",
    "a"."applicant_id",
    "a"."job_id",
    "a"."status",
    "a"."created_at",
    "a"."resume_url",
    "j"."title",
    COALESCE("c"."name", "j"."company_name") AS "company_name",
        CASE
            WHEN (COALESCE("j"."apply_url", "j"."application_url", "j"."external_url") IS NOT NULL) THEN 'quick_link'::"text"
            ELSE 'in_app'::"text"
        END AS "source_type"
   FROM (("public"."job_applications" "a"
     JOIN "public"."jobs" "j" ON (("j"."id" = "a"."job_id")))
     LEFT JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")));


ALTER TABLE "public"."v_my_applications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_my_dm_threads" AS
 SELECT "t"."id" AS "thread_id",
    "t"."user_a",
    "t"."user_b",
        CASE
            WHEN ("t"."user_a" = "auth"."uid"()) THEN "t"."user_b"
            ELSE "t"."user_a"
        END AS "other_user_id",
    COALESCE("p"."full_name", NULLIF(TRIM(BOTH FROM ((COALESCE("p"."first_name", ''::"text") || ' '::"text") || COALESCE("p"."last_name", ''::"text"))), ''::"text"), 'User'::"text") AS "other_user_name",
    "p"."avatar_url" AS "other_user_avatar_url",
        CASE
            WHEN ("p"."role" = 'employer'::"public"."app_role_enum") THEN "p"."company_name"
            ELSE "p"."current_job_title"
        END AS "other_user_title",
        CASE
            WHEN ("p"."role" = 'employer'::"public"."app_role_enum") THEN NULL::"text"
            ELSE "p"."company"
        END AS "other_user_company",
    "p"."role" AS "other_user_role",
    "public"."are_connected"("auth"."uid"(),
        CASE
            WHEN ("t"."user_a" = "auth"."uid"()) THEN "t"."user_b"
            ELSE "t"."user_a"
        END) AS "can_send",
    ( SELECT "count"(*) AS "count"
           FROM "public"."dm_messages" "m"
          WHERE (("m"."thread_id" = "t"."id") AND ("m"."sender_id" =
                CASE
                    WHEN ("t"."user_a" = "auth"."uid"()) THEN "t"."user_b"
                    ELSE "t"."user_a"
                END))) AS "unread_count",
    "t"."created_at",
    "t"."last_message_at"
   FROM ("public"."dm_threads" "t"
     JOIN "public"."profiles" "p" ON (("p"."id" =
        CASE
            WHEN ("t"."user_a" = "auth"."uid"()) THEN "t"."user_b"
            ELSE "t"."user_a"
        END)))
  WHERE (("auth"."uid"() = "t"."user_a") OR ("auth"."uid"() = "t"."user_b"));


ALTER TABLE "public"."v_my_dm_threads" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_my_event_rsvp" AS
 SELECT "event_attendees"."event_id",
    "lower"(COALESCE("event_attendees"."attendance_status", ''::"text")) AS "attendance_status",
    "event_attendees"."is_waitlisted"
   FROM "public"."event_attendees"
  WHERE ("event_attendees"."user_id" = "auth"."uid"());


ALTER TABLE "public"."v_my_event_rsvp" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_my_groups" AS
 SELECT "g"."id",
    "g"."name",
    "g"."description",
    "g"."group_avatar_url",
    "g"."tags",
    "g"."is_private",
    "g"."visibility",
    "g"."is_admin_only_posts",
    "g"."is_archived",
    "g"."is_approved",
    "gm"."role" AS "membership_role",
    "gm"."status" AS "membership_status",
    "gm"."joined_at"
   FROM ("public"."group_members" "gm"
     JOIN "public"."groups" "g" ON (("g"."id" = "gm"."group_id")))
  WHERE (("gm"."user_id" = "auth"."uid"()) AND ("gm"."status" = 'active'::"text") AND ("g"."is_archived" = false));


ALTER TABLE "public"."v_my_groups" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_my_mentorship_dashboard" AS
 SELECT "r"."id",
    "r"."mentee_id",
    "r"."mentor_id",
    "r"."status",
    "r"."message",
    "r"."goals",
    "r"."created_at",
    "r"."updated_at",
    "r"."responded_at",
    "me"."full_name" AS "mentee_full_name",
    COALESCE("me"."avatar_url", '/default-avatar.svg'::"text") AS "mentee_avatar",
    "me"."location" AS "mentee_location"
   FROM ("public"."mentorship_requests" "r"
     JOIN "public"."profiles" "me" ON (("me"."id" = "r"."mentee_id")));


ALTER TABLE "public"."v_my_mentorship_dashboard" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_my_mentorship_relationships" AS
 SELECT "r"."id",
    "r"."program_id",
    "r"."mentor_id",
    "r"."mentee_id",
    "r"."status",
    "r"."created_at",
    "r"."updated_at",
    "r"."start_date",
    "r"."end_date",
    "mentor"."full_name" AS "mentor_name",
    "mentee"."full_name" AS "mentee_name"
   FROM (("public"."mentorship_relationships" "r"
     JOIN "public"."profiles" "mentor" ON (("mentor"."id" = "r"."mentor_id")))
     JOIN "public"."profiles" "mentee" ON (("mentee"."id" = "r"."mentee_id")));


ALTER TABLE "public"."v_my_mentorship_relationships" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_my_mentorship_requests" AS
 SELECT "r"."id",
    "r"."mentee_id",
    "r"."mentor_id",
    "r"."status",
    "r"."message",
    "r"."goals",
    "r"."created_at",
    "r"."updated_at",
    "r"."responded_at",
    "m"."full_name" AS "mentor_full_name",
    COALESCE("m"."avatar_url", '/default-avatar.svg'::"text") AS "mentor_avatar",
    "m"."location" AS "mentor_location"
   FROM ("public"."mentorship_requests" "r"
     JOIN "public"."profiles" "m" ON (("m"."id" = "r"."mentor_id")));


ALTER TABLE "public"."v_my_mentorship_requests" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_notification_prefs" AS
 SELECT "notification_preferences"."user_id",
    "notification_preferences"."notification_type" AS "type",
    "notification_preferences"."in_app_enabled",
    "notification_preferences"."email_enabled",
    "notification_preferences"."push_enabled",
    "notification_preferences"."updated_at"
   FROM "public"."notification_preferences";


ALTER TABLE "public"."v_notification_prefs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_profiles_directory_card" AS
 SELECT "p"."id",
    TRIM(BOTH FROM COALESCE("p"."full_name", "concat_ws"(' '::"text", "p"."first_name", "p"."last_name"))) AS "full_name",
    "p"."graduation_year",
    COALESCE(NULLIF("p"."current_job_title", ''::"text"), NULLIF("p"."job_title", ''::"text"), ( SELECT ("pos"."value" ->> 'title'::"text")
           FROM "jsonb_array_elements"("p"."positions") "pos"("value")
          WHERE ((("pos"."value" ->> 'end_date'::"text") IS NULL) OR (("pos"."value" ->> 'end_date'::"text") = ''::"text"))
          ORDER BY ("pos"."value" ->> 'start_date'::"text") DESC NULLS LAST
         LIMIT 1), ( SELECT ("pos"."value" ->> 'title'::"text")
           FROM "jsonb_array_elements"("p"."positions") "pos"("value")
          ORDER BY ("pos"."value" ->> 'end_date'::"text") DESC NULLS LAST, ("pos"."value" ->> 'start_date'::"text") DESC NULLS LAST
         LIMIT 1)) AS "current_title",
    COALESCE(NULLIF("p"."company_name", ''::"text"), NULLIF("p"."current_company", ''::"text"), NULLIF("p"."company", ''::"text"), ( SELECT ("pos"."value" ->> 'company'::"text")
           FROM "jsonb_array_elements"("p"."positions") "pos"("value")
          WHERE ((("pos"."value" ->> 'end_date'::"text") IS NULL) OR (("pos"."value" ->> 'end_date'::"text") = ''::"text"))
          ORDER BY ("pos"."value" ->> 'start_date'::"text") DESC NULLS LAST
         LIMIT 1), ( SELECT ("pos"."value" ->> 'company'::"text")
           FROM "jsonb_array_elements"("p"."positions") "pos"("value")
          ORDER BY ("pos"."value" ->> 'end_date'::"text") DESC NULLS LAST, ("pos"."value" ->> 'start_date'::"text") DESC NULLS LAST
         LIMIT 1)) AS "current_company",
    NULLIF("p"."profession", ''::"text") AS "profession",
    COALESCE(NULLIF("p"."location", ''::"text"), NULLIF(TRIM(BOTH FROM ((COALESCE("p"."location_city", ''::"text") ||
        CASE
            WHEN (("p"."location_city" IS NOT NULL) AND ("p"."location_country" IS NOT NULL) AND ("p"."location_country" <> ''::"text")) THEN ', '::"text"
            ELSE ''::"text"
        END) || COALESCE("p"."location_country", ''::"text"))), ''::"text")) AS "location_label",
    NULLIF(TRIM(BOTH FROM ((COALESCE("deg"."label", "p"."degree_program", "p"."degree", ''::"text") ||
        CASE
            WHEN ((COALESCE("dept"."name", "p"."department", ''::"text") <> ''::"text") AND (COALESCE("deg"."label", "p"."degree_program", "p"."degree", ''::"text") <> ''::"text")) THEN ' '::"text"
            ELSE ''::"text"
        END) || COALESCE("dept"."name", "p"."department", ''::"text"))), ''::"text") AS "degree_department",
    COALESCE("p"."skills", '[]'::"jsonb") AS "skills",
    COALESCE("p"."is_approved", false) AS "is_approved"
   FROM (("public"."profiles" "p"
     LEFT JOIN "public"."degrees" "deg" ON (("deg"."code" = "p"."degree_code")))
     LEFT JOIN "public"."departments" "dept" ON (("dept"."id" = "p"."department_id")))
  WHERE (("p"."is_approved" = true) AND (COALESCE("p"."is_employer", false) = false) AND (COALESCE(("p"."role")::"text", 'alumni'::"text") = ANY (ARRAY['alumni'::"text", 'student'::"text"])));


ALTER TABLE "public"."v_profiles_directory_card" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_programs" AS
 SELECT "programs"."id",
    "programs"."name",
    "programs"."slug"
   FROM "public"."programs"
  ORDER BY "programs"."name";


ALTER TABLE "public"."v_programs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_recent_activities" AS
 SELECT "x"."user_id",
    "x"."activity_type",
    "x"."activity_text",
    "x"."target_id",
    "x"."created_at"
   FROM ( SELECT "ea"."user_id",
            'event_rsvp'::"text" AS "activity_type",
            "e"."title" AS "activity_text",
            "e"."id" AS "target_id",
            "ea"."created_at"
           FROM ("public"."event_attendees" "ea"
             JOIN "public"."events" "e" ON (("e"."id" = "ea"."event_id")))
        UNION ALL
         SELECT "ja"."applicant_id" AS "user_id",
            'job_application'::"text" AS "activity_type",
            "j"."title" AS "activity_text",
            "j"."id" AS "target_id",
            "ja"."created_at"
           FROM ("public"."job_applications" "ja"
             JOIN "public"."jobs" "j" ON (("j"."id" = "ja"."job_id")))
        UNION ALL
         SELECT "c"."requester_id" AS "user_id",
            'connection_request'::"text" AS "activity_type",
            "p"."full_name" AS "activity_text",
            "c"."recipient_id" AS "target_id",
            "c"."created_at"
           FROM ("public"."connections" "c"
             JOIN "public"."profiles" "p" ON (("p"."id" = "c"."recipient_id")))
          WHERE ("c"."status" = 'pending'::"text")
        UNION ALL
         SELECT "gm"."user_id",
            'group_joined'::"text" AS "activity_type",
            "g"."name" AS "activity_text",
            "g"."id" AS "target_id",
            "gm"."created_at"
           FROM ("public"."group_members" "gm"
             JOIN "public"."groups" "g" ON (("g"."id" = "gm"."group_id")))
          WHERE ("g"."is_approved" = true)
        UNION ALL
         SELECT "m"."mentee_id" AS "user_id",
            'mentorship_accepted'::"text" AS "activity_type",
            "p"."full_name" AS "activity_text",
            "m"."mentor_id" AS "target_id",
            "m"."created_at"
           FROM ("public"."mentorships" "m"
             JOIN "public"."profiles" "p" ON (("p"."id" = "m"."mentor_id")))
          WHERE ("m"."status" = 'accepted'::"text")) "x"
  WHERE ("x"."user_id" = "auth"."uid"())
  ORDER BY "x"."created_at" DESC
 LIMIT 10;


ALTER TABLE "public"."v_recent_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "realtime"."messages" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
)
PARTITION BY RANGE ("inserted_at");


ALTER TABLE "realtime"."messages" OWNER TO "supabase_realtime_admin";


CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_12_01" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_12_01" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_12_02" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_12_02" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_12_03" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_12_03" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_12_04" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_12_04" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_12_05" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_12_05" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_12_06" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_12_06" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "realtime"."messages_2025_12_07" (
    "topic" "text" NOT NULL,
    "extension" "text" NOT NULL,
    "payload" "jsonb",
    "event" "text",
    "private" boolean DEFAULT false,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "inserted_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "realtime"."messages_2025_12_07" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "realtime"."schema_migrations" (
    "version" bigint NOT NULL,
    "inserted_at" timestamp(0) without time zone
);


ALTER TABLE "realtime"."schema_migrations" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "realtime"."subscription" (
    "id" bigint NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "entity" "regclass" NOT NULL,
    "filters" "realtime"."user_defined_filter"[] DEFAULT '{}'::"realtime"."user_defined_filter"[] NOT NULL,
    "claims" "jsonb" NOT NULL,
    "claims_role" "regrole" GENERATED ALWAYS AS ("realtime"."to_regrole"(("claims" ->> 'role'::"text"))) STORED NOT NULL,
    "created_at" timestamp without time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "realtime"."subscription" OWNER TO "supabase_admin";


ALTER TABLE "realtime"."subscription" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "realtime"."subscription_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text",
    "type" "storage"."buckettype" DEFAULT 'STANDARD'::"storage"."buckettype" NOT NULL
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."buckets_analytics" (
    "name" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'ANALYTICS'::"storage"."buckettype" NOT NULL,
    "format" "text" DEFAULT 'ICEBERG'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "storage"."buckets_analytics" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."buckets_vectors" (
    "id" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'VECTOR'::"storage"."buckettype" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."buckets_vectors" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb",
    "level" integer
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."prefixes" (
    "bucket_id" "text" NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "level" integer GENERATED ALWAYS AS ("storage"."get_level"("name")) STORED NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "storage"."prefixes" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."vector_indexes" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "bucket_id" "text" NOT NULL,
    "data_type" "text" NOT NULL,
    "dimension" integer NOT NULL,
    "distance_metric" "text" NOT NULL,
    "metadata_configuration" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."vector_indexes" OWNER TO "supabase_storage_admin";


ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_12_01" FOR VALUES FROM ('2025-12-01 00:00:00') TO ('2025-12-02 00:00:00');



ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_12_02" FOR VALUES FROM ('2025-12-02 00:00:00') TO ('2025-12-03 00:00:00');



ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_12_03" FOR VALUES FROM ('2025-12-03 00:00:00') TO ('2025-12-04 00:00:00');



ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_12_04" FOR VALUES FROM ('2025-12-04 00:00:00') TO ('2025-12-05 00:00:00');



ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_12_05" FOR VALUES FROM ('2025-12-05 00:00:00') TO ('2025-12-06 00:00:00');



ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_12_06" FOR VALUES FROM ('2025-12-06 00:00:00') TO ('2025-12-07 00:00:00');



ALTER TABLE ONLY "realtime"."messages" ATTACH PARTITION "realtime"."messages_2025_12_07" FOR VALUES FROM ('2025-12-07 00:00:00') TO ('2025-12-08 00:00:00');



ALTER TABLE ONLY "public"."profile_approval_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."profile_approval_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."social_links" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."social_links_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_actions"
    ADD CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_analytics_audit_log"
    ADD CONSTRAINT "admin_analytics_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_deletion_audit_log"
    ADD CONSTRAINT "admin_deletion_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_invalid_degree_programs_audit"
    ADD CONSTRAINT "admin_invalid_degree_programs_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_notifications"
    ADD CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."avatar_upload_log"
    ADD CONSTRAINT "avatar_upload_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookmarked_jobs_legacy_do_not_use"
    ADD CONSTRAINT "bookmarked_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."profiles"
    ADD CONSTRAINT "chk_avatar_url_length" CHECK ((("avatar_url" IS NULL) OR ("length"("avatar_url") < 2048))) NOT VALID;



ALTER TABLE ONLY "public"."clarification_requests"
    ADD CONSTRAINT "clarification_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_approvals"
    ADD CONSTRAINT "content_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_moderation"
    ADD CONSTRAINT "content_moderation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_members"
    ADD CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."csv_import_history"
    ADD CONSTRAINT "csv_import_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."degree_programs"
    ADD CONSTRAINT "degree_programs_label_key" UNIQUE ("label");



ALTER TABLE ONLY "public"."degree_programs"
    ADD CONSTRAINT "degree_programs_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."degrees"
    ADD CONSTRAINT "degrees_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."deletion_queue"
    ADD CONSTRAINT "deletion_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_degree_code_name_key" UNIQUE ("degree_code", "name");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dm_messages"
    ADD CONSTRAINT "dm_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dm_participants"
    ADD CONSTRAINT "dm_participants_pkey" PRIMARY KEY ("thread_id", "user_id");



ALTER TABLE ONLY "public"."dm_threads"
    ADD CONSTRAINT "dm_threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."education_history"
    ADD CONSTRAINT "education_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_event_id_attendee_id_key" UNIQUE ("event_id", "attendee_id");



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_feedback"
    ADD CONSTRAINT "event_feedback_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_feedback"
    ADD CONSTRAINT "event_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_groups"
    ADD CONSTRAINT "event_groups_event_id_group_id_key" UNIQUE ("event_id", "group_id");



ALTER TABLE ONLY "public"."event_groups"
    ADD CONSTRAINT "event_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_event_id_user_id_key" UNIQUE ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_slug_unique" UNIQUE ("slug");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."group_comments"
    ADD CONSTRAINT "group_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id");



ALTER TABLE ONLY "public"."group_memberships"
    ADD CONSTRAINT "group_memberships_group_id_user_id_key" UNIQUE ("group_id", "user_id");



ALTER TABLE ONLY "public"."group_memberships"
    ADD CONSTRAINT "group_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_post_reports"
    ADD CONSTRAINT "group_post_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_posts"
    ADD CONSTRAINT "group_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_alerts"
    ADD CONSTRAINT "job_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_alerts"
    ADD CONSTRAINT "job_alerts_user_alert_name_key" UNIQUE ("user_id", "alert_name");



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_job_id_applicant_id_key" UNIQUE ("job_id", "applicant_id");



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_bookmarks"
    ADD CONSTRAINT "job_bookmarks_job_id_user_id_key" UNIQUE ("job_id", "user_id");



ALTER TABLE ONLY "public"."job_bookmarks"
    ADD CONSTRAINT "job_bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentee_profiles"
    ADD CONSTRAINT "mentee_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentees"
    ADD CONSTRAINT "mentees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentor_availability"
    ADD CONSTRAINT "mentor_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentor_profiles"
    ADD CONSTRAINT "mentor_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentors"
    ADD CONSTRAINT "mentors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentors"
    ADD CONSTRAINT "mentors_user_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."mentorship_appointments"
    ADD CONSTRAINT "mentorship_appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentorship_feedback"
    ADD CONSTRAINT "mentorship_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentorship_messages"
    ADD CONSTRAINT "mentorship_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentorship_programs"
    ADD CONSTRAINT "mentorship_programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentorship_relationships"
    ADD CONSTRAINT "mentorship_relationships_mentor_id_mentee_id_program_id_key" UNIQUE ("mentor_id", "mentee_id", "program_id");



ALTER TABLE ONLY "public"."mentorship_relationships"
    ADD CONSTRAINT "mentorship_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentorship_requests"
    ADD CONSTRAINT "mentorship_requests_mentee_id_mentor_id_key" UNIQUE ("mentee_id", "mentor_id");



ALTER TABLE ONLY "public"."mentorship_requests"
    ADD CONSTRAINT "mentorship_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentorship_sessions"
    ADD CONSTRAINT "mentorship_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentorships"
    ADD CONSTRAINT "mentorships_mentor_id_mentee_id_key" UNIQUE ("mentor_id", "mentee_id");



ALTER TABLE ONLY "public"."mentorships"
    ADD CONSTRAINT "mentorships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."networking_group_members"
    ADD CONSTRAINT "networking_group_members_group_id_user_id_key" UNIQUE ("group_id", "user_id");



ALTER TABLE ONLY "public"."networking_group_members"
    ADD CONSTRAINT "networking_group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."networking_groups"
    ADD CONSTRAINT "networking_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_events"
    ADD CONSTRAINT "notification_events_idempotent" UNIQUE ("idempotency_key") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "public"."notification_events"
    ADD CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_notification_type_key" UNIQUE ("user_id", "notification_type");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_approval_audit"
    ADD CONSTRAINT "profile_approval_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_approval_log"
    ADD CONSTRAINT "profile_approval_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_profiles"
    ADD CONSTRAINT "resume_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resume_profiles"
    ADD CONSTRAINT "resume_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_links"
    ADD CONSTRAINT "social_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_links"
    ADD CONSTRAINT "social_links_profile_id_type_key" UNIQUE ("profile_id", "type");



ALTER TABLE ONLY "public"."system_alerts"
    ADD CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_analytics"
    ADD CONSTRAINT "system_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookmarked_jobs_legacy_do_not_use"
    ADD CONSTRAINT "unique_user_job_bookmark" UNIQUE ("user_id", "job_id");



ALTER TABLE ONLY "public"."dm_messages"
    ADD CONSTRAINT "uq_dm_messages_dedupe" UNIQUE ("thread_id", "sender_id", "client_id");



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "uq_job_applications_applicant_job" UNIQUE ("applicant_id", "job_id");



ALTER TABLE ONLY "public"."user_activity_logs"
    ADD CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mentee_profiles"
    ADD CONSTRAINT "user_id_unique_mentee_profile" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_resumes"
    ADD CONSTRAINT "user_resumes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_profile_id_role_id_key" UNIQUE ("profile_id", "role_id");



ALTER TABLE ONLY "public"."dm_threads"
    ADD CONSTRAINT "ux_dm_threads_pair" UNIQUE ("user_a", "user_b");



ALTER TABLE ONLY "public"."social_links"
    ADD CONSTRAINT "ux_social_links_profile_type" UNIQUE ("profile_id", "type");



ALTER TABLE ONLY "realtime"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id", "inserted_at");



ALTER TABLE ONLY "realtime"."messages_2025_12_01"
    ADD CONSTRAINT "messages_2025_12_01_pkey" PRIMARY KEY ("id", "inserted_at");



ALTER TABLE ONLY "realtime"."messages_2025_12_02"
    ADD CONSTRAINT "messages_2025_12_02_pkey" PRIMARY KEY ("id", "inserted_at");



ALTER TABLE ONLY "realtime"."messages_2025_12_03"
    ADD CONSTRAINT "messages_2025_12_03_pkey" PRIMARY KEY ("id", "inserted_at");



ALTER TABLE ONLY "realtime"."messages_2025_12_04"
    ADD CONSTRAINT "messages_2025_12_04_pkey" PRIMARY KEY ("id", "inserted_at");



ALTER TABLE ONLY "realtime"."messages_2025_12_05"
    ADD CONSTRAINT "messages_2025_12_05_pkey" PRIMARY KEY ("id", "inserted_at");



ALTER TABLE ONLY "realtime"."messages_2025_12_06"
    ADD CONSTRAINT "messages_2025_12_06_pkey" PRIMARY KEY ("id", "inserted_at");



ALTER TABLE ONLY "realtime"."messages_2025_12_07"
    ADD CONSTRAINT "messages_2025_12_07_pkey" PRIMARY KEY ("id", "inserted_at");



ALTER TABLE ONLY "realtime"."subscription"
    ADD CONSTRAINT "pk_subscription" PRIMARY KEY ("id");



ALTER TABLE ONLY "realtime"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "storage"."buckets_analytics"
    ADD CONSTRAINT "buckets_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets_vectors"
    ADD CONSTRAINT "buckets_vectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."prefixes"
    ADD CONSTRAINT "prefixes_pkey" PRIMARY KEY ("bucket_id", "level", "name");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "connections_unique_pair" ON "public"."connections" USING "btree" ("requester_id", "addressee_id");



CREATE UNIQUE INDEX "connections_unique_pair_directed" ON "public"."connections" USING "btree" ("requester_id", "recipient_id");



CREATE UNIQUE INDEX "dm_threads_unique_pair" ON "public"."dm_threads" USING "btree" (LEAST("user_a", "user_b"), GREATEST("user_a", "user_b"));



CREATE INDEX "event_attendees_event_id_idx" ON "public"."event_attendees" USING "btree" ("event_id");



CREATE INDEX "event_attendees_status_idx" ON "public"."event_attendees" USING "btree" ("attendance_status");



CREATE INDEX "event_attendees_user_id_idx" ON "public"."event_attendees" USING "btree" ("user_id");



CREATE INDEX "events_approval_status_idx" ON "public"."events" USING "btree" ("approval_status");



CREATE INDEX "events_category_idx" ON "public"."events" USING "btree" ("category");



CREATE INDEX "events_is_featured_idx" ON "public"."events" USING "btree" ("is_featured");



CREATE INDEX "events_is_published_idx" ON "public"."events" USING "btree" ("is_published");



CREATE INDEX "events_organizer_id_idx" ON "public"."events" USING "btree" ("organizer_id");



CREATE INDEX "events_search_idx" ON "public"."events" USING "gin" ("to_tsvector"('"simple"'::"regconfig", ((((COALESCE("title", ''::"text") || ' '::"text") || COALESCE("description", ''::"text")) || ' '::"text") || COALESCE("location", ''::"text"))));



CREATE INDEX "events_start_date_idx" ON "public"."events" USING "btree" ("start_date");



CREATE INDEX "idx_activity_log_user_time" ON "public"."activity_log" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_activity_logs_created_at" ON "public"."activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_admin_actions_admin_created" ON "public"."admin_actions" USING "btree" ("admin_id", "created_at" DESC);



CREATE INDEX "idx_admin_actions_admin_id" ON "public"."admin_actions" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_actions_created_at" ON "public"."admin_actions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_admin_actions_target" ON "public"."admin_actions" USING "btree" ("target_type", "target_id");



CREATE INDEX "idx_admin_analytics_audit_log_admin_created" ON "public"."admin_analytics_audit_log" USING "btree" ("admin_id", "created_at" DESC);



CREATE INDEX "idx_attendees_event" ON "public"."event_attendees" USING "btree" ("event_id");



CREATE INDEX "idx_avatar_upload_log_user_time" ON "public"."avatar_upload_log" USING "btree" ("user_id", "uploaded_at" DESC);



CREATE INDEX "idx_connections_dual" ON "public"."connections" USING "btree" ("requester_id", "recipient_id", "status", "updated_at");



CREATE INDEX "idx_connections_pair" ON "public"."connections" USING "btree" ("requester_id", "recipient_id");



CREATE INDEX "idx_connections_recipient" ON "public"."connections" USING "btree" ("recipient_id");



CREATE INDEX "idx_connections_recipient_id" ON "public"."connections" USING "btree" ("recipient_id");



CREATE INDEX "idx_connections_requester" ON "public"."connections" USING "btree" ("requester_id");



CREATE INDEX "idx_connections_requester_id" ON "public"."connections" USING "btree" ("requester_id");



CREATE INDEX "idx_connections_status" ON "public"."connections" USING "btree" ("status");



CREATE INDEX "idx_connections_status_pair" ON "public"."connections" USING "btree" ("status", "requester_id", "recipient_id");



CREATE INDEX "idx_connections_users" ON "public"."connections" USING "btree" ("requester_id", "recipient_id");



CREATE INDEX "idx_content_approvals_creator_id" ON "public"."content_approvals" USING "btree" ("creator_id");



CREATE INDEX "idx_content_approvals_status" ON "public"."content_approvals" USING "btree" ("status");



CREATE INDEX "idx_content_moderation_content_type" ON "public"."content_moderation" USING "btree" ("content_type");



CREATE INDEX "idx_content_moderation_status" ON "public"."content_moderation" USING "btree" ("status");



CREATE INDEX "idx_conv_participants_user" ON "public"."conversation_participants" USING "btree" ("user_id", "conversation_id");



CREATE INDEX "idx_conversation_participants_conversation_id" ON "public"."conversation_participants" USING "btree" ("conversation_id");



CREATE INDEX "idx_conversation_participants_user_id" ON "public"."conversation_participants" USING "btree" ("user_id");



CREATE INDEX "idx_conversations_last_message_at" ON "public"."conversations" USING "btree" ("last_message_at" DESC);



CREATE INDEX "idx_conversations_mentorship_relationship_id" ON "public"."conversations" USING "btree" ("mentorship_relationship_id");



CREATE INDEX "idx_cp_conv" ON "public"."conversation_participants" USING "btree" ("conversation_id");



CREATE INDEX "idx_cp_user" ON "public"."conversation_participants" USING "btree" ("user_id");



CREATE INDEX "idx_deletion_queue_status" ON "public"."deletion_queue" USING "btree" ("status");



CREATE INDEX "idx_deletion_queue_status_created" ON "public"."deletion_queue" USING "btree" ("status", "created_at");



CREATE INDEX "idx_dm_messages_read_at" ON "public"."dm_messages" USING "btree" ("thread_id", "read_at");



CREATE INDEX "idx_dm_messages_sender_time" ON "public"."dm_messages" USING "btree" ("sender_id", "created_at" DESC);



CREATE INDEX "idx_dm_messages_thread_time" ON "public"."dm_messages" USING "btree" ("thread_id", "created_at" DESC);



CREATE INDEX "idx_dm_participants_user" ON "public"."dm_participants" USING "btree" ("user_id");



CREATE INDEX "idx_dm_thread_time" ON "public"."dm_messages" USING "btree" ("thread_id", "created_at" DESC);



CREATE INDEX "idx_education_history_profile_id" ON "public"."education_history" USING "btree" ("profile_id");



CREATE INDEX "idx_event_attendees_attendance_status" ON "public"."event_attendees" USING "btree" ("attendance_status");



CREATE INDEX "idx_event_attendees_attendee" ON "public"."event_attendees" USING "btree" ("user_id");



CREATE INDEX "idx_event_attendees_event" ON "public"."event_attendees" USING "btree" ("event_id");



CREATE INDEX "idx_event_attendees_event_id" ON "public"."event_attendees" USING "btree" ("event_id");



CREATE INDEX "idx_event_attendees_user" ON "public"."event_attendees" USING "btree" ("user_id");



CREATE INDEX "idx_event_attendees_user_created" ON "public"."event_attendees" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_events_approval_published" ON "public"."events" USING "btree" ("approval_status", "is_published");



CREATE INDEX "idx_events_approval_status" ON "public"."events" USING "btree" ("approval_status", "created_at" DESC);



CREATE INDEX "idx_events_category" ON "public"."events" USING "btree" ("category");



CREATE INDEX "idx_events_end" ON "public"."events" USING "btree" ("end_date");



CREATE INDEX "idx_events_event_type" ON "public"."events" USING "btree" ("event_type");



CREATE INDEX "idx_events_group_id" ON "public"."events" USING "btree" ("group_id");



CREATE INDEX "idx_events_is_published" ON "public"."events" USING "btree" ("is_published");



CREATE INDEX "idx_events_organizer_id" ON "public"."events" USING "btree" ("organizer_id");



CREATE INDEX "idx_events_published_start" ON "public"."events" USING "btree" ("is_published", "start_date");



CREATE INDEX "idx_events_start" ON "public"."events" USING "btree" ("start_date");



CREATE INDEX "idx_events_start_at" ON "public"."events" USING "btree" ("start_at");



CREATE INDEX "idx_events_start_date" ON "public"."events" USING "btree" ("start_date");



CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("status");



CREATE INDEX "idx_events_tags" ON "public"."events" USING "gin" ("tags");



CREATE INDEX "idx_events_user_id" ON "public"."events" USING "btree" ("user_id");



CREATE INDEX "idx_feedback_event" ON "public"."event_feedback" USING "btree" ("event_id");



CREATE INDEX "idx_gpr_post" ON "public"."group_post_reports" USING "btree" ("post_id");



CREATE INDEX "idx_gpr_status" ON "public"."group_post_reports" USING "btree" ("status");



CREATE INDEX "idx_group_comments_author" ON "public"."group_comments" USING "btree" ("author_id", "created_at" DESC);



CREATE INDEX "idx_group_comments_post" ON "public"."group_comments" USING "btree" ("post_id", "created_at" DESC);



CREATE INDEX "idx_group_comments_post_created_at" ON "public"."group_comments" USING "btree" ("post_id", "created_at" DESC);



CREATE INDEX "idx_group_members_group" ON "public"."group_members" USING "btree" ("group_id");



CREATE INDEX "idx_group_members_group_user" ON "public"."group_members" USING "btree" ("group_id", "user_id");



CREATE INDEX "idx_group_members_joined_at" ON "public"."group_members" USING "btree" ("joined_at" DESC);



CREATE INDEX "idx_group_members_user" ON "public"."group_members" USING "btree" ("user_id");



CREATE INDEX "idx_group_members_user_created" ON "public"."group_members" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_group_members_user_status" ON "public"."group_members" USING "btree" ("user_id", "status");



CREATE INDEX "idx_group_memberships_gid_status" ON "public"."group_memberships" USING "btree" ("group_id", "status");



CREATE INDEX "idx_group_memberships_user" ON "public"."group_memberships" USING "btree" ("user_id");



CREATE INDEX "idx_group_posts_gid_created_at" ON "public"."group_posts" USING "btree" ("group_id", "created_at" DESC);



CREATE INDEX "idx_group_posts_group_created" ON "public"."group_posts" USING "btree" ("group_id", "created_at" DESC);



CREATE INDEX "idx_group_posts_group_created_at" ON "public"."group_posts" USING "btree" ("group_id", "created_at" DESC);



CREATE INDEX "idx_group_posts_group_id" ON "public"."group_posts" USING "btree" ("group_id");



CREATE INDEX "idx_group_posts_id_group" ON "public"."group_posts" USING "btree" ("id", "group_id");



CREATE INDEX "idx_groups_archived_created" ON "public"."groups" USING "btree" ("is_archived", "created_at" DESC);



CREATE INDEX "idx_groups_created_at" ON "public"."groups" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_groups_is_private" ON "public"."groups" USING "btree" ("is_private");



CREATE INDEX "idx_groups_pending" ON "public"."groups" USING "btree" ("is_approved", "created_at" DESC);



CREATE INDEX "idx_groups_review" ON "public"."groups" USING "btree" ("is_approved", "is_rejected", "created_at" DESC);



CREATE INDEX "idx_groups_review_notes_trgm" ON "public"."groups" USING "gin" ("review_notes" "public"."gin_trgm_ops");



CREATE INDEX "idx_groups_tags_gin" ON "public"."groups" USING "gin" ("tags");



CREATE INDEX "idx_groups_visibility_state" ON "public"."groups" USING "btree" ("is_archived", "visibility", "is_approved");



CREATE INDEX "idx_ja_applicant_created_at" ON "public"."job_applications" USING "btree" ("applicant_id", "created_at" DESC);



CREATE INDEX "idx_ja_job_created_at" ON "public"."job_applications" USING "btree" ("job_id", "created_at" DESC);



CREATE INDEX "idx_job_applications_status" ON "public"."job_applications" USING "btree" ("status");



CREATE INDEX "idx_job_bookmarks_job_id" ON "public"."job_bookmarks" USING "btree" ("job_id");



CREATE INDEX "idx_job_bookmarks_user" ON "public"."job_bookmarks" USING "btree" ("user_id");



CREATE INDEX "idx_job_bookmarks_user_created" ON "public"."job_bookmarks" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_job_bookmarks_user_job" ON "public"."job_bookmarks" USING "btree" ("user_id", "job_id");



CREATE INDEX "idx_jobs_active_approved" ON "public"."jobs" USING "btree" ("is_active", "is_approved");



CREATE INDEX "idx_jobs_active_approved_created" ON "public"."jobs" USING "btree" ("is_active", "is_approved", "created_at" DESC);



CREATE INDEX "idx_jobs_active_approved_created_at" ON "public"."jobs" USING "btree" ("created_at" DESC) WHERE (COALESCE("is_active", true) AND COALESCE("is_approved", false));



CREATE INDEX "idx_jobs_application_deadline" ON "public"."jobs" USING "btree" ("application_deadline");



CREATE INDEX "idx_jobs_approved_active" ON "public"."jobs" USING "btree" ("is_approved", "is_active");



CREATE INDEX "idx_jobs_company" ON "public"."jobs" USING "btree" ("company_id");



CREATE INDEX "idx_jobs_company_id" ON "public"."jobs" USING "btree" ("company_id");



CREATE INDEX "idx_jobs_created_at" ON "public"."jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_jobs_created_by" ON "public"."jobs" USING "btree" ("created_by");



CREATE INDEX "idx_jobs_deadline" ON "public"."jobs" USING "btree" ("deadline");



CREATE INDEX "idx_jobs_department" ON "public"."jobs" USING "btree" ("department");



CREATE INDEX "idx_jobs_exp_level" ON "public"."jobs" USING "btree" ("experience_level");



CREATE INDEX "idx_jobs_expires_at" ON "public"."jobs" USING "btree" ("expires_at");



CREATE INDEX "idx_jobs_feed_filters" ON "public"."jobs" USING "btree" ("is_active", "is_approved", "deadline", "application_deadline", "expires_at");



CREATE INDEX "idx_jobs_feed_state" ON "public"."jobs" USING "btree" ("is_active", "is_approved", COALESCE("is_rejected", false), "status", "deadline", "application_deadline", "expires_at");



CREATE INDEX "idx_jobs_feed_status_approved_deadline" ON "public"."jobs" USING "btree" ("status", "is_approved", "application_deadline");



CREATE INDEX "idx_jobs_fts" ON "public"."jobs" USING "gin" ((((COALESCE("title", ''::"text") || ' '::"text") || COALESCE("description", ''::"text"))) "public"."gin_trgm_ops");



CREATE INDEX "idx_jobs_industry" ON "public"."jobs" USING "btree" ("industry");



CREATE INDEX "idx_jobs_is_active" ON "public"."jobs" USING "btree" ("is_active");



CREATE INDEX "idx_jobs_is_active_approved" ON "public"."jobs" USING "btree" ("is_active", "is_approved");



CREATE INDEX "idx_jobs_job_type" ON "public"."jobs" USING "btree" ("job_type");



CREATE INDEX "idx_jobs_loc" ON "public"."jobs" USING "btree" ("location");



CREATE INDEX "idx_jobs_location_ilike" ON "public"."jobs" USING "btree" ("location");



CREATE INDEX "idx_jobs_open_close" ON "public"."jobs" USING "btree" ("open_at", "close_at");



CREATE INDEX "idx_jobs_open_close_at" ON "public"."jobs" USING "btree" ("open_at", "close_at");



CREATE INDEX "idx_jobs_owner" ON "public"."jobs" USING "btree" ("posted_by", "created_at" DESC);



CREATE INDEX "idx_jobs_posted_by" ON "public"."jobs" USING "btree" ("posted_by");



CREATE INDEX "idx_jobs_public_feed" ON "public"."jobs" USING "btree" ("status", "is_active", "open_at", "close_at", "created_at");



CREATE INDEX "idx_jobs_publish" ON "public"."jobs" USING "btree" ("is_approved", "is_active", "created_at" DESC);



CREATE INDEX "idx_jobs_review" ON "public"."jobs" USING "btree" ("is_approved", "is_rejected", "created_at" DESC);



CREATE INDEX "idx_jobs_skills_gin" ON "public"."jobs" USING "gin" ("skills");



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_jobs_status_active_approved_deadline" ON "public"."jobs" USING "btree" ("status", "is_active", "is_approved", "application_deadline", "deadline", "location", "job_type", "department");



CREATE INDEX "idx_jobs_status_approved_active_expires" ON "public"."jobs" USING "btree" ("status", "is_approved", "is_active", "expires_at");



CREATE INDEX "idx_jobs_type_exp" ON "public"."jobs" USING "btree" ("job_type", "experience_level");



CREATE INDEX "idx_jobs_visibility" ON "public"."jobs" USING "btree" ("is_active", "is_approved", "posted_by");



CREATE UNIQUE INDEX "idx_mentors_user_id_unique" ON "public"."mentors" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_mentorship_relationships_active_unique" ON "public"."mentorship_relationships" USING "btree" ("mentor_id", "mentee_id") WHERE (("status" = 'active'::"text") AND ("end_date" IS NULL));



CREATE INDEX "idx_mentorship_relationships_dm_thread_id" ON "public"."mentorship_relationships" USING "btree" ("dm_thread_id");



CREATE INDEX "idx_mentorship_relationships_mentor_active" ON "public"."mentorship_relationships" USING "btree" ("mentor_id", "status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_mentorship_relationships_mentor_status_dm" ON "public"."mentorship_relationships" USING "btree" ("mentor_id", "status", "dm_thread_id");



CREATE UNIQUE INDEX "idx_mentorship_relationships_unique_active" ON "public"."mentorship_relationships" USING "btree" ("mentee_id", "mentor_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_mentorship_requests_mentee_id" ON "public"."mentorship_requests" USING "btree" ("mentee_id");



CREATE INDEX "idx_mentorship_requests_mentor_id" ON "public"."mentorship_requests" USING "btree" ("mentor_id");



CREATE INDEX "idx_mentorship_requests_parties_status" ON "public"."mentorship_requests" USING "btree" ("mentor_id", "mentee_id", "status");



CREATE UNIQUE INDEX "idx_mentorship_requests_pending_unique" ON "public"."mentorship_requests" USING "btree" ("mentor_id", "mentee_id") WHERE ("status" = 'pending'::"public"."mentorship_request_status");



CREATE INDEX "idx_mentorship_requests_status" ON "public"."mentorship_requests" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_mentorship_requests_unique_pending" ON "public"."mentorship_requests" USING "btree" ("mentor_id", "mentee_id") WHERE ("status" = 'pending'::"public"."mentorship_request_status");



CREATE INDEX "idx_mentorship_requests_user" ON "public"."mentorship_requests" USING "btree" ("mentor_id", "mentee_id", "status");



CREATE INDEX "idx_mentorship_sessions_request_id" ON "public"."mentorship_sessions" USING "btree" ("mentorship_request_id");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_messages_conversation_created" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_messages_conversation_read" ON "public"."messages" USING "btree" ("conversation_id", "read_at");



CREATE INDEX "idx_messages_on_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_parties" ON "public"."messages" USING "btree" ("sender_id", "recipient_id");



CREATE INDEX "idx_mr_mentee_pending" ON "public"."mentorship_requests" USING "btree" ("mentee_id") WHERE ("status" = 'pending'::"public"."mentorship_request_status");



CREATE INDEX "idx_mrships_mentee_active" ON "public"."mentorship_relationships" USING "btree" ("mentee_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_notification_events_unprocessed" ON "public"."notification_events" USING "btree" ("processed_at", "created_at") WHERE ("processed_at" IS NULL);



CREATE INDEX "idx_notifications_event_id" ON "public"."notifications" USING "btree" ("event_id");



CREATE UNIQUE INDEX "idx_notifications_idempotency_key" ON "public"."notifications" USING "btree" ("idempotency_key") WHERE ("idempotency_key" IS NOT NULL);



CREATE INDEX "idx_notifications_inbox" ON "public"."notifications" USING "btree" ("recipient_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_notifications_metadata_gin" ON "public"."notifications" USING "gin" ("metadata");



CREATE INDEX "idx_notifications_module_type" ON "public"."notifications" USING "btree" ("module", "type");



CREATE INDEX "idx_notifications_profile_id" ON "public"."notifications" USING "btree" ("profile_id");



CREATE INDEX "idx_notifications_recipient_created" ON "public"."notifications" USING "btree" ("recipient_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_notifications_recipient_created_at" ON "public"."notifications" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "idx_notifications_recipient_id" ON "public"."notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_notifications_recipient_isread_created_at" ON "public"."notifications" USING "btree" ("recipient_id", "is_read", "created_at" DESC);



CREATE INDEX "idx_notifications_recipient_type_unread" ON "public"."notifications" USING "btree" ("recipient_id", "type") WHERE ("is_read" = false);



CREATE INDEX "idx_notifications_recipient_unread" ON "public"."notifications" USING "btree" ("recipient_id") WHERE ("is_read" = false);



CREATE INDEX "idx_notifications_sender_id" ON "public"."notifications" USING "btree" ("sender_id");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_unread_per_user" ON "public"."notifications" USING "btree" ("recipient_id", "type") WHERE ("is_read" = false);



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_read" ON "public"."notifications" USING "btree" ("user_id", "read_at");



CREATE INDEX "idx_profile_approval_audit_admin_created" ON "public"."profile_approval_audit" USING "btree" ("admin_id", "created_at" DESC);



CREATE INDEX "idx_profile_approval_audit_admin_created_at" ON "public"."profile_approval_audit" USING "btree" ("admin_id", "created_at" DESC);



CREATE INDEX "idx_profile_approval_audit_profile_created" ON "public"."profile_approval_audit" USING "btree" ("profile_id", "created_at" DESC);



CREATE INDEX "idx_profile_approval_audit_profile_created_at" ON "public"."profile_approval_audit" USING "btree" ("profile_id", "created_at" DESC);



CREATE INDEX "idx_profile_approval_log_changed_at" ON "public"."profile_approval_log" USING "btree" ("changed_at");



CREATE INDEX "idx_profile_approval_log_profile_id" ON "public"."profile_approval_log" USING "btree" ("profile_id");



CREATE INDEX "idx_profiles_achievements_gin" ON "public"."profiles" USING "gin" ("achievements");



CREATE INDEX "idx_profiles_approval_status" ON "public"."profiles" USING "btree" ("approval_status");



CREATE INDEX "idx_profiles_approval_visibility" ON "public"."profiles" USING "btree" ("approval_status", "visibility");



CREATE INDEX "idx_profiles_avatar_source" ON "public"."profiles" USING "btree" ("avatar_source") WHERE ("avatar_source" IS NOT NULL);



CREATE INDEX "idx_profiles_avatar_url_not_null" ON "public"."profiles" USING "btree" ("avatar_url") WHERE ("avatar_url" IS NOT NULL);



CREATE INDEX "idx_profiles_current_company_title" ON "public"."profiles" USING "btree" ("company_name", "current_job_title");



CREATE INDEX "idx_profiles_degree_code" ON "public"."profiles" USING "btree" ("degree_code");



CREATE INDEX "idx_profiles_degree_prog" ON "public"."profiles" USING "btree" ("degree_program");



CREATE INDEX "idx_profiles_department" ON "public"."profiles" USING "btree" ("department");



CREATE INDEX "idx_profiles_department_id" ON "public"."profiles" USING "btree" ("department_id");



CREATE INDEX "idx_profiles_directory_filter" ON "public"."profiles" USING "btree" ("role", "approval_status", "is_employer", "is_active", "is_deleted", "show_in_directory");



CREATE INDEX "idx_profiles_full_name" ON "public"."profiles" USING "btree" ("full_name");



CREATE INDEX "idx_profiles_grad_year" ON "public"."profiles" USING "btree" ("graduation_year");



CREATE INDEX "idx_profiles_graduation_year" ON "public"."profiles" USING "btree" ("graduation_year");



CREATE INDEX "idx_profiles_interests_gin" ON "public"."profiles" USING "gin" ("interests");



CREATE INDEX "idx_profiles_is_active" ON "public"."profiles" USING "btree" ("is_active");



CREATE INDEX "idx_profiles_is_deleted" ON "public"."profiles" USING "btree" ("is_deleted");



CREATE INDEX "idx_profiles_is_employer" ON "public"."profiles" USING "btree" ("role", "is_active", "is_deleted");



CREATE INDEX "idx_profiles_is_mentor" ON "public"."profiles" USING "btree" ("is_mentor");



CREATE INDEX "idx_profiles_location" ON "public"."profiles" USING "btree" ("location");



CREATE INDEX "idx_profiles_major" ON "public"."profiles" USING "btree" ("major");



CREATE INDEX "idx_profiles_mentor_directory" ON "public"."profiles" USING "btree" ("role", "approval_status", "is_available_for_mentorship") WHERE (("role" = 'mentor'::"public"."app_role_enum") AND ("approval_status" = 'approved'::"public"."profile_approval_status"));



CREATE INDEX "idx_profiles_name" ON "public"."profiles" USING "btree" ("full_name");



CREATE INDEX "idx_profiles_public_flags" ON "public"."profiles" USING "btree" ("approval_status", "visibility");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_show_in_directory" ON "public"."profiles" USING "btree" ("show_in_directory");



CREATE INDEX "idx_profiles_skills_gin" ON "public"."profiles" USING "gin" ("skills");



CREATE INDEX "idx_profiles_soft_delete" ON "public"."profiles" USING "btree" ("is_deleted", "deleted_at");



CREATE INDEX "idx_relationships_mentee_id" ON "public"."mentorship_relationships" USING "btree" ("mentee_id");



CREATE INDEX "idx_relationships_mentor_id" ON "public"."mentorship_relationships" USING "btree" ("mentor_id");



CREATE INDEX "idx_system_alerts_created_at" ON "public"."system_alerts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_system_alerts_is_resolved" ON "public"."system_alerts" USING "btree" ("is_resolved");



CREATE INDEX "idx_ual_action" ON "public"."user_activity_logs" USING "btree" ("action");



CREATE INDEX "idx_ual_created_at" ON "public"."user_activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_ual_route" ON "public"."user_activity_logs" USING "btree" ("route");



CREATE INDEX "idx_ual_user" ON "public"."user_activity_logs" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "ix_dm_messages_thread_created_at" ON "public"."dm_messages" USING "btree" ("thread_id", "created_at" DESC);



CREATE INDEX "mentees_status_idx" ON "public"."mentees" USING "btree" ("status");



CREATE INDEX "mentees_user_id_idx" ON "public"."mentees" USING "btree" ("user_id");



CREATE INDEX "mentor_availability_date_idx" ON "public"."mentor_availability" USING "btree" ("date");



CREATE INDEX "mentor_availability_is_booked_idx" ON "public"."mentor_availability" USING "btree" ("is_booked");



CREATE INDEX "mentor_availability_mentor_id_idx" ON "public"."mentor_availability" USING "btree" ("mentor_id");



CREATE INDEX "mentors_status_idx" ON "public"."mentors" USING "btree" ("status");



CREATE INDEX "mentors_user_id_idx" ON "public"."mentors" USING "btree" ("user_id");



CREATE UNIQUE INDEX "mentors_user_id_key" ON "public"."mentors" USING "btree" ("user_id");



CREATE UNIQUE INDEX "mentors_user_id_uidx" ON "public"."mentors" USING "btree" ("user_id");



CREATE INDEX "mentorship_appointments_availability_id_idx" ON "public"."mentorship_appointments" USING "btree" ("availability_id");



CREATE INDEX "mentorship_appointments_created_at_idx" ON "public"."mentorship_appointments" USING "btree" ("created_at");



CREATE INDEX "mentorship_appointments_mentee_id_idx" ON "public"."mentorship_appointments" USING "btree" ("mentee_id");



CREATE INDEX "mentorship_appointments_status_idx" ON "public"."mentorship_appointments" USING "btree" ("status");



CREATE UNIQUE INDEX "mentorship_relationships_mentor_mentee_active_uidx" ON "public"."mentorship_relationships" USING "btree" ("mentor_id", "mentee_id") WHERE (("status" = 'active'::"text") AND ("end_date" IS NULL));



CREATE UNIQUE INDEX "mentorship_relationships_unique_active" ON "public"."mentorship_relationships" USING "btree" ("mentor_id", "mentee_id") WHERE (("status" = 'active'::"text") AND ("end_date" IS NULL));



CREATE UNIQUE INDEX "mentorship_requests_mentor_mentee_pending_uidx" ON "public"."mentorship_requests" USING "btree" ("mentor_id", "mentee_id") WHERE ("status" = 'pending'::"public"."mentorship_request_status");



CREATE UNIQUE INDEX "mentorship_requests_unique_pending" ON "public"."mentorship_requests" USING "btree" ("mentor_id", "mentee_id") WHERE ("status" = 'pending'::"public"."mentorship_request_status");



CREATE UNIQUE INDEX "mentorship_requests_unique_pending_or_accepted" ON "public"."mentorship_requests" USING "btree" ("mentor_id", "mentee_id") WHERE ("status" = ANY (ARRAY['pending'::"public"."mentorship_request_status", 'accepted'::"public"."mentorship_request_status"]));



CREATE INDEX "mentorship_sessions_request_id_idx" ON "public"."mentorship_sessions" USING "btree" ("mentorship_request_id");



CREATE INDEX "mentorship_sessions_scheduled_time_idx" ON "public"."mentorship_sessions" USING "btree" ("scheduled_time");



CREATE UNIQUE INDEX "messages_client_uuid_unique" ON "public"."messages" USING "btree" ("client_uuid") WHERE ("client_uuid" IS NOT NULL);



CREATE INDEX "notifications_created_at_idx" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "notifications_is_read_idx" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "notifications_recipient_created_idx" ON "public"."notifications" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "notifications_recipient_isread_idx" ON "public"."notifications" USING "btree" ("recipient_id", "is_read");



CREATE INDEX "profiles_id_idx" ON "public"."profiles" USING "btree" ("id");



CREATE UNIQUE INDEX "profiles_phone_unique" ON "public"."profiles" USING "btree" ("phone") WHERE ("phone" IS NOT NULL);



CREATE INDEX "profiles_search_idx" ON "public"."profiles" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((((((COALESCE("full_name", ''::"text") || ' '::"text") || COALESCE("current_location", ''::"text")) || ' '::"text") || COALESCE("degree", ''::"text")) || ' '::"text") || COALESCE("department", ''::"text"))));



CREATE INDEX "resume_profiles_user_idx" ON "public"."resume_profiles" USING "btree" ("user_id");



CREATE UNIQUE INDEX "uniq_connections_pair" ON "public"."connections" USING "btree" ("public"."_conn_min"("requester_id", "recipient_id"), "public"."_conn_max"("requester_id", "recipient_id"));



CREATE UNIQUE INDEX "uniq_profiles_email_active" ON "public"."profiles" USING "btree" ("email") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "uq_dm_messages_sender_client" ON "public"."dm_messages" USING "btree" ("thread_id", "sender_id", "client_id");



CREATE UNIQUE INDEX "uq_dm_participants" ON "public"."dm_participants" USING "btree" ("thread_id", "user_id");



CREATE UNIQUE INDEX "uq_dm_participants_pair" ON "public"."dm_participants" USING "btree" ("thread_id", "user_id");



CREATE UNIQUE INDEX "uq_dm_participants_thread_user" ON "public"."dm_participants" USING "btree" ("thread_id", "user_id");



CREATE UNIQUE INDEX "uq_dm_threads_pair_norm" ON "public"."dm_threads" USING "btree" (LEAST("user_a", "user_b"), GREATEST("user_a", "user_b"));



CREATE UNIQUE INDEX "uq_event_attendees_event_user" ON "public"."event_attendees" USING "btree" ("event_id", "user_id");



CREATE UNIQUE INDEX "uq_event_feedback_event_user" ON "public"."event_feedback" USING "btree" ("event_id", "user_id");



CREATE UNIQUE INDEX "uq_group_members_gid_uid" ON "public"."group_members" USING "btree" ("group_id", "user_id");



CREATE UNIQUE INDEX "uq_group_members_group_user" ON "public"."group_members" USING "btree" ("group_id", "user_id");



CREATE UNIQUE INDEX "uq_group_members_pair" ON "public"."group_members" USING "btree" ("group_id", "user_id");



CREATE UNIQUE INDEX "uq_group_memberships_gid_uid" ON "public"."group_memberships" USING "btree" ("group_id", "user_id");



CREATE UNIQUE INDEX "uq_groups_name_norm_active" ON "public"."groups" USING "btree" ("name_norm") WHERE ("is_archived" = false);



CREATE UNIQUE INDEX "uq_messages_client_uuid" ON "public"."messages" USING "btree" ("client_uuid");



CREATE UNIQUE INDEX "uq_profiles_email_lower" ON "public"."profiles" USING "btree" ("lower"("email"));



CREATE INDEX "user_resumes_user_idx" ON "public"."user_resumes" USING "btree" ("user_id");



CREATE UNIQUE INDEX "ux_connections_pair_active" ON "public"."connections" USING "btree" (LEAST("requester_id", "recipient_id"), GREATEST("requester_id", "recipient_id")) WHERE ("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'connected'::"text"]));



CREATE UNIQUE INDEX "ux_connections_pending_pair" ON "public"."connections" USING "btree" (LEAST("requester_id", "recipient_id"), GREATEST("requester_id", "recipient_id")) WHERE ("status" = 'pending'::"text");



CREATE UNIQUE INDEX "ux_mentors_user_id" ON "public"."mentors" USING "btree" ("user_id");



CREATE UNIQUE INDEX "ux_mentorship_pending_once" ON "public"."mentorship_requests" USING "btree" ("mentor_id", "mentee_id") WHERE ("status" = 'pending'::"public"."mentorship_request_status");



CREATE UNIQUE INDEX "ux_mentorship_relationships_active" ON "public"."mentorship_relationships" USING "btree" ("mentor_id", "mentee_id") WHERE (("status" = 'active'::"text") AND ("end_date" IS NULL));



CREATE UNIQUE INDEX "ux_mentorship_relationships_active_pair" ON "public"."mentorship_relationships" USING "btree" ("mentee_id", "mentor_id") WHERE ("status" = 'active'::"text");



CREATE UNIQUE INDEX "ux_mentorship_requests_pending" ON "public"."mentorship_requests" USING "btree" ("mentor_id", "mentee_id") WHERE ("status" = 'pending'::"public"."mentorship_request_status");



CREATE UNIQUE INDEX "ux_mentorship_requests_pending_or_accepted" ON "public"."mentorship_requests" USING "btree" ("mentee_id", "mentor_id") WHERE ("status" = ANY (ARRAY['pending'::"public"."mentorship_request_status", 'accepted'::"public"."mentorship_request_status"]));



CREATE UNIQUE INDEX "ux_messages_client_id" ON "public"."messages" USING "btree" ("client_id");



CREATE INDEX "ix_realtime_subscription_entity" ON "realtime"."subscription" USING "btree" ("entity");



CREATE INDEX "messages_inserted_at_topic_index" ON ONLY "realtime"."messages" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));



CREATE INDEX "messages_2025_12_01_inserted_at_topic_idx" ON "realtime"."messages_2025_12_01" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));



CREATE INDEX "messages_2025_12_02_inserted_at_topic_idx" ON "realtime"."messages_2025_12_02" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));



CREATE INDEX "messages_2025_12_03_inserted_at_topic_idx" ON "realtime"."messages_2025_12_03" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));



CREATE INDEX "messages_2025_12_04_inserted_at_topic_idx" ON "realtime"."messages_2025_12_04" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));



CREATE INDEX "messages_2025_12_05_inserted_at_topic_idx" ON "realtime"."messages_2025_12_05" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));



CREATE INDEX "messages_2025_12_06_inserted_at_topic_idx" ON "realtime"."messages_2025_12_06" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));



CREATE INDEX "messages_2025_12_07_inserted_at_topic_idx" ON "realtime"."messages_2025_12_07" USING "btree" ("inserted_at" DESC, "topic") WHERE (("extension" = 'broadcast'::"text") AND ("private" IS TRUE));



CREATE UNIQUE INDEX "subscription_subscription_id_entity_filters_key" ON "realtime"."subscription" USING "btree" ("subscription_id", "entity", "filters");



CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");



CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");



CREATE UNIQUE INDEX "buckets_analytics_unique_name_idx" ON "storage"."buckets_analytics" USING "btree" ("name") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");



CREATE UNIQUE INDEX "idx_name_bucket_level_unique" ON "storage"."objects" USING "btree" ("name" COLLATE "C", "bucket_id", "level");



CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");



CREATE INDEX "idx_objects_lower_name" ON "storage"."objects" USING "btree" (("path_tokens"["level"]), "lower"("name") "text_pattern_ops", "bucket_id", "level");



CREATE INDEX "idx_prefixes_lower_name" ON "storage"."prefixes" USING "btree" ("bucket_id", "level", (("string_to_array"("name", '/'::"text"))["level"]), "lower"("name") "text_pattern_ops");



CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");



CREATE UNIQUE INDEX "objects_bucket_id_level_idx" ON "storage"."objects" USING "btree" ("bucket_id", "level", "name" COLLATE "C");



CREATE UNIQUE INDEX "vector_indexes_name_bucket_id_idx" ON "storage"."vector_indexes" USING "btree" ("name", "bucket_id");



ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2025_12_01_inserted_at_topic_idx";



ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_12_01_pkey";



ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2025_12_02_inserted_at_topic_idx";



ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_12_02_pkey";



ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2025_12_03_inserted_at_topic_idx";



ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_12_03_pkey";



ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2025_12_04_inserted_at_topic_idx";



ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_12_04_pkey";



ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2025_12_05_inserted_at_topic_idx";



ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_12_05_pkey";



ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2025_12_06_inserted_at_topic_idx";



ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_12_06_pkey";



ALTER INDEX "realtime"."messages_inserted_at_topic_index" ATTACH PARTITION "realtime"."messages_2025_12_07_inserted_at_topic_idx";



ALTER INDEX "realtime"."messages_pkey" ATTACH PARTITION "realtime"."messages_2025_12_07_pkey";



CREATE OR REPLACE VIEW "public"."event_stats" AS
 SELECT "e"."id" AS "event_id",
    "e"."title",
    "e"."start_date",
    "e"."end_date",
    "e"."location",
    "e"."is_virtual",
    "e"."category",
    "e"."is_featured",
    "e"."is_published",
    "e"."max_attendees",
    "e"."organizer_id",
    "e"."organizer_name",
    "count"("ea".*) FILTER (WHERE ("ea"."attendance_status" = ANY (ARRAY['registered'::"text", 'confirmed'::"text"]))) AS "attendee_count",
    GREATEST((0)::bigint, (COALESCE("e"."max_attendees", 0) - "count"("ea".*) FILTER (WHERE ("ea"."attendance_status" = ANY (ARRAY['registered'::"text", 'confirmed'::"text"]))))) AS "spots_remaining"
   FROM ("public"."events" "e"
     LEFT JOIN "public"."event_attendees" "ea" ON (("ea"."event_id" = "e"."id")))
  GROUP BY "e"."id";



CREATE OR REPLACE VIEW "public"."profile_social_links" AS
 SELECT "p"."id",
    "jsonb_build_object"('linkedin', COALESCE("max"("s"."url") FILTER (WHERE ("s"."type" = 'linkedin'::"public"."social_type")), NULLIF("p"."linkedin_url", ''::"text")), 'github', COALESCE("max"("s"."url") FILTER (WHERE ("s"."type" = 'github'::"public"."social_type")), NULLIF("p"."github_url", ''::"text")), 'x', COALESCE("max"("s"."url") FILTER (WHERE ("s"."type" = 'x'::"public"."social_type")), NULLIF("p"."twitter_url", ''::"text")), 'website', COALESCE("max"("s"."url") FILTER (WHERE ("s"."type" = 'website'::"public"."social_type")), NULLIF("p"."website_url", ''::"text")), 'instagram', "max"("s"."url") FILTER (WHERE ("s"."type" = 'instagram'::"public"."social_type")), 'facebook', "max"("s"."url") FILTER (WHERE ("s"."type" = 'facebook'::"public"."social_type"))) AS "social_links"
   FROM ("public"."profiles" "p"
     LEFT JOIN "public"."social_links" "s" ON (("s"."profile_id" = "p"."id")))
  GROUP BY "p"."id";



CREATE OR REPLACE TRIGGER "connections_ensure_thread_for_connection" AFTER INSERT OR UPDATE OF "status" ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_thread_for_connection"();



CREATE OR REPLACE TRIGGER "enforce_bookmark_limit" BEFORE INSERT ON "public"."job_bookmarks" FOR EACH ROW EXECUTE FUNCTION "public"."check_bookmark_limit"();



CREATE OR REPLACE TRIGGER "enforce_bookmarked_jobs_limit" BEFORE INSERT ON "public"."bookmarked_jobs_legacy_do_not_use" FOR EACH ROW EXECUTE FUNCTION "public"."check_bookmarked_jobs_limit"();



CREATE OR REPLACE TRIGGER "event_attendee_invite_or_rsvp_ins_trg" AFTER INSERT ON "public"."event_attendees" FOR EACH ROW EXECUTE FUNCTION "public"."trg_event_attendee_invite_or_rsvp_notify"();



CREATE OR REPLACE TRIGGER "event_attendee_invite_or_rsvp_upd_trg" AFTER UPDATE ON "public"."event_attendees" FOR EACH ROW EXECUTE FUNCTION "public"."trg_event_attendee_invite_or_rsvp_notify"();



CREATE OR REPLACE TRIGGER "event_update_notify" AFTER INSERT OR DELETE OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."event_changes_broadcast"();



CREATE OR REPLACE TRIGGER "events_update_broadcast_trg" AFTER UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."trg_events_update_broadcast"();



CREATE OR REPLACE TRIGGER "handle_event_attendees_updated_at" BEFORE UPDATE ON "public"."event_attendees" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at_connections" BEFORE UPDATE ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

ALTER TABLE "public"."connections" DISABLE TRIGGER "handle_updated_at_connections";



CREATE OR REPLACE TRIGGER "handle_updated_at_events" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_jobs" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_mentorship_requests" BEFORE UPDATE ON "public"."mentorship_requests" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at_profiles" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "ja_fill_resume_path" BEFORE INSERT OR UPDATE ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."_ja_fill_resume_path"();



CREATE OR REPLACE TRIGGER "job_applications_block_quick_link" BEFORE INSERT ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."block_applications_for_quick_link"();



CREATE OR REPLACE TRIGGER "job_applications_fill_resume_path" BEFORE INSERT ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."_ja_fill_resume_path"();



CREATE OR REPLACE TRIGGER "limit_bookmarks" BEFORE INSERT ON "public"."job_bookmarks" FOR EACH ROW EXECUTE FUNCTION "public"."check_bookmark_limit"();



CREATE OR REPLACE TRIGGER "mentorship_chat_trigger" AFTER INSERT ON "public"."mentorship_relationships" FOR EACH ROW EXECUTE FUNCTION "public"."auto_conversation_on_match"();



CREATE OR REPLACE TRIGGER "mentorship_on_profile_deactivated" AFTER UPDATE OF "is_deleted", "approval_status" ON "public"."profiles" FOR EACH ROW WHEN ((("old"."is_deleted" IS DISTINCT FROM "new"."is_deleted") OR ("old"."approval_status" IS DISTINCT FROM "new"."approval_status"))) EXECUTE FUNCTION "public"."mentorship_on_profile_deactivated"();



CREATE OR REPLACE TRIGGER "mentorship_relationships_ensure_dm_thread" BEFORE INSERT OR UPDATE OF "mentor_id", "mentee_id" ON "public"."mentorship_relationships" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_dm_thread_for_mentorship"();



CREATE OR REPLACE TRIGGER "on_group_posts_update" BEFORE UPDATE ON "public"."group_posts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_groups_update" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_mentee_profiles_updated" BEFORE UPDATE ON "public"."mentee_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_new_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_updated_at"();



CREATE OR REPLACE TRIGGER "on_new_message_update_conversation_timestamp" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_last_message_at"();



CREATE OR REPLACE TRIGGER "profiles_avatar_update_timestamp" BEFORE UPDATE OF "avatar_url" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_timestamp_on_avatar_change"();



CREATE OR REPLACE TRIGGER "profiles_role_sanitizer" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sanitize_profile_role"();



CREATE OR REPLACE TRIGGER "protect_mentors_admin_columns_trg" BEFORE UPDATE ON "public"."mentors" FOR EACH ROW EXECUTE FUNCTION "public"."protect_mentors_admin_columns"();



CREATE OR REPLACE TRIGGER "protect_profile_admin_columns_trg" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."protect_profile_admin_columns"();



CREATE OR REPLACE TRIGGER "set_connections_timestamps" BEFORE INSERT OR UPDATE ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."tg_connections_timestamps"();

ALTER TABLE "public"."connections" DISABLE TRIGGER "set_connections_timestamps";



CREATE OR REPLACE TRIGGER "set_connections_updated_at" BEFORE UPDATE ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

ALTER TABLE "public"."connections" DISABLE TRIGGER "set_connections_updated_at";



CREATE OR REPLACE TRIGGER "set_group_creator_as_admin" AFTER INSERT ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."set_group_creator_as_admin"();



CREATE OR REPLACE TRIGGER "set_mentees_updated_at" BEFORE UPDATE ON "public"."mentees" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_mentorship_programs_updated_at" BEFORE UPDATE ON "public"."mentorship_programs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_mentorship_sessions_updated_at" BEFORE UPDATE ON "public"."mentorship_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_sessions_updated_at" BEFORE UPDATE ON "public"."mentorship_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "set_user_id_on_group_members" BEFORE INSERT ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."set_group_member_user_id"();



CREATE OR REPLACE TRIGGER "trg_admin_notify_on_event_insert" AFTER INSERT ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."notify_admin_on_event_create"();



CREATE OR REPLACE TRIGGER "trg_auto_assign_batch_group_on_approval" AFTER UPDATE OF "approval_status" ON "public"."profiles" FOR EACH ROW WHEN ((("new"."approval_status" = 'approved'::"public"."profile_approval_status") AND ("old"."approval_status" IS DISTINCT FROM "new"."approval_status"))) EXECUTE FUNCTION "public"."auto_assign_batch_group_for_profile_trg"();



CREATE OR REPLACE TRIGGER "trg_block_direct_role_updates" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."block_direct_role_updates"();



CREATE OR REPLACE TRIGGER "trg_block_quick_link_apps" BEFORE INSERT ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."block_applications_for_quick_link"();



CREATE OR REPLACE TRIGGER "trg_bump_last_message" AFTER INSERT ON "public"."dm_messages" FOR EACH ROW EXECUTE FUNCTION "public"."bump_conversation_last_message"();



CREATE OR REPLACE TRIGGER "trg_companies_set_created_by" BEFORE INSERT ON "public"."companies" FOR EACH ROW EXECUTE FUNCTION "public"."companies_set_created_by"();



CREATE OR REPLACE TRIGGER "trg_connection_change" AFTER UPDATE ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."log_connection_change"();

ALTER TABLE "public"."connections" DISABLE TRIGGER "trg_connection_change";



CREATE OR REPLACE TRIGGER "trg_connections_fill_defaults" BEFORE INSERT ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."connections_fill_defaults"();



CREATE OR REPLACE TRIGGER "trg_connections_notify" AFTER INSERT ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."connections_notify"();



CREATE OR REPLACE TRIGGER "trg_connections_to_dm_thread" AFTER UPDATE ON "public"."connections" FOR EACH ROW WHEN ((("new"."status" = ANY (ARRAY['accepted'::"text", 'connected'::"text"])) AND ("old"."status" IS DISTINCT FROM "new"."status"))) EXECUTE FUNCTION "public"."ensure_thread_for_connection"();

ALTER TABLE "public"."connections" DISABLE TRIGGER "trg_connections_to_dm_thread";



CREATE OR REPLACE TRIGGER "trg_connections_to_thread" AFTER UPDATE ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_thread_for_connection"();

ALTER TABLE "public"."connections" DISABLE TRIGGER "trg_connections_to_thread";



CREATE OR REPLACE TRIGGER "trg_connections_updated_at" BEFORE UPDATE ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_create_relationship_on_accept" AFTER UPDATE OF "status" ON "public"."mentorship_requests" FOR EACH ROW WHEN ((("old"."status" = 'pending'::"public"."mentorship_request_status") AND ("new"."status" = 'accepted'::"public"."mentorship_request_status"))) EXECUTE FUNCTION "public"."create_relationship_on_accept"();



CREATE OR REPLACE TRIGGER "trg_departments_touch" BEFORE UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."_touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_dm_message_notify" AFTER INSERT ON "public"."dm_messages" FOR EACH ROW EXECUTE FUNCTION "public"."notify_dm_participants"();



CREATE OR REPLACE TRIGGER "trg_dm_threads_insert_participants" AFTER INSERT ON "public"."dm_threads" FOR EACH ROW EXECUTE FUNCTION "public"."dm_threads_insert_participants"();



CREATE CONSTRAINT TRIGGER "trg_enforce_at_least_one_admin" AFTER INSERT OR DELETE OR UPDATE ON "public"."group_members" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "public"."enforce_at_least_one_admin_deferred"();



CREATE OR REPLACE TRIGGER "trg_enforce_job_admin_columns_clean" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_job_admin_columns"();



CREATE OR REPLACE TRIGGER "trg_events_set_owner" BEFORE INSERT OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."events_set_owner"();



CREATE OR REPLACE TRIGGER "trg_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."tg_set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_feedback_after_end" BEFORE INSERT ON "public"."event_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_feedback_after_end"();



CREATE OR REPLACE TRIGGER "trg_group_comments_author_guard" BEFORE INSERT OR UPDATE ON "public"."group_comments" FOR EACH ROW EXECUTE FUNCTION "public"."set_comment_author_and_guard"();



CREATE OR REPLACE TRIGGER "trg_group_leave" AFTER DELETE ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."log_group_leave"();



CREATE OR REPLACE TRIGGER "trg_groups_guard_moderation" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."guard_groups_moderation_columns"();



CREATE OR REPLACE TRIGGER "trg_groups_set_created_by" BEFORE INSERT ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."trg_groups_set_created_by"();



CREATE OR REPLACE TRIGGER "trg_groups_set_name_norm" BEFORE INSERT OR UPDATE OF "name" ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."trg_groups_set_name_norm"();



CREATE OR REPLACE TRIGGER "trg_groups_stamp_approval" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."trg_groups_stamp_approval"();



CREATE OR REPLACE TRIGGER "trg_groups_sync_visibility" BEFORE INSERT OR UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."groups_sync_visibility"();



CREATE OR REPLACE TRIGGER "trg_handle_mentor_rejection" AFTER UPDATE OF "status" ON "public"."mentors" FOR EACH ROW WHEN ((("new"."status" = 'rejected'::"text") AND ("old"."status" IS DISTINCT FROM 'rejected'::"text"))) EXECUTE FUNCTION "public"."handle_mentor_rejection"();



CREATE OR REPLACE TRIGGER "trg_job_apps_updated_at" BEFORE UPDATE ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_jobs_before_insert" BEFORE INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."jobs_before_insert"();



CREATE OR REPLACE TRIGGER "trg_jobs_before_insert_company" BEFORE INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."jobs_before_insert_company"();



CREATE OR REPLACE TRIGGER "trg_jobs_defaults" BEFORE INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_jobs_defaults"();



CREATE OR REPLACE TRIGGER "trg_jobs_ins_company" BEFORE INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."set_company_on_job_insert"();



CREATE OR REPLACE TRIGGER "trg_jobs_normalize_external_targets" BEFORE INSERT OR UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."jobs_normalize_external_targets"();



CREATE OR REPLACE TRIGGER "trg_jobs_set_creator" BEFORE INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."jobs_set_creator"();



CREATE OR REPLACE TRIGGER "trg_jobs_set_logo_url" BEFORE INSERT OR UPDATE OF "company_id", "logo_url" ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."jobs_set_logo_url"();



CREATE OR REPLACE TRIGGER "trg_jobs_set_owner" BEFORE INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."jobs_set_owner"();



CREATE OR REPLACE TRIGGER "trg_jobs_set_salary_range" BEFORE INSERT OR UPDATE OF "salary_min", "salary_max" ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."jobs_set_salary_range"();



CREATE OR REPLACE TRIGGER "trg_jobs_sync_company_logo" BEFORE INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."sync_company_logo_from_profile"();



CREATE OR REPLACE TRIGGER "trg_jobs_sync_flags" BEFORE INSERT OR UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."jobs_sync_flags_from_status"();



CREATE OR REPLACE TRIGGER "trg_jobs_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_log_profile_approval_changes" AFTER UPDATE OF "approval_status", "is_active", "is_deleted", "show_in_directory" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."log_profile_approval_changes"();



CREATE OR REPLACE TRIGGER "trg_mentorship_on_mentor_status_change" AFTER UPDATE OF "status" ON "public"."mentors" FOR EACH ROW WHEN ((("old"."status" IS DISTINCT FROM "new"."status") AND ("new"."status" = 'rejected'::"text"))) EXECUTE FUNCTION "public"."mentorship_on_mentor_status_change"();



CREATE OR REPLACE TRIGGER "trg_mentorship_on_profile_deactivated" AFTER UPDATE OF "approval_status", "is_deleted" ON "public"."profiles" FOR EACH ROW WHEN (((("old"."approval_status" IS DISTINCT FROM "new"."approval_status") AND ("new"."approval_status" <> 'approved'::"public"."profile_approval_status")) OR (("old"."is_deleted" IS DISTINCT FROM "new"."is_deleted") AND ("new"."is_deleted" IS TRUE)))) EXECUTE FUNCTION "public"."mentorship_on_profile_deactivated"();



CREATE OR REPLACE TRIGGER "trg_no_early_feedback" BEFORE INSERT ON "public"."event_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_early_event_feedback"();



CREATE OR REPLACE TRIGGER "trg_normalize_social_link" BEFORE INSERT OR UPDATE ON "public"."social_links" FOR EACH ROW EXECUTE FUNCTION "public"."normalize_social_link"();



CREATE OR REPLACE TRIGGER "trg_notification_events_mentorship_fanout" AFTER INSERT ON "public"."notification_events" FOR EACH ROW WHEN (("new"."module" = 'mentorship'::"public"."notification_module")) EXECUTE FUNCTION "public"."trg_process_notification_event_mentorship"();



CREATE OR REPLACE TRIGGER "trg_notifications_ensure_recipient" BEFORE INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."notifications_ensure_recipient"();



CREATE OR REPLACE TRIGGER "trg_notifications_timestamps" BEFORE INSERT OR UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamps"();



CREATE OR REPLACE TRIGGER "trg_notify_admins_event" AFTER INSERT ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."notify_admins_on_event"();



CREATE OR REPLACE TRIGGER "trg_notify_admins_on_event" AFTER INSERT ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."notify_admins_on_event"();



CREATE OR REPLACE TRIGGER "trg_notify_admins_on_gpr" AFTER INSERT ON "public"."group_post_reports" FOR EACH ROW EXECUTE FUNCTION "public"."notify_admins_on_group_post_report"();



CREATE OR REPLACE TRIGGER "trg_notify_connection_accepted" AFTER UPDATE ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."create_connection_notification"();

ALTER TABLE "public"."connections" DISABLE TRIGGER "trg_notify_connection_accepted";



CREATE OR REPLACE TRIGGER "trg_notify_connection_approved" AFTER UPDATE ON "public"."connections" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."notify_connection_approved"();

ALTER TABLE "public"."connections" DISABLE TRIGGER "trg_notify_connection_approved";



CREATE OR REPLACE TRIGGER "trg_notify_connection_request" AFTER INSERT ON "public"."connections" FOR EACH ROW EXECUTE FUNCTION "public"."create_connection_notification"();

ALTER TABLE "public"."connections" DISABLE TRIGGER "trg_notify_connection_request";



CREATE OR REPLACE TRIGGER "trg_notify_event_rsvp" AFTER INSERT ON "public"."event_rsvps" FOR EACH ROW EXECUTE FUNCTION "public"."notify_event_rsvp"();



CREATE OR REPLACE TRIGGER "trg_notify_job_application" AFTER INSERT ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."notify_job_application"();



CREATE OR REPLACE TRIGGER "trg_notify_job_application_submitted" AFTER INSERT ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."notify_job_application_submitted"();



CREATE OR REPLACE TRIGGER "trg_notify_mentorship_request" AFTER INSERT ON "public"."mentorship_requests" FOR EACH ROW EXECUTE FUNCTION "public"."notify_mentorship_request"();



CREATE OR REPLACE TRIGGER "trg_notify_on_request_update" AFTER UPDATE OF "status" ON "public"."mentorship_requests" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."notify_on_request_update"();



CREATE OR REPLACE TRIGGER "trg_notify_request_status_change" AFTER UPDATE OF "status" ON "public"."mentorship_requests" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."notify_request_status_change"();



CREATE OR REPLACE TRIGGER "trg_notify_requests" AFTER UPDATE OF "status" ON "public"."mentors" FOR EACH ROW WHEN ((("new"."status" = 'rejected'::"text") AND ("old"."status" IS DISTINCT FROM 'rejected'::"text"))) EXECUTE FUNCTION "public"."notify_requests_on_rejection"();



CREATE OR REPLACE TRIGGER "trg_on_mentorship_request_status" AFTER UPDATE OF "status" ON "public"."mentorship_requests" FOR EACH ROW EXECUTE FUNCTION "public"."on_mentorship_request_status"();



CREATE OR REPLACE TRIGGER "trg_profile_approval_audit" AFTER UPDATE OF "approval_status" ON "public"."profiles" FOR EACH ROW WHEN (("old"."approval_status" IS DISTINCT FROM "new"."approval_status")) EXECUTE FUNCTION "public"."log_profile_approval_change"();



CREATE OR REPLACE TRIGGER "trg_profiles_after_insert_batch" AFTER INSERT ON "public"."profiles" FOR EACH ROW WHEN (("new"."is_approved" IS TRUE)) EXECUTE FUNCTION "public"."trg_attach_user_to_batch_group"();



CREATE OR REPLACE TRIGGER "trg_profiles_after_update_avatar" AFTER UPDATE OF "avatar_url" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."profiles_after_update_avatar"();



CREATE OR REPLACE TRIGGER "trg_profiles_after_update_batch" AFTER UPDATE OF "alumni_verification_status" ON "public"."profiles" FOR EACH ROW WHEN ((("new"."alumni_verification_status" = 'approved'::"text") AND ("old"."alumni_verification_status" IS DISTINCT FROM 'approved'::"text"))) EXECUTE FUNCTION "public"."trg_attach_user_to_batch_group"();



CREATE OR REPLACE TRIGGER "trg_profiles_after_update_batch_canonical" AFTER UPDATE OF "approval_status", "is_approved" ON "public"."profiles" FOR EACH ROW WHEN ((("new"."is_approved" IS TRUE) AND ("old"."is_approved" IS DISTINCT FROM true))) EXECUTE FUNCTION "public"."trg_attach_user_to_batch_group"();



CREATE OR REPLACE TRIGGER "trg_profiles_block_self_approval" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."profiles_prevent_self_approval_changes"();



CREATE OR REPLACE TRIGGER "trg_profiles_set_full_name" BEFORE INSERT OR UPDATE OF "first_name", "last_name", "full_name" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."profiles_set_full_name"();



CREATE OR REPLACE TRIGGER "trg_profiles_sync_is_approved" BEFORE INSERT OR UPDATE OF "approval_status" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_is_approved_from_status"();



CREATE OR REPLACE TRIGGER "trg_profiles_upper" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."profiles_normalize_names"();



CREATE OR REPLACE TRIGGER "trg_protect_jobs_admin_columns" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."protect_jobs_admin_columns"();



CREATE OR REPLACE TRIGGER "trg_sanitize_job_urls_ins" BEFORE INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."sanitize_job_urls"();



CREATE OR REPLACE TRIGGER "trg_sanitize_job_urls_upd" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."sanitize_job_urls"();



CREATE OR REPLACE TRIGGER "trg_set_company_logo_from_poster" AFTER INSERT ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."set_company_logo_from_poster"();



CREATE OR REPLACE TRIGGER "trg_set_job_owner" BEFORE INSERT ON "public"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_job_owner"();



CREATE OR REPLACE TRIGGER "trg_sync_company_logo" AFTER INSERT OR UPDATE OF "avatar_url" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_company_logo_from_avatar"();



CREATE OR REPLACE TRIGGER "trg_sync_event_is_approved" BEFORE INSERT OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."sync_event_is_approved"();



CREATE OR REPLACE TRIGGER "trg_sync_membership_to_members" AFTER INSERT OR UPDATE OF "status" ON "public"."group_memberships" FOR EACH ROW EXECUTE FUNCTION "public"."sync_membership_to_members"();



CREATE OR REPLACE TRIGGER "trg_sync_resume_profile_to_job_alert" AFTER INSERT OR UPDATE OF "job_alert_active", "job_alert_frequency", "job_alert_keywords", "preferred_locations" ON "public"."resume_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_resume_profile_to_job_alert"();



CREATE OR REPLACE TRIGGER "trg_touch_thread_after_message" AFTER INSERT ON "public"."dm_messages" FOR EACH ROW EXECUTE FUNCTION "public"."dm_threads_touch_after_message"();



CREATE OR REPLACE TRIGGER "trg_update_conversation_last_message" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_last_message"();



CREATE OR REPLACE TRIGGER "trg_user_activity_logs_sync" BEFORE INSERT OR UPDATE ON "public"."user_activity_logs" FOR EACH ROW EXECUTE FUNCTION "public"."user_activity_logs_sync"();



CREATE OR REPLACE TRIGGER "trg_validate_social_links" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_social_links"();



CREATE OR REPLACE TRIGGER "update_achievements_updated_at" BEFORE UPDATE ON "public"."achievements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_csv_import_history_updated_at" BEFORE UPDATE ON "public"."csv_import_history" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_event_attendees_updated_at" BEFORE UPDATE ON "public"."event_attendees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_full_name_trigger" BEFORE INSERT OR UPDATE OF "first_name", "last_name" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_full_name"();



CREATE OR REPLACE TRIGGER "update_job_alerts_updated_at" BEFORE UPDATE ON "public"."job_alerts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mentees_updated_at" BEFORE UPDATE ON "public"."mentees" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mentor_availability_updated_at" BEFORE UPDATE ON "public"."mentor_availability" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mentor_profiles_updated_at" BEFORE UPDATE ON "public"."mentor_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mentors_updated_at" BEFORE UPDATE ON "public"."mentors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mentorship_appointments_updated_at" BEFORE UPDATE ON "public"."mentorship_appointments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mentorship_programs_updated_at" BEFORE UPDATE ON "public"."mentorship_programs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_mentorship_relationships_updated_at" BEFORE UPDATE ON "public"."mentorship_relationships" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_event_feedback" BEFORE INSERT ON "public"."event_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."check_event_completed"();



CREATE OR REPLACE TRIGGER "validate_profile_fields_trigger" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_profile_fields"();



CREATE OR REPLACE TRIGGER "tr_check_filters" BEFORE INSERT OR UPDATE ON "realtime"."subscription" FOR EACH ROW EXECUTE FUNCTION "realtime"."subscription_check_filters"();



CREATE OR REPLACE TRIGGER "enforce_bucket_name_length_trigger" BEFORE INSERT OR UPDATE OF "name" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."enforce_bucket_name_length"();



CREATE OR REPLACE TRIGGER "objects_delete_delete_prefix" AFTER DELETE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();



CREATE OR REPLACE TRIGGER "objects_insert_create_prefix" BEFORE INSERT ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."objects_insert_prefix_trigger"();



CREATE OR REPLACE TRIGGER "objects_update_create_prefix" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW WHEN ((("new"."name" <> "old"."name") OR ("new"."bucket_id" <> "old"."bucket_id"))) EXECUTE FUNCTION "storage"."objects_update_prefix_trigger"();



CREATE OR REPLACE TRIGGER "prefixes_create_hierarchy" BEFORE INSERT ON "storage"."prefixes" FOR EACH ROW WHEN (("pg_trigger_depth"() < 1)) EXECUTE FUNCTION "storage"."prefixes_insert_trigger"();



CREATE OR REPLACE TRIGGER "prefixes_delete_hierarchy" AFTER DELETE ON "storage"."prefixes" FOR EACH ROW EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();



CREATE OR REPLACE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admin_actions"
    ADD CONSTRAINT "admin_actions_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_actions"
    ADD CONSTRAINT "admin_actions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_analytics_audit_log"
    ADD CONSTRAINT "admin_analytics_audit_log_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_analytics_audit_log"
    ADD CONSTRAINT "admin_analytics_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."avatar_upload_log"
    ADD CONSTRAINT "avatar_upload_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookmarked_jobs_legacy_do_not_use"
    ADD CONSTRAINT "bookmarked_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookmarked_jobs_legacy_do_not_use"
    ADD CONSTRAINT "bookmarked_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clarification_requests"
    ADD CONSTRAINT "clarification_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_approvals"
    ADD CONSTRAINT "content_approvals_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_approvals"
    ADD CONSTRAINT "content_approvals_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_moderation"
    ADD CONSTRAINT "content_moderation_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."conversation_members"
    ADD CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_members"
    ADD CONSTRAINT "conversation_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_mentorship_relationship_id_fkey" FOREIGN KEY ("mentorship_relationship_id") REFERENCES "public"."mentorship_relationships"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_participant_1_fkey" FOREIGN KEY ("participant_1") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_participant_2_fkey" FOREIGN KEY ("participant_2") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."csv_import_history"
    ADD CONSTRAINT "csv_import_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_degree_code_fkey" FOREIGN KEY ("degree_code") REFERENCES "public"."degrees"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dm_messages"
    ADD CONSTRAINT "dm_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dm_messages"
    ADD CONSTRAINT "dm_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."dm_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dm_participants"
    ADD CONSTRAINT "dm_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."dm_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dm_threads"
    ADD CONSTRAINT "dm_threads_user_a_fkey" FOREIGN KEY ("user_a") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dm_threads"
    ADD CONSTRAINT "dm_threads_user_b_fkey" FOREIGN KEY ("user_b") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."education_history"
    ADD CONSTRAINT "education_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."education_history"
    ADD CONSTRAINT "education_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_attendee_id_fkey" FOREIGN KEY ("attendee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_feedback"
    ADD CONSTRAINT "event_feedback_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_feedback"
    ADD CONSTRAINT "event_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_groups"
    ADD CONSTRAINT "event_groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."event_groups"
    ADD CONSTRAINT "event_groups_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "fk_connections_recipient" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "fk_connections_requester" FOREIGN KEY ("requester_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dm_messages"
    ADD CONSTRAINT "fk_dm_messages_thread" FOREIGN KEY ("thread_id") REFERENCES "public"."dm_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dm_participants"
    ADD CONSTRAINT "fk_dm_participants_thread" FOREIGN KEY ("thread_id") REFERENCES "public"."dm_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentorship_feedback"
    ADD CONSTRAINT "fk_feedback_request" FOREIGN KEY ("mentorship_request_id") REFERENCES "public"."mentorship_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "fk_jobs_company_id" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "fk_notification_event" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "fk_notification_recipient" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "fk_notification_sender" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "fk_profiles_degree_program" FOREIGN KEY ("degree_program") REFERENCES "public"."degree_programs"("code") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."mentorship_sessions"
    ADD CONSTRAINT "fk_sessions_request" FOREIGN KEY ("mentorship_request_id") REFERENCES "public"."mentorship_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_comments"
    ADD CONSTRAINT "group_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_comments"
    ADD CONSTRAINT "group_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."group_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_memberships"
    ADD CONSTRAINT "group_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_memberships"
    ADD CONSTRAINT "group_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_post_reports"
    ADD CONSTRAINT "group_post_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."group_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_post_reports"
    ADD CONSTRAINT "group_post_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_posts"
    ADD CONSTRAINT "group_posts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_posts"
    ADD CONSTRAINT "group_posts_parent_post_id_fkey" FOREIGN KEY ("parent_post_id") REFERENCES "public"."group_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_posts"
    ADD CONSTRAINT "group_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "groups_created_by_fkey" ON "public"."groups" IS 'Ensures that the creator of a group is a valid user profile.';



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."job_alerts"
    ADD CONSTRAINT "job_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_bookmarks"
    ADD CONSTRAINT "job_bookmarks_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_bookmarks"
    ADD CONSTRAINT "job_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mentee_profiles"
    ADD CONSTRAINT "mentee_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentees"
    ADD CONSTRAINT "mentees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_availability"
    ADD CONSTRAINT "mentor_availability_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentor_profiles"
    ADD CONSTRAINT "mentor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentors"
    ADD CONSTRAINT "mentors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentorship_appointments"
    ADD CONSTRAINT "mentorship_appointments_availability_id_fkey" FOREIGN KEY ("availability_id") REFERENCES "public"."mentor_availability"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentorship_appointments"
    ADD CONSTRAINT "mentorship_appointments_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "public"."mentee_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mentorship_feedback"
    ADD CONSTRAINT "mentorship_feedback_mentorship_request_id_fkey" FOREIGN KEY ("mentorship_request_id") REFERENCES "public"."mentorship_requests"("id");



ALTER TABLE ONLY "public"."mentorship_feedback"
    ADD CONSTRAINT "mentorship_feedback_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."mentorship_messages"
    ADD CONSTRAINT "mentorship_messages_mentorship_request_id_fkey" FOREIGN KEY ("mentorship_request_id") REFERENCES "public"."mentorship_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentorship_messages"
    ADD CONSTRAINT "mentorship_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."mentorship_relationships"
    ADD CONSTRAINT "mentorship_relationships_dm_thread_id_fkey" FOREIGN KEY ("dm_thread_id") REFERENCES "public"."dm_threads"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mentorship_relationships"
    ADD CONSTRAINT "mentorship_relationships_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentorship_relationships"
    ADD CONSTRAINT "mentorship_relationships_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentorship_relationships"
    ADD CONSTRAINT "mentorship_relationships_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."mentorship_programs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mentorship_requests"
    ADD CONSTRAINT "mentorship_requests_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentorship_requests"
    ADD CONSTRAINT "mentorship_requests_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentorship_sessions"
    ADD CONSTRAINT "mentorship_sessions_mentorship_request_id_fkey" FOREIGN KEY ("mentorship_request_id") REFERENCES "public"."mentorship_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentorships"
    ADD CONSTRAINT "mentorships_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mentorships"
    ADD CONSTRAINT "mentorships_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."networking_group_members"
    ADD CONSTRAINT "networking_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."networking_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."networking_group_members"
    ADD CONSTRAINT "networking_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_events"
    ADD CONSTRAINT "notification_events_actor_profile_id_fkey" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_approval_audit"
    ADD CONSTRAINT "profile_approval_audit_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profile_approval_audit"
    ADD CONSTRAINT "profile_approval_audit_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profile_approval_audit"
    ADD CONSTRAINT "profile_approval_audit_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_approval_audit"
    ADD CONSTRAINT "profile_approval_audit_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_degree_code_fkey" FOREIGN KEY ("degree_code") REFERENCES "public"."degrees"("code");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_degree_fk" FOREIGN KEY ("degree_code") REFERENCES "public"."degrees"("code") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_department_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_verification_reviewed_by_fkey" FOREIGN KEY ("verification_reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."resume_profiles"
    ADD CONSTRAINT "resume_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."social_links"
    ADD CONSTRAINT "social_links_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_alerts"
    ADD CONSTRAINT "system_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_activity_logs"
    ADD CONSTRAINT "user_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_resumes"
    ADD CONSTRAINT "user_resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."prefixes"
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets_vectors"("id");



CREATE POLICY "Admin can insert analytics logs" ON "public"."admin_analytics_audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "Admin can view own analytics logs" ON "public"."admin_analytics_audit_log" FOR SELECT TO "authenticated" USING ((("admin_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"public"."app_role_enum", 'super_admin'::"public"."app_role_enum"])) AND (COALESCE("p"."is_deleted", false) = false))))));



CREATE POLICY "Admins can delete any feedback" ON "public"."event_feedback" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admins can insert admin actions" ON "public"."admin_actions" FOR INSERT WITH CHECK ("public"."is_site_admin"());



CREATE POLICY "Admins can manage all content submissions" ON "public"."content_approvals" USING (("public"."get_my_role"() = 'admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admins can manage all resources" ON "public"."resources" USING (("public"."get_my_role"() = 'admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admins can manage content moderation" ON "public"."content_moderation" USING ("public"."is_site_admin"());



CREATE POLICY "Admins can manage event groups" ON "public"."event_groups" USING ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))));



CREATE POLICY "Admins can manage system alerts" ON "public"."system_alerts" USING ("public"."is_site_admin"());



CREATE POLICY "Admins can manage user roles" ON "public"."user_roles" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_roles" "ur"
     JOIN "public"."roles" "r" ON (("ur"."role_id" = "r"."id")))
  WHERE (("ur"."profile_id" = "auth"."uid"()) AND ("r"."name" = 'admin'::"text")))));



CREATE POLICY "Admins can view all admin actions" ON "public"."admin_actions" FOR SELECT USING ("public"."is_site_admin"());



CREATE POLICY "Admins can view all event feedback" ON "public"."event_feedback" FOR SELECT USING ("public"."is_site_admin"());



CREATE POLICY "Admins can view logs" ON "public"."activity_logs" FOR SELECT USING ("public"."is_site_admin"());



CREATE POLICY "Admins can view profile approval audit" ON "public"."profile_approval_audit" FOR SELECT USING ("public"."app_is_admin"());



CREATE POLICY "Admins manage features" ON "public"."feature_flags" TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))) WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "Allow authenticated users to view RSVPs" ON "public"."event_rsvps" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow insert for all users" ON "public"."user_feedback" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow select for developer only" ON "public"."user_feedback" FOR SELECT USING (("auth"."uid"() = '5371e2d5-0697-46c0-bf5b-aab2e4d88b58'::"uuid"));



CREATE POLICY "Allow users and admins to view mentee profiles" ON "public"."mentee_profiles" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))));



CREATE POLICY "Allow users to create their own mentee profile" ON "public"."mentee_profiles" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to update their own mentee profile" ON "public"."mentee_profiles" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Anyone can view achievements" ON "public"."achievements" FOR SELECT USING (true);



CREATE POLICY "Anyone can view active mentorship programs" ON "public"."mentorship_programs" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view mentor availability" ON "public"."mentor_availability" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."mentors"
  WHERE (("mentors"."id" = "mentor_availability"."mentor_id") AND (("mentors"."status" = 'approved'::"text") OR ("mentors"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Creators can view their own content submissions" ON "public"."content_approvals" FOR SELECT USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."job_alerts" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."job_alerts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable select for users based on user_id" ON "public"."job_alerts" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable update for users based on user_id" ON "public"."job_alerts" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Import history visible to creator" ON "public"."csv_import_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Mentees can create appointments" ON "public"."mentorship_appointments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."mentees"
  WHERE (("mentees"."id" = "mentorship_appointments"."mentee_id") AND ("mentees"."user_id" = "auth"."uid"())))));



CREATE POLICY "Mentors can manage their own availability" ON "public"."mentor_availability" USING ((EXISTS ( SELECT 1
   FROM "public"."mentors"
  WHERE (("mentors"."id" = "mentor_availability"."mentor_id") AND ("mentors"."user_id" = "auth"."uid"())))));



CREATE POLICY "Organizers can view event feedback" ON "public"."event_feedback" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "event_feedback"."event_id") AND ("events"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "Public can view approved resources" ON "public"."resources" FOR SELECT USING (("is_approved" = true));



CREATE POLICY "Public can view published events" ON "public"."events" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Roles are viewable by everyone" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "User can insert import history" ON "public"."csv_import_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "User can see their own approval audit" ON "public"."profile_approval_audit" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can accept/reject connection requests" ON "public"."connections" FOR UPDATE USING (("auth"."uid"() = "recipient_id")) WITH CHECK (("status" <> 'pending'::"text"));



CREATE POLICY "Users can create bookmarks" ON "public"."job_bookmarks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create resources" ON "public"."resources" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create their own feedback" ON "public"."event_feedback" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own resume profile" ON "public"."resume_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own resumes" ON "public"."resume_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own social links" ON "public"."social_links" FOR DELETE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their connection requests" ON "public"."connections" FOR DELETE USING ((("auth"."uid"() = "requester_id") OR ("auth"."uid"() = "recipient_id")));



CREATE POLICY "Users can delete their own bookmarks" ON "public"."job_bookmarks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own resume profile" ON "public"."resume_profiles" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own resumes" ON "public"."user_resumes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own social links" ON "public"."social_links" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own participation" ON "public"."conversation_participants" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own resumes" ON "public"."user_resumes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own RSVPs" ON "public"."event_rsvps" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own appointments" ON "public"."mentorship_appointments" USING ((EXISTS ( SELECT 1
   FROM "public"."mentee_profiles"
  WHERE (("mentee_profiles"."id" = "mentorship_appointments"."mentee_id") AND ("mentee_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own bookmarks" ON "public"."job_bookmarks" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own event feedback" ON "public"."event_feedback" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own job bookmarks" ON "public"."job_bookmarks" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read event groups" ON "public"."event_groups" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can see conversations they are members of" ON "public"."conversations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_members" "cm"
  WHERE (("cm"."conversation_id" = "conversations"."id") AND ("cm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can see membership rows they belong to" ON "public"."conversation_members" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can submit feedback" ON "public"."event_feedback" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update connection requests they received" ON "public"."connections" FOR UPDATE USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can update if participant" ON "public"."connections" FOR UPDATE USING ((("auth"."uid"() = "requester_id") OR ("auth"."uid"() = "recipient_id"))) WITH CHECK ((("auth"."uid"() = "requester_id") OR ("auth"."uid"() = "recipient_id")));



CREATE POLICY "Users can update own social links" ON "public"."social_links" FOR UPDATE USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own achievements" ON "public"."achievements" USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can update their own feedback" ON "public"."event_feedback" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own resume profile" ON "public"."resume_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own resumes" ON "public"."resume_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own resumes" ON "public"."user_resumes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view all feedback" ON "public"."event_feedback" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view own social links" ON "public"."social_links" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view their RSVP rows" ON "public"."event_attendees" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their connections" ON "public"."connections" FOR SELECT USING ((("auth"."uid"() = "requester_id") OR ("auth"."uid"() = "recipient_id")));



CREATE POLICY "Users can view their memberships" ON "public"."group_members" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own appointments" ON "public"."mentorship_appointments" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."mentees"
  WHERE (("mentees"."id" = "mentorship_appointments"."mentee_id") AND ("mentees"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."mentor_availability" "ma"
     JOIN "public"."mentors" "m" ON (("ma"."mentor_id" = "m"."id")))
  WHERE (("ma"."id" = "mentorship_appointments"."availability_id") AND ("m"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view their own bookmarks" ON "public"."job_bookmarks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own connections" ON "public"."connections" FOR SELECT USING ((("auth"."uid"() = "requester_id") OR ("auth"."uid"() = "recipient_id")));



CREATE POLICY "Users can view their own feedback" ON "public"."event_feedback" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own resumes" ON "public"."user_resumes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users manage their own bookmarks" ON "public"."job_bookmarks" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "achv_public_read" ON "public"."achievements" FOR SELECT USING (true);



CREATE POLICY "achv_self_all" ON "public"."achievements" TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_log_insert_policy" ON "public"."activity_log" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "activity_log_select_policy" ON "public"."activity_log" FOR SELECT USING ("public"."is_site_admin"());



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_analytics_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_deletion_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_notifications_insert_auth" ON "public"."admin_notifications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "admin_notifications_select_admins" ON "public"."admin_notifications" FOR SELECT TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "admin_notifications_update_admins" ON "public"."admin_notifications" FOR UPDATE TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))) WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "admin_select_all_jobs" ON "public"."jobs" FOR SELECT TO "authenticated" USING ("public"."fc_is_admin"());



CREATE POLICY "admins_read_deletion_logs" ON "public"."admin_deletion_audit_log" FOR SELECT TO "authenticated" USING ("public"."app_is_admin"());



CREATE POLICY "attendees_insert_self" ON "public"."event_attendees" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND ("public"."fc_is_fully_approved"("auth"."uid"()) OR "public"."fc_is_admin"())));



CREATE POLICY "attendees_update_self" ON "public"."event_attendees" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND ("public"."fc_is_fully_approved"("auth"."uid"()) OR "public"."fc_is_admin"()))) WITH CHECK ((("user_id" = "auth"."uid"()) AND ("public"."fc_is_fully_approved"("auth"."uid"()) OR "public"."fc_is_admin"())));



CREATE POLICY "bookmarked_jobs_legacy_delete" ON "public"."bookmarked_jobs_legacy_do_not_use" FOR DELETE USING (false);



ALTER TABLE "public"."bookmarked_jobs_legacy_do_not_use" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bookmarked_jobs_legacy_insert" ON "public"."bookmarked_jobs_legacy_do_not_use" FOR INSERT WITH CHECK (false);



CREATE POLICY "bookmarked_jobs_legacy_select" ON "public"."bookmarked_jobs_legacy_do_not_use" FOR SELECT USING (("public"."fc_is_admin"() OR (("auth"."uid"() IS NOT NULL) AND "public"."is_super_admin"("auth"."uid"()))));



CREATE POLICY "bookmarked_jobs_legacy_update" ON "public"."bookmarked_jobs_legacy_do_not_use" FOR UPDATE USING (false) WITH CHECK (false);



CREATE POLICY "conn_delete_either" ON "public"."connections" FOR DELETE TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "conn_read_both" ON "public"."connections" FOR SELECT TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "conn_select_either_party" ON "public"."connections" FOR SELECT USING ((("requester_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "conn_update_recipient" ON "public"."connections" FOR UPDATE USING (("recipient_id" = "auth"."uid"())) WITH CHECK (("recipient_id" = "auth"."uid"()));



ALTER TABLE "public"."connections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "connections_delete_participants" ON "public"."connections" FOR DELETE TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "connections_insert_fully_approved" ON "public"."connections" FOR INSERT TO "authenticated" WITH CHECK ((("requester_id" = "auth"."uid"()) AND "public"."fc_is_fully_approved"("auth"."uid"())));



CREATE POLICY "connections_read_participants" ON "public"."connections" FOR SELECT TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "connections_requester_can_delete_pending" ON "public"."connections" FOR DELETE TO "authenticated" USING ((("requester_id" = "auth"."uid"()) AND ("status" = 'pending'::"text")));



CREATE POLICY "connections_select" ON "public"."connections" FOR SELECT TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "connections_select_involved" ON "public"."connections" FOR SELECT USING ((("auth"."uid"() = "requester_id") OR ("auth"."uid"() = "recipient_id")));



CREATE POLICY "connections_select_visible" ON "public"."connections" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "requester_id") OR ("auth"."uid"() = "recipient_id")));



CREATE POLICY "connections_update" ON "public"."connections" FOR UPDATE TO "authenticated" USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "connections_update_participants" ON "public"."connections" FOR UPDATE TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"()))) WITH CHECK ((("requester_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "connections_update_self_edge" ON "public"."connections" FOR UPDATE TO "authenticated" USING ((("requester_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"()))) WITH CHECK ((("requester_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



ALTER TABLE "public"."content_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_moderation" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conv_participants_delete" ON "public"."conversation_participants" FOR DELETE TO "authenticated" USING (("public"."is_conversation_participant"("conversation_id", "auth"."uid"()) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "conv_participants_insert" ON "public"."conversation_participants" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_conversation_participant"("conversation_id", "auth"."uid"()));



CREATE POLICY "conv_participants_select" ON "public"."conversation_participants" FOR SELECT TO "authenticated" USING ("public"."is_conversation_participant"("conversation_id", "auth"."uid"()));



CREATE POLICY "conv_participants_update" ON "public"."conversation_participants" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "conv_select_participant" ON "public"."conversations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "p"
  WHERE (("p"."conversation_id" = "conversations"."id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."conversation_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_participants_delete" ON "public"."conversations" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "conversations_participants_insert" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "conversations_participants_select" ON "public"."conversations" FOR SELECT TO "authenticated" USING ("public"."is_conversation_participant"("id", "auth"."uid"()));



CREATE POLICY "conversations_participants_update" ON "public"."conversations" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "conversations_select" ON "public"."conversations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "conversations"."id") AND ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "cp_select_self" ON "public"."conversation_participants" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."csv_import_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."degree_programs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "degree_programs_read" ON "public"."degree_programs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "delete_own_social_links" ON "public"."social_links" FOR DELETE USING (("profile_id" = "auth"."uid"()));



ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dev_event_attendees_select" ON "public"."event_attendees" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "dev_events_select" ON "public"."events" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."dm_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dm_messages_insert" ON "public"."dm_messages" FOR INSERT TO "authenticated" WITH CHECK (("public"."fc_is_fully_approved"("auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."dm_participants" "p"
     JOIN "public"."dm_threads" "t" ON (("t"."id" = "p"."thread_id")))
  WHERE (("p"."thread_id" = "dm_messages"."thread_id") AND ("p"."user_id" = "auth"."uid"()) AND "public"."are_connected"("auth"."uid"(),
        CASE
            WHEN ("t"."user_a" = "auth"."uid"()) THEN "t"."user_b"
            ELSE "t"."user_a"
        END))))));



CREATE POLICY "dm_messages_select" ON "public"."dm_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."dm_participants" "p"
  WHERE (("p"."thread_id" = "dm_messages"."thread_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."dm_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dm_participants_select" ON "public"."dm_participants" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."dm_threads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dm_threads_insert_participants_or_admin" ON "public"."dm_threads" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("auth"."uid"() = "user_a") OR ("auth"."uid"() = "user_b") OR "public"."_is_admin"("auth"."uid"()))));



CREATE POLICY "dm_threads_participants_rw" ON "public"."dm_threads" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."dm_participants" "p"
  WHERE (("p"."thread_id" = "dm_threads"."id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."dm_participants" "p"
  WHERE (("p"."thread_id" = "dm_threads"."id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "dm_threads_select" ON "public"."dm_threads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."dm_participants" "p"
  WHERE (("p"."thread_id" = "dm_threads"."id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."education_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ef_insert_own" ON "public"."event_feedback" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "ef_insert_self" ON "public"."event_feedback" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "ef_select_admin_all" ON "public"."event_feedback" FOR SELECT TO "authenticated" USING ("public"."is_admin_like"());



CREATE POLICY "ef_select_for_my_events" ON "public"."event_feedback" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "event_feedback"."event_id") AND ("e"."organizer_id" = "auth"."uid"())))));



CREATE POLICY "ef_select_own" ON "public"."event_feedback" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "ef_select_own_or_admin" ON "public"."event_feedback" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR COALESCE("public"."is_admin"("auth"."uid"()), false)));



CREATE POLICY "ef_update_own" ON "public"."event_feedback" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "ef_update_self" ON "public"."event_feedback" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."event_attendees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_attendees_insert_approved" ON "public"."event_attendees" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."fc_is_fully_approved"("auth"."uid"())));



CREATE POLICY "event_attendees_read" ON "public"."event_attendees" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "event_attendees"."event_id") AND ("e"."is_published" = true) AND ("e"."approval_status" = 'approved'::"public"."approval_status")))));



CREATE POLICY "event_attendees_select_own" ON "public"."event_attendees" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."event_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_rsvps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "events_admin_update" ON "public"."events" FOR UPDATE TO "authenticated" USING ("public"."is_admin_like"()) WITH CHECK ("public"."is_admin_like"());



CREATE POLICY "events_delete_owner_admin" ON "public"."events" FOR DELETE TO "authenticated" USING ((("organizer_id" = "auth"."uid"()) OR "public"."is_user_admin"("auth"."uid"())));



CREATE POLICY "events_insert_by_role" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_user_admin"("auth"."uid"()) OR ("public"."fc_is_fully_approved"("auth"."uid"()) AND ("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['employer'::"text", 'admin'::"text", 'super_admin'::"text"])))));



CREATE POLICY "events_insert_employer_admin" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_user_admin"("auth"."uid"()) OR ("public"."fc_is_fully_approved"("auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'employer'::"public"."app_role_enum")))))));



CREATE POLICY "events_read_all" ON "public"."events" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "events_select_anon" ON "public"."events" FOR SELECT TO "anon" USING ((COALESCE("is_public", false) = true));



CREATE POLICY "events_select_public" ON "public"."events" FOR SELECT TO "authenticated", "anon" USING ((("approval_status" = 'approved'::"public"."approval_status") AND COALESCE("is_public", true)));



CREATE POLICY "events_select_published" ON "public"."events" FOR SELECT USING (("is_published" = true));



CREATE POLICY "events_update_owner_admin" ON "public"."events" FOR UPDATE TO "authenticated" USING ((("organizer_id" = "auth"."uid"()) OR "public"."is_user_admin"("auth"."uid"()))) WITH CHECK ((("organizer_id" = "auth"."uid"()) OR "public"."is_user_admin"("auth"."uid"())));



CREATE POLICY "feedback_insert_mentor_or_mentee" ON "public"."mentorship_feedback" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."mentorship_requests" "r"
  WHERE (("r"."id" = "mentorship_feedback"."mentorship_request_id") AND (("r"."mentor_id" = "auth"."uid"()) OR ("r"."mentee_id" = "auth"."uid"()))))));



CREATE POLICY "feedback_insert_self" ON "public"."event_feedback" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "feedback_select_mentor_or_mentee" ON "public"."mentorship_feedback" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."mentorship_requests" "r"
  WHERE (("r"."id" = "mentorship_feedback"."mentorship_request_id") AND (("r"."mentor_id" = "auth"."uid"()) OR ("r"."mentee_id" = "auth"."uid"()))))));



CREATE POLICY "gc_delete_admin" ON "public"."group_comments" FOR DELETE TO "authenticated" USING (("public"."is_group_admin"(( SELECT "p"."group_id"
   FROM "public"."group_posts" "p"
  WHERE ("p"."id" = "group_comments"."post_id")), "auth"."uid"()) OR "public"."is_platform_admin"("auth"."uid"())));



CREATE POLICY "gc_delete_own" ON "public"."group_comments" FOR DELETE TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "gc_insert" ON "public"."group_comments" FOR INSERT TO "authenticated" WITH CHECK ("public"."can_comment_group"(( SELECT "p"."group_id"
   FROM "public"."group_posts" "p"
  WHERE ("p"."id" = "group_comments"."post_id")), "auth"."uid"()));



CREATE POLICY "gc_select" ON "public"."group_comments" FOR SELECT TO "authenticated" USING ("public"."can_view_group"(( SELECT "p"."group_id"
   FROM "public"."group_posts" "p"
  WHERE ("p"."id" = "group_comments"."post_id")), "auth"."uid"()));



CREATE POLICY "gc_update_admin" ON "public"."group_comments" FOR UPDATE TO "authenticated" USING (("public"."is_group_admin"(( SELECT "p"."group_id"
   FROM "public"."group_posts" "p"
  WHERE ("p"."id" = "group_comments"."post_id")), "auth"."uid"()) OR "public"."is_platform_admin"("auth"."uid"()))) WITH CHECK (true);



CREATE POLICY "gc_update_own" ON "public"."group_comments" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "gm_insert" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK ((("public"."app_role_of"("auth"."uid"()) <> 'employer'::"text") AND (NOT "public"."is_employer_user"("user_id"))));



CREATE POLICY "gm_insert_by_admin" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_group_admin"("group_id", "auth"."uid"()) AND (NOT "public"."is_employer"("user_id"))));



CREATE POLICY "gm_insert_creator" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."groups" "g"
  WHERE (("g"."id" = "group_members"."group_id") AND ("g"."created_by" = "auth"."uid"()))))));



CREATE POLICY "gm_select" ON "public"."group_members" FOR SELECT TO "authenticated" USING (("public"."app_role_of"("auth"."uid"()) <> 'employer'::"text"));



CREATE POLICY "gm_self_join_public" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."fc_is_fully_approved"("auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."groups" "g"
  WHERE (("g"."id" = "group_members"."group_id") AND ("g"."is_approved" IS TRUE) AND ("g"."is_archived" IS FALSE) AND ("g"."is_private" IS FALSE))))));



CREATE POLICY "gm_self_leave" ON "public"."group_members" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "gms_delete_self_or_admin" ON "public"."group_memberships" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_group_admin"("group_id", "auth"."uid"()) OR "public"."is_platform_admin"("auth"."uid"())));



CREATE POLICY "gms_insert_self" ON "public"."group_memberships" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (NOT "public"."is_employer"("auth"."uid"())) AND ("status" = 'pending'::"public"."membership_status_enum") AND (EXISTS ( SELECT 1
   FROM "public"."groups" "g"
  WHERE (("g"."id" = "group_memberships"."group_id") AND ("g"."is_archived" = false) AND ("g"."is_rejected" = false))))));



CREATE POLICY "gms_select_self_or_admin" ON "public"."group_memberships" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_group_admin"("group_id", "auth"."uid"()) OR "public"."is_platform_admin"("auth"."uid"())));



CREATE POLICY "gms_update_admin" ON "public"."group_memberships" FOR UPDATE TO "authenticated" USING (("public"."is_group_admin"("group_id", "auth"."uid"()) OR "public"."is_platform_admin"("auth"."uid"()))) WITH CHECK (true);



CREATE POLICY "gp_delete_admin" ON "public"."group_posts" FOR DELETE TO "authenticated" USING (("public"."is_group_admin"("group_id", "auth"."uid"()) OR "public"."is_platform_admin"("auth"."uid"())));



CREATE POLICY "gp_delete_own" ON "public"."group_posts" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "gp_insert" ON "public"."group_posts" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."fc_is_fully_approved"("auth"."uid"()) AND "public"."can_post_group"("group_id", "auth"."uid"())));



CREATE POLICY "gp_select" ON "public"."group_posts" FOR SELECT TO "authenticated" USING ("public"."can_read_group"("group_id", "auth"."uid"()));



CREATE POLICY "gp_update_admin" ON "public"."group_posts" FOR UPDATE TO "authenticated" USING (("public"."is_group_admin"("group_id", "auth"."uid"()) OR "public"."is_platform_admin"("auth"."uid"()))) WITH CHECK (true);



CREATE POLICY "gp_update_own" ON "public"."group_posts" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "gpr_insert" ON "public"."group_post_reports" FOR INSERT TO "authenticated" WITH CHECK (("reporter_id" = "auth"."uid"()));



CREATE POLICY "gpr_select_admin" ON "public"."group_post_reports" FOR SELECT TO "authenticated" USING ("public"."is_user_admin"("auth"."uid"()));



CREATE POLICY "gpr_select_self" ON "public"."group_post_reports" FOR SELECT TO "authenticated" USING (("reporter_id" = "auth"."uid"()));



CREATE POLICY "gpr_update_admin" ON "public"."group_post_reports" FOR UPDATE TO "authenticated" USING ("public"."is_user_admin"("auth"."uid"())) WITH CHECK ("public"."is_user_admin"("auth"."uid"()));



ALTER TABLE "public"."group_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "group_comments_delete_own" ON "public"."group_comments" FOR DELETE TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR "public"."is_admin_like"("auth"."uid"())));



CREATE POLICY "group_comments_insert" ON "public"."group_comments" FOR INSERT TO "authenticated" WITH CHECK (("public"."fc_is_fully_approved"("auth"."uid"()) AND ("public"."is_admin_like"("auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."group_posts" "p"
     JOIN "public"."group_members" "m" ON ((("m"."group_id" = "p"."group_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."status" = 'active'::"text"))))
  WHERE ("p"."id" = "group_comments"."post_id"))))));



CREATE POLICY "group_comments_select" ON "public"."group_comments" FOR SELECT TO "authenticated" USING (("public"."is_admin_like"("auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."group_posts" "p"
     JOIN "public"."group_members" "m" ON ((("m"."group_id" = "p"."group_id") AND ("m"."user_id" = "auth"."uid"()) AND ("m"."status" = 'active'::"text"))))
  WHERE ("p"."id" = "group_comments"."post_id")))));



CREATE POLICY "group_comments_update" ON "public"."group_comments" FOR UPDATE TO "authenticated" USING ((("author_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."group_posts" "gp"
     JOIN "public"."groups" "g" ON (("g"."id" = "gp"."group_id")))
  WHERE (("gp"."id" = "group_comments"."post_id") AND ("g"."is_archived" = false)))))) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "group_comments_update_own" ON "public"."group_comments" FOR UPDATE TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR "public"."is_admin_like"("auth"."uid"()))) WITH CHECK ((("author_id" = "auth"."uid"()) OR "public"."is_admin_like"("auth"."uid"())));



ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "group_members_admin_add" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK (("public"."_is_admin"("auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "group_members"."group_id") AND ("gm"."user_id" = "auth"."uid"()) AND ("gm"."role" = 'admin'::"text"))))));



CREATE POLICY "group_members_leave" ON "public"."group_members" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"public"."app_role_enum", 'super_admin'::"public"."app_role_enum"])))))));



CREATE POLICY "group_members_self_join_public" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."groups" "g"
  WHERE (("g"."id" = "group_members"."group_id") AND ("g"."visibility" = 'public'::"public"."group_visibility_enum") AND ("g"."is_approved" = true) AND ("g"."is_archived" = false))))));



ALTER TABLE "public"."group_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_post_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "groups_delete" ON "public"."groups" FOR DELETE TO "authenticated" USING (("public"."is_user_admin"("auth"."uid"()) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "groups_delete_admin_or_creator" ON "public"."groups" FOR DELETE TO "authenticated" USING (("public"."is_admin"("auth"."uid"()) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "groups_insert" ON "public"."groups" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_user_admin"("auth"."uid"()) OR ("public"."fc_is_fully_approved"("auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'alumni'::"public"."app_role_enum")))) AND ("created_by" = "auth"."uid"()) AND ("is_approved" = false))));



CREATE POLICY "groups_insert_no_employers" ON "public"."groups" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) <> 'employer'::"public"."app_role_enum"));



CREATE POLICY "groups_select_admin" ON "public"."groups" FOR SELECT TO "authenticated" USING ("public"."is_platform_admin"("auth"."uid"()));



CREATE POLICY "groups_select_archived" ON "public"."groups" FOR SELECT TO "authenticated" USING (("public"."_is_admin"("auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "groups"."id") AND ("gm"."user_id" = "auth"."uid"()) AND ("gm"."role" = 'admin'::"text")))) OR (("is_archived" = false) AND ("is_approved" = true))));



CREATE POLICY "groups_select_non_employer" ON "public"."groups" FOR SELECT TO "authenticated" USING (((NOT "public"."is_employer"("auth"."uid"())) AND ((("is_private" IS FALSE) AND (COALESCE("is_approved", true) = true) AND (COALESCE("is_archived", false) = false)) OR "public"."is_member_of_group"("id", "auth"."uid"()))));



CREATE POLICY "groups_update" ON "public"."groups" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR "public"."is_user_admin"("auth"."uid"()) OR "public"."is_group_manager"("id"))) WITH CHECK ((("created_by" = "auth"."uid"()) OR "public"."is_user_admin"("auth"."uid"()) OR "public"."is_group_manager"("id")));



CREATE POLICY "groups_update_admin" ON "public"."groups" FOR UPDATE TO "authenticated" USING ("public"."is_platform_admin"("auth"."uid"())) WITH CHECK (true);



CREATE POLICY "groups_update_owner" ON "public"."groups" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK ((("created_by" = "auth"."uid"()) AND ("is_approved" = false)));



CREATE POLICY "insert_own_social_links" ON "public"."social_links" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "ja_applicant_self_select" ON "public"."job_applications" FOR SELECT TO "authenticated" USING (("applicant_id" = "auth"."uid"()));



CREATE POLICY "ja_insert_applicant" ON "public"."job_applications" FOR INSERT TO "authenticated" WITH CHECK ((("applicant_id" = "auth"."uid"()) AND ("public"."fc_is_fully_approved"("auth"."uid"()) OR "public"."fc_is_admin"())));



CREATE POLICY "ja_owner_read" ON "public"."job_applications" FOR SELECT TO "authenticated" USING (((COALESCE(((NULLIF("current_setting"('request.jwt.claims'::"text", true), ''::"text"))::"jsonb" ->> 'role'::"text"), 'alumni'::"text") = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])) OR (EXISTS ( SELECT 1
   FROM "public"."jobs" "j"
  WHERE (("j"."id" = "job_applications"."job_id") AND (("j"."created_by" = "auth"."uid"()) OR ("j"."posted_by" = "auth"."uid"())))))));



CREATE POLICY "ja_select_applicant" ON "public"."job_applications" FOR SELECT TO "authenticated" USING (("applicant_id" = "auth"."uid"()));



CREATE POLICY "ja_select_company_owner" ON "public"."job_applications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."jobs" "j"
     JOIN "public"."companies" "c" ON (("c"."id" = "j"."company_id")))
  WHERE (("j"."id" = "job_applications"."job_id") AND ("c"."created_by" = "auth"."uid"())))));



CREATE POLICY "jb_delete" ON "public"."job_bookmarks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "jb_insert" ON "public"."job_bookmarks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "jb_select" ON "public"."job_bookmarks" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."job_alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "job_alerts_delete" ON "public"."job_alerts" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "job_alerts_delete_self_or_admin" ON "public"."job_alerts" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()));



CREATE POLICY "job_alerts_insert" ON "public"."job_alerts" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "job_alerts_insert_self_or_admin" ON "public"."job_alerts" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()));



CREATE POLICY "job_alerts_select" ON "public"."job_alerts" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "job_alerts_select_self_or_admin" ON "public"."job_alerts" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()));



CREATE POLICY "job_alerts_update" ON "public"."job_alerts" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "job_alerts_update_self_or_admin" ON "public"."job_alerts" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()));



ALTER TABLE "public"."job_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "job_applications_delete_self" ON "public"."job_applications" FOR DELETE USING (("applicant_id" = "auth"."uid"()));



CREATE POLICY "job_applications_insert_self" ON "public"."job_applications" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("applicant_id" = "auth"."uid"()) OR ("applicant_id" IS NULL)) AND "public"."fc_is_fully_approved"("auth"."uid"())));



CREATE POLICY "job_applications_select_job_owner" ON "public"."job_applications" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."jobs" "j"
  WHERE (("j"."id" = "job_applications"."job_id") AND ((("auth"."uid"() = "j"."created_by") OR ("auth"."uid"() = "j"."posted_by")) OR ("auth"."uid"() = "j"."user_id")))))));



CREATE POLICY "job_applications_select_self" ON "public"."job_applications" FOR SELECT USING (("applicant_id" = "auth"."uid"()));



CREATE POLICY "job_applications_update_self" ON "public"."job_applications" FOR UPDATE USING (("applicant_id" = "auth"."uid"())) WITH CHECK (("applicant_id" = "auth"."uid"()));



ALTER TABLE "public"."job_bookmarks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "job_bookmarks_delete_self_or_admin" ON "public"."job_bookmarks" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()));



CREATE POLICY "job_bookmarks_insert_self_or_admin" ON "public"."job_bookmarks" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()));



CREATE POLICY "job_bookmarks_owner_rw" ON "public"."job_bookmarks" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "job_bookmarks_select_self_or_admin" ON "public"."job_bookmarks" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()));



ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "jobs_delete_own" ON "public"."jobs" FOR DELETE TO "authenticated" USING (((("created_by" = "auth"."uid"()) AND "public"."fc_is_employer_approved"("auth"."uid"())) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"public"."app_role_enum", 'super_admin'::"public"."app_role_enum"])))))));



CREATE POLICY "jobs_insert_employer_or_admin" ON "public"."jobs" FOR INSERT TO "authenticated" WITH CHECK (("public"."fc_is_employer_approved"("auth"."uid"()) OR "public"."fc_is_admin"()));



CREATE POLICY "jobs_select_applied" ON "public"."jobs" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND "public"."fc_has_applied_to_job"("id", "auth"."uid"())));



CREATE POLICY "jobs_select_owner" ON "public"."jobs" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ((("auth"."uid"() = "posted_by") OR ("auth"."uid"() = "created_by")) OR ("auth"."uid"() = "user_id"))));



CREATE POLICY "jobs_select_public_open" ON "public"."jobs" FOR SELECT TO "authenticated" USING (((COALESCE("is_active", false) = true) AND (COALESCE("is_approved", false) = true) AND (COALESCE("is_rejected", false) = false) AND (("deadline" IS NULL) OR ("deadline" >= "now"())) AND (("expires_at" IS NULL) OR ("expires_at" >= "now"()))));



CREATE POLICY "jobs_update_owner_or_admin" ON "public"."jobs" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (((("auth"."uid"() = "posted_by") OR ("auth"."uid"() = "created_by")) OR ("auth"."uid"() = "user_id")) OR "public"."fc_is_admin"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (((("auth"."uid"() = "posted_by") OR ("auth"."uid"() = "created_by")) OR ("auth"."uid"() = "user_id")) OR "public"."fc_is_admin"())));



ALTER TABLE "public"."mentee_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mentees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentees_owner_or_admin" ON "public"."mentees" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_site_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_site_admin"()));



CREATE POLICY "mentees_read_only_authenticated" ON "public"."mentees" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."mentor_availability" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentor_availability_delete_policy" ON "public"."mentor_availability" FOR DELETE USING (("auth"."uid"() = "mentor_id"));



CREATE POLICY "mentor_availability_insert_policy" ON "public"."mentor_availability" FOR INSERT WITH CHECK (("auth"."uid"() = "mentor_id"));



CREATE POLICY "mentor_availability_read_owner_relationship_admin" ON "public"."mentor_availability" FOR SELECT TO "authenticated" USING ((("mentor_id" = "auth"."uid"()) OR "public"."is_site_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."mentorship_relationships" "r"
  WHERE (("r"."mentor_id" = "mentor_availability"."mentor_id") AND ("r"."status" = 'active'::"text") AND (("r"."mentor_id" = "auth"."uid"()) OR ("r"."mentee_id" = "auth"."uid"())))))));



CREATE POLICY "mentor_availability_select_mentee_policy" ON "public"."mentor_availability" FOR SELECT USING (true);



CREATE POLICY "mentor_availability_select_policy" ON "public"."mentor_availability" FOR SELECT USING (("auth"."uid"() = "mentor_id"));



CREATE POLICY "mentor_availability_update_policy" ON "public"."mentor_availability" FOR UPDATE USING (("auth"."uid"() = "mentor_id"));



CREATE POLICY "mentor_availability_write_owner_or_admin" ON "public"."mentor_availability" TO "authenticated" USING ((("mentor_id" = "auth"."uid"()) OR "public"."is_site_admin"())) WITH CHECK ((("mentor_id" = "auth"."uid"()) OR "public"."is_site_admin"()));



ALTER TABLE "public"."mentor_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentor_profiles_owner_or_admin" ON "public"."mentor_profiles" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_site_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_site_admin"()));



CREATE POLICY "mentor_profiles_read_only_authenticated" ON "public"."mentor_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "mentor_update_own_sessions_link" ON "public"."mentorship_sessions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."mentorship_requests" "r"
  WHERE (("r"."id" = "mentorship_sessions"."mentorship_request_id") AND (("r"."mentor_id" = "auth"."uid"()) OR "public"."is_user_admin"("auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."mentorship_requests" "r"
  WHERE (("r"."id" = "mentorship_sessions"."mentorship_request_id") AND (("r"."mentor_id" = "auth"."uid"()) OR "public"."is_user_admin"("auth"."uid"()))))));



ALTER TABLE "public"."mentors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentors_insert_self" ON "public"."mentors" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "mentors_internal_upsert" ON "public"."mentors" TO "postgres" USING (true) WITH CHECK (true);



CREATE POLICY "mentors_select_self_approved_or_admin" ON "public"."mentors" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_site_admin"() OR ("status" = 'approved'::"text")));



CREATE POLICY "mentors_update_self_or_admin" ON "public"."mentors" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_site_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_site_admin"()));



ALTER TABLE "public"."mentorship_appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentorship_appointments_delete_policy" ON "public"."mentorship_appointments" FOR DELETE USING (("auth"."uid"() = "mentee_id"));



CREATE POLICY "mentorship_appointments_insert_policy" ON "public"."mentorship_appointments" FOR INSERT WITH CHECK (("auth"."uid"() = "mentee_id"));



CREATE POLICY "mentorship_appointments_parties_or_admin" ON "public"."mentorship_appointments" TO "authenticated" USING ((("mentee_id" = "auth"."uid"()) OR "public"."is_site_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."mentorship_relationships" "r"
  WHERE (("r"."mentee_id" = "mentorship_appointments"."mentee_id") AND ("r"."status" = 'active'::"text") AND ("r"."mentor_id" = "auth"."uid"())))))) WITH CHECK ((("mentee_id" = "auth"."uid"()) OR "public"."is_site_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."mentorship_relationships" "r"
  WHERE (("r"."mentee_id" = "mentorship_appointments"."mentee_id") AND ("r"."status" = 'active'::"text") AND ("r"."mentor_id" = "auth"."uid"()))))));



CREATE POLICY "mentorship_appointments_select_policy" ON "public"."mentorship_appointments" FOR SELECT USING (("auth"."uid"() = "mentee_id"));



CREATE POLICY "mentorship_appointments_update_policy" ON "public"."mentorship_appointments" FOR UPDATE USING (("auth"."uid"() = "mentee_id"));



ALTER TABLE "public"."mentorship_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentorship_feedback_parties_or_admin" ON "public"."mentorship_feedback" TO "authenticated" USING (("public"."is_site_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."mentorship_requests" "req"
  WHERE (("req"."id" = "mentorship_feedback"."mentorship_request_id") AND (("req"."mentor_id" = "auth"."uid"()) OR ("req"."mentee_id" = "auth"."uid"()))))))) WITH CHECK (("public"."is_site_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."mentorship_requests" "req"
  WHERE (("req"."id" = "mentorship_feedback"."mentorship_request_id") AND (("req"."mentor_id" = "auth"."uid"()) OR ("req"."mentee_id" = "auth"."uid"())))))));



ALTER TABLE "public"."mentorship_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentorship_messages_select" ON "public"."mentorship_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."mentorship_requests" "r"
  WHERE (("r"."id" = "mentorship_messages"."mentorship_request_id") AND (("r"."mentor_id" = "auth"."uid"()) OR ("r"."mentee_id" = "auth"."uid"()))))));



ALTER TABLE "public"."mentorship_programs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentorship_programs_insert_mentor_or_admin" ON "public"."mentorship_programs" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['mentor'::"text", 'admin'::"text", 'super_admin'::"text"])));



ALTER TABLE "public"."mentorship_relationships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentorship_relationships_internal_update" ON "public"."mentorship_relationships" FOR UPDATE TO "postgres" USING (true) WITH CHECK (true);



CREATE POLICY "mentorship_relationships_parties_or_admin" ON "public"."mentorship_relationships" TO "authenticated" USING ((("mentor_id" = "auth"."uid"()) OR ("mentee_id" = "auth"."uid"()) OR "public"."is_site_admin"())) WITH CHECK ((("mentor_id" = "auth"."uid"()) OR ("mentee_id" = "auth"."uid"()) OR "public"."is_site_admin"()));



CREATE POLICY "mentorship_relationships_select_own" ON "public"."mentorship_relationships" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("auth"."uid"() = "mentee_id") OR ("auth"."uid"() = "mentor_id") OR "public"."is_user_admin"("auth"."uid"()))));



ALTER TABLE "public"."mentorship_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentorship_requests_insert_mentee" ON "public"."mentorship_requests" FOR INSERT TO "authenticated" WITH CHECK (("mentee_id" = "auth"."uid"()));



CREATE POLICY "mentorship_requests_internal_delete" ON "public"."mentorship_requests" FOR DELETE TO "postgres" USING (true);



CREATE POLICY "mentorship_requests_internal_insert" ON "public"."mentorship_requests" FOR INSERT TO "postgres" WITH CHECK (true);



CREATE POLICY "mentorship_requests_internal_update" ON "public"."mentorship_requests" FOR UPDATE TO "postgres" USING (true) WITH CHECK (true);



CREATE POLICY "mentorship_requests_select_own" ON "public"."mentorship_requests" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("auth"."uid"() = "mentee_id") OR ("auth"."uid"() = "mentor_id") OR "public"."is_user_admin"("auth"."uid"()))));



CREATE POLICY "mentorship_requests_select_parties_or_admin" ON "public"."mentorship_requests" FOR SELECT TO "authenticated" USING ((("mentor_id" = "auth"."uid"()) OR ("mentee_id" = "auth"."uid"()) OR "public"."is_site_admin"()));



CREATE POLICY "mentorship_requests_update_parties_or_admin" ON "public"."mentorship_requests" FOR UPDATE TO "authenticated" USING ((("mentor_id" = "auth"."uid"()) OR ("mentee_id" = "auth"."uid"()) OR "public"."is_site_admin"())) WITH CHECK ((("mentor_id" = "auth"."uid"()) OR ("mentee_id" = "auth"."uid"()) OR "public"."is_site_admin"()));



ALTER TABLE "public"."mentorship_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentorship_sessions_delete_policy" ON "public"."mentorship_sessions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."mentorship_requests" "r"
  WHERE (("r"."id" = "mentorship_sessions"."mentorship_request_id") AND (("r"."mentor_id" = "auth"."uid"()) OR "public"."is_user_admin"("auth"."uid"()))))));



CREATE POLICY "mentorship_sessions_parties_or_admin" ON "public"."mentorship_sessions" TO "authenticated" USING (("public"."is_site_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."mentorship_requests" "req"
  WHERE (("req"."id" = "mentorship_sessions"."mentorship_request_id") AND (("req"."mentor_id" = "auth"."uid"()) OR ("req"."mentee_id" = "auth"."uid"()))))))) WITH CHECK (("public"."is_site_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."mentorship_requests" "req"
  WHERE (("req"."id" = "mentorship_sessions"."mentorship_request_id") AND (("req"."mentor_id" = "auth"."uid"()) OR ("req"."mentee_id" = "auth"."uid"())))))));



ALTER TABLE "public"."mentorships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mentorships_read_only_authenticated" ON "public"."mentorships" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_insert" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "messages"."conversation_id") AND ("cp"."user_id" = "auth"."uid"()))))));



CREATE POLICY "messages_participants_delete" ON "public"."messages" FOR DELETE TO "authenticated" USING (("public"."is_conversation_participant"("conversation_id", "auth"."uid"()) AND ("sender_id" = "auth"."uid"())));



CREATE POLICY "messages_participants_insert" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_conversation_participant"("conversation_id", "auth"."uid"()) AND ("sender_id" = "auth"."uid"())));



CREATE POLICY "messages_participants_select" ON "public"."messages" FOR SELECT TO "authenticated" USING ("public"."is_conversation_participant"("conversation_id", "auth"."uid"()));



CREATE POLICY "messages_participants_update" ON "public"."messages" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "msg_insert_self" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "msg_read_participants" ON "public"."messages" FOR SELECT TO "authenticated" USING ((("sender_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "no_modify_deletion_logs" ON "public"."admin_deletion_audit_log" USING (false) WITH CHECK (false);



ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notification_prefs_delete_self_or_admin" ON "public"."notification_preferences" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"())));



CREATE POLICY "notification_prefs_insert_self_or_admin" ON "public"."notification_preferences" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"())));



CREATE POLICY "notification_prefs_select_self_or_admin" ON "public"."notification_preferences" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"())));



CREATE POLICY "notification_prefs_update_self_or_admin" ON "public"."notification_preferences" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"())));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete_admin_only" ON "public"."notifications" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("public"."fc_is_admin"() OR "public"."fc_is_super_admin"())));



CREATE POLICY "notifications_insert_for_self_or_admin" ON "public"."notifications" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("recipient_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"())));



CREATE POLICY "notifications_select_self_or_admin" ON "public"."notifications" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("recipient_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"())));



CREATE POLICY "notifications_update_self_or_admin" ON "public"."notifications" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("recipient_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("recipient_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"())));



ALTER TABLE "public"."profile_approval_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_me_or_admin" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((("id" = "auth"."uid"()) OR "public"."app_is_admin"()));



CREATE POLICY "profiles_insert_self" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_no_deleted_for_auth" ON "public"."profiles" AS RESTRICTIVE FOR SELECT TO "authenticated" USING (((COALESCE("is_deleted", false) = false) OR "public"."app_is_admin"()));



CREATE POLICY "profiles_select_admin_all" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."app_is_admin"());



CREATE POLICY "profiles_select_directory" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."app_is_admin"() OR ((COALESCE("show_in_directory", true) = true) AND (COALESCE("is_deleted", false) = false) AND (("is_approved" = true) OR ("approval_status" = 'approved'::"public"."profile_approval_status")))));



CREATE POLICY "profiles_select_event_feedback_for_my_events" ON "public"."profiles" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."event_feedback" "ef"
     JOIN "public"."events" "e" ON (("e"."id" = "ef"."event_id")))
  WHERE (("ef"."user_id" = "profiles"."id") AND ("e"."organizer_id" = "auth"."uid"())))) OR COALESCE("public"."is_admin"("auth"."uid"()), false)));



CREATE POLICY "profiles_select_for_mentors" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("approval_status" = 'approved'::"public"."profile_approval_status") AND (COALESCE("is_available_for_mentorship", false) = true)));



CREATE POLICY "profiles_select_me_or_admin" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."app_is_admin"()));



CREATE POLICY "profiles_select_self" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update_me_or_admin" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."_is_admin"("auth"."uid"()))) WITH CHECK ((("id" = "auth"."uid"()) OR "public"."_is_admin"("auth"."uid"())));



CREATE POLICY "profiles_update_self" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."programs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read departments" ON "public"."departments" FOR SELECT USING (true);



CREATE POLICY "read programs" ON "public"."programs" FOR SELECT USING (true);



CREATE POLICY "realtime: connections" ON "public"."connections" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "realtime: conversations" ON "public"."conversations" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "realtime: event_feedback" ON "public"."event_feedback" FOR SELECT USING (("public"."fc_is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "event_feedback"."event_id") AND ("e"."organizer_id" = "auth"."uid"()))))));



CREATE POLICY "realtime: participants" ON "public"."conversation_participants" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "realtime: rsvps" ON "public"."event_rsvps" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "recipient can update their own connections" ON "public"."connections" FOR UPDATE USING (("recipient_id" = "auth"."uid"()));



ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resume_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "resume_profiles_delete" ON "public"."resume_profiles" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR (("auth"."uid"() IS NOT NULL) AND "public"."is_super_admin"("auth"."uid"()))));



CREATE POLICY "resume_profiles_employers" ON "public"."resume_profiles" FOR SELECT TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['employer'::"text", 'admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "resume_profiles_insert" ON "public"."resume_profiles" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR (("auth"."uid"() IS NOT NULL) AND "public"."is_super_admin"("auth"."uid"()))));



CREATE POLICY "resume_profiles_select" ON "public"."resume_profiles" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR (("auth"."uid"() IS NOT NULL) AND "public"."is_super_admin"("auth"."uid"()))));



CREATE POLICY "resume_profiles_select_admin" ON "public"."resume_profiles" FOR SELECT TO "authenticated" USING ("public"."is_site_admin"());



CREATE POLICY "resume_profiles_select_owner" ON "public"."resume_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "resume_profiles_self" ON "public"."resume_profiles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "resume_profiles_update" ON "public"."resume_profiles" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR (("auth"."uid"() IS NOT NULL) AND "public"."is_super_admin"("auth"."uid"())))) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR (("auth"."uid"() IS NOT NULL) AND "public"."is_super_admin"("auth"."uid"()))));



ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_own_social_links" ON "public"."social_links" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "select_sessions_for_participants" ON "public"."mentorship_sessions" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."mentorship_requests" "r"
  WHERE (("r"."id" = "mentorship_sessions"."mentorship_request_id") AND (("r"."mentor_id" = "auth"."uid"()) OR ("r"."mentee_id" = "auth"."uid"()))))) OR ("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))));



ALTER TABLE "public"."social_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ual_insert_own" ON "public"."user_activity_logs" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "ual_select_admins" ON "public"."user_activity_logs" FOR SELECT TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])));



CREATE POLICY "update_end_relationship" ON "public"."mentorship_relationships" FOR UPDATE USING ((("status" = 'active'::"text") AND (("auth"."uid"() = "mentor_id") OR ("auth"."uid"() = "mentee_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = ANY (ARRAY['admin'::"public"."app_role_enum", 'super_admin'::"public"."app_role_enum"])))))))) WITH CHECK (("status" = ANY (ARRAY['completed'::"text", 'terminated'::"text"])));



CREATE POLICY "update_own_social_links" ON "public"."social_links" FOR UPDATE USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "update_profile_safe_fields" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK ((("id" = "auth"."uid"()) AND true));



ALTER TABLE "public"."user_activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_feedback_select_super_only" ON "public"."user_feedback" FOR SELECT USING ("public"."is_super_admin"());



CREATE POLICY "user_feedback_update_super_only" ON "public"."user_feedback" FOR UPDATE USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



ALTER TABLE "public"."user_resumes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_resumes_delete_self_or_admin" ON "public"."user_resumes" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()));



CREATE POLICY "user_resumes_insert_self_or_admin" ON "public"."user_resumes" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()));



CREATE POLICY "user_resumes_select_admin" ON "public"."user_resumes" FOR SELECT TO "authenticated" USING ("public"."is_site_admin"());



CREATE POLICY "user_resumes_select_self_or_admin" ON "public"."user_resumes" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()));



CREATE POLICY "user_resumes_update_self_or_admin" ON "public"."user_resumes" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."fc_is_admin"() OR "public"."fc_is_super_admin"()));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "write departments (admins)" ON "public"."departments" TO "authenticated" USING ("public"."is_user_admin"("auth"."uid"())) WITH CHECK ("public"."is_user_admin"("auth"."uid"()));



CREATE POLICY "write programs (admins)" ON "public"."programs" TO "authenticated" USING ("public"."is_user_admin"("auth"."uid"())) WITH CHECK ("public"."is_user_admin"("auth"."uid"()));



CREATE POLICY "Users can receive group notifications" ON "realtime"."messages" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."user_id" = "auth"."uid"()) AND (('group:'::"text" || ("gm"."group_id")::"text") = ( SELECT "realtime"."topic"() AS "topic"))))) AND ("extension" = 'broadcast'::"text")));



CREATE POLICY "Users can receive their own notifications" ON "realtime"."messages" FOR SELECT TO "authenticated" USING (((( SELECT "realtime"."topic"() AS "topic") = ('notifications:'::"text" || ("auth"."uid"())::"text")) AND ("extension" = 'broadcast'::"text")));



ALTER TABLE "realtime"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow authenticated to list" ON "storage"."buckets" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to upload company logos" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (("bucket_id" = 'company-logos'::"text"));



CREATE POLICY "Allow authenticated users to upload screenshots" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'feedback_screenshots'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Allow listing buckets" ON "storage"."buckets" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow post image uploads by authenticated users" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'post_images'::"text") AND ("lower"("right"("name", 4)) = ANY (ARRAY['.png'::"text", '.jpg'::"text", 'jpeg'::"text", '.gif'::"text"]))));



CREATE POLICY "Allow public access to company logos" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'company-logos'::"text"));



CREATE POLICY "Allow public read access to feedback screenshots" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'feedback_screenshots'::"text"));



CREATE POLICY "Allow public test insert" ON "storage"."objects" FOR INSERT WITH CHECK (("bucket_id" = 'post_images'::"text"));



CREATE POLICY "Allow public to view post images" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'post_images'::"text"));



CREATE POLICY "Anyone can upload resumes" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'resumes'::"text") AND ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Authenticated users can upload" ON "storage"."objects" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("bucket_id" = 'bucket-name'::"text")));



CREATE POLICY "Authenticated users can upload post images" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (("bucket_id" = 'post_images'::"text"));



CREATE POLICY "Event Images 1o4y39n_0" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'event-images'::"text"));



CREATE POLICY "Event Images 1o4y39n_1" ON "storage"."objects" FOR INSERT WITH CHECK (("bucket_id" = 'event-images'::"text"));



CREATE POLICY "Event Images 1o4y39n_2" ON "storage"."objects" FOR UPDATE USING (("bucket_id" = 'event-images'::"text"));



CREATE POLICY "Event Images 1o4y39n_3" ON "storage"."objects" FOR DELETE USING (("bucket_id" = 'event-images'::"text"));



CREATE POLICY "Group admins can upload group avatars" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'group_avatars'::"text") AND (("storage"."foldername"("name"))[1] IN ( SELECT ("groups"."id")::"text" AS "id"
   FROM "public"."groups"
  WHERE ("auth"."uid"() IN ( SELECT "group_members"."user_id"
           FROM "public"."group_members"
          WHERE (("group_members"."group_id" = "groups"."id") AND ("group_members"."role" = 'admin'::"text"))))))));



CREATE POLICY "Logo Uploads" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'company-logos'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "Message attachment access policy" ON "storage"."objects" USING (("bucket_id" = 'message_attachments'::"text")) WITH CHECK (("bucket_id" = 'message_attachments'::"text"));



CREATE POLICY "Only owners can delete cover letters" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'cover-letters'::"text") AND ("auth"."uid"() = "owner")));



CREATE POLICY "Only owners can delete resumes" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'resumes'::"text") AND ("auth"."uid"() = "owner")));



CREATE POLICY "Only owners can update cover letters" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'cover-letters'::"text") AND ("auth"."uid"() = "owner")));



CREATE POLICY "Only owners can update resumes" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'resumes'::"text") AND ("auth"."uid"() = "owner")));



CREATE POLICY "Public read access" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'bucket-name'::"text"));



CREATE POLICY "Public read company logos" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'company-logos'::"text"));



CREATE POLICY "Users can delete own files" ON "storage"."objects" FOR DELETE USING (((("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1]) AND ("bucket_id" = 'bucket-name'::"text")));



CREATE POLICY "Users can update own files" ON "storage"."objects" FOR UPDATE USING (((("auth"."uid"())::"text" = ("storage"."foldername"("name"))[1]) AND ("bucket_id" = 'bucket-name'::"text")));



CREATE POLICY "allow_controlled_resume_reads" ON "storage"."objects" FOR SELECT USING ((("bucket_id" = 'resumes'::"text") AND "public"."can_read_resume"("name")));



CREATE POLICY "avatars_d_admin_moderation" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'avatars'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."app_role_enum", 'super_admin'::"public"."app_role_enum"])))))));



CREATE POLICY "avatars_d_own" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'avatars'::"text") AND (("name" ~~ ("auth"."uid"() || '/%'::"text")) OR ("owner" = "auth"."uid"()))));



CREATE POLICY "avatars_i_own_folder" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'avatars'::"text") AND (("name" ~~ ("auth"."uid"() || '/%'::"text")) OR ("owner" = "auth"."uid"()))));



CREATE POLICY "avatars_r_own_always" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'avatars'::"text") AND (("name" ~~ (("auth"."uid"())::"text" || '/%'::"text")) OR ("owner" = "auth"."uid"()))));



CREATE POLICY "avatars_r_public_approved" ON "storage"."objects" FOR SELECT TO "authenticated", "anon" USING ((("bucket_id" = 'avatars'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "objects"."owner") AND (COALESCE("p"."is_deleted", false) = false) AND (COALESCE(("p"."approval_status")::"text", 'pending'::"text") = 'approved'::"text"))))));



CREATE POLICY "avatars_read_admin" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'avatars'::"text") AND "public"."is_admin"()));



ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_vectors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cover_letters_owner_upload" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'cover-letters'::"text") AND (("storage"."foldername"("name"))[1] = ("auth"."uid"())::"text")));



CREATE POLICY "cover_letters_read_owner_private" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'cover-letters'::"text") AND ("owner" = "auth"."uid"())));



CREATE POLICY "event-images-w-owner" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'event-images'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."featured_image_path" = "objects"."name") AND (("e"."created_by" = "auth"."uid"()) OR ("e"."organizer_id" = "auth"."uid"())))))));



CREATE POLICY "event_images_d_owner_or_admin" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'event-images'::"text") AND (("owner" = "auth"."uid"()) OR "public"."app_is_admin"())));



CREATE POLICY "event_images_i_owner" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'event-images'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE ((("e"."created_by" = "auth"."uid"()) OR ("e"."organizer_id" = "auth"."uid"())) AND ("objects"."name" ~~ (("e"."id")::"text" || '/%'::"text")))))));



CREATE POLICY "event_images_r_public" ON "storage"."objects" FOR SELECT TO "authenticated", "anon" USING ((("bucket_id" = 'event-images'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("objects"."name" ~~ (("e"."id")::"text" || '/%'::"text")) AND ((COALESCE("e"."status", 'pending'::"text") = 'approved'::"text") OR (COALESCE("e"."is_public", true) = true)))))));



CREATE POLICY "ga_read_public" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'group_avatars'::"text"));



CREATE POLICY "ga_update_admins" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'group_avatars'::"text") AND "public"."is_user_admin"("auth"."uid"())));



CREATE POLICY "group_posts_upload" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'group-posts'::"text") AND (("storage"."foldername"("name"))[1] IN ( SELECT ("g"."id")::"text" AS "id"
   FROM "public"."groups" "g"
  WHERE (("g"."is_archived" = false) AND "public"."is_member_of_group"("g"."id", "auth"."uid"()))))));



ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "msg_attach_insert_auth" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK (("bucket_id" = 'message_attachments'::"text"));



CREATE POLICY "msg_attach_public_read" ON "storage"."objects" FOR SELECT TO "authenticated", "anon" USING (("bucket_id" = 'message_attachments'::"text"));



ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."prefixes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profile_images_d_own" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'profile-images'::"text") AND ("owner" = "auth"."uid"())));



CREATE POLICY "profile_images_i_own" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'profile-images'::"text") AND ("owner" = "auth"."uid"())));



CREATE POLICY "profile_images_r_own" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'profile-images'::"text") AND ("owner" = "auth"."uid"())));



CREATE POLICY "profile_images_u_own" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'profile-images'::"text") AND ("owner" = "auth"."uid"()))) WITH CHECK ((("bucket_id" = 'profile-images'::"text") AND ("owner" = "auth"."uid"())));



CREATE POLICY "resumes_read_owner_private" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'resumes'::"text") AND ("owner" = "auth"."uid"())));



ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."vector_indexes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "realtime" TO "postgres";
GRANT USAGE ON SCHEMA "realtime" TO "anon";
GRANT USAGE ON SCHEMA "realtime" TO "authenticated";
GRANT USAGE ON SCHEMA "realtime" TO "service_role";
GRANT ALL ON SCHEMA "realtime" TO "supabase_realtime_admin";



GRANT USAGE ON SCHEMA "storage" TO "postgres";
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin";
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";



GRANT ALL ON FUNCTION "public"."_conn_max"("a" "uuid", "b" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."_conn_max"("a" "uuid", "b" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_conn_max"("a" "uuid", "b" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."_conn_min"("a" "uuid", "b" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."_conn_min"("a" "uuid", "b" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_conn_min"("a" "uuid", "b" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."_http_request_compat"("_method" "text", "_url" "text", "_headers" "extensions"."http_header"[], "_content" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_http_request_compat"("_method" "text", "_url" "text", "_headers" "extensions"."http_header"[], "_content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_http_request_compat"("_method" "text", "_url" "text", "_headers" "extensions"."http_header"[], "_content" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."_is_admin"("uid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."_is_admin"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."_is_admin"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_is_admin"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."_ja_fill_resume_path"() TO "anon";
GRANT ALL ON FUNCTION "public"."_ja_fill_resume_path"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_ja_fill_resume_path"() TO "service_role";



GRANT ALL ON FUNCTION "public"."_touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."_touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_touch_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."add_creator_to_group_members"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_creator_to_group_members"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_creator_to_group_members"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_delete_job"("p_job_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_job"("p_job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_job"("p_job_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_delete_user_fallback"("target_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_delete_user_fallback"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_user_fallback"("target_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_delete_user_rpc"("target" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_delete_user_rpc"("target" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_delete_user_rpc"("target" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_delete_user_rpc"("target" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_get_avatar"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_get_avatar"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_avatar"("p_user_id" "uuid") TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."profile_approval_audit" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE ON TABLE "public"."profile_approval_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_approval_audit" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_get_profile_approval_audit"("p_profile_id" "uuid", "p_limit" integer, "p_offset" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_get_profile_approval_audit"("p_profile_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_profile_approval_audit"("p_profile_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_list_jobs_pending"("_limit" integer, "_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_list_jobs_pending"("_limit" integer, "_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_jobs_pending"("_limit" integer, "_offset" integer) TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_list_profiles_for_approval"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_limit" integer, "p_offset" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_list_profiles_for_approval"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_profiles_for_approval"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_list_profiles_for_approval"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_list_profiles_for_approval"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_profiles_for_approval"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON TABLE "public"."admin_user_logins" TO "anon";
GRANT ALL ON TABLE "public"."admin_user_logins" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_user_logins" TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_list_user_logins"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_list_user_logins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_user_logins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_list_users_with_last_login"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_list_users_with_last_login"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_list_users_with_last_login"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_log_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_type" "text", "p_target_id" "uuid", "p_description" "text", "p_before" "jsonb", "p_after" "jsonb", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_log_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_type" "text", "p_target_id" "uuid", "p_description" "text", "p_before" "jsonb", "p_after" "jsonb", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_log_action"("p_admin_id" "uuid", "p_action_type" "text", "p_target_type" "text", "p_target_id" "uuid", "p_description" "text", "p_before" "jsonb", "p_after" "jsonb", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_pending_counts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_pending_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_pending_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_pending_counts"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_pending_feed"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_pending_feed"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_pending_feed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_pending_feed"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_purge_user_data"("target" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_purge_user_data"("target" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_purge_user_data"("target" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_request_user_delete"("target" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_request_user_delete"("target" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_request_user_delete"("target" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_review_group"("p_group_id" "uuid", "p_action" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_review_group"("p_group_id" "uuid", "p_action" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_review_group"("p_group_id" "uuid", "p_action" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_revoke_super_admin"("target_user_id" "uuid", "new_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_revoke_super_admin"("target_user_id" "uuid", "new_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_revoke_super_admin"("target_user_id" "uuid", "new_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_set_approval"("tname" "text", "row_id" "uuid", "new_status" "public"."approval_status", "note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_set_approval"("tname" "text", "row_id" "uuid", "new_status" "public"."approval_status", "note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_approval"("tname" "text", "row_id" "uuid", "new_status" "public"."approval_status", "note" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_set_group_approval"("p_group_id" "uuid", "p_status" "text", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_set_group_approval"("p_group_id" "uuid", "p_status" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_set_group_approval"("p_group_id" "uuid", "p_status" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_group_approval"("p_group_id" "uuid", "p_status" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_set_profile_approval"("p_profile_id" "uuid", "p_status" "public"."profile_approval_status", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_set_profile_approval"("p_profile_id" "uuid", "p_status" "public"."profile_approval_status", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_profile_approval"("p_profile_id" "uuid", "p_status" "public"."profile_approval_status", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_set_role"("p_user" "uuid", "p_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_set_role"("p_user" "uuid", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_set_role"("p_user" "uuid", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_role"("p_user" "uuid", "p_role" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_set_roles"("p_user_ids" "uuid"[], "p_role" "public"."app_role_enum") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_set_roles"("p_user_ids" "uuid"[], "p_role" "public"."app_role_enum") TO "service_role";
GRANT ALL ON FUNCTION "public"."admin_set_roles"("p_user_ids" "uuid"[], "p_role" "public"."app_role_enum") TO "authenticated";



GRANT ALL ON FUNCTION "public"."admin_set_user_role"("p_user_id" "uuid", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_user_role"("p_user_id" "uuid", "p_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_set_user_role"("p_user_id" "uuid", "p_role" "public"."app_role_enum") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_set_user_role_legacy"("target" "uuid", "new_role" "text", "make_admin" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_set_user_role_legacy"("target" "uuid", "new_role" "text", "make_admin" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_user_role_legacy"("target" "uuid", "new_role" "text", "make_admin" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_soft_delete_user"("target" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_soft_delete_user"("target" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_soft_delete_user"("target" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_soft_delete_user"("target" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_toggle_active"("p_user_id" "uuid", "p_is_active" boolean, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_toggle_active"("p_user_id" "uuid", "p_is_active" boolean, "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_total_profiles"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_total_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."admin_total_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_total_profiles"() TO "service_role";



GRANT ALL ON TABLE "public"."mentors" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."mentors" TO "authenticated";



GRANT ALL ON FUNCTION "public"."admin_update_mentor_status"("p_user_id" "uuid", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_mentor_status"("p_user_id" "uuid", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_mentor_status"("p_user_id" "uuid", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_profile_approval"("p_profile_id" "uuid", "p_decision" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_profile_approval"("p_profile_id" "uuid", "p_decision" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_user_role"("p_user_id" "uuid", "p_role" "public"."app_role_enum", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_user_role"("p_user_id" "uuid", "p_role" "public"."app_role_enum", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."app_is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."app_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."app_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."app_is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."app_is_admin_of"("p_user" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."app_is_admin_of"("p_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."app_is_admin_of"("p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."app_is_admin_of"("p_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."app_role_of"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."app_role_of"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."app_role_of"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_default_link_to_upcoming_sessions"("p_mentor" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_default_link_to_upcoming_sessions"("p_mentor" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_default_link_to_upcoming_sessions"("p_mentor" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_default_link_to_upcoming_sessions"("p_mentor" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_event"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_event"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_event"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_group_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_group_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_group_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_job"("p_job_id" "uuid", "p_approved" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."approve_job"("p_job_id" "uuid", "p_approved" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_job"("p_job_id" "uuid", "p_approved" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."are_connected"("a" "uuid", "b" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."are_connected"("a" "uuid", "b" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."are_connected"("a" "uuid", "b" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."are_users_connected"("a" "uuid", "b" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."are_users_connected"("a" "uuid", "b" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."are_users_connected"("a" "uuid", "b" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_user_role"("profile_uuid" "uuid", "role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_user_role"("profile_uuid" "uuid", "role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_user_role"("profile_uuid" "uuid", "role_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."attach_user_to_batch_group"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."attach_user_to_batch_group"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."attach_user_to_batch_group"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."auto_assign_batch_group_for_profile"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."auto_assign_batch_group_for_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_batch_group_for_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_assign_batch_group_for_profile_trg"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_assign_batch_group_for_profile_trg"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_assign_batch_group_for_profile_trg"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_confirm_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_confirm_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_confirm_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_conversation_on_match"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_conversation_on_match"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_conversation_on_match"() TO "service_role";



GRANT ALL ON FUNCTION "public"."backfill_profile_emails"() TO "anon";
GRANT ALL ON FUNCTION "public"."backfill_profile_emails"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."backfill_profile_emails"() TO "service_role";



GRANT ALL ON FUNCTION "public"."block_applications_for_quick_link"() TO "anon";
GRANT ALL ON FUNCTION "public"."block_applications_for_quick_link"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."block_applications_for_quick_link"() TO "service_role";



GRANT ALL ON FUNCTION "public"."block_direct_role_updates"() TO "anon";
GRANT ALL ON FUNCTION "public"."block_direct_role_updates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."block_direct_role_updates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."bump_conversation_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."bump_conversation_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."bump_conversation_last_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_comment_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_comment_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_comment_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_comment_on_post"("p_post_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_comment_on_post"("p_post_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_comment_on_post"("p_post_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_employer_view_profile"("p_target_id" "uuid", "p_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_employer_view_profile"("p_target_id" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_employer_view_profile"("p_target_id" "uuid", "p_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_manage_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_manage_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_manage_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_post_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_post_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_post_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_read_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_read_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_read_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_read_post"("p_post_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_read_post"("p_post_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_read_post"("p_post_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_read_resume"("p_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_read_resume"("p_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_read_resume"("p_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_submit_event_feedback"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_submit_event_feedback"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_submit_event_feedback"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_applications"("_job_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_applications"("_job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_applications"("_job_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_bookmark_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_bookmark_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_bookmark_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_bookmarked_jobs_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_bookmarked_jobs_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_bookmarked_jobs_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_event_completed"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_event_completed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_event_completed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_permission_bypass_rls"("profile_uuid" "uuid", "permission_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_permission_bypass_rls"("profile_uuid" "uuid", "permission_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_permission_bypass_rls"("profile_uuid" "uuid", "permission_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."claim_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."claim_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."coalesce_application_url"("apply_url" "text", "application_url" "text", "external_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."coalesce_application_url"("apply_url" "text", "application_url" "text", "external_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."coalesce_application_url"("apply_url" "text", "application_url" "text", "external_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."companies_set_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."companies_set_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."companies_set_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."connection_accept"("p_connection_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."connection_accept"("p_connection_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."connection_accept"("p_connection_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."connections_fill_defaults"() TO "anon";
GRANT ALL ON FUNCTION "public"."connections_fill_defaults"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."connections_fill_defaults"() TO "service_role";



GRANT ALL ON FUNCTION "public"."connections_notify"() TO "anon";
GRANT ALL ON FUNCTION "public"."connections_notify"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."connections_notify"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_super_admins"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_super_admins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_super_admins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_connection_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_connection_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_connection_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_conversation_for_mentorship"("mentor_uuid" "uuid", "mentee_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_conversation_for_mentorship"("mentor_uuid" "uuid", "mentee_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_conversation_for_mentorship"("mentor_uuid" "uuid", "mentee_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_event_with_agenda"("event_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_event_with_agenda"("event_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_event_with_agenda"("event_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_group_and_add_admin"("group_name" "text", "group_description" "text", "group_is_private" boolean, "group_tags" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_group_and_add_admin"("group_name" "text", "group_description" "text", "group_is_private" boolean, "group_tags" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_new_event"("event_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_new_event"("event_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_new_event"("event_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("user_id" "uuid", "notification_title" "text", "notification_message" "text", "notification_link" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("target_profile_id" "uuid", "notif_title" "text", "notif_message" "text", "notif_link" "text", "notif_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("recipient_id" "uuid", "sender_id" "uuid", "event_id" "uuid", "type" "text", "message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_body" "text", "p_link" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_or_update_mentor_profile"("p_expertise" "text"[], "p_mentoring_statement" "text", "p_max_mentees" integer, "p_availability" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_or_update_mentor_profile"("p_expertise" "text"[], "p_mentoring_statement" "text", "p_max_mentees" integer, "p_availability" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_or_update_mentor_profile"("p_expertise" "text"[], "p_mentoring_statement" "text", "p_max_mentees" integer, "p_availability" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_relationship_on_accept"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_relationship_on_accept"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."current_role_text"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."current_role_text"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_role_text"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_can_edit_job"("p_job_id" "uuid", "p_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."debug_can_edit_job"("p_job_id" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_can_edit_job"("p_job_id" "uuid", "p_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_user_avatar"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_avatar"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_avatar"() TO "service_role";



GRANT ALL ON FUNCTION "public"."deny_employer_directory"() TO "anon";
GRANT ALL ON FUNCTION "public"."deny_employer_directory"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."deny_employer_directory"() TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON FUNCTION "public"."derive_job_state"("j" "public"."jobs") TO "anon";
GRANT ALL ON FUNCTION "public"."derive_job_state"("j" "public"."jobs") TO "authenticated";
GRANT ALL ON FUNCTION "public"."derive_job_state"("j" "public"."jobs") TO "service_role";



REVOKE ALL ON FUNCTION "public"."dm_get_or_create_thread"("u1" "uuid", "u2" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."dm_get_or_create_thread"("u1" "uuid", "u2" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dm_get_or_create_thread"("u1" "uuid", "u2" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."dm_get_or_create_thread_with"("peer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."dm_get_or_create_thread_with"("peer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dm_get_or_create_thread_with"("peer_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."dm_mark_thread_read"("p_thread_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."dm_mark_thread_read"("p_thread_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dm_mark_thread_read"("p_thread_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."dm_threads_insert_participants"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."dm_threads_insert_participants"() TO "service_role";



GRANT ALL ON FUNCTION "public"."dm_threads_touch_after_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."dm_threads_touch_after_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."drop_all_policies"("target_table" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."drop_all_policies"("target_table" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."drop_all_policies"("target_table" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."echo_test"("p_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."echo_test"("p_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."echo_test"("p_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_admin_moderation_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_admin_moderation_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_admin_moderation_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_at_least_one_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_at_least_one_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_at_least_one_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_at_least_one_admin_deferred"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_at_least_one_admin_deferred"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_at_least_one_admin_deferred"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_avatar_upload_rate"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_avatar_upload_rate"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_avatar_upload_rate"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_feedback_after_end"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_feedback_after_end"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_feedback_after_end"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_job_admin_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_job_admin_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_job_admin_columns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_requester_guard"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_requester_guard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_requester_guard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enqueue_notification_event"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb", "p_idempotency_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_notification_event"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb", "p_idempotency_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_notification_event"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb", "p_idempotency_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enqueue_notification_event"("p_event_type" "public"."notification_type_enum", "p_module" "public"."notification_module", "p_actor_profile_id" "uuid", "p_entity_table" "text", "p_entity_id" "uuid", "p_metadata" "jsonb", "p_idempotency_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_notification_event"("p_event_type" "public"."notification_type_enum", "p_module" "public"."notification_module", "p_actor_profile_id" "uuid", "p_entity_table" "text", "p_entity_id" "uuid", "p_metadata" "jsonb", "p_idempotency_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_notification_event"("p_event_type" "public"."notification_type_enum", "p_module" "public"."notification_module", "p_actor_profile_id" "uuid", "p_entity_table" "text", "p_entity_id" "uuid", "p_metadata" "jsonb", "p_idempotency_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."enqueue_user_hard_delete"("target_user_id" "uuid", "reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."enqueue_user_hard_delete"("target_user_id" "uuid", "reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_user_hard_delete"("target_user_id" "uuid", "reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_connection_on_mentorship_accept"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_connection_on_mentorship_accept"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_connection_on_mentorship_accept"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_dm_thread_for_mentorship"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_dm_thread_for_mentorship"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_dm_thread_for_mentorship"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_dm_thread_with"("p_other" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_dm_thread_with"("p_other" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_dm_thread_with"("p_other" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_dm_thread_with"("p_other_user_id" "uuid", "p_context_type" "text", "p_context_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_dm_thread_with"("p_other_user_id" "uuid", "p_context_type" "text", "p_context_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_dm_thread_with"("p_other_user_id" "uuid", "p_context_type" "text", "p_context_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_employer_company"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_employer_company"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_employer_company"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_jsonb_array_from_text"("input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_jsonb_array_from_text"("input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_jsonb_array_from_text"("input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_profile_for_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_profile_for_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_profile_for_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_thread_for_connection"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_thread_for_connection"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_thread_for_connection"() TO "service_role";



GRANT ALL ON FUNCTION "public"."event_changes_broadcast"() TO "anon";
GRANT ALL ON FUNCTION "public"."event_changes_broadcast"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."event_changes_broadcast"() TO "service_role";



GRANT ALL ON FUNCTION "public"."events_set_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."events_set_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."events_set_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fc_assert_not_employer_for_directory"() TO "anon";
GRANT ALL ON FUNCTION "public"."fc_assert_not_employer_for_directory"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fc_assert_not_employer_for_directory"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."fc_has_applied_to_job"("p_job_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."fc_has_applied_to_job"("p_job_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fc_has_applied_to_job"("p_job_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fc_has_applied_to_job"("p_job_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fc_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."fc_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fc_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fc_is_admin"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fc_is_admin"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fc_is_admin"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fc_is_employer"() TO "anon";
GRANT ALL ON FUNCTION "public"."fc_is_employer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fc_is_employer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fc_is_employer_approved"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fc_is_employer_approved"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fc_is_employer_approved"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fc_is_fully_approved"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fc_is_fully_approved"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fc_is_fully_approved"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fc_is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."fc_is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fc_is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fc_is_super_admin"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fc_is_super_admin"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fc_is_super_admin"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."find_or_create_conversation"("other_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."find_or_create_conversation"("other_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_or_create_conversation"("other_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."format_inr"("val" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."format_inr"("val" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."format_inr"("val" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_admin_analytics_summary"("p_period" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_admin_analytics_summary"("p_period" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_analytics_summary"("p_period" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_analytics_summary"("p_period" "text") TO "service_role";



GRANT ALL ON TABLE "public"."admin_profile_metrics" TO "anon";
GRANT ALL ON TABLE "public"."admin_profile_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_profile_metrics" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_profile_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_profile_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_user_grid"("p_search" "text", "p_role" "public"."app_role_enum", "p_status" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_user_grid"("p_search" "text", "p_role" "public"."app_role_enum", "p_status" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_user_grid"("p_search" "text", "p_role" "public"."app_role_enum", "p_status" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_user_grid"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_user_grid"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_user_grid"("p_status" "public"."profile_approval_status", "p_role" "public"."app_role_enum", "p_search" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_profiles_count_by_role_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_profiles_count_by_role_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_profiles_count_by_role_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_alumni_approved_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_alumni_approved_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_application_count"("p_job_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_application_count"("p_job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_application_count"("p_job_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_applications_for_job"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_applications_for_job"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_applications_for_job"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_applications_for_job_v2"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_applications_for_job_v2"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_applications_for_job_v2"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_applications_for_job_v2"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bell_unread_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_bell_unread_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bell_unread_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_jobs_with_bookmarks"("p_company_id" "uuid", "p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_jobs_with_bookmarks"("p_company_id" "uuid", "p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_jobs_with_bookmarks"("p_company_id" "uuid", "p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_connection_peers"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_connection_peers"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_connection_peers"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_connection_peers"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_connection_status"("user_1_id" "uuid", "user_2_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_connection_status"("user_1_id" "uuid", "user_2_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_connection_status"("user_1_id" "uuid", "user_2_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_connections_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_connections_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_connections_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_flags"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_flags"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_flags"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_dashboard_summary_for_user"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_dashboard_summary_for_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_summary_for_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_summary_for_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_directory_cards"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_directory_cards"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_directory_cards"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_directory_profile"("p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_directory_profile"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_directory_profile"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_directory_profile"("p_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."degrees" TO "anon";
GRANT ALL ON TABLE "public"."degrees" TO "authenticated";
GRANT ALL ON TABLE "public"."degrees" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."directory_profiles_base" TO "anon";
GRANT ALL ON TABLE "public"."directory_profiles_base" TO "authenticated";
GRANT ALL ON TABLE "public"."directory_profiles_base" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_directory_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_directory_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_directory_profiles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_directory_profiles"("p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_directory_profiles"("p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_directory_profiles"("p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_directory_profiles_search"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_directory_profiles_search"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_directory_profiles_search"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer, "p_sort_field" "text", "p_sort_dir" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer, "p_sort_field" "text", "p_sort_dir" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_directory_profiles_secure"("p_search" "text", "p_limit" integer, "p_offset" integer, "p_sort_field" "text", "p_sort_dir" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_directory_profiles_secure_count"("p_search" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_directory_profiles_secure_count"("p_search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_directory_profiles_secure_count"("p_search" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_directory_role_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_directory_role_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_attendance_counts"("p_event_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_attendance_counts"("p_event_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_attendance_counts"("p_event_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_expired_jobs_admin"("p_limit" integer, "p_offset" integer, "p_search" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_expired_jobs_admin"("p_limit" integer, "p_offset" integer, "p_search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_expired_jobs_admin"("p_limit" integer, "p_offset" integer, "p_search" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_job_applications_for_owner"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_job_applications_for_owner"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_job_applications_for_owner"("p_job_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_job_details"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_job_details"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_job_details"("p_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_job_for_edit"("p_job_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_job_for_edit"("p_job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_job_for_edit"("p_job_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_jobs_feed"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer, "p_department" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_jobs_feed"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer, "p_department" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_jobs_feed"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer, "p_department" "text") TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."job_applications" TO "anon";
GRANT ALL ON TABLE "public"."job_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."job_applications" TO "service_role";



GRANT ALL ON TABLE "public"."v_jobs_feed_inr" TO "anon";
GRANT ALL ON TABLE "public"."v_jobs_feed_inr" TO "authenticated";
GRANT ALL ON TABLE "public"."v_jobs_feed_inr" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_jobs_public_v5"("p_search" "text", "p_location" "text", "p_job_type" "text", "p_experience_level" "text", "p_offset" integer, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_jobs_public_v5"("p_search" "text", "p_location" "text", "p_job_type" "text", "p_experience_level" "text", "p_offset" integer, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_jobs_public_v5"("p_search" "text", "p_location" "text", "p_job_type" "text", "p_experience_level" "text", "p_offset" integer, "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_jobs_public_v5"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer, "p_department" "text", "p_job_type" "text", "p_experience_level" "text", "p_location" "text", "p_industry" "text", "p_salary_min" integer, "p_salary_max" integer, "p_posted_since_days" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_jobs_public_v5"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer, "p_department" "text", "p_job_type" "text", "p_experience_level" "text", "p_location" "text", "p_industry" "text", "p_salary_min" integer, "p_salary_max" integer, "p_posted_since_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_jobs_public_v5"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer, "p_department" "text", "p_job_type" "text", "p_experience_level" "text", "p_location" "text", "p_industry" "text", "p_salary_min" integer, "p_salary_max" integer, "p_posted_since_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_jobs_public_v5"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer, "p_department" "text", "p_job_type" "text", "p_experience_level" "text", "p_location" "text", "p_industry" "text", "p_salary_min" integer, "p_salary_max" integer, "p_posted_since_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_jobs_with_bookmark_flag"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_jobs_with_bookmark_flag"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_jobs_with_bookmark_flag"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_jobs_with_bookmarks"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_jobs_with_bookmarks"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_jobs_with_bookmarks"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_jobs_with_bookmarks_v2"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_jobs_with_bookmarks_v2"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_jobs_with_bookmarks_v2"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_latest_message"("p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_latest_message"("p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_latest_message"("p_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_membership_map"("p_user" "uuid", "p_group_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_membership_map"("p_user" "uuid", "p_group_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_membership_map"("p_user" "uuid", "p_group_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_mentor_contact"("mentor_uuid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_mentor_contact"("mentor_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_mentor_contact"("mentor_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mentor_contact"("mentor_uuid" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."mentorship_relationships" TO "service_role";
GRANT SELECT ON TABLE "public"."mentorship_relationships" TO "authenticated";



GRANT ALL ON TABLE "public"."v_mentors_public" TO "anon";
GRANT ALL ON TABLE "public"."v_mentors_public" TO "authenticated";
GRANT ALL ON TABLE "public"."v_mentors_public" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mentors_for_current_mentee"("p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_mentors_for_current_mentee"("p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mentors_for_current_mentee"("p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_expired_jobs"("p_limit" integer, "p_offset" integer, "p_search" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_expired_jobs"("p_limit" integer, "p_offset" integer, "p_search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_expired_jobs"("p_limit" integer, "p_offset" integer, "p_search" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_my_posted_jobs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"("p_status" "text", "p_offset" integer, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"("p_status" "text", "p_offset" integer, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"("p_status" "text", "p_offset" integer, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_for"("p_user_id" "uuid", "p_status" "text", "p_offset" integer, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_for"("p_user_id" "uuid", "p_status" "text", "p_offset" integer, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_for"("p_user_id" "uuid", "p_status" "text", "p_offset" integer, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_paged"("p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_paged"("p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_paged"("p_limit" integer, "p_offset" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_my_posted_jobs_v2"("p_limit" integer, "p_offset" integer, "p_search" "text", "p_sort_by" "text", "p_sort_dir" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_v2"("p_limit" integer, "p_offset" integer, "p_search" "text", "p_sort_by" "text", "p_sort_dir" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_v2"("p_limit" integer, "p_offset" integer, "p_search" "text", "p_sort_by" "text", "p_sort_dir" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_v2"("p_limit" integer, "p_offset" integer, "p_search" "text", "p_sort_by" "text", "p_sort_dir" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_my_posted_jobs_v2"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_v2"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_v2"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_posted_jobs_v2"("p_search_query" "text", "p_sort_by" "text", "p_sort_order" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_role"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_role"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_bell_worthy"("p_role" "text", "p_type" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."is_bell_worthy"("p_role" "text", "p_type" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_bell_worthy"("p_role" "text", "p_type" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."bell_notifications" TO "anon";
GRANT ALL ON TABLE "public"."bell_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."bell_notifications" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_notifications_paginated"("p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_notifications_paginated"("p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_notifications_paginated"("p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("user_1_id" "uuid", "user_2_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("user_1_id" "uuid", "user_2_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("user_1_id" "uuid", "user_2_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_conversation_id"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation_id"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation_id"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_dm_thread"("p_user1" "uuid", "p_user2" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_dm_thread"("p_user1" "uuid", "p_user2" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_dm_thread"("p_user1" "uuid", "p_user2" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_approvals"("content_type" "text", "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_approvals"("content_type" "text", "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_approvals"("content_type" "text", "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_connections_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_connections_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_connections_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_content"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_content"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_content"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_contact_details"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_contact_details"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_contact_details"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_for_employer"("p_target_id" "uuid", "p_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_for_employer"("p_target_id" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_for_employer"("p_target_id" "uuid", "p_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recent_activity"("p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recent_activity"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_role_by_name"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_role_by_name"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_role_by_name"("role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_role_counts_for_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_role_counts_for_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_role_counts_for_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_role_id_by_name"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_role_id_by_name"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_role_id_by_name"("role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_roles"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_roles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_roles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_signed_avatar_url"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_signed_avatar_url"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_signed_avatar_url"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_signed_avatar_urls"("p_user_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_signed_avatar_urls"("p_user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_signed_avatar_urls"("p_user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_columns"("table_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_total_alumni"("include_nonpublic" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_total_alumni"("include_nonpublic" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_alumni"("include_nonpublic" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_alumni"("include_nonpublic" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_types"("tname" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_types"("tname" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_types"("tname" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_message_count"("conv_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_message_count"("conv_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_message_count"("conv_id" "uuid", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("profile_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("profile_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("profile_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notifications_count_by_type"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count_by_type"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count_by_type"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notifications_count_by_type"("type_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count_by_type"("type_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count_by_type"("type_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_analytics"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_analytics"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_analytics_old_109720"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_analytics_old_109720"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_analytics_old_109720"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations_v2"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations_v2"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations_v2"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_permissions"("profile_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("profile_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("profile_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_permissions_bypass_rls"("profile_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_permissions_bypass_rls"("profile_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_permissions_bypass_rls"("profile_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_roles_bypass_rls"("profile_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_roles_bypass_rls"("profile_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_roles_bypass_rls"("profile_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_view_columns"("view_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_view_columns"("view_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_view_columns"("view_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."group_admin_set_membership"("p_group_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_role" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."group_admin_set_membership"("p_group_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."group_admin_set_membership"("p_group_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."group_admin_set_membership"("p_group_id" "uuid", "p_user_id" "uuid", "p_status" "text", "p_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."groups_sync_visibility"() TO "anon";
GRANT ALL ON FUNCTION "public"."groups_sync_visibility"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."groups_sync_visibility"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_groups_moderation_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_groups_moderation_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_groups_moderation_columns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_jobs_defaults"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_jobs_defaults"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_jobs_defaults"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_mentor_rejection"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_mentor_rejection"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_mentor_rejection"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("user_id" "uuid", "permission_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("user_id" "uuid", "permission_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("user_id" "uuid", "permission_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."in_app_applicant_count"("p_job_id" "uuid", "p_source" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."in_app_applicant_count"("p_job_id" "uuid", "p_source" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."in_app_applicant_count"("p_job_id" "uuid", "p_source" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."init_my_notification_prefs"() TO "anon";
GRANT ALL ON FUNCTION "public"."init_my_notification_prefs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."init_my_notification_prefs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_member_by_email"("p_group_id" "uuid", "p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."invite_member_by_email"("p_group_id" "uuid", "p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_member_by_email"("p_group_id" "uuid", "p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_like"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_like"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_like"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_like"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_like"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_like"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_connected"("a" "uuid", "b" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_connected"("a" "uuid", "b" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_connected"("a" "uuid", "b" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_conversation_participant"("p_conversation_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_conversation_participant"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."is_conversation_participant"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."is_employer"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_employer"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_employer"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_employer_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_employer_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_employer_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_group_manager"("p_group_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_group_manager"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_manager"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_manager"("p_group_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_group_member"("p_user_id" "uuid", "p_group_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_group_member"("p_user_id" "uuid", "p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_member"("p_user_id" "uuid", "p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_member"("p_user_id" "uuid", "p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_member_of_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_member_of_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_member_of_group"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_mentee_below_program_limit"("p_mentee_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_mentee_below_program_limit"("p_mentee_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_mentee_below_program_limit"("p_mentee_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_mentor_selectable"("p_mentor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_mentor_selectable"("p_mentor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_mentor_selectable"("p_mentor_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_platform_admin"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_platform_admin"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_platform_admin"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_profile_verified"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_profile_verified"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_profile_verified"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_site_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_site_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_site_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"("uid" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_user_admin"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_user_admin"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_admin"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_admin"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_valid_application_target"("t" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_valid_application_target"("t" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_valid_application_target"("t" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."job_is_owned_by_me"("p_job_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."job_is_owned_by_me"("p_job_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."job_is_owned_by_me"("p_job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."job_is_owned_by_me"("p_job_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."job_is_owned_by_user"("p_job_id" "uuid", "p_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."job_is_owned_by_user"("p_job_id" "uuid", "p_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."job_is_owned_by_user"("p_job_id" "uuid", "p_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."job_source_type"("apply_url" "text", "application_url" "text", "external_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."job_source_type"("apply_url" "text", "application_url" "text", "external_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."job_source_type"("apply_url" "text", "application_url" "text", "external_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."jobs_before_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."jobs_before_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jobs_before_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."jobs_before_insert_company"() TO "anon";
GRANT ALL ON FUNCTION "public"."jobs_before_insert_company"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jobs_before_insert_company"() TO "service_role";



GRANT ALL ON FUNCTION "public"."jobs_normalize_external_targets"() TO "anon";
GRANT ALL ON FUNCTION "public"."jobs_normalize_external_targets"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jobs_normalize_external_targets"() TO "service_role";



GRANT ALL ON FUNCTION "public"."jobs_set_creator"() TO "anon";
GRANT ALL ON FUNCTION "public"."jobs_set_creator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jobs_set_creator"() TO "service_role";



GRANT ALL ON FUNCTION "public"."jobs_set_logo_url"() TO "anon";
GRANT ALL ON FUNCTION "public"."jobs_set_logo_url"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jobs_set_logo_url"() TO "service_role";



GRANT ALL ON FUNCTION "public"."jobs_set_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."jobs_set_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jobs_set_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."jobs_set_salary_range"() TO "anon";
GRANT ALL ON FUNCTION "public"."jobs_set_salary_range"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jobs_set_salary_range"() TO "service_role";



GRANT ALL ON FUNCTION "public"."jobs_sync_flags_from_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."jobs_sync_flags_from_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."jobs_sync_flags_from_status"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."join_group_v2"("p_group_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."join_group_v2"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."join_group_v2"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_group_v2"("p_group_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."leave_group"("p_group_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."leave_group"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."leave_group"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_group"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_pending_members"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."list_pending_members"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_pending_members"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."list_tables"() TO "anon";
GRANT ALL ON FUNCTION "public"."list_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_tables"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_connection_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_connection_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_connection_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_group_leave"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_group_leave"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_group_leave"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_profile_approval_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_profile_approval_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_profile_approval_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_profile_approval_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_profile_approval_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_profile_approval_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_my_notifications_as_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_my_notifications_as_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_my_notifications_as_read"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_conversation_as_read"("p_conversation_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"("notification_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mentors_upsert_current"("p_expertise" "text"[], "p_mentoring_experience_years" integer, "p_max_mentees" integer, "p_mentoring_capacity_hours_per_month" integer, "p_mentoring_preferences" "jsonb", "p_mentoring_statement" "text", "p_mentoring_experience_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mentors_upsert_current"("p_expertise" "text"[], "p_mentoring_experience_years" integer, "p_max_mentees" integer, "p_mentoring_capacity_hours_per_month" integer, "p_mentoring_preferences" "jsonb", "p_mentoring_statement" "text", "p_mentoring_experience_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mentors_upsert_current"("p_expertise" "text"[], "p_mentoring_experience_years" integer, "p_max_mentees" integer, "p_mentoring_capacity_hours_per_month" integer, "p_mentoring_preferences" "jsonb", "p_mentoring_statement" "text", "p_mentoring_experience_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mentorship_mark_user_unavailable"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mentorship_mark_user_unavailable"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mentorship_mark_user_unavailable"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mentorship_on_mentor_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."mentorship_on_mentor_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mentorship_on_mentor_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mentorship_on_profile_deactivated"() TO "anon";
GRANT ALL ON FUNCTION "public"."mentorship_on_profile_deactivated"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mentorship_on_profile_deactivated"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mentorship_open_chat"("p_relationship_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mentorship_open_chat"("p_relationship_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mentorship_open_chat"("p_relationship_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mentorship_relationship_end"("p_relationship_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mentorship_relationship_end"("p_relationship_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mentorship_relationship_end"("p_relationship_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mentorship_request_cancel"("p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mentorship_request_cancel"("p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mentorship_request_cancel"("p_request_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mentorship_request_create"("p_mentor_id" "uuid", "p_message" "text", "p_goals" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mentorship_request_create"("p_mentor_id" "uuid", "p_message" "text", "p_goals" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."mentorship_request_create"("p_mentor_id" "uuid", "p_message" "text", "p_goals" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."mentorship_request_respond"("p_request_id" "uuid", "p_new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mentorship_request_respond"("p_request_id" "uuid", "p_new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mentorship_request_respond"("p_request_id" "uuid", "p_new_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mentorship_request_respond_v2"("p_request_id" "uuid", "p_action" "public"."mentorship_request_status", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mentorship_request_respond_v2"("p_request_id" "uuid", "p_action" "public"."mentorship_request_status", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mentorship_request_respond_v2"("p_request_id" "uuid", "p_action" "public"."mentorship_request_status", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mentorship_request_update_status"("p_request_id" "uuid", "p_new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mentorship_request_update_status"("p_request_id" "uuid", "p_new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mentorship_request_update_status"("p_request_id" "uuid", "p_new_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mentorship_toggle_availability"("p_next" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."mentorship_toggle_availability"("p_next" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mentorship_toggle_availability"("p_next" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."moderate_content"("p_content_id" "uuid", "p_content_type" "text", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."moderate_content"("p_content_id" "uuid", "p_content_type" "text", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."moderate_content"("p_content_id" "uuid", "p_content_type" "text", "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."moderate_content"("content_table" "text", "content_id" "uuid", "is_approved" boolean, "rejection_reason" "text", "content_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."moderate_content"("content_table" "text", "content_id" "uuid", "is_approved" boolean, "rejection_reason" "text", "content_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."moderate_content"("content_table" "text", "content_id" "uuid", "is_approved" boolean, "rejection_reason" "text", "content_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_group_name"("p" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_group_name"("p" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_group_name"("p" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."normalize_social_link"() TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_social_link"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_social_link"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notifications_ensure_recipient"() TO "anon";
GRANT ALL ON FUNCTION "public"."notifications_ensure_recipient"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notifications_ensure_recipient"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."notify"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_admin_on_event_create"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_admin_on_event_create"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_admin_on_event_create"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_admins_on_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_admins_on_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_admins_on_event"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_admins_on_group_post_report"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_admins_on_group_post_report"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_admins_on_group_post_report"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_chat_message"("p_recipient" "uuid", "p_thread" "uuid", "p_preview" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_chat_message"("p_recipient" "uuid", "p_thread" "uuid", "p_preview" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_chat_message"("p_recipient" "uuid", "p_thread" "uuid", "p_preview" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_connection_approved"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_connection_approved"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_connection_approved"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_connection_request"("p_recipient" "uuid", "p_requester" "uuid", "p_edge" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_connection_request"("p_recipient" "uuid", "p_requester" "uuid", "p_edge" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_connection_request"("p_recipient" "uuid", "p_requester" "uuid", "p_edge" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_dm_participants"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_dm_participants"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_dm_participants"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_event"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_event"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_event"("p_recipient_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_metadata" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."notify_event_rsvp"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notify_event_rsvp"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_event_rsvp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_event_rsvp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_events_due_in_24h"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_events_due_in_24h"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_events_due_in_24h"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_interview_invite"("p_application_id" "uuid", "p_when" timestamp with time zone, "p_link" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_interview_invite"("p_application_id" "uuid", "p_when" timestamp with time zone, "p_link" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_interview_invite"("p_application_id" "uuid", "p_when" timestamp with time zone, "p_link" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_job_application"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_job_application"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_job_application"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_job_application_submitted"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_job_application_submitted"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_job_application_submitted"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_job_applied"("p_job_id" "uuid", "p_applicant" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_job_applied"("p_job_id" "uuid", "p_applicant" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_job_applied"("p_job_id" "uuid", "p_applicant" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_mentorship_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_mentorship_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_mentorship_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_mentorship_sessions_due_in_2h"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_mentorship_sessions_due_in_2h"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_mentorship_sessions_due_in_2h"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_connection_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_connection_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_connection_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_on_job_application"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_job_application"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_job_application"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_on_request_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_on_request_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_on_request_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_profile_verification"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_profile_verification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_profile_verification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_request_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_request_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_request_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_requests_on_rejection"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_requests_on_rejection"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_requests_on_rejection"() TO "service_role";



GRANT ALL ON FUNCTION "public"."on_mentorship_request_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_mentorship_request_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_mentorship_request_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."policy_exists"("_schemaname" "text", "_tablename" "text", "_policyname" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."policy_exists"("_schemaname" "text", "_tablename" "text", "_policyname" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."policy_exists"("_schemaname" "text", "_tablename" "text", "_policyname" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_early_event_feedback"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_early_event_feedback"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_early_event_feedback"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_no_admins"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_no_admins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_no_admins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_notification_event_mentorship_v1"("p_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_notification_event_mentorship_v1"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_notification_event_mentorship_v1"("p_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."profiles_after_update_avatar"() TO "anon";
GRANT ALL ON FUNCTION "public"."profiles_after_update_avatar"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."profiles_after_update_avatar"() TO "service_role";



GRANT ALL ON FUNCTION "public"."profiles_normalize_names"() TO "anon";
GRANT ALL ON FUNCTION "public"."profiles_normalize_names"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."profiles_normalize_names"() TO "service_role";



GRANT ALL ON FUNCTION "public"."profiles_prevent_self_approval_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."profiles_prevent_self_approval_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."profiles_prevent_self_approval_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."profiles_set_full_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."profiles_set_full_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."profiles_set_full_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_jobs_admin_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_jobs_admin_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_jobs_admin_columns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_mentors_admin_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_mentors_admin_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_mentors_admin_columns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_profile_admin_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_profile_admin_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_profile_admin_columns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."public_directory_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."public_directory_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."public_directory_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."purge_notifications_admin"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."purge_notifications_admin"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."purge_notifications_admin"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."purge_user_data"("uid" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purge_user_data"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_group_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_group_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_group_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_connection"("p_connection_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_connection"("p_connection_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_connection"("p_connection_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."remove_connection"("p_user" "uuid", "p_other" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_connection"("p_user" "uuid", "p_other" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_connection"("p_user" "uuid", "p_other" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_connection"("p_user" "uuid", "p_other" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_role_bypass_rls"("profile_uuid" "uuid", "role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_user_role"("profile_uuid" "uuid", "role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_user_role"("profile_uuid" "uuid", "role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_user_role"("profile_uuid" "uuid", "role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reqskills_to_jsonb"("sk" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."reqskills_to_jsonb"("sk" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reqskills_to_jsonb"("sk" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."reqskills_to_jsonb"("sk" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."reqskills_to_jsonb"("sk" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reqskills_to_jsonb"("sk" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."reqskills_to_jsonb"("sk" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reqskills_to_jsonb"("sk" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reqskills_to_jsonb"("sk" "text") TO "service_role";



GRANT ALL ON TABLE "public"."connections" TO "anon";
GRANT ALL ON TABLE "public"."connections" TO "authenticated";
GRANT ALL ON TABLE "public"."connections" TO "service_role";



GRANT ALL ON FUNCTION "public"."request_connection"("p_recipient" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."request_connection"("p_recipient" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_connection"("p_recipient" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_connection_for_job"("p_job_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."request_connection_for_job"("p_job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_connection_for_job"("p_job_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_connection_to_user"("p_recipient_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."request_connection_to_user"("p_recipient_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_connection_to_user"("p_recipient_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."respond_connection"("p_connection_id" "uuid", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."respond_connection"("p_connection_id" "uuid", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."respond_connection"("p_connection_id" "uuid", "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rsvp_to_event"("event_id" "uuid", "response" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rsvp_to_event"("event_id" "uuid", "response" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rsvp_to_event"("event_id" "uuid", "response" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rsvp_to_event"("p_event_id" "uuid", "p_attendee_id" "uuid", "p_attendance_status_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rsvp_to_event"("p_event_id" "uuid", "p_attendee_id" "uuid", "p_attendance_status_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rsvp_to_event"("p_event_id" "uuid", "p_attendee_id" "uuid", "p_attendance_status_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_to_jsonb"("_txt" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_to_jsonb"("_txt" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_to_jsonb"("_txt" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sanitize_job_urls"() TO "anon";
GRANT ALL ON FUNCTION "public"."sanitize_job_urls"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sanitize_job_urls"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sanitize_profile_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."sanitize_profile_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sanitize_profile_role"() TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_events"("q" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_events"("q" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_events"("q" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_events"("p_query" "text", "p_status" "text", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_events"("p_query" "text", "p_status" "text", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_events"("p_query" "text", "p_status" "text", "p_type" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."self_set_role"("p_role" "public"."app_role_enum") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."self_set_role"("p_role" "public"."app_role_enum") TO "authenticated";
GRANT ALL ON FUNCTION "public"."self_set_role"("p_role" "public"."app_role_enum") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_dm_message"("p_thread_id" "uuid", "p_content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_dm_message"("p_thread_id" "uuid", "p_content" "text") TO "service_role";



GRANT ALL ON TABLE "public"."dm_messages" TO "service_role";
GRANT SELECT ON TABLE "public"."dm_messages" TO "authenticated";



GRANT ALL ON FUNCTION "public"."send_dm_message"("p_thread_id" "uuid", "p_body" "text", "p_client_id" "text", "p_meta" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_dm_message"("p_thread_id" "uuid", "p_body" "text", "p_client_id" "text", "p_meta" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_application_status"("p_application_id" "uuid", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_application_status"("p_application_id" "uuid", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_application_status"("p_application_id" "uuid", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_comment_author_and_guard"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_comment_author_and_guard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_comment_author_and_guard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_company_logo_from_poster"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_company_logo_from_poster"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_company_logo_from_poster"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_company_on_job_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_company_on_job_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_company_on_job_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_group_creator_as_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_group_creator_as_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_group_creator_as_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_group_member_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_group_member_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_group_member_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_job_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_job_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_job_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_job_owner_default"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_job_owner_default"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_job_owner_default"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_member_role"("p_group_id" "uuid", "p_user_id" "uuid", "p_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_member_role"("p_group_id" "uuid", "p_user_id" "uuid", "p_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_member_role"("p_group_id" "uuid", "p_user_id" "uuid", "p_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."should_deliver_in_app"("p_user_id" "uuid", "p_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."should_deliver_in_app"("p_user_id" "uuid", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."should_deliver_in_app"("p_user_id" "uuid", "p_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."start_or_get_conversation"("other_user" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."start_or_get_conversation"("other_user" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_or_get_conversation"("other_user" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_company_logo_from_avatar"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_company_logo_from_avatar"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_company_logo_from_avatar"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_company_logo_from_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_company_logo_from_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_company_logo_from_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_event_is_approved"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_event_is_approved"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_event_is_approved"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_is_approved_from_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_is_approved_from_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_is_approved_from_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_membership_to_members"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_membership_to_members"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_membership_to_members"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_resume_profile_to_job_alert"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_resume_profile_to_job_alert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_resume_profile_to_job_alert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_connections_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_connections_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_connections_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."to_app_role"("p" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."to_app_role"("p" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."to_app_role"("p" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_job_bookmark"("p_job_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_job_bookmark"("p_job_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_job_bookmark"("p_job_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_attach_user_to_batch_group"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_attach_user_to_batch_group"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_attach_user_to_batch_group"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_event_attendee_invite_or_rsvp_notify"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_event_attendee_invite_or_rsvp_notify"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_event_attendee_invite_or_rsvp_notify"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_events_update_broadcast"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_events_update_broadcast"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_events_update_broadcast"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_groups_add_owner_membership"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_groups_add_owner_membership"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_groups_add_owner_membership"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_groups_set_created_by"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_groups_set_created_by"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_groups_set_created_by"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_groups_set_name_norm"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_groups_set_name_norm"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_groups_set_name_norm"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_groups_stamp_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_groups_stamp_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_groups_stamp_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_process_notification_event_mentorship"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_process_notification_event_mentorship"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_process_notification_event_mentorship"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_last_message_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_last_message_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_published_status"("event_id" "uuid", "status_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_published_status"("event_id" "uuid", "status_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_published_status"("event_id" "uuid", "status_value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_event_status_rpc"("event_id" "uuid", "new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_event_status_rpc"("event_id" "uuid", "new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_event_status_rpc"("event_id" "uuid", "new_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_full_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_full_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_full_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_timestamp_on_avatar_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_timestamp_on_avatar_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_timestamp_on_avatar_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_avatar"("p_file_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_avatar"("p_file_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_avatar"("p_file_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_role"("user_id" "uuid", "new_role" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_role"("user_id" "uuid", "new_role" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_role"("user_id" "uuid", "new_role" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_degree_by_code"("p_code" "text", "p_label" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_degree_by_code"("p_code" "text", "p_label" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_degree_by_code"("p_code" "text", "p_label" "text") TO "service_role";



GRANT ALL ON PROCEDURE "public"."upsert_department"(IN "p_degree_code" "text", IN "p_dept" "text", IN "p_degree_label" "text") TO "anon";
GRANT ALL ON PROCEDURE "public"."upsert_department"(IN "p_degree_code" "text", IN "p_dept" "text", IN "p_degree_label" "text") TO "authenticated";
GRANT ALL ON PROCEDURE "public"."upsert_department"(IN "p_degree_code" "text", IN "p_dept" "text", IN "p_degree_label" "text") TO "service_role";



GRANT ALL ON TABLE "public"."social_links" TO "anon";
GRANT ALL ON TABLE "public"."social_links" TO "authenticated";
GRANT ALL ON TABLE "public"."social_links" TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_social_link"("p_profile_id" "uuid", "p_type_text" "text", "p_url_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_social_link"("p_profile_id" "uuid", "p_type_text" "text", "p_url_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_social_link"("p_profile_id" "uuid", "p_type_text" "text", "p_url_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_activity_logs_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_activity_logs_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_activity_logs_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_permission"("profile_uuid" "uuid", "permission_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_permission"("profile_uuid" "uuid", "permission_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_permission"("profile_uuid" "uuid", "permission_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_role"("profile_uuid" "uuid", "role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_role"("profile_uuid" "uuid", "role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_role"("profile_uuid" "uuid", "role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_profile_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_profile_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_profile_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_social_links"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_social_links"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_social_links"() TO "service_role";



GRANT ALL ON FUNCTION "public"."whoami_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."whoami_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."whoami_role"() TO "service_role";



GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "anon";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."apply_rls"("wal" "jsonb", "max_record_bytes" integer) TO "supabase_realtime_admin";



GRANT ALL ON FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."broadcast_changes"("topic_name" "text", "event_name" "text", "operation" "text", "table_name" "text", "table_schema" "text", "new" "record", "old" "record", "level" "text") TO "dashboard_user";



GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "anon";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."build_prepared_statement_sql"("prepared_statement_name" "text", "entity" "regclass", "columns" "realtime"."wal_column"[]) TO "supabase_realtime_admin";



GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "anon";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."cast"("val" "text", "type_" "regtype") TO "supabase_realtime_admin";



GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "anon";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."check_equality_op"("op" "realtime"."equality_op", "type_" "regtype", "val_1" "text", "val_2" "text") TO "supabase_realtime_admin";



GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "anon";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."is_visible_through_filters"("columns" "realtime"."wal_column"[], "filters" "realtime"."user_defined_filter"[]) TO "supabase_realtime_admin";



GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "anon";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "service_role";
GRANT ALL ON FUNCTION "realtime"."list_changes"("publication" "name", "slot_name" "name", "max_changes" integer, "max_record_bytes" integer) TO "supabase_realtime_admin";



GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "anon";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."quote_wal2json"("entity" "regclass") TO "supabase_realtime_admin";



GRANT ALL ON FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) TO "postgres";
GRANT ALL ON FUNCTION "realtime"."send"("payload" "jsonb", "event" "text", "topic" "text", "private" boolean) TO "dashboard_user";



GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "postgres";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "anon";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "service_role";
GRANT ALL ON FUNCTION "realtime"."subscription_check_filters"() TO "supabase_realtime_admin";



GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "postgres";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "dashboard_user";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "realtime"."to_regrole"("role_name" "text") TO "supabase_realtime_admin";



GRANT ALL ON FUNCTION "realtime"."topic"() TO "postgres";
GRANT ALL ON FUNCTION "realtime"."topic"() TO "dashboard_user";



GRANT ALL ON FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") TO "postgres";



GRANT ALL ON FUNCTION "storage"."extension"("name" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."filename"("name" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."foldername"("name" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."operation"() TO "postgres";



GRANT ALL ON FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") TO "postgres";



GRANT ALL ON FUNCTION "storage"."update_updated_at_column"() TO "postgres";



GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."admin_actions" TO "anon";
GRANT ALL ON TABLE "public"."admin_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_actions" TO "service_role";



GRANT ALL ON TABLE "public"."admin_analytics_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_analytics_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_analytics_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_deletion_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_deletion_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_deletion_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_invalid_degree_programs_audit" TO "anon";
GRANT ALL ON TABLE "public"."admin_invalid_degree_programs_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_invalid_degree_programs_audit" TO "service_role";



GRANT ALL ON TABLE "public"."admin_notifications" TO "anon";
GRANT ALL ON TABLE "public"."admin_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."admin_profiles_view" TO "anon";
GRANT ALL ON TABLE "public"."admin_profiles_view" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_profiles_view" TO "service_role";



GRANT ALL ON TABLE "public"."alumni_directory_public" TO "anon";
GRANT ALL ON TABLE "public"."alumni_directory_public" TO "authenticated";
GRANT ALL ON TABLE "public"."alumni_directory_public" TO "service_role";



GRANT ALL ON TABLE "public"."avatar_oauth_backup" TO "anon";
GRANT ALL ON TABLE "public"."avatar_oauth_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."avatar_oauth_backup" TO "service_role";



GRANT ALL ON TABLE "public"."avatar_upload_log" TO "anon";
GRANT ALL ON TABLE "public"."avatar_upload_log" TO "authenticated";
GRANT ALL ON TABLE "public"."avatar_upload_log" TO "service_role";



GRANT ALL ON TABLE "public"."backup_bad_conversations_20250905" TO "anon";
GRANT ALL ON TABLE "public"."backup_bad_conversations_20250905" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_bad_conversations_20250905" TO "service_role";



GRANT ALL ON TABLE "public"."backup_bad_conversations_20250905_json" TO "anon";
GRANT ALL ON TABLE "public"."backup_bad_conversations_20250905_json" TO "authenticated";
GRANT ALL ON TABLE "public"."backup_bad_conversations_20250905_json" TO "service_role";



GRANT ALL ON TABLE "public"."event_attendees" TO "anon";
GRANT ALL ON TABLE "public"."event_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."event_attendees" TO "service_role";



GRANT ALL ON TABLE "public"."event_attendance_counts" TO "anon";
GRANT ALL ON TABLE "public"."event_attendance_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."event_attendance_counts" TO "service_role";



GRANT ALL ON TABLE "public"."basic_event_metrics" TO "anon";
GRANT ALL ON TABLE "public"."basic_event_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."basic_event_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."bookmarked_jobs_legacy_do_not_use" TO "anon";
GRANT ALL ON TABLE "public"."bookmarked_jobs_legacy_do_not_use" TO "authenticated";
GRANT ALL ON TABLE "public"."bookmarked_jobs_legacy_do_not_use" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bookmarked_jobs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bookmarked_jobs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bookmarked_jobs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."clarification_requests" TO "anon";
GRANT ALL ON TABLE "public"."clarification_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."clarification_requests" TO "service_role";



GRANT ALL ON TABLE "public"."content_approvals" TO "anon";
GRANT ALL ON TABLE "public"."content_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."content_approvals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."content_approvals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."content_approvals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."content_approvals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."content_moderation" TO "anon";
GRANT ALL ON TABLE "public"."content_moderation" TO "authenticated";
GRANT ALL ON TABLE "public"."content_moderation" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_members" TO "anon";
GRANT ALL ON TABLE "public"."conversation_members" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_members" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";
GRANT SELECT ON TABLE "public"."conversation_participants" TO "authenticated";



GRANT ALL ON TABLE "public"."conversations" TO "service_role";
GRANT SELECT ON TABLE "public"."conversations" TO "authenticated";



GRANT ALL ON TABLE "public"."csv_import_history" TO "anon";
GRANT ALL ON TABLE "public"."csv_import_history" TO "authenticated";
GRANT ALL ON TABLE "public"."csv_import_history" TO "service_role";



GRANT ALL ON TABLE "public"."degree_programs" TO "anon";
GRANT ALL ON TABLE "public"."degree_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."degree_programs" TO "service_role";



GRANT ALL ON TABLE "public"."deletion_queue" TO "anon";
GRANT ALL ON TABLE "public"."deletion_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."deletion_queue" TO "service_role";



GRANT ALL ON TABLE "public"."event_feedback" TO "anon";
GRANT ALL ON TABLE "public"."event_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."event_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."detailed_event_feedback" TO "anon";
GRANT ALL ON TABLE "public"."detailed_event_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."detailed_event_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."directory_profiles" TO "anon";
GRANT ALL ON TABLE "public"."directory_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."directory_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."directory_profiles_extended" TO "anon";
GRANT ALL ON TABLE "public"."directory_profiles_extended" TO "authenticated";
GRANT ALL ON TABLE "public"."directory_profiles_extended" TO "service_role";



GRANT ALL ON TABLE "public"."directory_profiles_public" TO "anon";
GRANT ALL ON TABLE "public"."directory_profiles_public" TO "authenticated";
GRANT ALL ON TABLE "public"."directory_profiles_public" TO "service_role";



GRANT ALL ON TABLE "public"."directory_profiles_safe" TO "anon";
GRANT ALL ON TABLE "public"."directory_profiles_safe" TO "authenticated";
GRANT ALL ON TABLE "public"."directory_profiles_safe" TO "service_role";



GRANT ALL ON TABLE "public"."dm_participants" TO "service_role";
GRANT SELECT ON TABLE "public"."dm_participants" TO "authenticated";



GRANT ALL ON TABLE "public"."dm_threads" TO "service_role";
GRANT SELECT ON TABLE "public"."dm_threads" TO "authenticated";



GRANT ALL ON TABLE "public"."education_history" TO "anon";
GRANT ALL ON TABLE "public"."education_history" TO "authenticated";
GRANT ALL ON TABLE "public"."education_history" TO "service_role";



GRANT ALL ON TABLE "public"."event_attendees_with_profiles" TO "anon";
GRANT ALL ON TABLE "public"."event_attendees_with_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."event_attendees_with_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."event_groups" TO "anon";
GRANT ALL ON TABLE "public"."event_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."event_groups" TO "service_role";



GRANT ALL ON TABLE "public"."event_rsvps" TO "anon";
GRANT ALL ON TABLE "public"."event_rsvps" TO "authenticated";
GRANT ALL ON TABLE "public"."event_rsvps" TO "service_role";



GRANT ALL ON TABLE "public"."event_stats" TO "anon";
GRANT ALL ON TABLE "public"."event_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."event_stats" TO "service_role";



GRANT ALL ON TABLE "public"."events_count_by_status" TO "anon";
GRANT ALL ON TABLE "public"."events_count_by_status" TO "authenticated";
GRANT ALL ON TABLE "public"."events_count_by_status" TO "service_role";



GRANT ALL ON TABLE "public"."events_moderation_queue" TO "anon";
GRANT ALL ON TABLE "public"."events_moderation_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."events_moderation_queue" TO "service_role";



GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";



GRANT ALL ON TABLE "public"."group_comments" TO "anon";
GRANT ALL ON TABLE "public"."group_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."group_comments" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."group_memberships" TO "anon";
GRANT ALL ON TABLE "public"."group_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."group_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."group_moderation_state" TO "anon";
GRANT ALL ON TABLE "public"."group_moderation_state" TO "authenticated";
GRANT ALL ON TABLE "public"."group_moderation_state" TO "service_role";



GRANT ALL ON TABLE "public"."group_post_reports" TO "anon";
GRANT ALL ON TABLE "public"."group_post_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."group_post_reports" TO "service_role";



GRANT ALL ON TABLE "public"."group_posts" TO "anon";
GRANT ALL ON TABLE "public"."group_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."group_posts" TO "service_role";



GRANT ALL ON TABLE "public"."job_alerts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."job_alerts" TO "authenticated";



GRANT ALL ON TABLE "public"."job_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."job_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."job_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."job_postings" TO "anon";
GRANT ALL ON TABLE "public"."job_postings" TO "authenticated";
GRANT ALL ON TABLE "public"."job_postings" TO "service_role";



GRANT ALL ON TABLE "public"."mentee_profiles" TO "anon";
GRANT ALL ON TABLE "public"."mentee_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."mentee_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."mentees" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."mentees" TO "authenticated";



GRANT ALL ON TABLE "public"."mentor_availability" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."mentor_availability" TO "authenticated";



GRANT ALL ON TABLE "public"."mentor_profiles" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."mentor_profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."mentors_directory" TO "anon";
GRANT ALL ON TABLE "public"."mentors_directory" TO "authenticated";
GRANT ALL ON TABLE "public"."mentors_directory" TO "service_role";



GRANT ALL ON TABLE "public"."mentorship_appointments" TO "service_role";
GRANT SELECT ON TABLE "public"."mentorship_appointments" TO "authenticated";



GRANT ALL ON TABLE "public"."mentorship_feedback" TO "service_role";
GRANT SELECT ON TABLE "public"."mentorship_feedback" TO "authenticated";



GRANT ALL ON TABLE "public"."mentorship_messages" TO "service_role";



GRANT ALL ON TABLE "public"."mentorship_programs" TO "anon";
GRANT ALL ON TABLE "public"."mentorship_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."mentorship_programs" TO "service_role";



GRANT ALL ON TABLE "public"."mentorship_requests" TO "service_role";
GRANT SELECT ON TABLE "public"."mentorship_requests" TO "authenticated";



GRANT ALL ON TABLE "public"."mentorship_sessions" TO "service_role";
GRANT SELECT ON TABLE "public"."mentorship_sessions" TO "authenticated";



GRANT ALL ON TABLE "public"."mentorship_stats" TO "anon";
GRANT ALL ON TABLE "public"."mentorship_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."mentorship_stats" TO "service_role";



GRANT ALL ON TABLE "public"."mentorships" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "service_role";
GRANT SELECT ON TABLE "public"."messages" TO "authenticated";



GRANT ALL ON TABLE "public"."networking_group_members" TO "anon";
GRANT ALL ON TABLE "public"."networking_group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."networking_group_members" TO "service_role";



GRANT ALL ON TABLE "public"."networking_groups" TO "anon";
GRANT ALL ON TABLE "public"."networking_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."networking_groups" TO "service_role";



GRANT ALL ON TABLE "public"."notification_events" TO "anon";
GRANT ALL ON TABLE "public"."notification_events" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_events" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."profile_about_view" TO "anon";
GRANT ALL ON TABLE "public"."profile_about_view" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_about_view" TO "service_role";



GRANT ALL ON TABLE "public"."profile_achievements_view" TO "anon";
GRANT ALL ON TABLE "public"."profile_achievements_view" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_achievements_view" TO "service_role";



GRANT ALL ON TABLE "public"."profile_approval_log" TO "anon";
GRANT ALL ON TABLE "public"."profile_approval_log" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_approval_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profile_approval_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profile_approval_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profile_approval_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profile_education_view" TO "anon";
GRANT ALL ON TABLE "public"."profile_education_view" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_education_view" TO "service_role";



GRANT ALL ON TABLE "public"."profile_experience_view" TO "anon";
GRANT ALL ON TABLE "public"."profile_experience_view" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_experience_view" TO "service_role";



GRANT ALL ON TABLE "public"."profile_social_links" TO "anon";
GRANT ALL ON TABLE "public"."profile_social_links" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_social_links" TO "service_role";



GRANT ALL ON TABLE "public"."programs" TO "anon";
GRANT ALL ON TABLE "public"."programs" TO "authenticated";
GRANT ALL ON TABLE "public"."programs" TO "service_role";



GRANT ALL ON TABLE "public"."public_profiles_view" TO "anon";
GRANT ALL ON TABLE "public"."public_profiles_view" TO "authenticated";
GRANT ALL ON TABLE "public"."public_profiles_view" TO "service_role";



GRANT ALL ON TABLE "public"."public_profiles_view_old" TO "anon";
GRANT ALL ON TABLE "public"."public_profiles_view_old" TO "authenticated";
GRANT ALL ON TABLE "public"."public_profiles_view_old" TO "service_role";



GRANT ALL ON TABLE "public"."public_profiles_view_v2" TO "anon";
GRANT ALL ON TABLE "public"."public_profiles_view_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."public_profiles_view_v2" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."resume_profiles" TO "anon";
GRANT ALL ON TABLE "public"."resume_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."resume_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."social_links_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."social_links_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."social_links_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."system_alerts" TO "anon";
GRANT ALL ON TABLE "public"."system_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."system_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."system_analytics" TO "anon";
GRANT ALL ON TABLE "public"."system_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."system_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."user_jobs_with_bookmark" TO "anon";
GRANT ALL ON TABLE "public"."user_jobs_with_bookmark" TO "authenticated";
GRANT ALL ON TABLE "public"."user_jobs_with_bookmark" TO "service_role";



GRANT ALL ON TABLE "public"."user_resumes" TO "anon";
GRANT ALL ON TABLE "public"."user_resumes" TO "authenticated";
GRANT ALL ON TABLE "public"."user_resumes" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."v_can_view_post_for_current_user" TO "anon";
GRANT ALL ON TABLE "public"."v_can_view_post_for_current_user" TO "authenticated";
GRANT ALL ON TABLE "public"."v_can_view_post_for_current_user" TO "service_role";



GRANT ALL ON TABLE "public"."v_degree_department_groups" TO "anon";
GRANT ALL ON TABLE "public"."v_degree_department_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."v_degree_department_groups" TO "service_role";



GRANT ALL ON TABLE "public"."v_degrees" TO "anon";
GRANT ALL ON TABLE "public"."v_degrees" TO "authenticated";
GRANT ALL ON TABLE "public"."v_degrees" TO "service_role";



GRANT ALL ON TABLE "public"."v_departments" TO "anon";
GRANT ALL ON TABLE "public"."v_departments" TO "authenticated";
GRANT ALL ON TABLE "public"."v_departments" TO "service_role";



GRANT ALL ON TABLE "public"."v_directory_card_view" TO "anon";
GRANT ALL ON TABLE "public"."v_directory_card_view" TO "authenticated";
GRANT ALL ON TABLE "public"."v_directory_card_view" TO "service_role";



GRANT ALL ON TABLE "public"."v_directory_connection_states" TO "anon";
GRANT ALL ON TABLE "public"."v_directory_connection_states" TO "authenticated";
GRANT ALL ON TABLE "public"."v_directory_connection_states" TO "service_role";



GRANT ALL ON TABLE "public"."v_event_feedback_detailed" TO "anon";
GRANT ALL ON TABLE "public"."v_event_feedback_detailed" TO "authenticated";
GRANT ALL ON TABLE "public"."v_event_feedback_detailed" TO "service_role";



GRANT ALL ON TABLE "public"."v_event_organizer" TO "anon";
GRANT ALL ON TABLE "public"."v_event_organizer" TO "authenticated";
GRANT ALL ON TABLE "public"."v_event_organizer" TO "service_role";



GRANT ALL ON TABLE "public"."v_events_with_end_at" TO "anon";
GRANT ALL ON TABLE "public"."v_events_with_end_at" TO "authenticated";
GRANT ALL ON TABLE "public"."v_events_with_end_at" TO "service_role";



GRANT ALL ON TABLE "public"."v_groups_for_list" TO "anon";
GRANT ALL ON TABLE "public"."v_groups_for_list" TO "authenticated";
GRANT ALL ON TABLE "public"."v_groups_for_list" TO "service_role";



GRANT ALL ON TABLE "public"."v_jobs_feed" TO "anon";
GRANT ALL ON TABLE "public"."v_jobs_feed" TO "authenticated";
GRANT ALL ON TABLE "public"."v_jobs_feed" TO "service_role";



GRANT ALL ON TABLE "public"."v_jobs_feed_all" TO "anon";
GRANT ALL ON TABLE "public"."v_jobs_feed_all" TO "authenticated";
GRANT ALL ON TABLE "public"."v_jobs_feed_all" TO "service_role";



GRANT ALL ON TABLE "public"."v_jobs_public" TO "anon";
GRANT ALL ON TABLE "public"."v_jobs_public" TO "authenticated";
GRANT ALL ON TABLE "public"."v_jobs_public" TO "service_role";



GRANT ALL ON TABLE "public"."v_jobs_public_left" TO "anon";
GRANT ALL ON TABLE "public"."v_jobs_public_left" TO "authenticated";
GRANT ALL ON TABLE "public"."v_jobs_public_left" TO "service_role";



GRANT ALL ON TABLE "public"."v_jobs_public_with_qualification" TO "anon";
GRANT ALL ON TABLE "public"."v_jobs_public_with_qualification" TO "authenticated";
GRANT ALL ON TABLE "public"."v_jobs_public_with_qualification" TO "service_role";



GRANT ALL ON TABLE "public"."v_my_applications" TO "anon";
GRANT ALL ON TABLE "public"."v_my_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."v_my_applications" TO "service_role";



GRANT ALL ON TABLE "public"."v_my_dm_threads" TO "anon";
GRANT ALL ON TABLE "public"."v_my_dm_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."v_my_dm_threads" TO "service_role";



GRANT ALL ON TABLE "public"."v_my_event_rsvp" TO "anon";
GRANT ALL ON TABLE "public"."v_my_event_rsvp" TO "authenticated";
GRANT ALL ON TABLE "public"."v_my_event_rsvp" TO "service_role";



GRANT ALL ON TABLE "public"."v_my_groups" TO "anon";
GRANT ALL ON TABLE "public"."v_my_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."v_my_groups" TO "service_role";



GRANT ALL ON TABLE "public"."v_my_mentorship_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."v_my_mentorship_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."v_my_mentorship_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."v_my_mentorship_relationships" TO "anon";
GRANT ALL ON TABLE "public"."v_my_mentorship_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."v_my_mentorship_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."v_my_mentorship_requests" TO "anon";
GRANT ALL ON TABLE "public"."v_my_mentorship_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."v_my_mentorship_requests" TO "service_role";



GRANT ALL ON TABLE "public"."v_notification_prefs" TO "anon";
GRANT ALL ON TABLE "public"."v_notification_prefs" TO "authenticated";
GRANT ALL ON TABLE "public"."v_notification_prefs" TO "service_role";



GRANT ALL ON TABLE "public"."v_profiles_directory_card" TO "anon";
GRANT ALL ON TABLE "public"."v_profiles_directory_card" TO "authenticated";
GRANT ALL ON TABLE "public"."v_profiles_directory_card" TO "service_role";



GRANT ALL ON TABLE "public"."v_programs" TO "anon";
GRANT ALL ON TABLE "public"."v_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."v_programs" TO "service_role";



GRANT ALL ON TABLE "public"."v_recent_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."v_recent_activities" TO "service_role";



GRANT ALL ON TABLE "realtime"."messages" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages" TO "dashboard_user";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "anon";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "authenticated";
GRANT SELECT,INSERT,UPDATE ON TABLE "realtime"."messages" TO "service_role";



GRANT ALL ON TABLE "realtime"."messages_2025_12_01" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_12_01" TO "dashboard_user";



GRANT ALL ON TABLE "realtime"."messages_2025_12_02" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_12_02" TO "dashboard_user";



GRANT ALL ON TABLE "realtime"."messages_2025_12_03" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_12_03" TO "dashboard_user";



GRANT ALL ON TABLE "realtime"."messages_2025_12_04" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_12_04" TO "dashboard_user";



GRANT ALL ON TABLE "realtime"."messages_2025_12_05" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_12_05" TO "dashboard_user";



GRANT ALL ON TABLE "realtime"."messages_2025_12_06" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_12_06" TO "dashboard_user";



GRANT ALL ON TABLE "realtime"."messages_2025_12_07" TO "postgres";
GRANT ALL ON TABLE "realtime"."messages_2025_12_07" TO "dashboard_user";



GRANT ALL ON TABLE "realtime"."schema_migrations" TO "postgres";
GRANT ALL ON TABLE "realtime"."schema_migrations" TO "dashboard_user";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "anon";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "authenticated";
GRANT SELECT ON TABLE "realtime"."schema_migrations" TO "service_role";
GRANT ALL ON TABLE "realtime"."schema_migrations" TO "supabase_realtime_admin";



GRANT ALL ON TABLE "realtime"."subscription" TO "postgres";
GRANT ALL ON TABLE "realtime"."subscription" TO "dashboard_user";
GRANT SELECT ON TABLE "realtime"."subscription" TO "anon";
GRANT SELECT ON TABLE "realtime"."subscription" TO "authenticated";
GRANT SELECT ON TABLE "realtime"."subscription" TO "service_role";
GRANT ALL ON TABLE "realtime"."subscription" TO "supabase_realtime_admin";



GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "postgres";
GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "dashboard_user";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "anon";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "realtime"."subscription_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "realtime"."subscription_id_seq" TO "supabase_realtime_admin";



REVOKE ALL ON TABLE "storage"."buckets" FROM "supabase_storage_admin";
GRANT ALL ON TABLE "storage"."buckets" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."buckets_analytics" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "anon";



GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "service_role";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "authenticated";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "anon";



REVOKE ALL ON TABLE "storage"."objects" FROM "supabase_storage_admin";
GRANT ALL ON TABLE "storage"."objects" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."prefixes" TO "service_role";
GRANT ALL ON TABLE "storage"."prefixes" TO "authenticated";
GRANT ALL ON TABLE "storage"."prefixes" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";
GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "postgres";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";
GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "postgres";



GRANT SELECT ON TABLE "storage"."vector_indexes" TO "service_role";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "authenticated";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "anon";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";















ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES  TO "service_role";



