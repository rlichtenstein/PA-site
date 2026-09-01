'use client';

import { useEffect, useState } from 'react';

const CATEGORIES = ['Spirit Wear', 'Winterfest', 'Spring Fair', 'General'];

const emptyForm = {
  title: '',
  category: CATEGORIES[0],
  description: '',
  event_date: '',
  start_time: '',
  end_time: '',
  location: '',
  capacity: 1,
  contact_name: '',
  contact_email: '',
  contact_phone: '',
};

export default function AdminSlots() {
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [signups, setSignups] = useState({});

  async function load() {
    try {
      const res = await fetch('/api/admin/slots');
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

  function startEdit(slot) {
    setEditingId(slot.id);
    setForm({
      title: slot.title,
      category: slot.category,
      description: slot.description || '',
      event_date: slot.event_date,
      start_time: slot.start_time ? slot.start_time.slice(0, 5) : '',
      end_time: slot.end_time ? slot.end_time.slice(0, 5) : '',
      location: slot.location || '',
      capacity: slot.capacity,
      contact_name: slot.contact_name || '',
      contact_email: slot.contact_email || '',
      contact_phone: slot.contact_phone || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startClone(slot) {
    setEditingId(null);
    setForm({
      title: slot.title,
      category: slot.category,
      description: slot.description || '',
      event_date: '',
      start_time: slot.start_time ? slot.start_time.slice(0, 5) : '',
      end_time: slot.end_time ? slot.end_time.slice(0, 5) : '',
      location: slot.location || '',
      capacity: slot.capacity,
      contact_name: slot.contact_name || '',
      contact_email: slot.contact_email || '',
      contact_phone: slot.contact_phone || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = editingId ? `/api/admin/slots/${editingId}` : '/api/admin/slots';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save slot.');
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this slot and all its signups?')) return;
    const res = await fetch(`/api/admin/slots/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  }

  async function toggleExpand(id) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!signups[id]) {
      const res = await fetch(`/api/admin/signups?slot_id=${id}`);
      const data = await res.json();
      setSignups((prev) => ({ ...prev, [id]: data.signups || [] }));
    }
  }

  async function removeSignup(slotId, signupId) {
    if (!confirm('Remove this signup?')) return;
    await fetch(`/api/admin/signups/${signupId}`, { method: 'DELETE' });
    setSignups((prev) => ({ ...prev, [slotId]: prev[slotId].filter((s) => s.id !== signupId) }));
    load();
  }

  return (
    <div>
      <div className="card">
        <h3>{editingId ? 'Edit slot' : 'Add a new slot'}</h3>
        <form onSubmit={handleSubmit}>
          <label>Title</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <label>Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label>Description (optional)</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label>Date</label>
          <input type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />

          <label>Start time (optional)</label>
          <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />

          <label>End time (optional)</label>
          <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />

          <label>Location (optional)</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />

          <label>Capacity (number of volunteers needed)</label>
          <input type="number" min="1" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />

          <label>Organizer name (who parents contact with questions)</label>
          <input required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />

          <label>Organizer email</label>
          <input type="email" required value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />

          <label>Organizer phone (optional)</label>
          <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />

          {error && <p className="error-text">{error}</p>}

          <div className="form-actions" style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Slot'}
            </button>
            {editingId && (
              <button type="button" className="secondary" onClick={cancelEdit}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <h3>All slots</h3>
      {!slots && <p className="muted">Loading...</p>}
      {slots && slots.length === 0 && <p className="muted">No slots yet.</p>}
      {slots && slots.map((slot) => (
        <div className="card" key={slot.id}>
          <div className="slot-header">
            <div>
              <strong>{slot.title}</strong> <span className="badge">{slot.category}</span>
              <p className="slot-meta">
                {slot.event_date} {slot.start_time ? `• ${slot.start_time}` : ''} {slot.location ? `• ${slot.location}` : ''}
              </p>
              {slot.contact_name && (
                <p className="muted">
                  Organizer: {slot.contact_name}
                  {slot.contact_email ? ` • ${slot.contact_email}` : ''}
                  {slot.contact_phone ? ` • ${slot.contact_phone}` : ''}
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${slot.open_spots <= 0 ? 'full' : ''}`}>
                {slot.filled}/{slot.capacity} filled
              </span>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button className="secondary" onClick={() => toggleExpand(slot.id)}>
                  {expanded === slot.id ? 'Hide' : 'View'} Signups
                </button>
                <button className="secondary" onClick={() => startEdit(slot)}>Edit</button>
                <button className="secondary" onClick={() => startClone(slot)}>Clone</button>
                <button className="danger" onClick={() => handleDelete(slot.id)}>Delete</button>
              </div>
            </div>
          </div>

          {expanded === slot.id && (
            <table style={{ marginTop: '1rem' }}>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Notes</th><th></th></tr>
              </thead>
              <tbody>
                {(signups[slot.id] || []).length === 0 && (
                  <tr><td colSpan={5} className="muted">No signups yet.</td></tr>
                )}
                {(signups[slot.id] || []).map((s) => (
                  <tr key={s.id}>
                    <td>{s.parent_name}</td>
                    <td>{s.parent_email}</td>
                    <td>{s.parent_phone || '—'}</td>
                    <td>{s.notes || '—'}</td>
                    <td><button className="danger" onClick={() => removeSignup(slot.id, s.id)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
