'use client';

import { useState } from 'react';

export default function ReimbursementPage() {
  const [form, setForm] = useState({
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    activity: '',
    amount: '',
    description: '',
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      if (file) body.append('receipt', file);

      const res = await fetch('/api/reimbursements', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card">
        <h2>Request submitted</h2>
        <p className="success-text">
          Thanks! Your reimbursement request has been sent to the PA treasurer. You'll hear back by
          email once it's reviewed.
        </p>
        <a className="button" href="/">Back to home</a>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Reimbursement Request</h2>
      <p className="muted">Paid out of pocket for a PA activity? Submit your receipt here.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="parent_name">Your name</label>
        <input
          id="parent_name"
          required
          value={form.parent_name}
          onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
        />

        <label htmlFor="parent_email">Email</label>
        <input
          id="parent_email"
          type="email"
          required
          value={form.parent_email}
          onChange={(e) => setForm({ ...form, parent_email: e.target.value })}
        />

        <label htmlFor="parent_phone">Phone (optional)</label>
        <input
          id="parent_phone"
          value={form.parent_phone}
          onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
        />

        <label htmlFor="activity">Activity / event</label>
        <input
          id="activity"
          required
          placeholder="e.g. Spring Fair supplies"
          value={form.activity}
          onChange={(e) => setForm({ ...form, activity: e.target.value })}
        />

        <label htmlFor="amount">Amount ($)</label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />

        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <label htmlFor="receipt">Receipt (JPG, PNG, or PDF)</label>
        <input
          id="receipt"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          required
          onChange={(e) => setFile(e.target.files[0])}
        />

        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
