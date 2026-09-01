import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf'];
const DELIVERY_METHODS = ['mail_check', 'pickup_business_office'];

// Public: submit a reimbursement request with one or more receipt attachments.
// Uses Vercel Blob for storage; falls back to no-files if not configured
// (BLOB_READ_WRITE_TOKEN unset), so local dev works without it.
export async function POST(request) {
  const formData = await request.formData();
  const parent_name = formData.get('parent_name');
  const parent_email = formData.get('parent_email');
  const parent_phone = formData.get('parent_phone');
  const address = formData.get('address');
  const activity = formData.get('activity');
  const amount = formData.get('amount');
  const expense_date = formData.get('expense_date');
  const description = formData.get('description');
  const delivery_method = formData.get('delivery_method');
  const files = formData.getAll('receipts').filter((f) => typeof f === 'object' && f.size > 0);

  if (!parent_name || !parent_email || !activity || !amount || !expense_date || !address) {
    return NextResponse.json(
      { error: 'parent_name, parent_email, address, activity, amount, and expense_date are required.' },
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
  if (!DELIVERY_METHODS.includes(delivery_method)) {
    return NextResponse.json({ error: 'Please choose how you\'d like to receive your reimbursement.' }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Please attach at most ${MAX_FILES} files.` }, { status: 400 });
  }

  if (files.length > 0 && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Reimbursement submitted with files but BLOB_READ_WRITE_TOKEN is not set.');
    return NextResponse.json(
      { error: 'Receipt uploads are temporarily unavailable. Please try again shortly, or contact the PA treasurer.' },
      { status: 500 }
    );
  }

  const receiptUrls = [];
  if (files.length > 0) {
    const { put } = await import('@vercel/blob');
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: `"${file.name}" is over the 10MB limit.` }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `"${file.name}" must be a JPG, PNG, HEIC, WEBP, or PDF file.` },
          { status: 400 }
        );
      }
      const blob = await put(`receipts/${Date.now()}-${file.name}`, file, {
        access: 'public',
        addRandomSuffix: true,
      });
      receiptUrls.push(blob.url);
    }
  }

  const { rows } = await query(
    `insert into reimbursements
       (parent_name, parent_email, parent_phone, address, activity, amount, expense_date, description, receipt_attached, delivery_method, receipt_urls)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     returning *`,
    [
      parent_name,
      parent_email,
      parent_phone || null,
      address,
      activity,
      amountNum,
      expense_date,
      description || null,
      receiptUrls.length > 0,
      delivery_method,
      receiptUrls,
    ]
  );

  return NextResponse.json({ reimbursement: rows[0] }, { status: 201 });
}
