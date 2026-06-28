-- Supabase Migration: BriefFill Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/rmrmxceuvxamyjrdscvg/sql/new)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  subscription_status TEXT DEFAULT 'active',
  trial_end_date TIMESTAMPTZ,
  plan TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  brief_count_this_month INTEGER DEFAULT 0,
  brief_count_month TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end INTEGER DEFAULT 0,
  locale TEXT DEFAULT 'en',
  referral_code TEXT UNIQUE,
  referred_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  onboarding_email_sent_at TIMESTAMPTZ,
  reactivation_email_sent_at TIMESTAMPTZ,
  last_referral_activity_at TIMESTAMPTZ,
  avatar_url TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  bio TEXT,
  company TEXT,
  job_title TEXT,
  location TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  password_changed_at TIMESTAMPTZ,
  totp_secret TEXT,
  totp_enabled INTEGER DEFAULT 0
);

-- Briefs
CREATE TABLE IF NOT EXISTS public.briefs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  original_text TEXT NOT NULL,
  analyzed_text TEXT,
  completeness_score INTEGER,
  missing_fields TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'draft',
  industry TEXT
);

-- Competitor analyses
CREATE TABLE IF NOT EXISTS public.competitor_analyses (
  brief_id INTEGER PRIMARY KEY REFERENCES briefs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  competitors JSONB NOT NULL DEFAULT '[]',
  common_strengths JSONB NOT NULL DEFAULT '[]',
  common_gaps JSONB NOT NULL DEFAULT '[]',
  opportunity TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Brief outcomes
CREATE TABLE IF NOT EXISTS public.brief_outcomes (
  brief_id INTEGER PRIMARY KEY REFERENCES briefs(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'in_progress')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Brief shares
CREATE TABLE IF NOT EXISTS public.brief_shares (
  id BIGSERIAL PRIMARY KEY,
  brief_id INTEGER NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL,
  shared_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Collaboration portals
CREATE TABLE IF NOT EXISTS public.collaboration_portals (
  id BIGSERIAL PRIMARY KEY,
  brief_id INTEGER NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  view_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Portal responses
CREATE TABLE IF NOT EXISTS public.portal_responses (
  id BIGSERIAL PRIMARY KEY,
  portal_id INTEGER NOT NULL REFERENCES collaboration_portals(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Portal files
CREATE TABLE IF NOT EXISTS public.portal_files (
  id BIGSERIAL PRIMARY KEY,
  portal_id INTEGER NOT NULL REFERENCES collaboration_portals(id) ON DELETE CASCADE,
  field_name TEXT,
  file_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  description TEXT,
  logo_url TEXT
);

-- Team members
CREATE TABLE IF NOT EXISTS public.team_members (
  id BIGSERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Team invites
CREATE TABLE IF NOT EXISTS public.team_invites (
  id BIGSERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  token TEXT UNIQUE NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User integrations
CREATE TABLE IF NOT EXISTS public.user_integrations (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key TEXT,
  target_id TEXT,
  target_id_2 TEXT,
  webhook_url TEXT,
  webhook_events JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, provider)
);

-- Webhook deliveries
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  url TEXT NOT NULL,
  status_code INTEGER,
  response_snippet TEXT,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User API keys
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active INTEGER DEFAULT 1,
  key_prefix TEXT,
  revoked_at TIMESTAMPTZ
);

-- User preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  email_greeting TEXT DEFAULT 'Hi {clientName},',
  email_signoff TEXT DEFAULT 'Best regards,\n{name}',
  email_template TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  notifications_email_enabled INTEGER DEFAULT 1,
  notifications_brief_analysis INTEGER DEFAULT 1,
  notifications_team_invites INTEGER DEFAULT 1,
  notifications_portal_updates INTEGER DEFAULT 1,
  notifications_referral_rewards INTEGER DEFAULT 1,
  notifications_billing INTEGER DEFAULT 1,
  notifications_product_updates INTEGER DEFAULT 1,
  notifications_weekly_summary INTEGER DEFAULT 1
);

-- User sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Field definitions
CREATE TABLE IF NOT EXISTS public.field_definitions (
  id BIGSERIAL PRIMARY KEY,
  field_name TEXT NOT NULL,
  description TEXT,
  example_question TEXT
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT,
  invoice_pdf TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  plan TEXT,
  status TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  referral_code TEXT,
  status TEXT DEFAULT 'pending',
  referrer_credit_cents INTEGER DEFAULT 1000,
  friend_reward TEXT DEFAULT '1 month Pro',
  created_at TIMESTAMPTZ DEFAULT now(),
  qualified_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  rejected_reason TEXT,
  ip_address TEXT
);

-- Referral credits
CREATE TABLE IF NOT EXISTS public.referral_credits (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  reason TEXT,
  referral_id INTEGER REFERENCES referrals(id) ON DELETE SET NULL,
  applied_to_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_briefs_user_id ON public.briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_briefs_created_at ON public.briefs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collaboration_portals_token ON public.collaboration_portals(token);
CREATE INDEX IF NOT EXISTS idx_collaboration_portals_brief_id ON public.collaboration_portals(brief_id);
CREATE INDEX IF NOT EXISTS idx_portal_responses_portal_id ON public.portal_responses(portal_id);
CREATE INDEX IF NOT EXISTS idx_portal_files_portal_id ON public.portal_files(portal_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);

-- ── Migration complete — 29 tables created ──
