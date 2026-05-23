/**
 * Create Test Users for k6 Load Testing
 * 
 * This script creates 100 auth users in your Supabase project
 * using the Admin API. Users will have emails like:
 * - testuser0@alumni-test.edu
 * - testuser1@alumni-test.edu
 * - ... through testuser99@alumni-test.edu
 * 
 * All users get the same password: TestPass123!
 * 
 * Run: node create-test-users.js
 */

// ============================================
// CONFIGURATION - PASTE YOUR KEYS HERE
// ============================================

// Your Supabase project URL
const SUPABASE_URL = 'https://sjksibkuxvduuuvakwqx.supabase.co';

// Your Supabase ANON KEY (public key - safe to use client-side)
// Get this from: Supabase Dashboard → Project Settings → API → anon public
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqa3NpYmt1eHZkdXV1dmFrd3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMzc3OTMsImV4cCI6MjA5MTgxMzc5M30.WgDipf1uz1eRwVDjI2hc-J80lGPtZV_eGfeahpkLw68';

// ⚠️ SERVICE ROLE KEY - PASTE THIS HERE ⚠️
// Get this from: Supabase Dashboard → Project Settings → API → service_role secret
// WARNING: This key has admin privileges! Keep it secret!
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqa3NpYmt1eHZkdXV1dmFrd3F4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIzNzc5MywiZXhwIjoyMDkxODEzNzkzfQ.-lLyx8BZ1H9ySrOjjgNwZ1VYNyLKGAArAnzYnPtHr3w';

// ============================================
// TEST USER CONFIGURATION
// ============================================

const TOTAL_USERS = 100;
const EMAIL_DOMAIN = 'alumni-test.edu';
const PASSWORD = 'TestPass123!';

// ============================================
// CREATE USER FUNCTION
// ============================================

/**
 * Create a single user via Supabase Admin API
 * Returns true if created, false if already exists
 */
async function createUser(index) {
  const email = `testuser${index}@${EMAIL_DOMAIN}`;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: PASSWORD,
        email_confirm: true, // Auto-confirm email so users can login immediately
        user_metadata: {
          role: index % 10 === 0 ? 'employer' : 'candidate', // 10% employers
          test_user: true,
          created_by: 'k6-test-setup',
        },
      }),
    });
    
    if (response.status === 200 || response.status === 201) {
      // User created successfully (Supabase returns 200 with user object)
      return { success: true, created: true, email };
    } else if (response.status === 422) {
      // User already exists
      return { success: true, created: false, email, reason: 'already exists' };
    } else {
      // Other error
      const error = await response.text();
      return { success: false, created: false, email, error: error };
    }
  } catch (error) {
    return { success: false, created: false, email, error: error.message };
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('🚀 Creating test users for k6 load testing...\n');
  
  // Validate configuration
  if (SERVICE_ROLE_KEY === 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE' || !SERVICE_ROLE_KEY) {
    console.error('❌ ERROR: Please paste your SERVICE_ROLE_KEY in the script!');
    console.error('   Get it from: Supabase Dashboard → Project Settings → API → service_role secret');
    process.exit(1);
  }
  
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Creating ${TOTAL_USERS} users...`);
  console.log(`   Email pattern: testuser{N}@${EMAIL_DOMAIN}`);
  console.log(`   Password: ${PASSWORD}`);
  console.log('');
  
  let created = 0;
  let skipped = 0;
  let failed = 0;
  
  // Create users one by one to avoid rate limiting
  for (let i = 0; i < TOTAL_USERS; i++) {
    const result = await createUser(i);
    
    if (result.created) {
      created++;
      console.log(`✅ Created user ${i + 1}/${TOTAL_USERS}: ${result.email}`);
    } else if (result.success && result.reason === 'already exists') {
      skipped++;
      console.log(`⏭️  Skipped user ${i + 1}/${TOTAL_USERS}: ${result.email} (already exists)`);
    } else {
      failed++;
      console.error(`❌ Failed user ${i + 1}/${TOTAL_USERS}: ${result.email} - ${result.error}`);
    }
    
    // Small delay to avoid hitting rate limits
    if (i < TOTAL_USERS - 1) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    }
  }
  
  // Print summary
  console.log('');
  console.log('========================================');
  console.log('✨ Done!');
  console.log(`   Created: ${created} users successfully`);
  console.log(`   Skipped: ${skipped} users (already existed)`);
  if (failed > 0) {
    console.log(`   Failed:  ${failed} users`);
  }
  console.log('========================================');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run the k6 test:');
  console.log('   cd "/Users/ashwin/Desktop/AI Projects/Alumni Standalone/k6"');
  console.log('   k6 run high-concurrency-login-test.js');
  console.log('');
  console.log('Sample credentials for verification:');
  console.log(`   Email: testuser0@${EMAIL_DOMAIN}`);
  console.log(`   Password: ${PASSWORD}`);
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
