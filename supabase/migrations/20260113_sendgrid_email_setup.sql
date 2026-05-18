-- ============================================================================
-- SENDGRID EMAIL NOTIFICATIONS SETUP
-- Configures SendGrid Edge Function and email templates for auth notifications
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EMAIL TEMPLATES TABLE
-- Stores email templates for different notification types
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text,
  from_email text NOT NULL DEFAULT 'noreply@amet.com',
  from_name text NOT NULL DEFAULT 'AMET Platform',
  category text DEFAULT 'transactional',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage templates
CREATE POLICY "admins_manage_email_templates" ON public.email_templates
  FOR ALL USING (public.is_platform_admin(auth.uid()));

-- ============================================================================
-- 2. EMAIL QUEUE TABLE
-- Queues emails for sending via SendGrid
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  template_key text NOT NULL,
  template_data jsonb DEFAULT '{}',
  from_email text DEFAULT 'noreply@amet.com',
  from_name text DEFAULT 'AMET Platform',
  category text DEFAULT 'transactional',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at timestamptz,
  error_message text,
  sendgrid_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Only system can read/write to queue
CREATE POLICY "system_email_queue_access" ON public.email_queue
  FOR ALL USING (false);

-- ============================================================================
-- 3. SEND EMAIL FUNCTION
-- Core function to queue emails for SendGrid
-- ============================================================================

