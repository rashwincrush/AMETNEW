-- API Functions for AMET Alumni Network
-- Date: 2025-06-21

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  -- First update stats to get the latest numbers
  PERFORM public.update_dashboard_stats();
  
  -- Then compile stats into a JSONB object
  SELECT jsonb_build_object(
    'totalUsers', COALESCE((SELECT stat_value FROM public.dashboard_stats WHERE stat_name = 'total_users' AND stat_period = 'all_time'), 0),
    'totalJobs', COALESCE((SELECT stat_value FROM public.dashboard_stats WHERE stat_name = 'total_jobs' AND stat_period = 'all_time'), 0),
    'activeJobs', COALESCE((SELECT stat_value FROM public.dashboard_stats WHERE stat_name = 'active_jobs' AND stat_period = 'all_time'), 0),
    'totalApplications', COALESCE((SELECT stat_value FROM public.dashboard_stats WHERE stat_name = 'total_applications' AND stat_period = 'all_time'), 0),
    'pendingApplications', COALESCE((SELECT stat_value FROM public.dashboard_stats WHERE stat_name = 'pending_applications' AND stat_period = 'all_time'), 0),
    'messagesToday', COALESCE((SELECT stat_value FROM public.dashboard_stats WHERE stat_name = 'messages_today' AND stat_period = 'daily' AND date_from = CURRENT_DATE), 0),
    'recentActivity', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id,
        'profileId', a.profile_id,
        'activityType', a.activity_type,
        'description', a.description,
        'createdAt', a.created_at
      ))
      FROM public.activity_logs a
      ORDER BY a.created_at DESC
      LIMIT 10
    ),
    'usersByRole', (
      SELECT jsonb_object_agg(role, count)
      FROM (
        SELECT COALESCE(role, 'user') AS role, COUNT(*) AS count
        FROM public.profiles
        GROUP BY role
      ) roles
    ),
    'lastUpdated', NOW()
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get job applications for review
CREATE OR REPLACE FUNCTION public.get_job_applications_for_review(
  p_status TEXT DEFAULT NULL,
  p_job_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  job_id UUID,
  job_title TEXT,
  company TEXT,
  applicant_id UUID,
  applicant_name TEXT,
  applicant_email TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT,
  employer_notes TEXT,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewer_name TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ja.id, 
    ja.job_id,
    j.title AS job_title,
    j.company,
    ja.applicant_id,
    (p1.first_name || ' ' || p1.last_name) AS applicant_name,
    p1.email AS applicant_email,
    ja.resume_url,
    ja.cover_letter,
    ja.status,
    ja.employer_notes,
    ja.admin_notes,
    ja.reviewed_by,
    (p2.first_name || ' ' || p2.last_name) AS reviewer_name,
    ja.reviewed_at,
    ja.created_at,
    ja.updated_at
  FROM 
    public.job_applications ja
    JOIN public.jobs j ON ja.job_id = j.id
    JOIN public.profiles p1 ON ja.applicant_id = p1.id
    LEFT JOIN public.profiles p2 ON ja.reviewed_by = p2.id
  WHERE
    (p_status IS NULL OR ja.status = p_status) AND
    (p_job_id IS NULL OR ja.job_id = p_job_id)
  ORDER BY 
    CASE 
      WHEN ja.status = 'pending' THEN 0
      WHEN ja.status = 'under_review' THEN 1
      ELSE 2
    END,
    ja.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to review a job application
CREATE OR REPLACE FUNCTION public.review_job_application(
  p_application_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_reviewer_id UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  v_job_id UUID;
  v_applicant_id UUID;
BEGIN
  -- Update the job application status
  UPDATE public.job_applications
  SET 
    status = p_status,
    admin_notes = COALESCE(p_notes, admin_notes),
    reviewed_by = p_reviewer_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_application_id
  RETURNING job_id, applicant_id INTO v_job_id, v_applicant_id;
  
  -- Return the result
  SELECT jsonb_build_object(
    'success', TRUE,
    'applicationId', p_application_id,
    'status', p_status,
    'jobId', v_job_id,
    'applicantId', v_applicant_id,
    'reviewedBy', p_reviewer_id,
    'reviewedAt', NOW()
  ) INTO result;
  
  -- Insert activity log
  INSERT INTO public.activity_logs (
    profile_id, 
    activity_type, 
    entity_type, 
    entity_id, 
    description, 
    metadata
  )
  VALUES (
    p_reviewer_id,
    'job_application_review',
    'job_application',
    p_application_id,
    'Job application status updated to ' || p_status,
    jsonb_build_object(
      'jobId', v_job_id,
      'applicantId', v_applicant_id,
      'status', p_status,
      'notes', p_notes
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a message thread
CREATE OR REPLACE FUNCTION public.create_message_thread(
  p_subject TEXT,
  p_participants UUID[],
  p_initial_message TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_thread_id UUID;
  v_sender_id UUID := auth.uid();
  v_result JSONB;
  v_recipient_id UUID;
BEGIN
  -- Create the thread
  INSERT INTO public.message_threads (subject, created_by)
  VALUES (p_subject, v_sender_id)
  RETURNING id INTO v_thread_id;
  
  -- Add participants (including sender)
  INSERT INTO public.thread_participants (thread_id, profile_id)
  SELECT v_thread_id, unnest(p_participants);
  
  -- Ensure sender is in participants
  INSERT INTO public.thread_participants (thread_id, profile_id)
  VALUES (v_thread_id, v_sender_id)
  ON CONFLICT DO NOTHING;
  
  -- Add first message (to first participant)
  SELECT profile_id INTO v_recipient_id
  FROM public.thread_participants
  WHERE thread_id = v_thread_id AND profile_id != v_sender_id
  LIMIT 1;
  
  INSERT INTO public.messages (thread_id, sender_id, recipient_id, content)
  VALUES (v_thread_id, v_sender_id, v_recipient_id, p_initial_message);
  
  -- Log activity
  INSERT INTO public.activity_logs (
    profile_id, 
    activity_type, 
    entity_type, 
    entity_id, 
    description
  )
  VALUES (
    v_sender_id,
    'thread_created',
    'message_thread',
    v_thread_id,
    'Created new message thread: ' || p_subject
  );
  
  -- Return thread info
  SELECT jsonb_build_object(
    'success', TRUE,
    'threadId', v_thread_id,
    'subject', p_subject,
    'createdBy', v_sender_id,
    'participants', (
      SELECT jsonb_agg(profile_id)
      FROM public.thread_participants
      WHERE thread_id = v_thread_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send a message in a thread
CREATE OR REPLACE FUNCTION public.send_message(
  p_thread_id UUID,
  p_content TEXT,
  p_recipient_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_sender_id UUID := auth.uid();
  v_message_id UUID;
  v_recipient UUID;
  v_result JSONB;
BEGIN
  -- Verify sender is in thread
  IF NOT EXISTS (
    SELECT 1 FROM public.thread_participants
    WHERE thread_id = p_thread_id AND profile_id = v_sender_id
  ) THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Not a thread participant');
  END IF;
  
  -- If recipient not specified, get first other participant
  IF p_recipient_id IS NULL THEN
    SELECT profile_id INTO v_recipient
    FROM public.thread_participants
    WHERE thread_id = p_thread_id AND profile_id != v_sender_id
    LIMIT 1;
  ELSE
    -- Verify recipient is in thread
    IF NOT EXISTS (
      SELECT 1 FROM public.thread_participants
      WHERE thread_id = p_thread_id AND profile_id = p_recipient_id
    ) THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'Recipient not in thread');
    END IF;
    
    v_recipient := p_recipient_id;
  END IF;
  
  -- Create message
  INSERT INTO public.messages (thread_id, sender_id, recipient_id, content)
  VALUES (p_thread_id, v_sender_id, v_recipient, p_content)
  RETURNING id INTO v_message_id;
  
  -- Update thread last message time
  UPDATE public.message_threads
  SET last_message_at = NOW(), updated_at = NOW()
  WHERE id = p_thread_id;
  
  -- Return message info
  SELECT jsonb_build_object(
    'success', TRUE,
    'messageId', v_message_id,
    'threadId', p_thread_id,
    'senderId', v_sender_id,
    'recipientId', v_recipient,
    'createdAt', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user threads with latest message
CREATE OR REPLACE FUNCTION public.get_user_message_threads(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  thread_id UUID,
  subject TEXT,
  created_by UUID,
  creator_name TEXT,
  is_archived BOOLEAN,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  participants JSONB,
  latest_message JSONB,
  unread_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id AS thread_id,
    t.subject,
    t.created_by,
    (p.first_name || ' ' || p.last_name) AS creator_name,
    t.is_archived,
    t.last_message_at,
    t.created_at,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'profileId', tp.profile_id,
        'name', (pp.first_name || ' ' || pp.last_name),
        'avatar', pp.avatar_url
      ))
      FROM public.thread_participants tp
      JOIN public.profiles pp ON tp.profile_id = pp.id
      WHERE tp.thread_id = t.id
    ) AS participants,
    (
      SELECT jsonb_build_object(
        'id', m.id,
        'content', m.content,
        'senderId', m.sender_id,
        'senderName', (ps.first_name || ' ' || ps.last_name),
        'createdAt', m.created_at
      )
      FROM public.messages m
      JOIN public.profiles ps ON m.sender_id = ps.id
      WHERE m.thread_id = t.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS latest_message,
    (
      SELECT COUNT(*)
      FROM public.messages m
      WHERE m.thread_id = t.id
      AND m.recipient_id = auth.uid()
      AND m.is_read = FALSE
    ) AS unread_count
  FROM 
    public.message_threads t
    JOIN public.profiles p ON t.created_by = p.id
    JOIN public.thread_participants tp ON t.id = tp.thread_id
  WHERE 
    tp.profile_id = auth.uid()
  ORDER BY 
    t.last_message_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get thread messages
CREATE OR REPLACE FUNCTION public.get_thread_messages(
  p_thread_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  recipient_id UUID,
  recipient_name TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Mark all incoming messages as read
  UPDATE public.messages 
  SET is_read = TRUE 
  WHERE thread_id = p_thread_id 
    AND recipient_id = auth.uid() 
    AND is_read = FALSE;
  
  -- Return messages
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.sender_id,
    (p1.first_name || ' ' || p1.last_name) AS sender_name,
    p1.avatar_url AS sender_avatar,
    m.recipient_id,
    (p2.first_name || ' ' || p2.last_name) AS recipient_name,
    m.is_read,
    m.created_at
  FROM 
    public.messages m
    JOIN public.profiles p1 ON m.sender_id = p1.id
    JOIN public.profiles p2 ON m.recipient_id = p2.id
  WHERE 
    m.thread_id = p_thread_id
  ORDER BY 
    m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
