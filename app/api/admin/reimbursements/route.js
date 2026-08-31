import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// Admin: list reimbursement requests, optionally filtered by status.
export async function GET(request) {
  const status = new URL(request.url).searchParams.get('status');
  const { rows } = await query(
    `select * from reimbursements
     ${status ? 'where status = $1' : ''}
     order by created_at desc`,
    status ? [status] : []
  );
  return NextResponse.json({ reimbursements: rows });
}
