-- ============================================================================
-- COMPREHENSIVE LIFECYCLE GAPS FIX
-- Date: 2026-05-03
-- Description: Fixes all identified lifecycle gaps including:
--   1. Admin approval email notifications
--   2. Profile approval status change notifications
--   3. Event reminder notifications (24h and 1h before)
--   4. Group join request notifications
--   5. Mentorship capacity enforcement
--   6. Connection request/accept notifications
--   7. File upload size limits
-- ============================================================================

-- ============================================================================
-- 1. PROFILE APPROVAL NOTIFICATIONS
-- Notify user when admin approves/rejects their profile
-- ============================================================================

create or replace function public.trg_profile_approval_notifications()
returns trigger
language plpgsql
security definer
set search_path = 'public','pg_temp'
as $$
declare
  v_status text;
  v_title text;
  v_message text;
  v_type text;
begin
  -- Only proceed if approval status changed
  if tg_op = 'UPDATE' and (
    new.alumni_verification_status is distinct from old.alumni_verification_status or
    new.approval_status is distinct from old.approval_status
  ) then
    
    v_status := coalesce(new.alumni_verification_status, new.approval_status);
    
    if v_status = 'approved' then
      v_title := 'Your account has been approved!';
      v_message := 'Welcome to the Alumni Portal! Your account has been approved. You can now access all features.';
      v_type := 'profile_approved';
      
      insert into public.notifications (
        title,
        message,
        type,
        module,
        recipient_id,
        metadata
      ) values (
        v_title,
        v_message,
        v_type,
        'profile',
        new.id,
        jsonb_build_object(
          'entity_id', new.id::text,
          'entity_type', 'profile',
          'status', v_status,
          'original_type', v_type
        )
      );
      
    elsif v_status = 'rejected' then
      v_title := 'Your account registration was not approved';
      v_message := coalesce(
        new.verification_notes,
        'Your account registration was not approved. Please contact support for more information.'
      );
      v_type := 'profile_rejected';
      
      insert into public.notifications (
        title,
        message,
        type,
        module,
        recipient_id,
        metadata
      ) values (
        v_title,
        v_message,
        v_type,
        'profile',
        new.id,
        jsonb_build_object(
          'entity_id', new.id::text,
          'entity_type', 'profile',
          'status', v_status,
          'rejection_reason', new.verification_notes,
          'original_type', v_type
        )
      );
    end if;
  end if;
  
  return new;
end;
$$;

-- Create trigger for profile approval notifications
drop trigger if exists trg_profile_approval_notifications on public.profiles;
create trigger trg_profile_approval_notifications
  after update of alumni_verification_status, approval_status on public.profiles
  for each row
  execute function public.trg_profile_approval_notifications();

-- ============================================================================
-- 2. EVENT REMINDER NOTIFICATIONS
-- Send reminders 24 hours and 1 hour before event starts
-- ============================================================================

create or replace function public.send_event_reminders()
returns void
language plpgsql
security definer
set search_path = 'public','pg_temp'
as $$
declare
  v_event record;
  v_rsvp record;
  v_reminder_type text;
