import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// Admin: list signups, optionally filtered to one slot (?slot_id=).
export async function GET(request) {
  const slotId = new URL(request.url).searchParams.get('slot_id');
  const { rows } = await query(
    `select su.*, s.title as slot_title, s.event_date::text as event_date, s.start_time, s.location
     from signups su
     join slots s on s.id = su.slot_id
     ${slotId ? 'where su.slot_id = $1' : ''}
     order by s.event_date asc, su.created_at asc`,
    slotId ? [slotId] : []
  );
  return NextResponse.json({ signups: rows });
}
