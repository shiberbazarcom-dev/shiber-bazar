-- Landing Pages feature migration
-- Run this in Supabase SQL Editor

create table if not exists landing_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid references shops(id) on delete set null,
  product_id uuid references products(id) on delete set null,

  -- identity
  slug text unique not null,
  template_id int not null default 1,
  is_published boolean not null default false,

  -- hero
  title text not null default '',
  headline text not null default '',
  subheadline text default '',
  badge_text text default '',
  hero_image_url text default '',
  cta_text text default 'এখনই অর্ডার করুন',
  cta_color text default '#16a34a',

  -- product info
  product_name text default '',
  product_price numeric(12,2),
  product_original_price numeric(12,2),
  product_description text default '',

  -- features list  (JSON array of strings)
  features jsonb not null default '[]',

  -- FAQ (JSON array of {q, a})
  faqs jsonb not null default '[]',

  -- social proof
  show_whatsapp boolean not null default true,
  phone text default '',
  whatsapp_message text default '',

  -- countdown (optional)
  countdown_end timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- updated_at trigger
create or replace function update_landing_pages_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger trg_landing_pages_updated_at
  before update on landing_pages
  for each row execute function update_landing_pages_updated_at();

-- RLS
alter table landing_pages enable row level security;

create policy "owner can manage own landing pages"
  on landing_pages for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "anyone can view published landing pages"
  on landing_pages for select
  using (is_published = true);

-- index for slug lookup
create index if not exists idx_landing_pages_slug on landing_pages(slug);
create index if not exists idx_landing_pages_owner on landing_pages(owner_id);
