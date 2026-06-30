-- =============================================
-- TCN Platform Database Schema
-- Phase A — MVP Foundation
-- 运行方式：Supabase → SQL Editor → 粘贴全部 → Run
-- =============================================

create extension if not exists "uuid-ossp";

-- =============================================
-- PHASE A: 核心表
-- =============================================

-- 1. 用户表
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  full_name text,
  role text not null default 'tct_owner'
    check (role in ('tct_owner', 'participant', 'submitter', 'admin')),
  tct_status text default 'active'
    check (tct_status in ('active', 'suspended', 'revoked')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Listings 表
create table if not exists public.listings (
  id text primary key,
  name text not null,
  sector text not null
    check (sector in ('Energy', 'Renewable Energy', 'Real Estate', 'Technology')),
  status text not null default 'pending'
    check (status in ('pending', 'info_requested', 'approved', 'rejected', 'archived')),
  submitted_at timestamptz default now(),
  updated_at timestamptz default now(),
  submitter_id text,
  submitter_name text not null,
  description text not null,
  target_amount bigint not null,
  location text not null,
  timeline text not null,
  highlights text[] default '{}',
  signal_count integer default 0
);

-- 3. Collaboration Signals 表
create table if not exists public.collaboration_signals (
  id uuid default uuid_generate_v4() primary key,
  listing_id text not null references public.listings(id) on delete cascade,
  user_id text not null,
  signaled_at timestamptz default now(),
  unique(listing_id, user_id)
);

-- 4. 审计日志表（不可修改、不可删除）
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  timestamp timestamptz default now() not null,
  event_type text not null,
  user_id text not null,
  user_name text not null,
  role text not null,
  details text not null,
  listing_id text,
  metadata jsonb default '{}'
);

-- =============================================
-- PHASE B: 占位表（先建好，Phase B 再填充）
-- =============================================

create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  listing_id text references public.listings(id) on delete cascade,
  sender_id text,
  recipient_id text,
  content text,
  sent_at timestamptz default now(),
  read_at timestamptz
);

create table if not exists public.documents (
  id uuid default uuid_generate_v4() primary key,
  listing_id text references public.listings(id) on delete cascade,
  uploaded_by text,
  file_name text,
  storage_path text,
  uploaded_at timestamptz default now()
);

-- =============================================
-- PHASE D: 占位表（智能合约接入时使用）
-- =============================================

create table if not exists public.workflow_events (
  id uuid default uuid_generate_v4() primary key,
  chain_tx_hash text,
  event_type text,
  listing_id text,
  payload jsonb default '{}',
  indexed_at timestamptz default now()
);

create table if not exists public.tcnwft_tokens (
  id uuid default uuid_generate_v4() primary key,
  token_id text,
  token_class text check (token_class in ('participation', 'role', 'state')),
  holder_id text,
  listing_id text,
  minted_at timestamptz,
  status text default 'active' check (status in ('active', 'revoked'))
);

create table if not exists public.fund_movement_refs (
  id uuid default uuid_generate_v4() primary key,
  external_ref text,
  listing_id text,
  confirmed_at timestamptz,
  notes text
);

create table if not exists public.entity_formation_refs (
  id uuid default uuid_generate_v4() primary key,
  external_ref text,
  listing_id text,
  formed_at timestamptz,
  notes text
);

-- =============================================
-- ROW LEVEL SECURITY（RLS）
-- Phase A: anon + authenticated 均开放（Phase C 接入 TCT 凭证后收紧）
-- =============================================

alter table public.listings enable row level security;
alter table public.collaboration_signals enable row level security;
alter table public.audit_logs enable row level security;
alter table public.users enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.workflow_events enable row level security;
alter table public.tcnwft_tokens enable row level security;
alter table public.fund_movement_refs enable row level security;
alter table public.entity_formation_refs enable row level security;

-- Listings
create policy "phase_a_listings_select"      on public.listings for select to anon        using (true);
create policy "phase_a_listings_insert"      on public.listings for insert to anon        with check (true);
create policy "phase_a_listings_update"      on public.listings for update to anon        using (true);
create policy "phase_a_listings_select_auth" on public.listings for select to authenticated using (true);
create policy "phase_a_listings_insert_auth" on public.listings for insert to authenticated with check (true);
create policy "phase_a_listings_update_auth" on public.listings for update to authenticated using (true);

-- Audit logs
create policy "phase_a_audit_select"      on public.audit_logs for select to anon        using (true);
create policy "phase_a_audit_insert"      on public.audit_logs for insert to anon        with check (true);
create policy "phase_a_audit_select_auth" on public.audit_logs for select to authenticated using (true);
create policy "phase_a_audit_insert_auth" on public.audit_logs for insert to authenticated with check (true);

