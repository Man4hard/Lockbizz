
create type public.app_role as enum ('super_admin','shop_owner','staff');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  plan text not null default 'trial',
  license_expiry date default (current_date + 30),
  device_quota int not null default 10,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  name text,
  phone text,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.current_tenant_id() returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;
create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  insert into public.tenants (name, phone)
    values (coalesce(nullif(new.raw_user_meta_data->>'shop_name',''), 'My Shop'), nullif(new.raw_user_meta_data->>'phone',''))
    returning id into t;
  insert into public.profiles (id, tenant_id, name, phone)
    values (new.id, t, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), nullif(new.raw_user_meta_data->>'phone',''));
  insert into public.user_roles (user_id, role) values (new.id, 'shop_owner');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id),
  name text not null, cnic text not null, phone text not null, whatsapp text, address text,
  guarantor_name text, guarantor_phone text, photo_url text, agreement_url text, consent_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id),
  customer_id uuid references public.customers(id),
  imei1 text, imei2 text, model text, brand text, android_version text, fcm_token text,
  enrollment_status text not null default 'pending',
  lock_state text not null default 'unlocked',
  last_seen_at timestamptz, last_lat double precision, last_lng double precision,
  sim_serial text, app_version text, battery int,
  deleted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.device_secrets (
  device_id uuid primary key references public.devices(id) on delete cascade,
  secret_hex text not null,
  enroll_token text not null,
  created_at timestamptz not null default now()
);
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id),
  customer_id uuid not null references public.customers(id),
  device_id uuid references public.devices(id),
  total_price numeric(12,2) not null, down_payment numeric(12,2) not null default 0,
  financed_amount numeric(12,2) not null, markup numeric(12,2) not null default 0,
  installments_count int not null, frequency text not null default 'monthly',
  start_date date not null, grace_days int not null default 2,
  status text not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.installments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  seq_no int not null, due_date date not null,
  amount numeric(12,2) not null, paid_amount numeric(12,2) not null default 0,
  status text not null default 'pending', paid_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id),
  contract_id uuid not null references public.contracts(id),
  installment_id uuid references public.installments(id),
  amount numeric(12,2) not null,
  method text not null default 'cash', reference_no text, receipt_url text,
  status text not null default 'pending',
  submitted_by text not null default 'staff',
  approved_by uuid, approved_at timestamptz,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);
create table public.device_commands (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id),
  device_id uuid not null references public.devices(id),
  type text not null, payload_json jsonb not null default '{}',
  status text not null default 'pending',
  sent_at timestamptz, acked_at timestamptz,
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);
create table public.device_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  device_id uuid not null references public.devices(id),
  type text not null, payload_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table public.unlock_codes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id() references public.tenants(id),
  device_id uuid not null references public.devices(id),
  counter bigint not null, code_hash text not null, action text not null default 'unlock',
  expires_at timestamptz not null, used_at timestamptz, generated_by uuid,
  created_at timestamptz not null default now(),
  unique (device_id, counter)
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null, user_id uuid, action text not null, entity text, entity_id uuid,
  diff_json jsonb, created_at timestamptz not null default now()
);

create index on public.customers (tenant_id);
create index on public.devices (tenant_id, lock_state);
create index on public.devices (imei1);
create index on public.contracts (tenant_id, status);
create index on public.installments (contract_id, seq_no);
create index installments_overdue_idx on public.installments (tenant_id, due_date) where status <> 'paid';
create index on public.payments (tenant_id, status);
create index on public.device_commands (device_id, status);
create index on public.device_events (device_id, created_at desc);
create index on public.audit_logs (tenant_id, created_at desc);

grant select, update on public.tenants to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update, delete on public.customers, public.devices, public.contracts, public.installments, public.payments, public.device_commands, public.unlock_codes to authenticated;
grant select on public.device_events, public.audit_logs to authenticated;
grant all on public.tenants, public.profiles, public.user_roles, public.customers, public.devices, public.device_secrets, public.contracts, public.installments, public.payments, public.device_commands, public.device_events, public.unlock_codes, public.audit_logs to service_role;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.customers enable row level security;
alter table public.devices enable row level security;
alter table public.device_secrets enable row level security;
alter table public.contracts enable row level security;
alter table public.installments enable row level security;
alter table public.payments enable row level security;
alter table public.device_commands enable row level security;
alter table public.device_events enable row level security;
alter table public.unlock_codes enable row level security;
alter table public.audit_logs enable row level security;

create policy "own tenant read" on public.tenants for select to authenticated using (id = public.current_tenant_id());
create policy "owner update tenant" on public.tenants for update to authenticated
  using (id = public.current_tenant_id() and public.has_role(auth.uid(),'shop_owner'))
  with check (id = public.current_tenant_id());
create policy "tenant profiles read" on public.profiles for select to authenticated using (tenant_id = public.current_tenant_id());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and tenant_id = public.current_tenant_id());
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid());

create policy "tenant all" on public.customers for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
create policy "tenant all" on public.devices for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
create policy "tenant all" on public.contracts for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
create policy "tenant all" on public.installments for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
create policy "tenant all" on public.payments for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
create policy "tenant all" on public.device_commands for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
create policy "tenant all" on public.unlock_codes for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id());
create policy "tenant read" on public.device_events for select to authenticated using (tenant_id = public.current_tenant_id());
create policy "tenant read" on public.audit_logs for select to authenticated using (tenant_id = public.current_tenant_id());

