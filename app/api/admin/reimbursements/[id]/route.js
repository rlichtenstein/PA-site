import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

const VALID_STATUSES = ['pending', 'approved', 'paid', 'denied'];

// Admin: update a reimbursement's status and/or internal notes.
export async function PATCH(request, { params }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'invalid reimbursement id' }, { status: 400 });
  }
  const body = await request.json();
  const { status, admin_notes } = body || {};
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of ${VALID_STATUSES.join(', ')}` }, { status: 400 });
  }

  const { rows } = await query(
    `update reimbursements
     set status = coalesce($2, status),
         admin_notes = coalesce($3, admin_notes),
         updated_at = now()
     where id = $1
     returning *`,
    [id, status || null, admin_notes ?? null]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: 'reimbursement not found' }, { status: 404 });
  }
  return NextResponse.json({ reimbursement: rows[0] });
}