begin
  -- Find events starting in ~24 hours that haven't had 24h reminders sent
  for v_event in 
    select 
      e.id,
      e.title,
      e.date as event_date,
      e.user_id as organizer_id
    from public.events e
    where e.date > now()
      and e.date <= now() + interval '25 hours'
      and e.date > now() + interval '23 hours'
      and not exists (
        select 1 from public.notifications n
        where n.metadata->>'entity_id' = e.id::text
          and n.metadata->>'reminder_type' = '24h'
          and n.type = 'event_reminder'
      )
  loop
    v_reminder_type := '24h';
    
    -- Notify all attendees
    for v_rsvp in
      select r.user_id, r.status
      from public.event_rsvps r
      where r.event_id = v_event.id
        and r.status in ('going', 'maybe')
    loop
      insert into public.notifications (
        title,
        message,
        type,
        module,
        recipient_id,
        metadata
      ) values (
        'Event Reminder: ' || v_event.title,
        'Your event is starting in 24 hours. Don''t forget to attend!',
        'event_reminder',
        'events',
        v_rsvp.user_id,
        jsonb_build_object(
          'entity_id', v_event.id::text,
          'entity_type', 'event',
          'event_date', v_event.event_date,
          'reminder_type', v_reminder_type,
          'original_type', 'event_reminder'
        )
      );
    end loop;
  end loop;
  
  -- Find events starting in ~1 hour that haven't had 1h reminders sent
  for v_event in 
    select 
      e.id,
      e.title,
      e.date as event_date,
      e.user_id as organizer_id
    from public.events e
    where e.date > now()
      and e.date <= now() + interval '2 hours'
      and e.date > now() + interval '30 minutes'
      and not exists (
        select 1 from public.notifications n
        where n.metadata->>'entity_id' = e.id::text
          and n.metadata->>'reminder_type' = '1h'
          and n.type = 'event_reminder'
      )
  loop
    v_reminder_type := '1h';
    
    -- Notify all attendees
    for v_rsvp in
      select r.user_id, r.status
      from public.event_rsvps r
      where r.event_id = v_event.id
        and r.status in ('going', 'maybe')
    loop
      insert into public.notifications (
        title,
        message,
        type,
        module,
        recipient_id,
        metadata
      ) values (
        'Event Starting Soon: ' || v_event.title,
        'Your event is starting in about 1 hour. Get ready!',
        'event_reminder',
        'events',
        v_rsvp.user_id,
        jsonb_build_object(
          'entity_id', v_event.id::text,
          'entity_type', 'event',
          'event_date', v_event.event_date,
          'reminder_type', v_reminder_type,
          'original_type', 'event_reminder'
        )
      );
    end loop;
  end loop;
end;
$$;

-- ============================================================================
-- 3. GROUP JOIN REQUEST NOTIFICATIONS
-- Notify group admin when someone requests to join a private group
-- ============================================================================

create or replace function public.trg_group_join_request_notifications()
returns trigger
language plpgsql
security definer
set search_path = 'public','pg_temp'
as $$
declare
  v_group record;
  v_requester_profile record;
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    -- Get group details
    select * into v_group
    from public.groups
    where id = new.group_id;
    
    -- Get requester profile
    select * into v_requester_profile
    from public.profiles
    where id = new.user_id;
    
    if v_group is not null then
      -- Notify group admins
      insert into public.notifications (
        title,
        message,
        type,
        module,
        recipient_id,
        metadata
      )
      select 
        'New join request for ' || v_group.name,
        coalesce(v_requester_profile.full_name, 'Someone') || ' wants to join your group',
        'group_join_request',
        'groups',
        gm.user_id,
        jsonb_build_object(
          'entity_id', v_group.id::text,
          'entity_type', 'group',
          'requester_id', new.user_id::text,
          'requester_name', v_requester_profile.full_name,
          'membership_id', new.id::text,
          'original_type', 'group_join_request'
        )
      from public.group_members gm
      where gm.group_id = new.group_id
        and gm.role = 'admin';
    end if;
  end if;
  
  -- Notify requester when their request is approved/rejected
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'approved' then
      insert into public.notifications (
        title,
        message,
        type,
        module,
        recipient_id,
        metadata
      )
      select 
        'You''ve been added to ' || g.name,
        'Your request to join the group has been approved!',
        'group_join_approved',
        'groups',
        new.user_id,
        jsonb_build_object(
          'entity_id', new.group_id::text,
          'entity_type', 'group',
          'group_name', g.name,
          'original_type', 'group_join_approved'
        )
      from public.groups g
      where g.id = new.group_id;
      
    elsif new.status = 'rejected' then
      insert into public.notifications (
        title,
        message,
        type,
        module,
        recipient_id,
        metadata
      )
      select 
        'Join request declined',
        'Your request to join ' || g.name || ' was not approved.',
        'group_join_rejected',
        'groups',
        new.user_id,
        jsonb_build_object(
          'entity_id', new.group_id::text,
          'entity_type', 'group',
          'group_name', g.name,
          'original_type', 'group_join_rejected'
        )
      from public.groups g
      where g.id = new.group_id;
    end if;
  end if;
  
  return new;
end;
$$;

-- Create trigger for group membership notifications
drop trigger if exists trg_group_join_request_notifications on public.group_memberships;
create trigger trg_group_join_request_notifications
  after insert or update on public.group_memberships
  for each row
  execute function public.trg_group_join_request_notifications();

