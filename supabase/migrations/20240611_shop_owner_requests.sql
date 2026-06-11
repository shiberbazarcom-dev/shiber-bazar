-- ─────────────────────────────────────────────────────────────────────────────
-- shop_owner_requests table
-- Stores requests from users who want to become shop owners.
-- Admin reviews and approves/rejects; on approval the user role is changed.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.shop_owner_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  full_name     text not null,
  phone         text not null,
  business_type text not null,
  shop_name     text,
  location      text not null,
  notes         text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  admin_note    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index for admin list queries
create index if not exists shop_owner_requests_status_idx
  on public.shop_owner_requests(status);

create index if not exists shop_owner_requests_user_id_idx
  on public.shop_owner_requests(user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shop_owner_requests_updated_at on public.shop_owner_requests;
create trigger shop_owner_requests_updated_at
  before update on public.shop_owner_requests
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.shop_owner_requests enable row level security;

-- Users can see only their own requests
create policy "Users can view own requests"
  on public.shop_owner_requests for select
  using (auth.uid() = user_id);

-- Authenticated users can submit a request
create policy "Authenticated users can insert"
  on public.shop_owner_requests for insert
  with check (auth.uid() = user_id);

-- Admins (super_admin, market_manager) can view all requests
create policy "Admins can view all requests"
  on public.shop_owner_requests for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'market_manager')
    )
  );

-- Admins can update (approve / reject)
create policy "Admins can update requests"
  on public.shop_owner_requests for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('super_admin', 'market_manager')
    )
  );
