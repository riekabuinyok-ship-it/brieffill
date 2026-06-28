CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT (datetime('now')),
  subscription_status TEXT DEFAULT 'free_trial',
  trial_end_date DATETIME,
  plan TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  brief_count_this_month INTEGER DEFAULT 0,
  brief_count_month TEXT,
  current_period_end DATETIME,
  cancel_at_period_end INTEGER DEFAULT 0,
  locale TEXT DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS briefs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  original_text TEXT NOT NULL,
  analyzed_text TEXT,
  completeness_score INTEGER,
  missing_fields TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT (datetime('now')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'analyzed', 'email_sent')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS field_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  example_question TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'failed', 'refunded', 'bypass')),
  stripe_session_id TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INTEGER PRIMARY KEY,
  theme TEXT DEFAULT 'light',
  email_greeting TEXT DEFAULT 'Hi {clientName},',
  email_signoff TEXT DEFAULT 'Best regards,\n{name}',
  email_template TEXT,
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  owner_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  joined_at DATETIME DEFAULT (datetime('now')),
  UNIQUE (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS brief_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  shared_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT (datetime('now')),
  UNIQUE (brief_id, team_id),
  FOREIGN KEY (brief_id) REFERENCES briefs(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team_invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  token TEXT NOT NULL UNIQUE,
  accepted_at DATETIME,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS brief_outcomes (
  brief_id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'in_progress')),
  notes TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (brief_id) REFERENCES briefs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS competitor_analyses (
  brief_id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  competitors JSON NOT NULL,
  common_strengths JSON NOT NULL,
  common_gaps JSON NOT NULL,
  opportunity TEXT NOT NULL,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (brief_id) REFERENCES briefs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_integrations (
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('notion', 'clickup', 'airtable', 'webhook')),
  api_key TEXT,
  target_id TEXT,
  target_id_2 TEXT,
  webhook_url TEXT,
  webhook_events JSON,
  updated_at DATETIME DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, provider),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event TEXT NOT NULL,
  url TEXT NOT NULL,
  status_code INTEGER,
  response_snippet TEXT,
  duration_ms INTEGER,
  error TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  stripe_invoice_id TEXT UNIQUE,
  amount INTEGER,
  currency TEXT DEFAULT 'usd',
  status TEXT,
  invoice_pdf TEXT,
  period_start DATETIME,
  period_end DATETIME,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_user_id INTEGER NOT NULL,
  referred_user_id INTEGER NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_signup' CHECK (status IN ('pending_signup', 'signed_up', 'paid', 'rewarded', 'cancelled', 'rejected')),
  referrer_credit_cents INTEGER DEFAULT 1000,
  friend_reward TEXT,
  created_at DATETIME DEFAULT (datetime('now')),
  qualified_at DATETIME,
  rewarded_at DATETIME,
  cancelled_at DATETIME,
  rejected_reason TEXT,
  ip_address TEXT,
  FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

CREATE TABLE IF NOT EXISTS referral_credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  referral_id INTEGER,
  applied_to_invoice_id INTEGER,
  created_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_referral_credits_user ON referral_credits(user_id);

INSERT OR IGNORE INTO field_definitions (field_name, description, example_question) VALUES
  ('Project Overview', 'What is the project about? What is the goal?', 'Could you briefly describe the project and its primary goal? How will success be measured?'),
  ('Target Audience', 'Who is this for? Demographics, psychographics, current behavior.', 'Who is the primary audience for this project? Can you describe their age, profession, and what they care about most?'),
  ('Core Problem', 'What problem does this product/service solve for the audience?', 'What specific problem does your product/service solve that existing solutions don''t address?'),
  ('Solution/Offer', 'What is the actual offering? Features, benefits, unique value proposition.', 'What is the core offering? What makes it different from competitors?'),
  ('Key Benefits', 'What are the top 3-5 benefits the audience will experience?', 'What are the main benefits someone will get from using this? Why should they care?'),
  ('Tone of Voice', 'What is the brand personality? Professional? Playful? Authoritative?', 'What tone should the messaging use? Is the brand more professional, friendly, bold, or humorous?'),
  ('Brand Guidelines', 'Colors, fonts, logo usage, design system links.', 'Do you have existing brand guidelines or a style guide I should follow? If not, any preferences on colors/fonts?'),
  ('Deliverables', 'What exactly are you delivering? List of all outputs.', 'Can you provide a list of all deliverables expected from this project? Please be as specific as possible.'),
  ('Timeline', 'When is this needed? Milestones, final deadline.', 'What is the ideal timeline for this project? Are there any specific milestones or important dates?'),
  ('Budget', 'What is the approximate budget? Helps scope the work.', 'Do you have a budget range in mind for this project? This helps me suggest the best scope of work.'),
  ('Competitors', 'Who else is doing something similar?', 'Who are your main competitors? What do you think they do well/poorly?'),
  ('Call to Action', 'What do you want the audience to do after consuming this?', 'What is the primary action you want the audience to take after seeing this (e.g., sign up, buy, contact)?');
