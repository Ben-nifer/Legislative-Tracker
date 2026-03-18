-- ============================================================
-- Add topic_follows table
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table if not exists topic_follows (
  user_id   uuid references auth.users(id) on delete cascade,
  topic_id  uuid references topics(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, topic_id)
);

alter table topic_follows enable row level security;

create policy "Users manage own topic_follows"
  on topic_follows for all using (auth.uid() = user_id);

create policy "Public read topic_follows"
  on topic_follows for select using (true);
