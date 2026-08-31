import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export const dynamic = 'force-dynamic';

// Public: list upcoming volunteer slots with remaining capacity.
// Past slots (event_date before today) are excluded entirely.
export async function GET() {
  const { rows } = await query(
    `select
       s.id, s.title, s.category, s.description, s.event_date::text as event_date,
       s.start_time, s.end_time, s.location, s.capacity,
       count(su.id)::int as filled,
       (s.capacity - count(su.id))::int as open_spots
     from slots s
     left join signups su on su.slot_id = s.id
     where s.event_date >= current_date
     group by s.id
     order by s.event_date asc, s.start_time asc nulls last`
  );
  return NextResponse.json({ slots: rows });
}
