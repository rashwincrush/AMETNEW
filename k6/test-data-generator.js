/**
 * Test Data Generator for High-Concurrency Tests
 * 
 * This script generates realistic test user data for the k6 tests.
 * Run this once before your performance tests to create test users.
 * 
 * Usage:
 *   node k6/test-data-generator.js
 * 
 * Or use the Supabase MCP to create test users in your database.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const NUM_USERS = 10000;  // Number of test users to generate
const OUTPUT_FILE = path.join(__dirname, 'test-data.json');

/**
 * Generate a random email
 */
function generateEmail(index) {
  const domains = [
    'alumni-test.edu',
    'test-university.edu',
    'alumni-demo.edu',
    'grad-test.edu',
  ];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  // Mix of patterns to look realistic
  const patterns = [
    `user${index}`,
    `alumnus${index}`,
    `grad${index}`,
    `test.user${index}`,
    `demo${index}`,
  ];
  
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  return `${pattern}@${domain}`;
}

/**
 * Generate a secure password
 */
function generatePassword(index) {
  // Ensure password meets common requirements
  const base = `TestPass${index}`;
  const special = ['!', '@', '#', '$', '%'][index % 5];
  const year = 2020 + (index % 5);
  return `${base}${special}${year}`;
}

/**
 * Generate user profile data
 */
function generateUserProfile(index) {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Jessica', 'Robert', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  
  const graduationYears = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const majors = ['Computer Science', 'Business', 'Engineering', 'Psychology', 'Biology', 'Economics', 'Marketing'];
  
  return {
    full_name: `${firstName} ${lastName}`,
    graduation_year: graduationYears[index % graduationYears.length],
    major: majors[index % majors.length],
  };
}

/**
 * Generate complete test data
 */
function generateTestData() {
  console.log(`🔄 Generating ${NUM_USERS} test users...`);
  
  const users = [];
  const emails = new Set(); // Ensure uniqueness
  
  for (let i = 0; i < NUM_USERS; i++) {
    let email;
    let attempts = 0;
    
    // Ensure unique emails
    do {
      email = generateEmail(i + attempts);
      attempts++;
    } while (emails.has(email) && attempts < 10);
    
    emails.add(email);
    
    const user = {
      id: `user-${i}`,
      email,
      password: generatePassword(i),
      profile: generateUserProfile(i),
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    users.push(user);
    
    if ((i + 1) % 1000 === 0) {
      console.log(`   Generated ${i + 1} users...`);
    }
  }
  
  const testData = {
    metadata: {
      generated_at: new Date().toISOString(),
      total_users: users.length,
      version: '1.0',
    },
    users,
  };
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testData, null, 2));
  
  console.log('');
  console.log(`✅ Generated ${users.length} unique test users`);
  console.log(`📁 Saved to: ${OUTPUT_FILE}`);
  console.log('');
  console.log('📋 Sample users:');
  console.log(JSON.stringify(users.slice(0, 3), null, 2));
  console.log('');
  console.log('⚠️  IMPORTANT:');
  console.log('   These users must exist in your Supabase Auth database!');
  console.log('   Run the user creation script or use Supabase MCP to create them.');
  console.log('');
  
  return testData;
}

/**
 * Create SQL to insert users into Supabase
 */
function generateSQLScript(users) {
  const sqlFile = path.join(__dirname, 'create-test-users.sql');
  
  let sql = `-- Auto-generated SQL to create test users
-- Run this in Supabase SQL Editor or via MCP
-- Generated: ${new Date().toISOString()}

`;
  
  // Note: Supabase Auth users should be created via Auth API, not direct SQL
  // This is for creating profile records
  sql += `-- Create profiles for test users\n`;
  sql += `INSERT INTO public.profiles (id, email, full_name, graduation_year, major, created_at)\n`;
  sql += `VALUES\n`;
  
  const values = users.slice(0, 100).map(u => 
    `  ('${u.id}', '${u.email}', '${u.profile.full_name}', ${u.profile.graduation_year}, '${u.profile.major}', '${u.created_at}')`
  );
  
  sql += values.join(',\n');
  sql += `\nON CONFLICT (id) DO NOTHING;\n`;
  
  fs.writeFileSync(sqlFile, sql);
  console.log(`📄 SQL script saved to: ${sqlFile}`);
  console.log('   (Note: Use Supabase Auth API for actual user creation)');
}

// Run generator
if (require.main === module) {
  const data = generateTestData();
  generateSQLScript(data.users);
}

module.exports = { generateTestData, generateUserProfile };