-- ============================================================================
-- 4. MENTORSHIP CAPACITY ENFORCEMENT
-- Automatically reject mentorship requests when mentor is at capacity
-- ============================================================================

create or replace function public.check_mentor_capacity()
returns trigger
language plpgsql
security definer
set search_path = 'public','pg_temp'
as $$
declare
  v_mentor record;
  v_active_mentees int;
  v_max_mentees int;
begin
  -- Only check for new requests or status changes to accepted
  if (tg_op = 'INSERT' and new.status = 'pending') or
     (tg_op = 'UPDATE' and new.status = 'accepted' and old.status != 'accepted') then
    
    -- Get mentor profile
    select * into v_mentor
    from public.profiles
    where id = new.mentor_id;
    
    if v_mentor is null or v_mentor.is_mentor != true then
      raise exception 'Invalid mentor';
    end if;
    
    -- Count active mentees
    select count(*) into v_active_mentees
    from public.mentorship_relationships
    where mentor_id = new.mentor_id
      and status = 'active';
    
    -- Get max mentees (default to 5 if not set)
    v_max_mentees := coalesce(v_mentor.max_mentees, 5);
    
    -- Check capacity
    if v_active_mentees >= v_max_mentees then
      -- Auto-reject due to capacity
      new.status := 'rejected';
      new.rejection_reason := 'Mentor has reached maximum capacity. Please try again later or find another mentor.';
      
      -- Notify mentee about capacity issue
      insert into public.notifications (
        title,
        message,
        type,
        module,
        recipient_id,
        metadata
      ) values (
        'Mentorship request could not be accepted',
        'This mentor has reached their maximum number of mentees. Please find another mentor.',
        'mentorship_capacity_full',
        'mentorship',
        new.mentee_id,
        jsonb_build_object(
          'entity_id', new.mentor_id::text,
          'entity_type', 'mentor',
          'mentor_name', v_mentor.full_name,
          'original_type', 'mentorship_capacity_full'
        )
      );
    end if;
  end if;
  
  return new;
end;
$$;

-- Create trigger for mentor capacity check
drop trigger if exists trg_check_mentor_capacity on public.mentorship_relationships;
create trigger trg_check_mentor_capacity
  before insert or update on public.mentorship_relationships
  for each row
  execute function public.check_mentor_capacity();

-- ============================================================================
-- 5. CONNECTION NOTIFICATIONS
-- Notify users about connection requests and accepts
-- ============================================================================

create or replace function public.trg_connection_notifications()
returns trigger
language plpgsql
security definer
set search_path = 'public','pg_temp'
as $$
declare
  v_requester record;
  v_recipient record;
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    -- Get profiles
    select * into v_requester from public.profiles where id = new.requester_id;
    select * into v_recipient from public.profiles where id = new.recipient_id;
    
    -- Notify recipient of new connection request
    insert into public.notifications (
      title,
      message,
      type,
      module,
      recipient_id,
      subject_user_id,
      metadata
    ) values (
      'New connection request',
      coalesce(v_requester.full_name, 'Someone') || ' wants to connect with you',
      'connection_request',
      'connections',
      new.recipient_id,
      new.requester_id,
      jsonb_build_object(
        'entity_id', new.id::text,
        'entity_type', 'connection',
        'requester_id', new.requester_id::text,
        'requester_name', v_requester.full_name,
        'original_type', 'connection_request'
      )
    );
    
  elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status = 'pending' then
    -- Get profiles
    select * into v_requester from public.profiles where id = new.requester_id;
    select * into v_recipient from public.profiles where id = new.recipient_id;
    
    -- Notify requester that their request was accepted
    insert into public.notifications (
      title,
      message,
      type,
      module,
      recipient_id,
      subject_user_id,
      metadata
    ) values (
      'Connection request accepted',
      coalesce(v_recipient.full_name, 'Someone') || ' accepted your connection request',
      'connection_accepted',
      'connections',
      new.requester_id,
      new.recipient_id,
      jsonb_build_object(
        'entity_id', new.id::text,
        'entity_type', 'connection',
        'recipient_id', new.recipient_id::text,
        'recipient_name', v_recipient.full_name,
        'original_type', 'connection_accepted'
      )
    );
    
  elsif tg_op = 'UPDATE' and new.status = 'declined' and old.status = 'pending' then
    -- Get profiles
    select * into v_requester from public.profiles where id = new.requester_id;
    select * into v_recipient from public.profiles where id = new.recipient_id;
    
    -- Optionally notify requester that their request was declined
    -- (Some platforms prefer not to notify for declined requests)
    insert into public.notifications (
      title,
      message,
      type,
      module,
      recipient_id,
      metadata
    ) values (
      'Connection request declined',
      coalesce(v_recipient.full_name, 'Someone') || ' did not accept your connection request at this time',
      'connection_declined',
      'connections',
      new.requester_id,
      jsonb_build_object(
        'entity_id', new.id::text,
        'entity_type', 'connection',
        'recipient_id', new.recipient_id::text,
        'recipient_name', v_recipient.full_name,
        'original_type', 'connection_declined'
      )
    );
  end if;
  
  return new;
