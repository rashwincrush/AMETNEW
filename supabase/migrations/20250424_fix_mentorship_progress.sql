-- GAP 6: Mentorship Progress Tracking
-- Adds progress tracking columns to mentorship_relationships and creates goal management RPCs

-- Step 1: Add new columns to mentorship_relationships table
ALTER TABLE public.mentorship_relationships
  ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  ADD COLUMN IF NOT EXISTS mentor_feedback TEXT,
  ADD COLUMN IF NOT EXISTS mentee_feedback TEXT,
  ADD COLUMN IF NOT EXISTS completion_date TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN public.mentorship_relationships.goals IS 'JSON array of goals: [{"id": "uuid", "text": "...", "achieved": false}]';
COMMENT ON COLUMN public.mentorship_relationships.progress_percentage IS 'Calculated as (achieved_goals / total_goals * 100), updated automatically';
COMMENT ON COLUMN public.mentorship_relationships.mentor_feedback IS 'Feedback provided by mentor when relationship is completed';
COMMENT ON COLUMN public.mentorship_relationships.mentee_feedback IS 'Feedback provided by mentee when relationship is completed';
COMMENT ON COLUMN public.mentorship_relationships.completion_date IS 'Date when relationship was marked as completed';

-- Index for goals queries
CREATE INDEX IF NOT EXISTS idx_mentorship_relationships_goals ON public.mentorship_relationships USING GIN(goals);

