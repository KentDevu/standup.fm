-- StandUp.fm Database Schema
-- Run this in your Supabase SQL editor

-- Storage bucket for audio drops
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  true,
  26214400, -- 25 MB limit
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg; codecs=opus', 'audio/webm; codecs=opus']
) on conflict (id) do nothing;

-- Allow anon (and service role) to upload audio files
create policy "Allow audio uploads"
  on storage.objects for insert
  with check (bucket_id = 'audio');

-- Allow public reads of audio files (bucket is public but policy is needed for RLS)
create policy "Allow audio reads"
  on storage.objects for select
  using (bucket_id = 'audio');

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  digest_time time default '09:00',
  timezone text default 'UTC',
  created_at timestamptz default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  name text not null,
  email text unique not null,
  avatar_url text,
  role text default 'member',
  created_at timestamptz default now()
);

create table drops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  audio_url text not null,
  duration integer not null,
  transcript text,
  sentiment_score real,
  created_at timestamptz default now()
);

create table extractions (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid references drops(id) on delete cascade,
  type text not null check (type in ('blocker', 'ask', 'win', 'decision')),
  content text not null,
  mentions text[] default '{}',
  resolved_at timestamptz,
  resolved_by uuid references users(id),
  created_at timestamptz default now()
);

create table reactions (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid references drops(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique(drop_id, user_id, emoji)
);

-- Indexes for common queries
create index idx_drops_team on drops(team_id, created_at desc);
create index idx_drops_user on drops(user_id, created_at desc);
create index idx_extractions_drop on extractions(drop_id);
create index idx_extractions_unresolved on extractions(type, resolved_at) where resolved_at is null;

-- Enable realtime
alter publication supabase_realtime add table drops;
alter publication supabase_realtime add table extractions;

-- Row Level Security
alter table teams enable row level security;
alter table users enable row level security;
alter table drops enable row level security;
alter table extractions enable row level security;
alter table reactions enable row level security;

-- For the hackathon demo, allow all reads
create policy "Allow all reads" on teams for select using (true);
create policy "Allow all reads" on users for select using (true);
create policy "Allow all reads" on drops for select using (true);
create policy "Allow all reads" on extractions for select using (true);
create policy "Allow all reads" on reactions for select using (true);

-- Allow inserts for demo
create policy "Allow inserts" on drops for insert with check (true);
create policy "Allow inserts" on extractions for insert with check (true);
create policy "Allow inserts" on reactions for insert with check (true);
create policy "Allow updates" on extractions for update using (true);

-- Seed demo data
insert into teams (id, name, digest_time, timezone) values
  ('00000000-0000-0000-0000-000000000001', 'StandUp.fm Core', '09:00', 'Asia/Manila');

insert into users (id, team_id, name, email, role) values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Aya Santos', 'aya@standup.fm', 'Frontend Lead'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Marco Weber', 'marco@standup.fm', 'Backend Engineer'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Priya Sharma', 'priya@standup.fm', 'Product Manager'),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Jordan Chen', 'jordan@standup.fm', 'DevOps');
