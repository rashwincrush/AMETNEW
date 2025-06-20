require('dotenv').config({ path: './frontend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthAndProfile() {
  // Check current session
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log('Current session:', sessionData, sessionError);
  
  if (sessionData.session) {
    // User is authenticated, check profile
    const userId = sessionData.session.user.id;
    console.log('User ID:', userId);
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    console.log('User profile from ID:', profileData, profileError);
    
    // Check email match with profile
    const { data: emailProfileData, error: emailProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'ashwinproject2024@gmail.com')
      .single();
    
    console.log('Profile by email (ashwinproject2024@gmail.com):', emailProfileData, emailProfileError);
    
    // Check for role mismatch
    if (profileData && emailProfileData && profileData.id !== emailProfileData.id) {
      console.log('WARNING: Profile ID mismatch between session user and email lookup!');
    }
  }
  
  // Try to sign in with test credentials (replace with your actual password)
  console.log('Attempting to sign in with ashwinproject2024@gmail.com...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'ashwinproject2024@gmail.com',
    password: 'test123456', // REPLACE THIS with your actual password
  });
  
  console.log('Sign in attempt:', signInData, signInError);
}

checkAuthAndProfile().catch(console.error);
