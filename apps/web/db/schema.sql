create table plans (
  id serial primary key,
  carrier text not null,
  name text not null,
  monthly_price numeric(6,2) not null,
  data_gb numeric(6,1), -- null means unlimited
  network text not null default '5G',
  url text not null,
  last_verified date not null
);

-- anonymous stats only, no bill content ever lands here
create table parse_events (
  id serial primary key,
  created_at timestamptz not null default now(),
  source text not null,
  savings_per_year numeric(8,2),
  flag_count int not null default 0
);