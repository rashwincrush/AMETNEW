// Fix for both issues:
// 1. get_pending_content SQL error
// 2. Login delay

// First, let's fix the SQL error by directly applying our SQL fix to Supabase
async function fixPendingContentFunction() {
  console.log("Applying SQL fix for get_pending_content...");
  
  const fixSQL = `
  -- Drop the existing function first
  DROP FUNCTION IF EXISTS public.get_pending_content();

  -- Create a completely new implementation without any reference to gp.status
  CREATE OR REPLACE FUNCTION public.get_pending_content()
  RETURNS SETOF jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    -- Check if user is admin/super_admin
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_admin = true)
    ) THEN
      RAISE EXCEPTION 'Access denied: Only administrators can access pending content';
    END IF;

    -- Return pending content as separate queries to avoid any column issues
    RETURN QUERY
    
    -- 1. Pending jobs
    SELECT jsonb_build_object(
      'id', j.id,
      'title', j.title,
      'content_type', 'job',
      'created_at', j.created_at,
      'name', p.full_name,
      'user_id', j.posted_by,
      'status', 'pending',
      'content', j.description
    )
    FROM jobs j
    JOIN profiles p ON j.posted_by = p.id
    WHERE j.is_approved = false AND j.is_active = true
    
    UNION ALL
    
    -- 2. Pending events
    SELECT jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'content_type', 'event',
      'created_at', e.created_at,
      'name', p.full_name,
      'user_id', e.created_by,
      'status', e.status,
      'content', e.description
    )
    FROM events e
    JOIN profiles p ON e.created_by = p.id
    WHERE e.status = 'pending_approval'
    
    UNION ALL
    
    -- 3. Pending group posts (avoiding problematic columns)
    SELECT jsonb_build_object(
      'id', gp.id,
      'title', 'Group Post',  -- Hardcoded title
      'content_type', 'group_post',
      'created_at', gp.created_at,
      'name', p.full_name,
      'user_id', gp.user_id,
      'status', 'pending',    -- Hardcoded status
      'content', gp.content
    )
    FROM group_posts gp
    JOIN profiles p ON gp.user_id = p.id
    WHERE gp.is_approved = false
    
    ORDER BY (value->>'created_at')::timestamptz DESC;
  END;
  $$;

  -- Grant permissions
  GRANT EXECUTE ON FUNCTION public.get_pending_content() TO authenticated;
  `;
  
  try {
    // Apply SQL using Supabase client - execute in Supabase SQL editor
    const { error } = await window.supabase.rpc('exec_sql', { sql: fixSQL });
    
    if (error) {
      throw error;
    }
    
    console.log("✅ SQL fix applied successfully!");
    console.log("Dashboard pending content should now load without errors.");
    
    // Force refresh the page to apply changes
    if (confirm("SQL fix applied! Refresh page to see changes?")) {
      window.location.reload();
    }
    
  } catch (error) {
    console.error("Error applying SQL fix:", error);
    console.log("Please copy and run the SQL directly in Supabase SQL Editor.");
  }
}

// Second, let's debug the login delay issue
function diagnoseFrontendAuthIssue() {
  console.log("Diagnosing login delay issue...");
  
  // Check Auth state
  const authState = {
    user: window.localStorage.getItem('supabase.auth.token') ? 'Has token' : 'No token',
    initializedFlag: window.AMET_AUTH?.initialized,
    profileFetched: window.AMET_AUTH?.profileFetched,
    authInProgress: window.AMET_AUTH?.authInProgress
  };
  
  console.log("Auth State:", authState);
  
  // Fix for login delay - check if there's a pending operation
  if (window.AMET_AUTH?.authInProgress) {
    console.log("Auth operation is stuck in progress - clearing flag");
    window.AMET_AUTH.authInProgress = false;
  }
  
  // Force clear any timeouts that might be stuck
  for (let i = 0; i < 10000; i++) {
    clearTimeout(i);
  }
  
  console.log("All timeouts cleared - this might help with login issues");
  
  // Check if the user is actually logged in but UI is not updating
  console.log("Checking if user is logged in behind the scenes...");
  window.supabase.auth.getSession().then(({ data }) => {
    if (data?.session) {
      console.log("User IS logged in! Session:", data.session);
      console.log("Try refreshing the page or navigate directly to /dashboard");
    } else {
      console.log("No valid session found. Try logging in again.");
    }
  });
}

// Create a simple UI to fix issues
function createFixUI() {
  const fixDiv = document.createElement('div');
  fixDiv.style.position = 'fixed';
  fixDiv.style.bottom = '20px';
  fixDiv.style.right = '20px';
  fixDiv.style.backgroundColor = 'white';
  fixDiv.style.padding = '15px';
  fixDiv.style.borderRadius = '8px';
  fixDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
  fixDiv.style.zIndex = '9999';
  
  const header = document.createElement('h3');
  header.innerText = 'AMET Dashboard Fixes';
  header.style.marginBottom = '10px';
  
  const sqlButton = document.createElement('button');
  sqlButton.innerText = 'Fix SQL Errors';
  sqlButton.style.padding = '8px 12px';
  sqlButton.style.backgroundColor = '#4f46e5';
  sqlButton.style.color = 'white';
  sqlButton.style.border = 'none';
  sqlButton.style.borderRadius = '4px';
  sqlButton.style.marginRight = '8px';
  sqlButton.style.cursor = 'pointer';
  sqlButton.onclick = fixPendingContentFunction;
  
  const loginButton = document.createElement('button');
  loginButton.innerText = 'Fix Login Issues';
  loginButton.style.padding = '8px 12px';
  loginButton.style.backgroundColor = '#10b981';
  loginButton.style.color = 'white';
  loginButton.style.border = 'none';
  loginButton.style.borderRadius = '4px';
  loginButton.style.cursor = 'pointer';
  loginButton.onclick = diagnoseFrontendAuthIssue;
  
  fixDiv.appendChild(header);
  fixDiv.appendChild(sqlButton);
  fixDiv.appendChild(loginButton);
  
  document.body.appendChild(fixDiv);
}

// Run this in browser console or add to your app
createFixUI();
