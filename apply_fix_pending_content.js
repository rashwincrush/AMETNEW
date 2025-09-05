// Script to apply the fix_pending_content.sql using Supabase client
// This will directly run the SQL to fix the get_pending_content function
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env file if available
try {
  require('dotenv').config();
} catch (err) {
  console.log('No dotenv package found, using environment variables directly');
}

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase URL or key in environment variables');
  console.error('Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPendingContentFix() {
  try {
    console.log('Reading SQL fix script...');
    const sqlFilePath = path.join(__dirname, 'fix_pending_content.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Applying get_pending_content fix...');
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Successfully applied get_pending_content fix!');
    console.log('The dashboard pending content should now load without errors.');
    
    // Verify the function exists and is properly defined
    console.log('Verifying function exists...');
    const { data, error: verifyError } = await supabase.rpc('exec_sql', { 
      sql: "SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_name = 'get_pending_content'" 
    });
    
    if (verifyError) {
      console.warn('Warning: Could not verify function existence:', verifyError.message);
    } else {
      console.log('Function verification result:', data);
    }
    
  } catch (error) {
    console.error('Error applying fix:', error.message);
    console.error('You may need to manually run the SQL in the Supabase dashboard.');
    console.error('The SQL file is located at:', path.join(__dirname, 'fix_pending_content.sql'));
  }
}

applyPendingContentFix();
