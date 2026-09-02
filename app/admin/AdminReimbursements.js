'use client';

import { useEffect, useState } from 'react';

const STATUSES = ['pending', 'approved', 'paid', 'denied'];
const DELIVERY_LABELS = {
  mail_check: 'Mail check',
  pickup_business_office: 'Hold for pick-up in business office',
};

function isImageUrl(url) {
  return /\.(jpe?g|png|webp|heic)(\?|$)/i.test(url);
}

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
              {r.address && <p className="muted">{r.address}</p>}
              {r.expense_date && (
                <p className="muted">Expense date: {new Date(`${r.expense_date}`).toLocaleDateString()}</p>
              )}
              <p className="muted">
                {DELIVERY_LABELS[r.delivery_method] || r.delivery_method}
                {' • '}
                Receipt attached: {r.receipt_attached ? 'Yes' : 'No'}
              </p>
              {r.description && <p className="muted">{r.description}</p>}
              {r.receipt_urls && r.receipt_urls.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {r.receipt_urls.map((url, i) => {
                    const receiptHref = `/api/admin/reimbursements/${r.id}/receipts/${i}`;
                    return isImageUrl(url) ? (
                      <a key={url} href={receiptHref} target="_blank" rel="noreferrer">
                        <img
                          src={receiptHref}
                          alt={`Receipt ${i + 1}`}
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                        />
                      </a>
                    ) : (
                      <a key={url} href={receiptHref} target="_blank" rel="noreferrer" className="button" style={{ alignSelf: 'center' }}>
                        View PDF {r.receipt_urls.length > 1 ? i + 1 : ''}
                      </a>
                    );
                  })}
                </div>
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
