-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests (required for calling Edge Functions)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule job alerts processing every hour (0 * * * *)
-- Calls the process-job-alerts-ai Edge Function to score and notify on job matches
SELECT cron.schedule(
  'process-job-alerts-hourly',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://sjksibkuxvduuuvakwqx.supabase.co/functions/v1/process-job-alerts-ai',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqa3NpYmt1eHZkdXV1dmFrd3F4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIzNzc5MywiZXhwIjoyMDkxODEzNzkzfQ.-lLyx8BZ1H9ySrOjjgNwZ1VYNyLKGAArAnzYnPtHr3w',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Schedule weekly digest every Sunday at 9 AM IST (3:30 AM UTC = 30 3 * * 0)
-- IST is UTC+5:30, so 9:00 AM IST = 3:30 AM UTC
-- Calls the send-weekly-digest Edge Function to send personalized job digests
SELECT cron.schedule(
  'send-weekly-digest-sunday',
  '30 3 * * 0',
  $$
    SELECT net.http_post(
      url := 'https://sjksibkuxvduuuvakwqx.supabase.co/functions/v1/send-weekly-digest',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqa3NpYmt1eHZkdXV1dmFrd3F4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIzNzc5MywiZXhwIjoyMDkxODEzNzkzfQ.-lLyx8BZ1H9ySrOjjgNwZ1VYNyLKGAArAnzYnPtHr3w',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Add comments for documentation
COMMENT ON TABLE cron.job IS 'pg_cron scheduled jobs for job alerts and weekly digests';

-- Verify jobs were created
SELECT 
  jobname,
  schedule,
  active,
  next_run_at
FROM cron.job
WHERE jobname IN ('process-job-alerts-hourly', 'send-weekly-digest-sunday');
