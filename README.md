# Cathedral School PA Site

A small Next.js app for the Cathedral School (St. John the Divine) Parents
Association: volunteer slot sign-ups and reimbursement requests.

## Features

- **Volunteer sign-ups** — parents browse open slots (spirit wear sales,
  Winterfest, Spring Fair, etc.), sign up with name/email, and get an
  instant confirmation email plus a reminder email the day before. Slots
  disappear once full or once their date has passed. Parents can cancel
  their own sign-up via a link in their email.
- **Admin view** (`/admin`) — PA leaders can add/delete slots, see who's
  signed up for each one, and remove a signup manually.
- **Reimbursement form** (`/reimbursement`) — parents submit an expense with
  a receipt photo/PDF; admins review and mark requests pending / approved /
  paid / denied from the same admin dashboard.

## Stack

- Next.js 14 (App Router), plain React, no CSS framework.
- Postgres for data (works with Neon, Vercel Postgres, Supabase, or any
  standard Postgres instance).
- [Resend](https://resend.com) for outgoing email (confirmation + reminder).
  If `RESEND_API_KEY` is unset, emails are just logged to the console —
  handy for local development.
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for receipt
  file storage. A request submitted with no files attached works fine
  without `BLOB_READ_WRITE_TOKEN` set, but a request that *does* include
  files is rejected with a clear error if the token is missing, rather
  than silently dropping the attachment.
- A daily [Vercel Cron Job](https://vercel.com/docs/cron-jobs) (see
  `vercel.json`) hits `/api/cron/reminders` to send day-before reminder
  emails.
- Admin routes (`/admin`, `/api/admin/*`) are protected with simple HTTP
  Basic Auth (`ADMIN_USER` / `ADMIN_PASSWORD`) — enough for a handful of PA
  leaders sharing one login, without building a full auth system.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL, ADMIN_USER, ADMIN_PASSWORD at minimum
npm run migrate              # creates the tables
npm run dev                  # http://localhost:3000
```

You don't need Resend or Vercel Blob configured to develop locally — emails
print to the console, and reimbursements with no files attached save fine
(one with files attached will error until `BLOB_READ_WRITE_TOKEN` is set).

## Deploying to Vercel

1. Create a new Vercel project from this repo (no special root directory
   setting needed — the app lives at the repo root).
2. Provision a Postgres database (Vercel Postgres, or a free
   [Neon](https://neon.tech) project both work well) and set `DATABASE_URL`
   in the Vercel project's environment variables.
3. Set `ADMIN_USER` / `ADMIN_PASSWORD` — this is the login PA leaders will
   use for `/admin`.
4. Set `NEXT_PUBLIC_SITE_URL` to your deployed domain (used to build the
   cancellation links in emails).
5. Sign up for [Resend](https://resend.com) (free tier is plenty for a PA),
   verify a sending domain or use their test domain, and set
   `RESEND_API_KEY` and `EMAIL_FROM`.
6. Create a [Vercel Blob store](https://vercel.com/docs/storage/vercel-blob)
   for the project and set `BLOB_READ_WRITE_TOKEN` (Vercel usually wires
   this up automatically when you connect a Blob store to the project).
7. Set `CRON_SECRET` to a random string — Vercel automatically sends it as
   a bearer token when it triggers the cron job, and the endpoint checks it.
8. Run the migration once against your production database:
   `DATABASE_URL=... npm run migrate` (from your machine, or via `vercel env
   pull` first).
9. Deploy. The cron schedule in `vercel.json` (`0 13 * * *`, i.e. 9am
   Eastern during daylight saving, 8am during standard time) sends
   reminders for any signup whose slot is happening the next day. Adjust
   the schedule if you'd like a different local time.

## Notes / things to adjust for your PA

- Slot categories are currently a fixed list (Spirit Wear, Winterfest,
  Spring Fair, General) in `app/admin/AdminSlots.js` — add more there as
  needed.
- There's no parent login: sign-ups just need a name + email, matching how
  most small-school volunteer sheets work. If you'd rather require a
  school-verified email domain, that validation can be added to
  `app/api/signups/route.js`.
- The admin login is a single shared username/password. If the PA wants
  per-person accounts and an audit trail later, that would replace the
  Basic Auth middleware in `middleware.js`.
