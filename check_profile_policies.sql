-- Query to check all policies on the profiles table
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

-- Also check if there are any functions or triggers that might be causing recursion
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

-- Check functions that might be related to profiles table policies
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM 
    pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND pg_get_functiondef(p.oid) LIKE '%profiles%';
