import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

// Admin: list reimbursement requests, optionally filtered by status.
export async function GET(request) {
  const status = new URL(request.url).searchParams.get('status');
  const { rows } = await query(
    `select id, parent_name, parent_email, parent_phone, address, activity, amount,
            expense_date::text as expense_date, description, receipt_attached,
            delivery_method, receipt_urls, status, admin_notes, created_at, updated_at
     from reimbursements
     ${status ? 'where status = $1' : ''}
     order by created_at desc`,
    status ? [status] : []
  );
  return NextResponse.json({ reimbursements: rows });
}
