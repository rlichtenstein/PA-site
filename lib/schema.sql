-- Cathedral School PA site schema.
-- Applied by scripts/migrate.js (run: npm run migrate). Safe to re-run.

create table if not exists slots (
  id serial primary key,
  title text not null,
  category text not null default 'General',
  description text,
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  capacity int not null check (capacity > 0),
  contact_name text not null default '',
  contact_email text not null default '',
  contact_phone text,
  created_at timestamptz not null default now()
);

-- Additive migration for databases created before contact fields existed.
alter table slots add column if not exists contact_name text not null default '';
alter table slots add column if not exists contact_email text not null default '';
alter table slots add column if not exists contact_phone text;

create table if not exists signups (
  id serial primary key,
  slot_id int not null references slots(id) on delete cascade,
  parent_name text not null,
  parent_email text not null,
  parent_phone text,
  notes text,
  cancel_token uuid not null default gen_random_uuid(),
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (slot_id, parent_email)
);

create index if not exists idx_signups_slot_id on signups(slot_id);
create index if not exists idx_signups_cancel_token on signups(cancel_token);
create index if not exists idx_slots_event_date on slots(event_date);

create table if not exists reimbursements (
  id serial primary key,
  parent_name text not null,
  parent_email text not null,
  parent_phone text,
  address text,
  activity text not null,
  amount numeric(10, 2) not null check (amount > 0),
  expense_date date,
  description text,
  receipt_attached boolean not null default false,
  delivery_method text not null default 'mail_check' check (delivery_method in ('mail_check', 'pickup_business_office')),
  receipt_urls text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'denied')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Additive migration for databases created before these fields existed.
alter table reimbursements add column if not exists address text;
alter table reimbursements add column if not exists expense_date date;
alter table reimbursements add column if not exists receipt_attached boolean not null default false;
alter table reimbursements add column if not exists delivery_method text not null default 'mail_check';
alter table reimbursements add column if not exists receipt_urls text[] not null default '{}';
-- Migrate any pre-existing single-receipt-url rows into the new array column, then drop it.
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'reimbursements' and column_name = 'receipt_url') then
    update reimbursements set receipt_urls = array[receipt_url] where receipt_url is not null and receipt_urls = '{}';
    alter table reimbursements drop column receipt_url;
  end if;
end $$;

create index if not exists idx_reimbursements_status on reimbursements(status);
