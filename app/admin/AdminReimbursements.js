'use client';

import { useEffect, useState } from 'react';

const STATUSES = ['pending', 'approved', 'paid', 'denied'];

export default function AdminReimbursements() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const res = await fetch(`/api/admin/reimbursements${filter ? `?status=${filter}` : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load reimbursements.');
      setItems(data.reimbursements);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(id, status) {
    await fetch(`/api/admin/reimbursements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      <div className="tabs">
        <button className={filter === '' ? 'active' : ''} onClick={() => setFilter('')}>All</button>
        {STATUSES.map((s) => (
          <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}
      {!items && <p className="muted">Loading...</p>}
      {items && items.length === 0 && <p className="muted">No reimbursement requests.</p>}

      {items && items.map((r) => (
        <div className="card" key={r.id}>
          <div className="slot-header">
            <div>
              <strong>{r.activity}</strong> — ${Number(r.amount).toFixed(2)}
              <p className="slot-meta">
                {r.parent_name} • {r.parent_email} {r.parent_phone ? `• ${r.parent_phone}` : ''}
              </p>
              {r.description && <p className="muted">{r.description}</p>}
              {r.receipt_url && (
                <p><a href={r.receipt_url} target="_blank" rel="noreferrer">View receipt</a></p>
              )}
              <p className="muted">Submitted {new Date(r.created_at).toLocaleDateString()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge status-${r.status}`}>{r.status}</span>
              <div style={{ marginTop: '0.5rem' }}>
                <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