-- Step 2: RPC to update mentorship goals (mentor or mentee can set goals)
CREATE OR REPLACE FUNCTION public.update_mentorship_goals(
  p_relationship_id UUID,
  p_goals JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_mentor BOOLEAN;
  v_is_mentee BOOLEAN;
  v_current_goals JSONB;
  v_new_goals JSONB;
  v_progress INTEGER;
  v_total INTEGER;
  v_achieved INTEGER;
BEGIN
  -- Check if user is mentor or mentee for this relationship
  SELECT 
    (mentor_id = v_user_id),
    (mentee_id = v_user_id)
  INTO v_is_mentor, v_is_mentee
  FROM public.mentorship_relationships
  WHERE id = p_relationship_id;

  IF NOT v_is_mentor AND NOT v_is_mentee AND NOT public.is_site_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only mentor, mentee, or admin can update goals');
  END IF;

  -- Get current goals for comparison (preserve achieved status if not explicitly changed)
  SELECT goals INTO v_current_goals
  FROM public.mentorship_relationships
  WHERE id = p_relationship_id;

  -- Ensure all goals have an id and default achieved to false
  v_new_goals := COALESCE(p_goals, '[]'::jsonb);
  
  -- Calculate progress
  v_total := jsonb_array_length(v_new_goals);
  IF v_total = 0 THEN
    v_progress := 0;
    v_achieved := 0;
  ELSE
    v_achieved := (
      SELECT COUNT(*)::int 
      FROM jsonb_array_elements(v_new_goals) AS goal 
      WHERE (goal->>'achieved')::boolean = true
    );
    v_progress := LEAST(100, (v_achieved * 100 / v_total));
  END IF;

  -- Update goals and progress
  UPDATE public.mentorship_relationships
  SET goals = v_new_goals,
      progress_percentage = v_progress,
      updated_at = NOW()
  WHERE id = p_relationship_id;

  -- Log activity
  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (v_user_id, 'mentorship_goals_updated', jsonb_build_object(
    'relationship_id', p_relationship_id,
    'total_goals', v_total,
    'achieved_goals', v_achieved,
    'progress', v_progress
  ));

  RETURN jsonb_build_object(
    'success', true,
    'progress_percentage', v_progress,
    'total_goals', v_total,
    'achieved_goals', v_achieved,
    'message', 'Goals updated successfully'
  );
END;
$$;

GRANT ALL ON FUNCTION public.update_mentorship_goals(UUID, JSONB) TO authenticated;

-- Step 3: RPC to toggle goal achieved status
CREATE OR REPLACE FUNCTION public.toggle_goal_achieved(
  p_relationship_id UUID,
  p_goal_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_mentor BOOLEAN;
  v_is_mentee BOOLEAN;
  v_goals JSONB;
  v_new_goals JSONB;
  v_goal_index INTEGER;
  v_current_achieved BOOLEAN;
  v_progress INTEGER;
  v_total INTEGER;
  v_achieved INTEGER;
BEGIN
  -- Check if user is mentor or mentee for this relationship
  SELECT 
    (mentor_id = v_user_id),
    (mentee_id = v_user_id)
  INTO v_is_mentor, v_is_mentee
  FROM public.mentorship_relationships
  WHERE id = p_relationship_id;

  IF NOT v_is_mentor AND NOT v_is_mentee AND NOT public.is_site_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only mentor, mentee, or admin can update goals');
  END IF;

  -- Get current goals
  SELECT goals INTO v_goals
  FROM public.mentorship_relationships
  WHERE id = p_relationship_id;

  IF v_goals IS NULL OR jsonb_array_length(v_goals) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No goals found for this relationship');
  END IF;

  -- Find goal index
  SELECT ordinality - 1 INTO v_goal_index
  FROM jsonb_array_elements(v_goals) WITH ORDINALITY AS elem
  WHERE elem->>'id' = p_goal_id OR elem->>'id' IS NULL
  LIMIT 1;

  IF v_goal_index IS NULL THEN
    -- Try matching by index if passed as number
    BEGIN
      v_goal_index := p_goal_id::int;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'error', 'Goal not found');
    END;
  END IF;

  -- Toggle achieved status
  v_current_achieved := (v_goals->v_goal_index->>'achieved')::boolean;
  
  v_new_goals := jsonb_set(
    v_goals,
    ARRAY[v_goal_index::text, 'achieved'],
    to_jsonb(NOT v_current_achieved)
  );

  -- Calculate new progress
  v_total := jsonb_array_length(v_new_goals);
  v_achieved := (
    SELECT COUNT(*)::int 
    FROM jsonb_array_elements(v_new_goals) AS goal 
    WHERE (goal->>'achieved')::boolean = true
  );
  v_progress := LEAST(100, (v_achieved * 100 / v_total));

  -- Update relationship
  UPDATE public.mentorship_relationships
  SET goals = v_new_goals,
      progress_percentage = v_progress,
      updated_at = NOW()
  WHERE id = p_relationship_id;

  -- Log activity
  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (v_user_id, 'mentorship_goal_toggled', jsonb_build_object(
    'relationship_id', p_relationship_id,
    'goal_id', p_goal_id,
    'new_achieved', NOT v_current_achieved,
    'progress', v_progress
  ));

  RETURN jsonb_build_object(
    'success', true,
    'achieved', NOT v_current_achieved,
    'progress_percentage', v_progress,
    'total_goals', v_total,
    'achieved_goals', v_achieved
  );
END;
$$;

GRANT ALL ON FUNCTION public.toggle_goal_achieved(UUID, TEXT) TO authenticated;

-- Step 4: RPC to submit feedback (both mentor and mentee)
CREATE OR REPLACE FUNCTION public.submit_mentorship_feedback(
  p_relationship_id UUID,
  p_feedback TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_mentor BOOLEAN;
  v_is_mentee BOOLEAN;
  v_relationship RECORD;
  v_other_feedback_exists BOOLEAN;
  v_all_goals_achieved BOOLEAN;
BEGIN
  -- Get relationship details
  SELECT mentor_id, mentee_id, mentor_feedback, mentee_feedback, goals, status
  INTO v_relationship
  FROM public.mentorship_relationships
  WHERE id = p_relationship_id;

  IF v_relationship IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Relationship not found');
  END IF;

  v_is_mentor := (v_relationship.mentor_id = v_user_id);
  v_is_mentee := (v_relationship.mentee_id = v_user_id);

  IF NOT v_is_mentor AND NOT v_is_mentee AND NOT public.is_site_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only mentor, mentee, or admin can submit feedback');
  END IF;

  -- Update appropriate feedback column
  IF v_is_mentor OR public.is_site_admin() THEN
    UPDATE public.mentorship_relationships
    SET mentor_feedback = p_feedback,
        updated_at = NOW()
    WHERE id = p_relationship_id;
    
    v_other_feedback_exists := (v_relationship.mentee_feedback IS NOT NULL);
  ELSE
    UPDATE public.mentorship_relationships
    SET mentee_feedback = p_feedback,
        updated_at = NOW()
    WHERE id = p_relationship_id;
    
    v_other_feedback_exists := (v_relationship.mentor_feedback IS NOT NULL);
  END IF;

  -- Check if all goals are achieved
  v_all_goals_achieved := NOT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(v_relationship.goals) AS goal 
    WHERE (goal->>'achieved')::boolean = false
  ) OR jsonb_array_length(COALESCE(v_relationship.goals, '[]'::jsonb)) = 0;

  -- Auto-complete if both feedbacks exist and all goals achieved
  IF v_other_feedback_exists AND v_all_goals_achieved AND v_relationship.status = 'active' THEN
    UPDATE public.mentorship_relationships
    SET status = 'completed',
        end_date = NOW(),
        completion_date = NOW(),
        updated_at = NOW()
    WHERE id = p_relationship_id;

    -- Log completion
    INSERT INTO public.activity_logs (user_id, action, details)
    VALUES (v_user_id, 'mentorship_auto_completed', jsonb_build_object(
      'relationship_id', p_relationship_id,
      'reason', 'both_feedback_and_all_goals_achieved'
    ));
  END IF;

  -- Log activity
  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (v_user_id, CASE WHEN v_is_mentor THEN 'mentor_feedback_submitted' ELSE 'mentee_feedback_submitted' END, jsonb_build_object(
    'relationship_id', p_relationship_id,
    'feedback_length', LENGTH(p_feedback)
  ));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Feedback submitted successfully',
    'auto_completed', (v_other_feedback_exists AND v_all_goals_achieved AND v_relationship.status = 'active')
  );
