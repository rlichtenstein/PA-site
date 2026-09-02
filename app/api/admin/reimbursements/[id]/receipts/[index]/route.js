import { NextResponse } from 'next/server';
import { query } from '../../../../../../../lib/db';

export const dynamic = 'force-dynamic';

// Admin: stream one private receipt file. Receipts are stored with
// access: 'private' in Vercel Blob (they can contain addresses and
// financial info), so there is no public URL to link to directly —
// this route looks the blob up by reimbursement id + index (never a
// client-supplied URL, to avoid this becoming an open fetch proxy),
// fetches it server-side with the same Blob credentials used to
// upload it, and streams it back. Protected by the same Basic Auth
// as the rest of /api/admin/*.
export async function GET(request, { params }) {
  const id = Number(params.id);
  const index = Number(params.index);
  if (!Number.isInteger(id) || !Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: 'invalid receipt reference' }, { status: 400 });
  }

  const { rows } = await query('select receipt_urls from reimbursements where id = $1', [id]);
  const url = rows[0]?.receipt_urls?.[index];
  if (!url) {
    return NextResponse.json({ error: 'receipt not found' }, { status: 404 });
  }

  try {
    const { get } = await import('@vercel/blob');
    const result = await get(url, { access: 'private' });
    if (!result || !result.stream) {
      return NextResponse.json({ error: 'receipt not found' }, { status: 404 });
    }
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (err) {
    console.error('Failed to fetch private receipt:', err);
    return NextResponse.json({ error: 'Failed to load receipt.' }, { status: 500 });
  }
}