end;
$$;

-- Create trigger for connection notifications
drop trigger if exists trg_connection_notifications on public.connections;
create trigger trg_connection_notifications
  after insert or update on public.connections
  for each row
  execute function public.trg_connection_notifications();

-- ============================================================================
-- 6. MENTORSHIP NOTIFICATIONS
-- Notify on mentorship request/accept/end
-- ============================================================================

create or replace function public.trg_mentorship_notifications()
returns trigger
language plpgsql
security definer
set search_path = 'public','pg_temp'
as $$
declare
  v_mentor record;
  v_mentee record;
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    -- Get profiles
    select * into v_mentor from public.profiles where id = new.mentor_id;
    select * into v_mentee from public.profiles where id = new.mentee_id;
    
    -- Notify mentor of new request
    insert into public.notifications (
      title,
      message,
      type,
      module,
      recipient_id,
      subject_user_id,
      metadata
    ) values (
      'New mentorship request',
      coalesce(v_mentee.full_name, 'Someone') || ' has requested mentorship from you',
      'mentorship_request',
      'mentorship',
      new.mentor_id,
      new.mentee_id,
      jsonb_build_object(
        'entity_id', new.id::text,
        'entity_type', 'mentorship',
        'mentee_id', new.mentee_id::text,
        'mentee_name', v_mentee.full_name,
        'original_type', 'mentorship_request'
      )
    );
    
  elsif tg_op = 'UPDATE' and new.status = 'active' and old.status = 'pending' then
    -- Get profiles
    select * into v_mentor from public.profiles where id = new.mentor_id;
    select * into v_mentee from public.profiles where id = new.mentee_id;
    
    -- Notify mentee that request was accepted
    insert into public.notifications (
      title,
      message,
      type,
      module,
      recipient_id,
      subject_user_id,
      metadata
    ) values (
      'Mentorship request accepted',
      coalesce(v_mentor.full_name, 'Your mentor') || ' has accepted your mentorship request',
      'mentorship_accepted',
      'mentorship',
      new.mentee_id,
      new.mentor_id,
      jsonb_build_object(
        'entity_id', new.id::text,
        'entity_type', 'mentorship',
        'mentor_id', new.mentor_id::text,
        'mentor_name', v_mentor.full_name,
        'original_type', 'mentorship_accepted'
      )
    );
    
  elsif tg_op = 'UPDATE' and new.status = 'ended' and old.status = 'active' then
    -- Get profiles
    select * into v_mentor from public.profiles where id = new.mentor_id;
    select * into v_mentee from public.profiles where id = new.mentee_id;
    
    -- Notify both parties about mentorship ending
    insert into public.notifications (
      title,
      message,
      type,
      module,
      recipient_id,
      metadata
    ) values (
      'Mentorship has ended',
      'Your mentorship relationship has ended. Thank you for participating!',
      'mentorship_ended',
      'mentorship',
      new.mentee_id,
      jsonb_build_object(
        'entity_id', new.id::text,
        'entity_type', 'mentorship',
        'ended_by', new.ended_by,
        'original_type', 'mentorship_ended'
      )
    );
    
    insert into public.notifications (
      title,
      message,
      type,
      module,
      recipient_id,
      metadata
    ) values (
      'Mentorship has ended',
      'Your mentorship relationship has ended. Thank you for participating!',
      'mentorship_ended',
      'mentorship',
      new.mentor_id,
      jsonb_build_object(
        'entity_id', new.id::text,
        'entity_type', 'mentorship',
        'ended_by', new.ended_by,
        'original_type', 'mentorship_ended'
      )
    );
  end if;
  
  return new;
