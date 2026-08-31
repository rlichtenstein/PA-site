import { NextResponse } from 'next/server';
import { withTransaction } from '../../../lib/db';
import { sendSignupConfirmation } from '../../../lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public: sign up for a volunteer slot. Enforces capacity and the
// event-hasn't-passed rule atomically (row lock on the slot).
export async function POST(request) {
  const body = await request.json();
  const { slot_id, parent_name, parent_email, parent_phone, notes } = body || {};

  if (!slot_id || !parent_name || !parent_email) {
    return NextResponse.json(
      { error: 'slot_id, parent_name, and parent_email are required.' },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(parent_email)) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  try {
    const { slot, signup } = await withTransaction(async (client) => {
      const slotResult = await client.query(
        `select id, title, category, capacity, location, start_time, end_time,
                event_date::text as event_date, (event_date < current_date) as is_past
         from slots where id = $1 for update`,
        [slot_id]
      );
      if (slotResult.rowCount === 0) {
        throw Object.assign(new Error('Slot not found.'), { status: 404 });
      }
      const slot = slotResult.rows[0];

      if (slot.is_past) {
        throw Object.assign(new Error('This slot has already passed.'), { status: 409 });
      }

      const countResult = await client.query(
        'select count(*)::int as filled from signups where slot_id = $1',
        [slot_id]
      );
      if (countResult.rows[0].filled >= slot.capacity) {
        throw Object.assign(new Error('This slot is already full.'), { status: 409 });
      }

      let signup;
      try {
        const insertResult = await client.query(
          `insert into signups (slot_id, parent_name, parent_email, parent_phone, notes)
           values ($1, $2, $3, $4, $5)
           returning *`,
          [slot_id, parent_name, parent_email, parent_phone || null, notes || null]
        );
        signup = insertResult.rows[0];
      } catch (err) {
        if (err.code === '23505') {
          throw Object.assign(
            new Error('You are already signed up for this slot with that email.'),
            { status: 409 }
          );
        }
        throw err;
      }

      return { slot, signup };
    });

    sendSignupConfirmation({ slot, signup }).catch((err) =>
      console.error('Failed to send signup confirmation email:', err)
    );

    return NextResponse.json({ signup }, { status: 201 });
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    return NextResponse.json({ error: err.message || 'Something went wrong.' }, { status });
  }
}
