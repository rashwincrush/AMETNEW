-- admin_delete_user_fallback.sql
-- Creates a fallback function for user deletion when Edge Function is unavailable
-- IMPORTANT: This is NOT a complete solution since it cannot delete auth.users without admin API
-- It serves only as a partial fallback for application data cleanup

-- This function handles:
-- 1. Authorization checks (only admin/super_admin)
-- 2. Check caller permissions (only super_admin can delete admin/super_admin)
-- 3. Audit logging
-- 4. Calls purge_user_data RPC
-- 5. Marks the user as "deleted" in profiles table
-- Note: This cannot fully delete the auth.users record! That requires admin API access

CREATE OR REPLACE FUNCTION admin_delete_user_fallback(
  target_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  caller_id UUID;
  caller_role TEXT;
  target_role TEXT;
  result JSONB;
  purge_result JSONB;
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
  
  -- Try to purge user data first
  BEGIN
    -- Call existing purge_user_data function (if it exists)
    SELECT * FROM purge_user_data(target_user_id) INTO purge_result;
  EXCEPTION WHEN OTHERS THEN
    -- Just record the error in the result instead of logging to a table
    purge_result := jsonb_build_object(
      'purge_success', false, 
      'error', SQLERRM,
      'user_id', target_user_id
    );
    
    -- Also log to the admin_actions table for audit trail
    INSERT INTO admin_actions (
      admin_id,
      action_type,
      target_type,
      target_id,
      description
    ) VALUES (
      caller_id,
      'purge_user_data_error',
      'user',
      target_user_id,
      'Error during purge_user_data: ' || SQLERRM
    );
  END;
  
  -- Mark as deleted in profiles
  -- This is NOT a complete deletion! Auth.users record remains, but data is anonymized
  UPDATE profiles 
  SET 
    email = 'deleted_' || id || '@deleted.user',
    full_name = 'Deleted User',
    deleted_at = NOW(),
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
    'data_purged', purge_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_delete_user_fallback TO authenticated;
COMMENT ON FUNCTION admin_delete_user_fallback IS 'Fallback admin user deletion. Only cleans up application data. Cannot delete auth records - Edge Function required for complete deletion.';
