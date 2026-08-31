-- Cathedral School PA site schema.
-- Applied by scripts/migrate.js (run: npm run migrate).

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
  created_at timestamptz not null default now()
);

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
  activity text not null,
  amount numeric(10, 2) not null check (amount > 0),
  description text,
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'denied')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reimbursements_status on reimbursements(status);
