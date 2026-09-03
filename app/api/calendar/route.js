import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { buildEvent, buildCalendar } from '../../../lib/ics';

export const dynamic = 'force-dynamic';

// Public: a subscribable feed of every upcoming volunteer slot. Parents can
// add this URL to Google Calendar ("From URL"), Apple Calendar ("New
// Calendar Subscription"), or Outlook to see all open opportunities without
// signing up for each one individually.
export async function GET() {
  const { rows } = await query(
    `select id, title, category, description, location,
            event_date::text as event_date, start_time, end_time
     from slots
     where event_date >= current_date
     order by event_date asc`
  );

  const ics = buildCalendar(rows.map((slot) => buildEvent(slot, `slot-${slot.id}@cathedral-pa`)));
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="cathedral-pa-volunteer-calendar.ics"',
    },
  });
}
