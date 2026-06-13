-- Enums
create type page_kind as enum ('exec_report','user_guide','test_cases','bugs','changelog');
create type feature_status as enum ('planned','in_progress','done','blocked');
create type tc_type as enum ('positive','boundary','business','negative');
create type tc_result as enum ('pass','fail','not_run');
create type bug_severity as enum ('S1','S2','S3','S4');
create type bug_priority as enum ('P1','P2','P3','P4');
create type bug_status as enum ('new','in_progress','fixed','wont_fix');
create type share_label as enum ('colleague','manager','boss');

-- Tables
create table project (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  client text,
  description text,
  status text default 'active',
  cover_url text,
  created_at timestamptz default now()
);

create table feature (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  name text not null,
  description text,
  status feature_status default 'planned',
  "order" int default 0
);

create table page (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  kind page_kind not null,
  title text not null,
  published boolean default false,
  html_vi text,
  html_en text,
  updated_at timestamptz default now(),
  unique (project_id, kind)
);

create table test_case (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  feature_id uuid references feature(id) on delete set null,
  section text,
  code text,
  type tc_type default 'positive',
  summary text,
  precondition text,
  steps jsonb default '[]',
  expected text,
  result tc_result default 'not_run',
  note text,
  "order" int default 0
);

create table bug (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  feature_id uuid references feature(id) on delete set null,
  code text,
  summary text,
  description text,
  expected text,
  observed text,
  severity bug_severity default 'S3',
  priority bug_priority default 'P3',
  status bug_status default 'new',
  suggested_fix text,
  steps jsonb default '[]',
  fixed_at timestamptz,
  "order" int default 0
);

create table changelog_entry (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  feature_id uuid references feature(id) on delete set null,
  entry_date date default now(),
  title text not null,
  status text,
  body text,
  commit_refs text[] default '{}',
  "order" int default 0
);

create table share_link (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references page(id) on delete cascade,
  token text unique not null,
  label share_label default 'colleague',
  recipient_note text,
  password_hash text,
  expires_at timestamptz,
  revoked boolean default false,
  view_count int default 0,
  last_viewed_at timestamptz,
  created_at timestamptz default now()
);

-- RLS: chỉ owner (authenticated) thao tác. Viewer công khai đọc qua service role (bypass RLS).
do $$
declare t text;
begin
  foreach t in array array['project','feature','page','test_case','bug','changelog_entry','share_link']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$create policy "owner_all_%1$s" on %1$I
      for all to authenticated using (true) with check (true);$f$, t);
  end loop;
end $$;
