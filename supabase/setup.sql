create extension if not exists pgcrypto;

create table if not exists public.lots (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  avito_link text not null,
  start_price numeric not null check (start_price >= 0),
  current_price numeric not null check (current_price >= 0),
  min_step numeric not null check (min_step > 0),
  delivery_price numeric not null default 0 check (delivery_price >= 0),
  end_time timestamptz not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots(id) on delete cascade,
  name text not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists bids_lot_amount_created_idx
  on public.bids (lot_id, amount desc, created_at desc);

create or replace function public.place_bid(
  p_slug text,
  p_name text,
  p_amount numeric
)
returns table (
  lot_id uuid,
  current_price numeric,
  end_time timestamptz,
  bid_id uuid,
  bid_created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot public.lots%rowtype;
  v_now timestamptz := timezone('utc'::text, now());
  v_new_end_time timestamptz;
  v_bid_id uuid;
  v_bid_created_at timestamptz;
begin
  select *
  into v_lot
  from public.lots
  where slug = p_slug
  for update;

  if not found then
    raise exception 'LOT_NOT_FOUND';
  end if;

  if v_now >= v_lot.end_time then
    raise exception 'AUCTION_ENDED';
  end if;

  if p_amount < (v_lot.current_price + v_lot.min_step) then
    raise exception 'BID_TOO_LOW';
  end if;

  insert into public.bids (lot_id, name, amount)
  values (v_lot.id, left(trim(p_name), 40), p_amount)
  returning id, created_at into v_bid_id, v_bid_created_at;

  if (v_lot.end_time - v_now) <= interval '2 minutes' then
    v_new_end_time := v_lot.end_time + interval '2 minutes';
  else
    v_new_end_time := v_lot.end_time;
  end if;

  update public.lots
  set current_price = p_amount,
      end_time = v_new_end_time
  where id = v_lot.id
  returning lots.current_price, lots.end_time
  into current_price, end_time;

  lot_id := v_lot.id;
  bid_id := v_bid_id;
  bid_created_at := v_bid_created_at;

  return next;
end;
$$;

alter table public.lots enable row level security;
alter table public.bids enable row level security;

drop policy if exists "Public read lots" on public.lots;
create policy "Public read lots"
  on public.lots
  for select
  using (true);

drop policy if exists "Public read bids" on public.bids;
create policy "Public read bids"
  on public.bids
  for select
  using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lots'
  ) then
    alter publication supabase_realtime add table public.lots;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bids'
  ) then
    alter publication supabase_realtime add table public.bids;
  end if;
end;
$$;
