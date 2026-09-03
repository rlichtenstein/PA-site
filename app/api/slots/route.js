import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export const dynamic = 'force-dynamic';

// First name + last initial only (e.g. "Alice P.") — full names stay
// admin-only. Applied server-side so the public API never exposes the
// full name, not just the UI.
function shortName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// Public: list upcoming volunteer slots with remaining capacity and who's
// already signed up. Past slots (event_date before today) are excluded.
export async function GET() {
  const { rows } = await query(
    `select
       s.id, s.title, s.category, s.description, s.event_date::text as event_date,
       s.start_time, s.end_time, s.location, s.capacity,
       count(su.id)::int as filled,
       (s.capacity - count(su.id))::int as open_spots,
       coalesce(
         array_agg(su.parent_name order by su.created_at) filter (where su.id is not null),
         '{}'
       ) as volunteer_names
     from slots s
     left join signups su on su.slot_id = s.id
     where s.event_date >= current_date
     group by s.id
     order by s.event_date asc, s.start_time asc nulls last`
  );
  const slots = rows.map((slot) => ({
    ...slot,
    volunteer_names: slot.volunteer_names.map(shortName),
  }));
  return NextResponse.json({ slots });
}
