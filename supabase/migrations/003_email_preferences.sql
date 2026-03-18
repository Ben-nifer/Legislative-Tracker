-- ============================================================
-- Add email notification preferences to user_profiles
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table user_profiles
  add column if not exists email_digests_enabled boolean default false;
