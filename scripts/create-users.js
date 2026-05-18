#!/usr/bin/env node
/**
 * Bulk User Creation Script for AMET Alumni Platform
 * Creates users with specific emails, passwords, and roles
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sjksibkuxvduuuvakwqx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('   Get it from: Supabase Dashboard > Project Settings > API > service_role key');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

// Users to create
const users = [
  { email: 'ashwinproject2024@gmail.com', password: 'Ashwin@12345', role: 'super_admin', first_name: 'Ashwin', last_name: 'Kumar' },
  { email: 'forgeash320@gmail.com', password: 'Ashwin@12345', role: 'admin', first_name: 'Forge', last_name: 'Alumni' },
  { email: 'forgeash83@gmail.com', password: 'Ashwin@12345', role: 'employer', first_name: 'Forge', last_name: 'Employer' },
  { email: 'forgeashtech@gmail.com', password: 'Ashwin@12345', role: 'student', first_name: 'Forge', last_name: 'Student' },
  { email: 'forgeashtech924@gmail.com', password: 'Ashwin@12345', role: 'alumni', first_name: 'Forge', last_name: 'Alumni Two' },
  { email: 'forgeashtechnologies@gmail.com', password: 'Ashwin@12345', role: 'student', first_name: 'Forge', last_name: 'Student Two' },
  { email: 'rashwin.kumar0120@gmail.com', password: 'Ashwin@12345', role: 'admin', first_name: 'Rashwin', last_name: 'Kumar' }
];

async function createUser(user) {
  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error(`❌ Error checking for existing user ${user.email}:`, checkError.message);
      return { success: false, email: user.email, error: checkError.message };
    }

    const userExists = existingUser.users.find(u => u.email === user.email);
    
    if (userExists) {
      console.log(`⚠️  User ${user.email} already exists, skipping...`);
      return { success: true, email: user.email, skipped: true };
    }

    // Create user with admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      app_metadata: {
        role: user.role
      }
    });

    if (error) {
      console.error(`❌ Failed to create ${user.email}:`, error.message);
      return { success: false, email: user.email, error: error.message };
    }

    console.log(`✅ Created user: ${user.email} (${user.role})`);
    return { success: true, email: user.email, userId: data.user.id };

  } catch (err) {
    console.error(`❌ Exception creating ${user.email}:`, err.message);
    return { success: false, email: user.email, error: err.message };
  }
}

async function main() {
  console.log('🚀 Starting bulk user creation...\n');
  console.log(`📍 Supabase Project: ${SUPABASE_URL}`);
  console.log(`👥 Users to create: ${users.length}\n`);

  const results = [];
  
  for (const user of users) {
    const result = await createUser(user);
    results.push(result);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const created = results.filter(r => r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Created: ${created}`);
  console.log(`⚠️  Skipped (already exists): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed users:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.email}: ${r.error}`);
    });
  }

  console.log('\n✨ Done!');
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