END;
$$;

GRANT ALL ON FUNCTION public.submit_mentorship_feedback(UUID, TEXT) TO authenticated;

-- Step 5: RPC to get mentorship progress summary
CREATE OR REPLACE FUNCTION public.get_mentorship_progress(p_relationship_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_participant BOOLEAN;
  v_relationship RECORD;
BEGIN
  -- Check if user is participant
  SELECT EXISTS (
    SELECT 1 FROM public.mentorship_relationships mr
    WHERE mr.id = p_relationship_id
      AND (mr.mentor_id = v_user_id OR mr.mentee_id = v_user_id)
  ) INTO v_is_participant;

  IF NOT v_is_participant AND NOT public.is_site_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to view this relationship');
  END IF;

  -- Get relationship data
  SELECT 
    id, goals, progress_percentage, mentor_feedback, mentee_feedback,
    status, start_date, end_date, completion_date,
    mentor_id, mentee_id
  INTO v_relationship
  FROM public.mentorship_relationships
  WHERE id = p_relationship_id;

  IF v_relationship IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Relationship not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'progress', jsonb_build_object(
      'relationship_id', v_relationship.id,
      'goals', v_relationship.goals,
      'progress_percentage', v_relationship.progress_percentage,
      'total_goals', jsonb_array_length(COALESCE(v_relationship.goals, '[]'::jsonb)),
      'achieved_goals', (
        SELECT COUNT(*)::int 
        FROM jsonb_array_elements(COALESCE(v_relationship.goals, '[]'::jsonb)) AS goal 
        WHERE (goal->>'achieved')::boolean = true
      ),
      'mentor_feedback_submitted', (v_relationship.mentor_feedback IS NOT NULL),
      'mentee_feedback_submitted', (v_relationship.mentee_feedback IS NOT NULL),
      'status', v_relationship.status,
      'start_date', v_relationship.start_date,
      'end_date', v_relationship.end_date,
      'completion_date', v_relationship.completion_date,
      'can_submit_feedback', v_relationship.status = 'active',
      'is_mentor', (v_relationship.mentor_id = v_user_id),
      'is_mentee', (v_relationship.mentee_id = v_user_id)
    )
  );
END;
$$;

GRANT ALL ON FUNCTION public.get_mentorship_progress(UUID) TO authenticated;

-- Migration complete
