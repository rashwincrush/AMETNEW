// Debug script to verify database tables and columns
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize the Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTables() {
  console.log('Starting database inspection...');
  
  try {
    // Check event_feedback table structure
    console.log('\n--- EVENT FEEDBACK TABLE ---');
    const { data: feedback, error: feedbackError } = await supabase
      .from('event_feedback')
      .select('*')
      .limit(5);
    
    if (feedbackError) {
      console.error('Error fetching event_feedback:', feedbackError);
    } else {
      console.log('Sample data:', feedback);
      if (feedback && feedback.length > 0) {
        console.log('Columns:', Object.keys(feedback[0]));
      } else {
        console.log('No feedback data found');
      }
    }
    
    // Check events table 
    console.log('\n--- EVENTS TABLE ---');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(5);
    
    if (eventsError) {
      console.error('Error fetching events:', eventsError);
    } else {
      console.log('Sample data:', events);
      if (events && events.length > 0) {
        console.log('Columns:', Object.keys(events[0]));
      } else {
        console.log('No events data found');
      }
    }
    
    // Specifically check for event feedback for a particular event
    const eventId = '8f8cf236-62ce-4d68-bd91-e6311e6d552b'; // The event ID from the URL
    console.log(`\n--- FEEDBACK FOR EVENT ${eventId} ---`);
    const { data: specificFeedback, error: specificError } = await supabase
      .from('event_feedback')
      .select('*')
      .eq('event_id', eventId);
    
    if (specificError) {
      console.error(`Error fetching feedback for event ${eventId}:`, specificError);
    } else {
      console.log('Feedback count:', specificFeedback ? specificFeedback.length : 0);
      console.log('Feedback data:', specificFeedback);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

inspectTables();