create or replace function public.create_contract(
  p_customer uuid, p_device uuid, p_total numeric, p_down numeric, p_markup numeric,
  p_count int, p_frequency text, p_start date, p_grace int
) returns uuid language plpgsql security invoker set search_path = public as $$
declare cid uuid; fin numeric; per numeric; i int; amt numeric; d date;
begin
  if p_count < 1 or p_total <= 0 or p_down < 0 or p_down > p_total then raise exception 'invalid contract values'; end if;
  fin := p_total - p_down + p_markup;
  per := ceil(fin / p_count);
  insert into public.contracts (customer_id, device_id, total_price, down_payment, financed_amount, markup, installments_count, frequency, start_date, grace_days)
    values (p_customer, p_device, p_total, p_down, fin, p_markup, p_count, p_frequency, p_start, p_grace) returning id into cid;
  for i in 1..p_count loop
    amt := case when i = p_count then fin - per * (p_count - 1) else per end;
    d := case when p_frequency = 'weekly' then p_start + (i-1) * 7 else (p_start + ((i-1) || ' months')::interval)::date end;
    insert into public.installments (contract_id, seq_no, due_date, amount) values (cid, i, d, amt);
  end loop;
  return cid;
end $$;

create or replace function public.approve_payment(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pay public.payments; ct public.contracts; inst public.installments; remaining numeric; applied numeric; need numeric; unpaid int; overdue int;
begin
  select * into pay from public.payments where id = p_id for update;
  if not found or pay.tenant_id <> public.current_tenant_id() then raise exception 'payment not found'; end if;
  if pay.status = 'approved' then return; end if;
  select * into ct from public.contracts where id = pay.contract_id;
  remaining := pay.amount;
  for inst in select * from public.installments where contract_id = ct.id and status <> 'paid' order by seq_no for update loop
    exit when remaining <= 0;
    need := inst.amount - inst.paid_amount;
    applied := least(need, remaining);
    update public.installments set paid_amount = paid_amount + applied,
      status = case when paid_amount + applied >= amount then 'paid' else 'partial' end,
      paid_at = case when paid_amount + applied >= amount then now() else paid_at end,
      updated_at = now()
      where id = inst.id;
    remaining := remaining - applied;
  end loop;
  update public.payments set status = 'approved', approved_by = auth.uid(), approved_at = now() where id = p_id;
  select count(*) into unpaid from public.installments where contract_id = ct.id and status <> 'paid';
  select count(*) into overdue from public.installments where contract_id = ct.id and status <> 'paid' and due_date + ct.grace_days < current_date;
  if unpaid = 0 then
    update public.contracts set status = 'completed', updated_at = now() where id = ct.id;
    if ct.device_id is not null then
      insert into public.device_commands (tenant_id, device_id, type) values (ct.tenant_id, ct.device_id, 'release');
    end if;
  elsif overdue = 0 and ct.device_id is not null then
    insert into public.device_commands (tenant_id, device_id, type) values (ct.tenant_id, ct.device_id, 'unlock');
  end if;
  insert into public.audit_logs (tenant_id, user_id, action, entity, entity_id, diff_json)
    values (ct.tenant_id, auth.uid(), 'payment_approved', 'payment', p_id, jsonb_build_object('amount', pay.amount));
end $$;

create or replace function public.reject_payment(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.payments set status = 'rejected', approved_by = auth.uid(), approved_at = now()
    where id = p_id and tenant_id = public.current_tenant_id() and status = 'pending';
end $$;

create or replace function public.record_payment(p_contract uuid, p_amount numeric, p_method text, p_ref text, p_key text)
returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid; ct public.contracts;
begin
  select * into ct from public.contracts where id = p_contract and tenant_id = public.current_tenant_id();
  if not found then raise exception 'contract not found'; end if;
  if p_amount <= 0 then raise exception 'invalid amount'; end if;
  if p_key is not null then select id into pid from public.payments where idempotency_key = p_key; if found then return pid; end if; end if;
  insert into public.payments (tenant_id, contract_id, amount, method, reference_no, status, submitted_by, idempotency_key)
    values (ct.tenant_id, p_contract, p_amount, p_method, p_ref, 'pending', 'staff', p_key) returning id into pid;
  perform public.approve_payment(pid);
  return pid;
end $$;

revoke all on function public.approve_payment(uuid), public.reject_payment(uuid), public.record_payment(uuid,numeric,text,text,text), public.current_tenant_id(), public.has_role(uuid, public.app_role), public.handle_new_user() from public, anon;
grant execute on function public.approve_payment(uuid), public.reject_payment(uuid), public.record_payment(uuid,numeric,text,text,text), public.current_tenant_id(), public.has_role(uuid, public.app_role), public.create_contract(uuid,uuid,numeric,numeric,numeric,int,text,date,int) to authenticated;

create policy "tenant files read" on storage.objects for select to authenticated
  using (bucket_id = 'agreements' and (storage.foldername(name))[1] = public.current_tenant_id()::text);
create policy "tenant files insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'agreements' and (storage.foldername(name))[1] = public.current_tenant_id()::text);
