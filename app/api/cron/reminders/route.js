import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { sendSignupReminder } from '../../../../lib/email';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Triggered daily by Vercel Cron (see vercel.json). Sends a reminder email
// to every parent whose slot is 2 days out and hasn't been reminded yet.
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { rows } = await query(
    `select
       su.id, su.parent_name, su.parent_email, su.cancel_token,
       s.id as slot_id, s.title, s.category, s.event_date::text as event_date, s.start_time, s.end_time, s.location,
       s.contact_name, s.contact_email, s.contact_phone
     from signups su
     join slots s on s.id = su.slot_id
     where s.event_date = current_date + interval '2 days'
       and su.reminder_sent_at is null`
  );

  let sent = 0;
  const errors = [];
  for (const row of rows) {
    const signup = {
      id: row.id,
      parent_name: row.parent_name,
      parent_email: row.parent_email,
      cancel_token: row.cancel_token,
    };
    const slot = {
      title: row.title,
      category: row.category,
      event_date: row.event_date,
      start_time: row.start_time,
      end_time: row.end_time,
      location: row.location,
      contact_name: row.contact_name,
      contact_email: row.contact_email,
      contact_phone: row.contact_phone,
    };
    try {
      await sendSignupReminder({ slot, signup });
      await query('update signups set reminder_sent_at = now() where id = $1', [row.id]);
      sent += 1;
    } catch (err) {
      console.error(`Failed to send reminder for signup ${row.id}:`, err);
      errors.push({ signup_id: row.id, error: String(err) });
    }
  }

  return NextResponse.json({ checked: rows.length, sent, errors });
}
