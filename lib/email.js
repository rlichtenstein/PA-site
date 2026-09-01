// Thin wrapper around Resend. If RESEND_API_KEY isn't set (e.g. local dev),
// emails are logged to the console instead of sent, so the rest of the app
// works without an email account configured.

let resendClient;
function getResend() {
  if (!resendClient) {
    const { Resend } = require('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:dev] to=${to} subject="${subject}"\n${text || html}`);
    return { devMode: true };
  }
  const from = process.env.EMAIL_FROM || 'Cathedral School PA <onboarding@resend.dev>';
  return getResend().emails.send({ from, to, subject, html, text });
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function formatSlotWhen(slot) {
  const date = new Date(`${slot.event_date}T00:00:00Z`);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const timeStr = slot.start_time
    ? ` from ${formatTime(slot.start_time)}${slot.end_time ? ` to ${formatTime(slot.end_time)}` : ''}`
    : '';
  return `${dateStr}${timeStr}`;
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function contactLine(slot) {
  if (!slot.contact_name) return null;
  const parts = [slot.contact_email, slot.contact_phone].filter(Boolean).join(' or ');
  return `Should you have any questions, please reach out to ${slot.contact_name}${parts ? ` at ${parts}` : ''}.`;
}

async function sendSignupConfirmation({ slot, signup }) {
  const cancelUrl = `${siteUrl()}/volunteer/cancel/${signup.cancel_token}`;
  const when = formatSlotWhen(slot);
  const text = [
    `Hi ${signup.parent_name},`,
    ``,
    `Thank you for signing up for ${slot.title} on ${when}.`,
    slot.location ? `Where: ${slot.location}` : null,
    contactLine(slot),
    ``,
    `Need to cancel? ${cancelUrl}`,
    ``,
    `We'll send you a reminder 2 days before. Thank you for volunteering with the Cathedral School PA!`,
  ]
    .filter(Boolean)
    .join('\n');

  return sendEmail({
    to: signup.parent_email,
    subject: `You're signed up: ${slot.title}`,
    text,
  });
}

async function sendSignupReminder({ slot, signup }) {
  const cancelUrl = `${siteUrl()}/volunteer/cancel/${signup.cancel_token}`;
  const when = formatSlotWhen(slot);
  const text = [
    `Hi ${signup.parent_name},`,
    ``,
    `Reminder: you're volunteering for ${slot.title} on ${when} — that's 2 days from now.`,
    slot.location ? `Where: ${slot.location}` : null,
    contactLine(slot),
    ``,
    `Can't make it anymore? Please cancel so we can find a replacement: ${cancelUrl}`,
    ``,
    `Thank you for volunteering with the Cathedral School PA!`,
  ]
    .filter(Boolean)
    .join('\n');

  return sendEmail({
    to: signup.parent_email,
    subject: `Reminder: volunteering in 2 days — ${slot.title}`,
    text,
  });
}

module.exports = { sendEmail, sendSignupConfirmation, sendSignupReminder, formatSlotWhen };
