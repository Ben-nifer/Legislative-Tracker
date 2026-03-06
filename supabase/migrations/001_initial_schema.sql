-- ============================================================
-- NYC Legislative Tracker - Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

create table if not exists legislatures (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  name        text not null,
  jurisdiction text not null,
  level       text not null check (level in ('city', 'state', 'federal')),
  api_base_url text,
  created_at  timestamptz default now()
);

-- Seed NYC Council
insert into legislatures (slug, name, jurisdiction, level, api_base_url)
values ('nyc-council', 'New York City Council', 'New York City', 'city', 'https://webapi.legistar.com/v1/nyc')
on conflict (slug) do nothing;

create table if not exists committees (
  id            uuid primary key default uuid_generate_v4(),
  legislature_id uuid references legislatures(id) on delete cascade,
  name          text not null,
  legistar_id   integer unique,
  created_at    timestamptz default now()
);

create table if not exists legislation (
  id                uuid primary key default uuid_generate_v4(),
  legislature_id    uuid references legislatures(id) on delete cascade,
  legistar_id       integer unique,
  file_number       text not null,
  slug              text unique not null,
  title             text not null,
  status            text not null default 'Unknown',
  type              text not null default 'introduction' check (type in ('resolution', 'introduction', 'other')),
  intro_date        date,
  last_action_date  date,
  last_action_text  text,
  ai_summary        text,
  official_summary  text,
  committee_id      uuid references committees(id) on delete set null,
  legistar_url      text,
  full_text_url     text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists legislation_intro_date_idx on legislation(intro_date desc);
create index if not exists legislation_status_idx on legislation(status);
create index if not exists legislation_legislature_id_idx on legislation(legislature_id);

create table if not exists legislators (
  id              uuid primary key default uuid_generate_v4(),
  legislature_id  uuid references legislatures(id) on delete cascade,
  legistar_id     integer unique,
  full_name       text not null,
  title           text,
  slug            text unique not null,
  district        integer,
  borough         text,
  party           text,
  email           text,
  photo_url       text,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists sponsorships (
  legislation_id  uuid references legislation(id) on delete cascade,
  legislator_id   uuid references legislators(id) on delete cascade,
  is_primary      boolean default false,
  primary key (legislation_id, legislator_id)
);

create table if not exists legislation_history (
  id              uuid primary key default uuid_generate_v4(),
  legislation_id  uuid references legislation(id) on delete cascade,
  legistar_id     integer,
  action_date     date,
  action_text     text,
  passed_flag     boolean,
  created_at      timestamptz default now()
);

create index if not exists legislation_history_legislation_id_idx on legislation_history(legislation_id);

create table if not exists events (
  id              uuid primary key default uuid_generate_v4(),
  legislation_id  uuid references legislation(id) on delete cascade,
  legistar_id     integer,
  event_date      timestamptz,
  event_type      text,
  location        text,
  video_url       text,
  created_at      timestamptz default now()
);

create table if not exists topics (
  id              uuid primary key default uuid_generate_v4(),
  legislature_id  uuid references legislatures(id) on delete cascade,
  name            text not null,
  slug            text not null,
  unique (legislature_id, slug)
);

create table if not exists legislation_topics (
  legislation_id  uuid references legislation(id) on delete cascade,
  topic_id        uuid references topics(id) on delete cascade,
  primary key (legislation_id, topic_id)
);

-- ============================================================
-- USER TABLES
-- ============================================================

create table if not exists user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  links         jsonb default '[]'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists interest_tags (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  slug                text unique not null,
  is_predefined       boolean default false,
  created_by_user_id  uuid references auth.users(id) on delete set null,
  created_at          timestamptz default now()
);

create table if not exists user_interest_tags (
  user_id   uuid references auth.users(id) on delete cascade,
  tag_id    uuid references interest_tags(id) on delete cascade,
  primary key (user_id, tag_id)
);

create table if not exists user_stances (
  user_id         uuid references auth.users(id) on delete cascade,
  legislation_id  uuid references legislation(id) on delete cascade,
  stance          text not null check (stance in ('support', 'oppose', 'neutral', 'watching')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  primary key (user_id, legislation_id)
);

create table if not exists bookmarks (
  user_id         uuid references auth.users(id) on delete cascade,
  legislation_id  uuid references legislation(id) on delete cascade,
  created_at      timestamptz default now(),
  primary key (user_id, legislation_id)
);

-- ============================================================
-- COMMENT SYSTEM
-- ============================================================

create table if not exists comments (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade,
  legislation_id    uuid references legislation(id) on delete cascade,
  parent_comment_id uuid references comments(id) on delete cascade,
  body              text not null,
  stance_context    text check (stance_context in ('support', 'oppose', 'neutral')),
  is_hidden         boolean default false,
  is_flagged        boolean default false,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists comments_legislation_id_idx on comments(legislation_id);
create index if not exists comments_parent_comment_id_idx on comments(parent_comment_id);

create table if not exists comment_votes (
  user_id     uuid references auth.users(id) on delete cascade,
  comment_id  uuid references comments(id) on delete cascade,
  vote        smallint not null check (vote in (1, -1)),
  primary key (user_id, comment_id)
);

-- ============================================================
-- SOCIAL TABLES
-- ============================================================

create table if not exists user_follows (
  follower_id   uuid references auth.users(id) on delete cascade,
  following_id  uuid references auth.users(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

create table if not exists legislator_follows (
  user_id       uuid references auth.users(id) on delete cascade,
  legislator_id uuid references legislators(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (user_id, legislator_id)
);

create table if not exists legislation_follows (
  user_id             uuid references auth.users(id) on delete cascade,
  legislation_id      uuid references legislation(id) on delete cascade,
  notify_updates      boolean default true,
  notify_hearings     boolean default true,
  notify_amendments   boolean default true,
  created_at          timestamptz default now(),
  primary key (user_id, legislation_id)
);

-- ============================================================
-- NOTIFICATION TABLES
-- ============================================================

create table if not exists notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade,
  type            text not null check (type in (
                    'legislation_update', 'hearing_alert', 'bill_amendment',
                    'comment_reply', 'comment_upvote', 'new_follower'
                  )),
  title           text not null,
  body            text,
  url             text,
  read            boolean default false,
  legislation_id  uuid references legislation(id) on delete cascade,
  comment_id      uuid references comments(id) on delete cascade,
  actor_user_id   uuid references auth.users(id) on delete set null,
  created_at      timestamptz default now()
);

create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_read_idx on notifications(user_id, read);

-- ============================================================
-- ANALYTICS & TRENDING
-- ============================================================

create table if not exists engagement_events (
  id              uuid primary key default uuid_generate_v4(),
  legislation_id  uuid references legislation(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  event_type      text not null check (event_type in ('view', 'stance', 'comment', 'bookmark')),
  created_at      timestamptz default now()
);

create index if not exists engagement_events_legislation_id_idx on engagement_events(legislation_id);
create index if not exists engagement_events_created_at_idx on engagement_events(created_at desc);

-- legislation_stats: kept as a regular table, updated by triggers or cron
create table if not exists legislation_stats (
  legislation_id    uuid primary key references legislation(id) on delete cascade,
  support_count     integer default 0,
  oppose_count      integer default 0,
  neutral_count     integer default 0,
  watching_count    integer default 0,
  comment_count     integer default 0,
  bookmark_count    integer default 0,
  trending_score    numeric default 0,
  engagement_24h    integer default 0,
  engagement_7d     integer default 0,
  updated_at        timestamptz default now()
);

-- Auto-create a stats row whenever legislation is inserted
create or replace function create_legislation_stats()
returns trigger language plpgsql as $$
begin
  insert into legislation_stats (legislation_id)
  values (new.id)
  on conflict (legislation_id) do nothing;
  return new;
end;
$$;

drop trigger if exists legislation_stats_insert on legislation;
create trigger legislation_stats_insert
  after insert on legislation
  for each row execute function create_legislation_stats();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Public read on core tables
alter table legislation enable row level security;
alter table legislators enable row level security;
alter table legislation_stats enable row level security;
alter table committees enable row level security;
alter table legislation_history enable row level security;
alter table events enable row level security;
alter table topics enable row level security;
alter table legislation_topics enable row level security;
alter table sponsorships enable row level security;
alter table legislatures enable row level security;

create policy "Public read legislation" on legislation for select using (true);
create policy "Public read legislators" on legislators for select using (true);
create policy "Public read legislation_stats" on legislation_stats for select using (true);
create policy "Public read committees" on committees for select using (true);
create policy "Public read legislation_history" on legislation_history for select using (true);
create policy "Public read events" on events for select using (true);
create policy "Public read topics" on topics for select using (true);
create policy "Public read legislation_topics" on legislation_topics for select using (true);
create policy "Public read sponsorships" on sponsorships for select using (true);
create policy "Public read legislatures" on legislatures for select using (true);

-- User tables: users manage their own rows
alter table user_profiles enable row level security;
alter table user_stances enable row level security;
alter table bookmarks enable row level security;
alter table comments enable row level security;
alter table comment_votes enable row level security;
alter table user_follows enable row level security;
alter table legislator_follows enable row level security;
alter table legislation_follows enable row level security;
alter table notifications enable row level security;
alter table interest_tags enable row level security;
alter table user_interest_tags enable row level security;

create policy "Public read user_profiles" on user_profiles for select using (true);
create policy "Users manage own profile" on user_profiles for all using (auth.uid() = id);

create policy "Public read comments" on comments for select using (is_hidden = false);
create policy "Users insert own comments" on comments for insert with check (auth.uid() = user_id);
create policy "Users update own comments" on comments for update using (auth.uid() = user_id);
create policy "Users delete own comments" on comments for delete using (auth.uid() = user_id);

create policy "Users manage own stances" on user_stances for all using (auth.uid() = user_id);
create policy "Users manage own bookmarks" on bookmarks for all using (auth.uid() = user_id);
create policy "Users manage own votes" on comment_votes for all using (auth.uid() = user_id);
create policy "Users manage own user_follows" on user_follows for all using (auth.uid() = follower_id);
create policy "Users manage own legislator_follows" on legislator_follows for all using (auth.uid() = user_id);
create policy "Users manage own legislation_follows" on legislation_follows for all using (auth.uid() = user_id);
create policy "Users read own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on notifications for update using (auth.uid() = user_id);

create policy "Public read predefined tags" on interest_tags for select using (is_predefined = true or auth.uid() = created_by_user_id);
create policy "Users create custom tags" on interest_tags for insert with check (auth.uid() = created_by_user_id);
create policy "Users manage own interest_tags" on user_interest_tags for all using (auth.uid() = user_id);

-- Public read on follows/stances for profile pages
create policy "Public read user_follows" on user_follows for select using (true);
create policy "Public read legislator_follows" on legislator_follows for select using (true);
create policy "Public read bookmarks" on bookmarks for select using (true);
create policy "Public read stances" on user_stances for select using (true);
