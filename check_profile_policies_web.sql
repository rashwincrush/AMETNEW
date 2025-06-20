-- Query to view all policies on the profiles table
-- Run this in the Supabase Dashboard SQL Editor

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM 
    pg_policies 
WHERE 
    tablename = 'profiles'
ORDER BY 
    policyname;

-- Check if there are any function-based policies or complex conditions
-- that might be causing recursive behavior

-- Also check any triggers on the profiles table that might cause recursion
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'profiles';
