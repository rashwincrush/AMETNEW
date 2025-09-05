const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env file if available
require('dotenv').config();

// Get Supabase URL and key from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY (or REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY) must be set');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// SQL migrations to apply
const migrations = [
  {
    name: '008_fix_dashboard_stats.sql',
    path: path.join(__dirname, 'supabase', 'migrations', '008_fix_dashboard_stats.sql'),
  },
  {
    name: '009_fix_pending_content.sql',
    path: path.join(__dirname, 'supabase', 'migrations', '009_fix_pending_content.sql'),
  }
];

async function applyMigration(migration) {
  console.log(`Applying migration: ${migration.name}...`);
  
  try {
    const sql = fs.readFileSync(migration.path, 'utf8');
    const { data, error } = await supabase.rpc('pgmigrate', { sql });
    
    if (error) {
      console.error(`Error applying migration ${migration.name}:`, error);
      return false;
    }
    
    console.log(`Migration ${migration.name} applied successfully:`, data);
    return true;
  } catch (err) {
    console.error(`Exception while applying migration ${migration.name}:`, err);
    return false;
  }
}

// Custom RPC function to execute raw SQL (we need to check if this exists first)
async function checkPgMigrateExists() {
  try {
    // Try to query information about the pgmigrate function from Postgres information_schema
    const { data, error } = await supabase.rpc('pg_function_exists', { function_name: 'pgmigrate' });
    
    if (error) {
      console.log('pgmigrate function does not exist, creating it...');
      return false;
    }
    
    return data;
  } catch (err) {
    console.log('Error checking pgmigrate function, assuming it does not exist:', err.message);
    return false;
  }
}

// Create the pgmigrate function if it doesn't exist
async function createPgMigrateFunction() {
  try {
    // Create the pg_function_exists helper function first
    const createCheckFn = `
    CREATE OR REPLACE FUNCTION pg_function_exists(function_name TEXT) 
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = function_name
        AND n.nspname = 'public'
      );
    END;
    $$;
    `;
    
    console.log('Creating pg_function_exists helper...');
    const { error: checkFnError } = await supabase.rpc('exec_sql', { sql: createCheckFn });
    
    if (checkFnError) {
      console.log('Creating pg_function_exists using raw query...');
      await supabase.from('_exec_sql').rpc('exec', { query: createCheckFn });
    }
    
    // Create the pgmigrate function
    const createPgMigrate = `
    CREATE OR REPLACE FUNCTION pgmigrate(sql TEXT) 
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      result JSONB;
    BEGIN
      EXECUTE sql;
      result := jsonb_build_object('success', true, 'message', 'SQL executed successfully');
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      result := jsonb_build_object(
        'success', false, 
        'message', 'SQL execution failed', 
        'error', SQLERRM,
        'context', SQLSTATE
      );
      RETURN result;
    END;
    $$;
    `;
    
    console.log('Creating pgmigrate function...');
    const { error: pgMigrateError } = await supabase.rpc('exec_sql', { sql: createPgMigrate });
    
    if (pgMigrateError) {
      console.log('Creating pgmigrate using raw query...');
      await supabase.from('_exec_sql').rpc('exec', { query: createPgMigrate });
    }
    
    return true;
  } catch (err) {
    console.error('Failed to create pgmigrate function:', err);
    return false;
  }
}

// Alternate approach using direct SQL execution if available
async function applyMigrationDirect(migration) {
  console.log(`Applying migration directly: ${migration.name}...`);
  
  try {
    const sql = fs.readFileSync(migration.path, 'utf8');
    
    // Try different ways to execute SQL directly
    let error;
    
    // Method 1: Using exec_sql RPC if available
    try {
      const { data, error: rpcError } = await supabase.rpc('exec_sql', { sql });
      if (!rpcError) {
        console.log(`Migration ${migration.name} applied successfully via exec_sql`);
        return true;
      }
      error = rpcError;
    } catch (err) {
      console.log('exec_sql method failed:', err.message);
    }
    
    // Method 2: Using _exec_sql table RPC if available
    try {
      const { data, error: tableRpcError } = await supabase.from('_exec_sql').rpc('exec', { query: sql });
      if (!tableRpcError) {
        console.log(`Migration ${migration.name} applied successfully via _exec_sql.exec`);
        return true;
      }
      error = tableRpcError || error;
    } catch (err) {
      console.log('_exec_sql.exec method failed:', err.message);
    }
    
    // If we get here, all methods failed
    console.error(`Error applying migration ${migration.name}:`, error);
    return false;
  } catch (err) {
    console.error(`Exception while applying migration ${migration.name}:`, err);
    return false;
  }
}

// Main function to run migrations
async function runMigrations() {
  console.log('Starting migrations...');

  // Check if pgmigrate function exists
  const pgMigrateExists = await checkPgMigrateExists();
  
  if (!pgMigrateExists) {
    // Create the pgmigrate function
    const created = await createPgMigrateFunction();
    if (!created) {
      console.error('Failed to create pgmigrate function, will try direct execution');
    }
  }

  // Apply each migration
  let allSuccessful = true;
  
  for (const migration of migrations) {
    let success;
    
    // Try the pgmigrate approach first
    try {
      success = await applyMigration(migration);
    } catch (err) {
      console.log(`pgmigrate approach failed for ${migration.name}, trying direct execution:`, err.message);
      success = false;
    }
    
    // If that fails, try direct execution
    if (!success) {
      success = await applyMigrationDirect(migration);
    }
    
    if (!success) {
      allSuccessful = false;
      console.error(`❌ Failed to apply migration: ${migration.name}`);
    } else {
      console.log(`✅ Successfully applied migration: ${migration.name}`);
    }
  }

  if (allSuccessful) {
    console.log('All migrations completed successfully!');
  } else {
    console.error('Some migrations failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Run the migrations
runMigrations().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
