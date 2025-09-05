-- admin_delete_user_simplified_fallback.sql
-- A simplified fallback function that works with the existing database structure
-- and doesn't rely on non-existent tables

CREATE OR REPLACE FUNCTION admin_delete_user_fallback(
  target_user_id UUID
) RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_delete_user_fallback TO authenticated;
COMMENT ON FUNCTION admin_delete_user_fallback IS 'Fallback admin user deletion. Only cleans up application data. Cannot delete auth records - Edge Function required for complete deletion.';
