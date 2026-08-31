import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

// Admin: remove a signup (e.g. a parent called in to cancel).
export async function DELETE(request, { params }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'invalid signup id' }, { status: 400 });
  }
  const { rowCount } = await query('delete from signups where id = $1', [id]);
  if (rowCount === 0) {
    return NextResponse.json({ error: 'signup not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
