-- Add role column to users table (admin or user)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Set admin role for specific admin accounts
UPDATE users SET role = 'admin' WHERE email = 'riekabui@brieffill.com';

-- Create admin_settings table for system configuration
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO admin_settings (key, value) VALUES
  ('general', '{"company_name": "BriefFill", "support_email": "support@brieffill.com", "default_locale": "en"}'),
  ('security', '{"two_factor_required": false, "session_timeout_minutes": 30}'),
  ('email', '{"smtp_host": "", "smtp_port": 587, "encryption": "tls"}')
ON CONFLICT (key) DO NOTHING;

SELECT 'Admin migration complete' AS result;
