import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Admin: list all slots (including past ones) with signup counts.
export async function GET() {
  const { rows } = await query(
    `select
       s.id, s.title, s.category, s.description, s.event_date::text as event_date,
       s.start_time, s.end_time, s.location, s.capacity,
       s.contact_name, s.contact_email, s.contact_phone, s.created_at,
       count(su.id)::int as filled,
       (s.capacity - count(su.id))::int as open_spots
     from slots s
     left join signups su on su.slot_id = s.id
     group by s.id
     order by s.event_date desc, s.start_time desc nulls last`
  );
  return NextResponse.json({ slots: rows });
}

// Admin: create a new volunteer slot.
export async function POST(request) {
  const body = await request.json();
  const {
    title,
    category,
    description,
    event_date,
    start_time,
    end_time,
    location,
    capacity,
    contact_name,
    contact_email,
    contact_phone,
  } = body || {};

  if (!title || !event_date || !capacity || !contact_name || !contact_email) {
    return NextResponse.json(
      { error: 'title, event_date, capacity, contact_name, and contact_email are required.' },
      { status: 400 }
    );
  }
  const cap = Number(capacity);
  if (!Number.isInteger(cap) || cap < 1) {
    return NextResponse.json({ error: 'capacity must be a positive whole number.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(contact_email)) {
    return NextResponse.json({ error: 'Please provide a valid contact email address.' }, { status: 400 });
  }

  const { rows } = await query(
    `insert into slots (title, category, description, event_date, start_time, end_time, location, capacity, contact_name, contact_email, contact_phone)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     returning id, title, category, description, event_date::text as event_date,
               start_time, end_time, location, capacity, contact_name, contact_email, contact_phone, created_at`,
    [
      title,
      category || 'General',
      description || null,
      event_date,
      start_time || null,
      end_time || null,
      location || null,
      cap,
      contact_name,
      contact_email,
      contact_phone || null,
    ]
  );
  return NextResponse.json({ slot: rows[0] }, { status: 201 });
}
