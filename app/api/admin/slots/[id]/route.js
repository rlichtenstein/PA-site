import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Admin: edit an existing slot.
export async function PATCH(request, { params }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'invalid slot id' }, { status: 400 });
  }

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
    `update slots set
       title = $2, category = $3, description = $4, event_date = $5,
       start_time = $6, end_time = $7, location = $8, capacity = $9,
       contact_name = $10, contact_email = $11, contact_phone = $12
     where id = $1
     returning id, title, category, description, event_date::text as event_date,
               start_time, end_time, location, capacity, contact_name, contact_email, contact_phone, created_at`,
    [
      id,
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
  if (rows.length === 0) {
    return NextResponse.json({ error: 'slot not found' }, { status: 404 });
  }
  return NextResponse.json({ slot: rows[0] });
}

// Admin: delete/cancel a slot (also removes its signups via FK cascade).
export async function DELETE(request, { params }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'invalid slot id' }, { status: 400 });
  }
  const { rowCount } = await query('delete from slots where id = $1', [id]);
  if (rowCount === 0) {
    return NextResponse.json({ error: 'slot not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