-- Collaboration signals
create policy "phase_a_signals_select"      on public.collaboration_signals for select to anon        using (true);
create policy "phase_a_signals_insert"      on public.collaboration_signals for insert to anon        with check (true);
create policy "phase_a_signals_delete"      on public.collaboration_signals for delete to anon        using (true);
create policy "phase_a_signals_select_auth" on public.collaboration_signals for select to authenticated using (true);
create policy "phase_a_signals_insert_auth" on public.collaboration_signals for insert to authenticated with check (true);
create policy "phase_a_signals_delete_auth" on public.collaboration_signals for delete to authenticated using (true);

-- Users
create policy "phase_a_users_select"      on public.users for select to anon        using (true);
create policy "phase_a_users_insert"      on public.users for insert to anon        with check (true);
create policy "phase_a_users_select_auth" on public.users for select to authenticated using (true);
create policy "phase_a_users_insert_auth" on public.users for insert to authenticated with check (true);

-- =============================================
-- GRANTS（GRANT 需在 RLS 之外单独执行）
-- =============================================

grant select, insert, update on public.listings              to anon, authenticated;
grant select, insert, delete on public.collaboration_signals to anon, authenticated;
grant select, insert          on public.audit_logs           to anon, authenticated;
grant select                  on public.users                to anon, authenticated;

-- =============================================
-- SEED DATA: 导入 Mock Listings
-- =============================================

insert into public.listings (id, name, sector, status, submitted_at, updated_at, submitter_id, submitter_name, description, target_amount, location, timeline, highlights, signal_count) values
('TCN-2025-001', 'Clearwater Solar Farm Development', 'Renewable Energy', 'approved', '2025-01-08', '2025-01-12', 'sub-001', 'Greenfield Capital Partners', 'A utility-scale solar photovoltaic development project spanning 2,400 acres in west Texas. The project seeks collaboration partners for land acquisition coordination, permitting support, and operational co-development. All financial arrangements are determined externally and independently between participants.', 24000000, 'Midland, Texas, USA', 'Q2 2025 – Q4 2026', ARRAY['240 MW installed capacity', 'PPA framework in place', 'Permitting at 70% completion', 'Grid interconnection approved'], 14),
('TCN-2025-002', 'Coastal Mixed-Use Redevelopment', 'Real Estate', 'approved', '2025-01-14', '2025-01-19', 'sub-002', 'Harbor View Development LLC', 'Mixed-use waterfront redevelopment project in the Port of Charleston area. Conversion of 12 decommissioned warehouse structures into residential lofts, commercial retail, and hospitality venues. Seeking collaboration partners for phased development planning and coordination.', 18500000, 'Charleston, South Carolina, USA', 'Q3 2025 – Q2 2028', ARRAY['380,000 sq ft total area', 'Historic preservation credits secured', 'Zoning pre-approved', 'Anchor tenant LOI received'], 9),
('TCN-2025-003', 'Permian Basin Enhanced Recovery Initiative', 'Energy', 'approved', '2025-01-20', '2025-01-24', 'sub-003', 'Basin Energy Partners', 'Enhanced oil recovery operation utilizing carbon dioxide injection across three established production fields in the Permian Basin. The collaboration opportunity involves operational co-participation in secondary recovery phases. Field-level production data available under NDA.', 31000000, 'Odessa, Texas, USA', 'Q1 2025 – Q3 2027', ARRAY['4,200 BOE/day current production', 'CO₂ supply contract executed', 'Three-field operation', 'Proven reserves certified'], 22),
('TCN-2025-004', 'Mountain West Data Center Campus', 'Technology', 'approved', '2025-01-28', '2025-02-03', 'sub-004', 'Summit Infrastructure Group', 'Tier-3 data center campus development on a 48-acre site in the Denver metropolitan area. The project seeks collaboration partners for phased construction coordination and hyperscale tenant relationship development. 100% renewable-powered by onsite solar and wind offtake agreements.', 42000000, 'Aurora, Colorado, USA', 'Q2 2025 – Q1 2027', ARRAY['180 MW total power capacity', '3 hyperscale LOIs received', 'LEED Gold target', 'Carrier-neutral fiber hub'], 31),
('TCN-2025-005', 'Offshore Wind Coordination Consortium', 'Renewable Energy', 'approved', '2025-02-05', '2025-02-11', 'sub-005', 'Atlantic Wind Ventures', 'Consortium formation for collaboration across an 800 MW offshore wind development lease area off the Virginia coast. The project coordinates marine survey, turbine procurement, and port logistics across multiple collaboration tracks. BOEM lease rights in place.', 55000000, 'Virginia Beach, Virginia, USA', 'Q2 2025 – Q4 2029', ARRAY['800 MW BOEM lease area', 'Environmental review complete', 'Port facility agreement signed', 'Turbine OEM term sheet executed'], 18),
('TCN-2025-006', 'Sunbelt Industrial Logistics Park', 'Real Estate', 'approved', '2025-02-12', '2025-02-18', 'sub-002', 'Harbor View Development LLC', 'Development of a 1.2 million square foot Class A industrial logistics facility positioned at the intersection of two major interstate corridors in the Phoenix metropolitan area. Collaboration sought for phased pad development and pre-leasing coordination with 3PL operators.', 28000000, 'Goodyear, Arizona, USA', 'Q3 2025 – Q1 2027', ARRAY['1.2M sq ft across 4 buildings', 'Two I-10 interchange access points', 'BNSF rail spur available', '40-foot clear height spec'], 12),
('TCN-2025-007', 'Gulf Coast LNG Terminal Expansion', 'Energy', 'info_requested', '2025-02-20', '2025-02-20', 'sub-006', 'Gulf Energy Terminal LLC', 'Expansion of an existing LNG liquefaction and export terminal with the addition of two new processing trains. Collaboration opportunity encompasses engineering coordination, regulatory filing support, and long-term offtake arrangement facilitation with international counterparties.', 68000000, 'Port Arthur, Texas, USA', 'Q3 2025 – Q2 2028', ARRAY['6 MTPA additional capacity', 'FERC pre-filing initiated', 'Asian market offtake discussions', 'Berth expansion permitted'], 0),
('TCN-2025-008', 'Southeast Semiconductor Fab Site Development', 'Technology', 'pending', '2025-02-22', '2025-02-22', 'sub-007', 'Meridian Advanced Manufacturing LLC', 'Greenfield development of a 600,000 sq ft semiconductor fabrication facility in the Research Triangle area of North Carolina. Collaboration partners sought for utility infrastructure coordination, workforce development pipeline, and supply chain localization strategy.', 94000000, 'Durham, North Carolina, USA', 'Q4 2025 – Q3 2029', ARRAY['600,000 sq ft fab footprint', 'CHIPS Act pre-application submitted', 'State incentive MOU signed', 'Utility power reserved — 400 MW'], 0)
on conflict (id) do nothing;

