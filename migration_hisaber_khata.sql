-- হিসাবের খাতা: customers & baki_entries tables

create table if not exists hisab_customers (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  shop_id     uuid references shops(id) on delete set null,
  name        text not null,
  phone       text,
  address     text,
  notes       text,
  created_at  timestamptz default now()
);

create table if not exists hisab_entries (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  customer_id   uuid not null references hisab_customers(id) on delete cascade,
  type          text not null check (type in ('baki', 'payment')),
  amount        numeric(12,2) not null,
  description   text,
  entry_date    date not null default current_date,
  created_at    timestamptz default now()
);

-- RLS
alter table hisab_customers enable row level security;
alter table hisab_entries   enable row level security;

create policy "owner_customers" on hisab_customers
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_entries" on hisab_entries
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Index for fast lookup
create index if not exists idx_hisab_customers_owner on hisab_customers(owner_id);
create index if not exists idx_hisab_entries_customer on hisab_entries(customer_id);
