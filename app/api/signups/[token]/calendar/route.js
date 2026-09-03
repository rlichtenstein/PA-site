import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';
import { buildEvent, buildCalendar } from '../../../../../lib/ics';

export const dynamic = 'force-dynamic';

// Public: download a single .ics event for one signup, keyed by the same
// unguessable cancel_token used for self-service cancellation.
export async function GET(request, { params }) {
  const { rows } = await query(
    `select su.id as signup_id, s.title, s.category, s.description, s.location,
            s.event_date::text as event_date, s.start_time, s.end_time
     from signups su join slots s on s.id = su.slot_id
     where su.cancel_token = $1`,
    [params.token]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Signup not found.' }, { status: 404 });
  }

  const slot = rows[0];
  const ics = buildCalendar([buildEvent(slot, `signup-${slot.signup_id}@cathedral-pa`)]);
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="volunteer-slot.ics"',
    },
  });
}