CREATE OR REPLACE FUNCTION public.queue_email(
  p_to_email text,
  p_template_key text,
  p_template_data jsonb DEFAULT '{}',
  p_from_email text DEFAULT 'noreply@amet.com',
  p_from_name text DEFAULT 'AMET Platform',
  p_category text DEFAULT 'transactional'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email_id uuid;
BEGIN
  -- Validate inputs
  IF p_to_email IS NULL OR p_template_key IS NULL THEN
    RAISE EXCEPTION 'Email address and template key are required';
  END IF;
  
  -- Validate template exists
  IF NOT EXISTS (
    SELECT 1 FROM public.email_templates 
    WHERE template_key = p_template_key AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Email template % does not exist or is inactive', p_template_key;
  END IF;
  
  -- Queue email
  INSERT INTO public.email_queue (
    to_email,
    template_key,
    template_data,
    from_email,
    from_name,
    category
  ) VALUES (
    p_to_email,
    p_template_key,
    p_template_data,
    p_from_email,
    p_from_name,
    p_category
  ) RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$;

-- Grant permissions
REVOKE EXECUTE ON FUNCTION public.queue_email FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.queue_email TO authenticated;

-- ============================================================================
-- 4. AUTH NOTIFICATION TRIGGER FUNCTIONS
-- Automatically queue emails on auth events
-- ============================================================================

-- Signup verification email
CREATE OR REPLACE FUNCTION public.trigger_signup_verification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.queue_email(
    p_to_email => NEW.email,
    p_template_key => 'signup_verification',
    p_template_data => jsonb_build_object(
      'email', NEW.email,
      'verification_link', public.generate_email_verification_link(NEW.id),
      'first_name', COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
      'app_name', 'AMET Platform'
    )
  );
  RETURN NEW;
END;
$$;

-- Welcome email (triggered after email verification)
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only send welcome email if email is confirmed
  IF NEW.email_confirmed = true AND OLD.email_confirmed = false THEN
    PERFORM public.queue_email(
      p_to_email => NEW.email,
      p_template_key => 'welcome_email',
      p_template_data => jsonb_build_object(
        'first_name', COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        'login_url', 'https://amet-platform.com/login',
        'dashboard_url', 'https://amet-platform.com/dashboard',
        'app_name', 'AMET Platform'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Password reset email
CREATE OR REPLACE FUNCTION public.trigger_forgot_password_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.queue_email(
    p_to_email => NEW.email,
    p_template_key => 'forgot_password',
    p_template_data => jsonb_build_object(
      'first_name', COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
      'reset_link', NEW.recovery_token,
      'app_name', 'AMET Platform',
      'expiry_hours', 1
    )
  );
  RETURN NEW;
END;
$$;

-- Password changed confirmation
CREATE OR REPLACE FUNCTION public.trigger_password_changed_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.queue_email(
    p_to_email => NEW.email,
    p_template_key => 'password_changed',
    p_template_data => jsonb_build_object(
      'first_name', COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
      'security_url', 'https://amet-platform.com/profile/security',
      'app_name', 'AMET Platform',
      'changed_at', now()
    )
  );
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. ADMIN ACTION EMAIL FUNCTIONS
-- Functions called from admin RPCs to send notifications
-- ============================================================================

-- Account approved email
CREATE OR REPLACE FUNCTION public.send_account_approved_email(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_record public.profiles%ROWTYPE;
BEGIN
  -- Get user details
  SELECT * INTO v_user_record 
  FROM public.profiles 
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN public.queue_email(
    p_to_email => (SELECT email FROM auth.users WHERE id = p_user_id),
    p_template_key => 'account_approved',
    p_template_data => jsonb_build_object(
      'first_name', v_user_record.first_name,
      'dashboard_url', 'https://amet-platform.com/dashboard',
      'app_name', 'AMET Platform',
      'approved_at', now()
    )
  );
END;
$$;

-- Account rejected email
CREATE OR REPLACE FUNCTION public.send_account_rejected_email(p_user_id uuid, p_reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_record public.profiles%ROWTYPE;
BEGIN
  -- Get user details
  SELECT * INTO v_user_record 
  FROM public.profiles 
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  RETURN public.queue_email(
    p_to_email => (SELECT email FROM auth.users WHERE id = p_user_id),
    p_template_key => 'account_rejected',
    p_template_data => jsonb_build_object(
      'first_name', v_user_record.first_name,
      'contact_url', 'https://amet-platform.com/contact',
      'app_name', 'AMET Platform',
      'rejection_reason', p_reason,
      'rejected_at', now()
    )
  );
END;
$$;

-- Admin invite email
CREATE OR REPLACE FUNCTION public.send_admin_invite_email(
  p_email text,
  p_invite_token text,
  p_invited_by text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.queue_email(
    p_to_email => p_email,
    p_template_key => 'invite_user',
    p_template_data => jsonb_build_object(
      'email', p_email,
      'invite_link', 'https://amet-platform.com/auth/callback?token=' || p_invite_token,
      'invited_by', p_invited_by,
      'app_name', 'AMET Platform',
      'expires_hours', 24
    )
  );
END;
$$;

-- ============================================================================
-- 6. HELPER FUNCTION FOR VERIFICATION LINKS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_email_verification_link(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN 'https://amet-platform.com/auth/verify?token=' || 
         encode(p_user_id::bytea, 'hex') || 
         '&expires=' || extract(epoch from now() + interval '24 hours');
END;
$$;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Create triggers if they don't exist
DROP TRIGGER IF EXISTS on_auth_user_created_signup_verification ON auth.users;
CREATE TRIGGER on_auth_user_created_signup_verification
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_signup_verification_email();

DROP TRIGGER IF EXISTS on_auth_user_updated_welcome_email ON auth.users;
CREATE TRIGGER on_auth_user_updated_welcome_email
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed IS DISTINCT FROM NEW.email_confirmed)
  EXECUTE FUNCTION public.trigger_welcome_email();

-- ============================================================================
-- 8. DEFAULT EMAIL TEMPLATES
-- Insert default templates for all auth notification types
-- ============================================================================

INSERT INTO public.email_templates (template_key, subject, html_content, text_content) VALUES
('signup_verification', 
 'Verify your AMET Platform account',
 '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Verify your account</title><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6}.btn{display:inline-block;padding:12px 30px;background:#007bff;color:white;text-decoration:none;border-radius:5px;margin:20px 0}.header{color:#333;text-align:center}</style></head><body>
  <div class="header"><h2>Welcome to AMET Platform!</h2></div>
  <p>Hi {{first_name}},</p>
  <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
  <div style="text-align:center;margin:30px 0">
    <a href="{{verification_link}}" class="btn">Verify Email</a>
  </div>
  <p>Or copy this link: <br>{{verification_link}}</p>
  <p><strong>This link expires in 24 hours.</strong></p>
  <p>Best regards,<br>The AMET Platform Team</p>
 </body></html>',
 'Hi {{first_name}},

Welcome to AMET Platform!

Please verify your email by visiting: {{verification_link}}

This link expires in 24 hours.

Best regards,
The AMET Platform Team'),

('welcome_email',
 'Welcome to AMET Platform!',
 '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome to AMET Platform</title><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6}.btn{display:inline-block;padding:12px 30px;background:#28a745;color:white;text-decoration:none;border-radius:5px;margin:20px 0}.header{color:#28a745;text-align:center}</style></head><body>
  <div class="header"><h2>Welcome to AMET Platform!</h2></div>
  <p>Hi {{first_name}},</p>
  <p>Your account has been successfully verified. You now have full access to AMET Platform.</p>
  <div style="text-align:center;margin:30px 0">
    <a href="{{dashboard_url}}" class="btn">Go to Dashboard</a>
  </div>
  <p>If you have any questions, feel free to contact our support team.</p>
  <p>Best regards,<br>The AMET Platform Team</p>
 </body></html>',
 'Hi {{first_name}},

Welcome to AMET Platform!

Your account has been successfully verified. You now have full access to the platform.

Go to your dashboard: {{dashboard_url}}

If you have any questions, feel free to contact our support team.

Best regards,
The AMET Platform Team'),

('forgot_password',
 'Reset your AMET Platform password',
 '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reset your password</title><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6}.btn{display:inline-block;padding:12px 30px;background:#dc3545;color:white;text-decoration:none;border-radius:5px;margin:20px 0}.alert{background:#f8d7da;color:#721c24;padding:10px;border-radius:5px;margin:10px 0}</style></head><body>
  <h2 style="color:#333">Reset Your Password</h2>
  <p>Hi {{first_name}},</p>
  <div class="alert">We received a request to reset your password for your AMET Platform account.</div>
  <div style="text-align:center;margin:30px 0">
    <a href="{{reset_link}}" class="btn">Reset Password</a>
  </div>
  <p>Or copy this link: <br>{{reset_link}}</p>
  <p><strong>This link expires in {{expiry_hours}} hour(s).</strong></p>
  <p>If you didn''t request this password reset, you can safely ignore this email.</p>
  <p>Best regards,<br>The AMET Platform Team</p>
 </body></html>',
 'Hi {{first_name}},

We received a request to reset your password for your AMET Platform account.

Reset your password here: {{reset_link}}

This link expires in {{expiry_hours}} hour(s).

If you didn''t request this password reset, you can safely ignore this email.

Best regards,
The AMET Platform Team'),

('password_changed',
 'Your AMET Platform password has been changed',
 '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Password changed</title><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6}.btn{display:inline-block;padding:12px 30px;background:#ffc107;color:#333;text-decoration:none;border-radius:5px;margin:20px 0}.alert{background:#fff3cd;color:#856404;padding:10px;border-radius:5px;margin:10px 0}</style></head><body>
  <h2 style="color:#333">Password Changed Successfully</h2>
  <p>Hi {{first_name}},</p>
  <div class="alert">Your password for your AMET Platform account has been successfully changed.</div>
  <p>If you didn''t make this change, please contact our support team immediately.</p>
  <div style="text-align:center;margin:30px 0">
    <a href="{{security_url}}" class="btn">Review Security Settings</a>
  </div>
  <p>Best regards,<br>The AMET Platform Team</p>
 </body></html>',
 'Hi {{first_name}},

Your password for your AMET Platform account has been successfully changed.

If you didn''t make this change, please contact our support team immediately.

Review your security settings: {{security_url}}

Best regards,
The AMET Platform Team'),

('account_approved',
 'Your AMET Platform account has been approved',
 '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Account approved</title><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6}.btn{display:inline-block;padding:12px 30px;background:#28a745;color:white;text-decoration:none;border-radius:5px;margin:20px 0}.success{color:#28a745;text-align:center}</style></head><body>
  <div class="success"><h2>Account Approved! 🎉</h2></div>
  <p>Hi {{first_name}},</p>
  <p>Your AMET Platform account has been approved and is now fully active.</p>
  <div style="text-align:center;margin:30px 0">
    <a href="{{dashboard_url}}" class="btn">Go to Dashboard</a>
  </div>
  <p>Welcome to the AMET Platform community!</p>
  <p>Best regards,<br>The AMET Platform Team</p>
 </body></html>',
 'Hi {{first_name},

Your AMET Platform account has been approved and is now fully active.

Welcome to the AMET Platform community!

Go to your dashboard: {{dashboard_url}}

Best regards,
The AMET Platform Team'),

('account_rejected',
 'Regarding your AMET Platform account application',
 '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Account application status</title><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6}.btn{display:inline-block;padding:12px 30px;background:#6c757d;color:white;text-decoration:none;border-radius:5px;margin:20px 0}.warning{color:#dc3545;text-align:center}</style></head><body>
  <div class="warning"><h2>Account Application Update</h2></div>
  <p>Hi {{first_name}},</p>
  <p>Thank you for your interest in joining AMET Platform. After careful review, we are unable to approve your application at this time.</p>
  <p>If you would like more information or believe this is an error, please contact our support team.</p>
  <div style="text-align:center;margin:30px 0">
    <a href="{{contact_url}}" class="btn">Contact Support</a>
  </div>
  <p>Best regards,<br>The AMET Platform Team</p>
 </body></html>',
 'Hi {{first_name}},

Thank you for your interest in joining AMET Platform. After careful review, we are unable to approve your application at this time.

If you would like more information or believe this is an error, please contact our support team.

Contact support: {{contact_url}}

Best regards,
The AMET Platform Team'),

('invite_user',
 'You''re invited to join AMET Platform',
 '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invitation to AMET Platform</title><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;line-height:1.6}.btn{display:inline-block;padding:12px 30px;background:#007bff;color:white;text-decoration:none;border-radius:5px;margin:20px 0}.invite{color:#007bff;text-align:center}</style></head><body>
  <div class="invite"><h2>You''re Invited! 🎉</h2></div>
  <p>You have been invited to join AMET Platform by <strong>{{invited_by}}</strong>.</p>
  <div style="text-align:center;margin:30px 0">
    <a href="{{invite_link}}" class="btn">Accept Invitation</a>
  </div>
  <p>Or copy this link: <br>{{invite_link}}</p>
  <p><strong>This invitation expires in {{expires_hours}} hours.</strong></p>
  <p>Best regards,<br>The AMET Platform Team</p>
 </body></html>',
 'You have been invited to join AMET Platform by {{invited_by}}.

Accept your invitation: {{invite_link}}

This invitation expires in {{expires_hours}} hours.

Best regards,
The AMET Platform Team')
ON CONFLICT (template_key) DO NOTHING;

-- ============================================================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_email_queue_status_created_at 
  ON public.email_queue (status, created_at);

CREATE INDEX IF NOT EXISTS idx_email_queue_to_email 
  ON public.email_queue (to_email);

CREATE INDEX IF NOT EXISTS idx_email_templates_key_active 
  ON public.email_templates (template_key, is_active);

-- ============================================================================
-- 10. UPDATED AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at 
  BEFORE UPDATE ON public.email_templates 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at 
  BEFORE UPDATE ON public.email_queue 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
