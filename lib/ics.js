// Minimal RFC 5545 (iCalendar) writer — just enough to describe a volunteer
// slot as a VEVENT. No external dependency needed for something this small.
// Times are emitted as "floating" (no TZID/Z suffix), which calendar apps
// interpret in the viewer's local timezone — a reasonable approximation
// since this site serves a single school community in one timezone.

function pad(n) {
  return String(n).padStart(2, '0');
}

function escapeText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// RFC 5545 line folding: continuation lines are prefixed with a space.
function foldLine(line) {
  const max = 75;
  if (line.length <= max) return line;
  let result = line.slice(0, max);
  let i = max;
  while (i < line.length) {
    result += `\r\n ${line.slice(i, i + max - 1)}`;
    i += max - 1;
  }
  return result;
}

function formatDateStampUTC(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// slot: { event_date: 'YYYY-MM-DD', start_time: 'HH:MM:SS'|null, end_time, title, category, description, location }
function slotDates(slot) {
  const [y, m, d] = slot.event_date.split('-').map(Number);

  if (!slot.start_time) {
    const start = `${y}${pad(m)}${pad(d)}`;
    const end = new Date(Date.UTC(y, m - 1, d + 1));
    const endStr = `${end.getUTCFullYear()}${pad(end.getUTCMonth() + 1)}${pad(end.getUTCDate())}`;
    return { allDay: true, dtstart: start, dtend: endStr };
  }

  const [sh, sm] = slot.start_time.split(':').map(Number);
  const dtstart = `${y}${pad(m)}${pad(d)}T${pad(sh)}${pad(sm)}00`;

  let eh, em;
  if (slot.end_time) {
    [eh, em] = slot.end_time.split(':').map(Number);
  } else {
    const total = sh * 60 + sm + 60; // default 1-hour duration
    eh = Math.floor(total / 60) % 24;
    em = total % 60;
  }
  const dtend = `${y}${pad(m)}${pad(d)}T${pad(eh)}${pad(em)}00`;

  return { allDay: false, dtstart, dtend };
}

function buildEvent(slot, uid) {
  const { allDay, dtstart, dtend } = slotDates(slot);
  const lines = ['BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${formatDateStampUTC(new Date())}`];

  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${dtstart}`, `DTEND;VALUE=DATE:${dtend}`);
  } else {
    lines.push(`DTSTART:${dtstart}`, `DTEND:${dtend}`);
  }

  lines.push(`SUMMARY:${escapeText(slot.title)}`);
  const descriptionParts = [slot.category, slot.description].filter(Boolean);
  if (descriptionParts.length) {
    lines.push(`DESCRIPTION:${escapeText(descriptionParts.join(' — '))}`);
  }
  if (slot.location) lines.push(`LOCATION:${escapeText(slot.location)}`);
  lines.push('END:VEVENT');
  return lines;
}

function buildCalendar(eventLineGroups) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cathedral School PA//Volunteer Signups//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...eventLineGroups.flat(),
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

module.exports = { buildEvent, buildCalendar };