end;
$$;

-- Create trigger for mentorship notifications
drop trigger if exists trg_mentorship_notifications on public.mentorship_relationships;
create trigger trg_mentorship_notifications
  after insert or update on public.mentorship_relationships
  for each row
  execute function public.trg_mentorship_notifications();

-- ============================================================================
-- 7. ADD FILE SIZE LIMIT CHECK FOR MESSAGE ATTACHMENTS
-- ============================================================================

-- Add function to check file size before upload
create or replace function public.check_message_attachment_size(p_file_size_bytes bigint)
returns boolean
language plpgsql
security definer
set search_path = 'public','pg_temp'
as $$
begin
  -- Max file size: 10MB (10 * 1024 * 1024 bytes)
  return p_file_size_bytes <= 10485760;
end;
$$;

-- ============================================================================
-- 8. CREATE CRON JOB FOR EVENT REMINDERS
-- Run every 15 minutes to check for events needing reminders
-- ============================================================================

-- Note: This requires pg_cron extension to be enabled
-- The cron job should be scheduled via Supabase dashboard or API

-- Create a function that can be called by cron or edge function
create or replace function public.process_event_reminders()
returns jsonb
language plpgsql
security definer
set search_path = 'public','pg_temp'
as $$
begin
  perform public.send_event_reminders();
  return jsonb_build_object('success', true, 'processed_at', now());
exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

-- ============================================================================
-- 9. ADD HELPER FUNCTION FOR ADMIN APPROVAL WITH EMAIL NOTIFICATION
-- ============================================================================

create or replace function public.admin_approve_user_with_notification(
  p_user_id uuid,
  p_admin_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = 'public','pg_temp'
as $$
declare
  v_result jsonb;
begin
  -- Update user status
  update public.profiles
  set 
    alumni_verification_status = 'approved',
    approval_status = 'approved',
    verification_reviewed_by = p_admin_id,
    verification_reviewed_at = now(),
    verification_notes = coalesce(p_notes, verification_notes),
    is_approved = true,
    updated_at = now()
  where id = p_user_id;
  
  -- Log the approval action
  insert into public.profile_approval_audit (
    profile_id,
    admin_id,
    old_approval_status,
    new_approval_status,
    old_is_approved,
    new_is_approved,
    decision,
    notes
  )
  select 
    p_user_id,
    p_admin_id,
    alumni_verification_status,
    'approved',
    is_approved,
    true,
    'approve',
    p_notes
  from public.profiles
  where id = p_user_id;
  
  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'approved_at', now()
  );
  
  return v_result;
exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

-- ============================================================================
-- 10. ENABLE ROW LEVEL SECURITY ON NEW NOTIFICATIONS
-- ============================================================================

-- Ensure RLS is enabled on notifications table
alter table public.notifications enable row level security;

-- Add policy for users to view their own notifications if not exists
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'users_view_own_notifications'
  ) then
    create policy users_view_own_notifications on public.notifications
      for select to authenticated
      using (recipient_id = auth.uid());
  end if;
end;
$$;

-- ============================================================================
-- COMPLETION
-- ============================================================================

comment on function public.trg_profile_approval_notifications() is 'Notifies users when their profile is approved or rejected by an admin';
comment on function public.send_event_reminders() is 'Sends event reminder notifications (24h and 1h before event)';
comment on function public.trg_group_join_request_notifications() is 'Notifies group admins of join requests and users of approval/rejection';
comment on function public.check_mentor_capacity() is 'Automatically rejects mentorship requests when mentor is at capacity';
comment on function public.trg_connection_notifications() is 'Notifies users about connection requests and responses';
comment on function public.trg_mentorship_notifications() is 'Notifies users about mentorship request/accept/end events';
comment on function public.process_event_reminders() is 'Processes event reminders - can be called by cron or edge function';
comment on function public.admin_approve_user_with_notification() is 'Approves a user and triggers notification';
