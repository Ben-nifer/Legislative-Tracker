create table if not exists legislator_committee_memberships (
  id              uuid primary key default uuid_generate_v4(),
  legislator_id   uuid references legislators(id) on delete cascade not null,
  committee_id    uuid references committees(id) on delete cascade not null,
  is_chair        boolean default false,
  start_date      date,
  end_date        date,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (legislator_id, committee_id)
);

alter table legislator_committee_memberships enable row level security;
create policy "Public read memberships" on legislator_committee_memberships for select using (true);
