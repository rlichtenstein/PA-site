import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf'];

// Public: submit a reimbursement request with a receipt attachment.
// Uses Vercel Blob for storage; falls back to no-file if not configured
// (BLOB_READ_WRITE_TOKEN unset), so local dev works without it.
export async function POST(request) {
  const formData = await request.formData();
  const parent_name = formData.get('parent_name');
  const parent_email = formData.get('parent_email');
  const parent_phone = formData.get('parent_phone');
  const activity = formData.get('activity');
  const amount = formData.get('amount');
  const description = formData.get('description');
  const file = formData.get('receipt');

  if (!parent_name || !parent_email || !activity || !amount) {
    return NextResponse.json(
      { error: 'parent_name, parent_email, activity, and amount are required.' },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(parent_email)) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number.' }, { status: 400 });
  }

  let receiptUrl = null;
  if (file && typeof file === 'object' && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Receipt file must be under 10MB.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Receipt must be a JPG, PNG, HEIC, WEBP, or PDF file.' },
        { status: 400 }
      );
    }
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(`receipts/${Date.now()}-${file.name}`, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      receiptUrl = blob.url;
    } else {
      console.warn('BLOB_READ_WRITE_TOKEN not set; skipping receipt file storage.');
    }
  }

  const { rows } = await query(
    `insert into reimbursements (parent_name, parent_email, parent_phone, activity, amount, description, receipt_url)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [
      parent_name,
      parent_email,
      parent_phone || null,
      activity,
      amountNum,
      description || null,
      receiptUrl,
    ]
  );

  return NextResponse.json({ reimbursement: rows[0] }, { status: 201 });
}
