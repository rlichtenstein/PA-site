import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

// Admin: delete/cancel a slot (also removes its signups via FK cascade).
export async function DELETE(request, { params }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'invalid slot id' }, { status: 400 });
  }
  const { rowCount } = await query('delete from slots where id = $1', [id]);
  if (rowCount === 0) {
    return NextResponse.json({ error: 'slot not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
