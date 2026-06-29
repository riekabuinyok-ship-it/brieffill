-- Fix auto-increment sequences after data migration
-- Run this in Supabase SQL Editor
SELECT setval('briefs_id_seq', COALESCE((SELECT MAX(id) FROM briefs), 1));
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval('teams_id_seq', COALESCE((SELECT MAX(id) FROM teams), 1));
SELECT setval('team_members_id_seq', COALESCE((SELECT MAX(id) FROM team_members), 1));
SELECT setval('brief_shares_id_seq', COALESCE((SELECT MAX(id) FROM brief_shares), 1));
SELECT setval('team_invites_id_seq', COALESCE((SELECT MAX(id) FROM team_invites), 1));
SELECT setval('webhook_deliveries_id_seq', COALESCE((SELECT MAX(id) FROM webhook_deliveries), 1));
SELECT setval('user_api_keys_id_seq', COALESCE((SELECT MAX(id) FROM user_api_keys), 1));
SELECT setval('invoices_id_seq', COALESCE((SELECT MAX(id) FROM invoices), 1));
SELECT setval('referrals_id_seq', COALESCE((SELECT MAX(id) FROM referrals), 1));
SELECT setval('referral_credits_id_seq', COALESCE((SELECT MAX(id) FROM referral_credits), 1));
SELECT setval('user_sessions_id_seq', COALESCE((SELECT MAX(id) FROM user_sessions), 1));
SELECT setval('collaboration_portals_id_seq', COALESCE((SELECT MAX(id) FROM collaboration_portals), 1));
SELECT setval('portal_responses_id_seq', COALESCE((SELECT MAX(id) FROM portal_responses), 1));
SELECT setval('portal_files_id_seq', COALESCE((SELECT MAX(id) FROM portal_files), 1));
SELECT 'All sequences fixed' AS result;
