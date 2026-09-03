'use client';

import { useEffect, useState } from 'react';

function formatDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function VolunteerPage() {
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');
  const [activeSlot, setActiveSlot] = useState(null);

  async function load() {
    try {
      const res = await fetch('/api/slots');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load slots.');
      setSlots(data.slots);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = {};
  if (slots) {
    for (const slot of slots) {
      grouped[slot.category] = grouped[slot.category] || [];
      grouped[slot.category].push(slot);
    }
  }

  return (
    <div>
      <h2>Volunteer Sign-Ups</h2>
      <p className="muted">Pick a slot below and add your name. Spots are first-come, first-served.</p>
      <p className="muted">
        📅 Want these on your calendar?{' '}
        <a href="/api/calendar" target="_blank" rel="noreferrer">
          Subscribe to all volunteer opportunities
        </a>{' '}
        (add this link in Google Calendar, Apple Calendar, or Outlook as a calendar subscription).
      </p>

      {error && <p className="error-text">{error}</p>}
      {!slots && !error && <p className="muted">Loading...</p>}
      {slots && slots.length === 0 && <p className="muted">No open volunteer slots right now — check back soon!</p>}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3>{category}</h3>
          {items.map((slot) => (
            <div className="card" key={slot.id}>
              <div className="slot-header">
                <div>
                  <strong>{slot.title}</strong>
                  <p className="slot-meta">
                    {formatDate(slot.event_date)}
                    {slot.start_time ? ` • ${formatTime(slot.start_time)}${slot.end_time ? ` - ${formatTime(slot.end_time)}` : ''}` : ''}
                    {slot.location ? ` • ${slot.location}` : ''}
                  </p>
                  {slot.description && <p className="muted">{slot.description}</p>}
                  {slot.volunteer_names && slot.volunteer_names.length > 0 && (
                    <p className="muted">Already signed up: {slot.volunteer_names.join(', ')}</p>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className={`badge ${slot.open_spots <= 0 ? 'full' : ''}`}>
                    {slot.open_spots > 0 ? `${slot.open_spots} of ${slot.capacity} open` : 'Full'}
                  </span>
                  <div style={{ marginTop: '0.75rem' }}>
                    <button disabled={slot.open_spots <= 0} onClick={() => setActiveSlot(slot)}>
                      {slot.open_spots > 0 ? 'Sign Up' : 'Full'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {activeSlot && (
        <SignupModal
          slot={activeSlot}
          onClose={() => setActiveSlot(null)}
          onSuccess={() => {
            setActiveSlot(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function SignupModal({ slot, onClose, onSuccess }) {
  const [form, setForm] = useState({ parent_name: '', parent_email: '', parent_phone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slot.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Sign up: {slot.title}</h3>
        <p className="muted">{formatDate(slot.event_date)}</p>
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

          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          {error && <p className="error-text">{error}</p>}

          <div className="form-actions" style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Signing up...' : 'Confirm Sign Up'}
            </button>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