-- 导入审计日志
insert into public.audit_logs (timestamp, event_type, user_id, user_name, role, details, listing_id) values
('2025-02-22T16:44:00Z', 'listing_submitted', 'sub-007', 'Meridian Advanced Manufacturing LLC', 'submitter', 'New listing submitted for admin review', 'TCN-2025-008'),
('2025-02-22T09:12:00Z', 'listing_submitted', 'sub-006', 'Gulf Energy Terminal LLC', 'submitter', 'New listing submitted for admin review', 'TCN-2025-007'),
('2025-02-21T14:55:00Z', 'listing_info_requested', 'admin-001', 'TCN Admin', 'admin', 'Additional information requested from submitter — project description requires clarification', 'TCN-2025-007'),
('2025-02-18T14:30:00Z', 'listing_approved', 'admin-001', 'TCN Admin', 'admin', 'Listing approved and published to registry', 'TCN-2025-006'),
('2025-02-17T11:05:00Z', 'interest_signaled', 'part-003', 'Participant #3', 'participant', 'Interest signaled in Sunbelt Industrial Logistics Park', 'TCN-2025-006'),
('2025-02-16T09:44:00Z', 'interest_signaled', 'part-007', 'Participant #7', 'participant', 'Interest signaled in Mountain West Data Center Campus', 'TCN-2025-004'),
('2025-02-11T16:20:00Z', 'listing_approved', 'admin-001', 'TCN Admin', 'admin', 'Listing approved and published to registry', 'TCN-2025-005'),
('2025-02-10T13:15:00Z', 'listing_info_requested', 'admin-001', 'TCN Admin', 'admin', 'Additional information requested from submitter', 'TCN-2025-005'),
('2025-02-05T10:00:00Z', 'listing_submitted', 'sub-005', 'Atlantic Wind Ventures', 'submitter', 'New listing submitted for admin review', 'TCN-2025-005'),
('2025-02-03T15:45:00Z', 'listing_approved', 'admin-001', 'TCN Admin', 'admin', 'Listing approved and published to registry', 'TCN-2025-004'),
('2025-01-31T11:20:00Z', 'user_login', 'part-012', 'Participant #12', 'participant', 'Platform access authenticated', null),
('2025-01-30T09:05:00Z', 'interest_signaled', 'part-001', 'Participant #1', 'participant', 'Interest signaled in Permian Basin Enhanced Recovery Initiative', 'TCN-2025-003'),
('2025-01-24T14:10:00Z', 'listing_approved', 'admin-001', 'TCN Admin', 'admin', 'Listing approved and published to registry', 'TCN-2025-003'),
('2025-01-19T10:30:00Z', 'listing_approved', 'admin-001', 'TCN Admin', 'admin', 'Listing approved and published to registry', 'TCN-2025-002'),
('2025-01-12T09:00:00Z', 'listing_approved', 'admin-001', 'TCN Admin', 'admin', 'Listing approved and published to registry', 'TCN-2025-001'),
('2025-01-08T08:30:00Z', 'listing_submitted', 'sub-001', 'Greenfield Capital Partners', 'submitter', 'New listing submitted for admin review', 'TCN-2025-001');
