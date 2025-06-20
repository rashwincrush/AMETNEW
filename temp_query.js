import { supabase } from './frontend/src/utils/supabase';

async function getTableInfo() {
  // Get information from information_schema
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_name', 'jobs');

  if (error) {
    console.error('Error fetching table info:', error);
  } else {
    console.log('Jobs table structure:', data);
  }
}

getTableInfo();
