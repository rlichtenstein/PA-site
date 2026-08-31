import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// Public self-service cancellation via the token emailed at signup time.
export async function GET(request, { params }) {
  const { rows } = await query(
    `select su.*, s.title, s.event_date::text as event_date, s.start_time, s.location
     from signups su join slots s on s.id = su.slot_id
     where su.cancel_token = $1`,
    [params.token]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Signup not found.' }, { status: 404 });
  }
  return NextResponse.json({ signup: rows[0] });
}

export async function DELETE(request, { params }) {
  const { rowCount } = await query('delete from signups where cancel_token = $1', [params.token]);
  if (rowCount === 0) {
    return NextResponse.json({ error: 'Signup not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
