SELECT COUNT(*) FROM profiles WHERE is_verified = true AND privacy_settings->>'show_in_directory' = 'true';
