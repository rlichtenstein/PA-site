'use client';

import { useEffect, useState } from 'react';

export default function CancelPage({ params }) {
  const { token } = params;
  const [signup, setSignup] = useState(null);
  const [error, setError] = useState('');
  const [cancelled, setCancelled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/signups/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup not found.');
        setSignup(data.signup);
      })
      .catch((err) => setError(err.message));
  }, [token]);

  async function handleCancel() {
    setBusy(true);
    try {
      const res = await fetch(`/api/signups/${token}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel.');
      setCancelled(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!signup) return <p className="muted">Loading...</p>;

  return (
    <div className="card">
      <h2>Cancel volunteer sign-up</h2>
      {cancelled ? (
        <p className="success-text">You're cancelled. Thanks for letting us know — see you at the next event!</p>
      ) : (
        <>
          <p>
            You're signed up for <strong>{signup.title}</strong> on{' '}
            {new Date(`${signup.event_date}T00:00:00Z`).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              timeZone: 'UTC',
            })}
            .
          </p>
          <button className="danger" onClick={handleCancel} disabled={busy}>
            {busy ? 'Cancelling...' : 'Cancel my sign-up'}
          </button>
        </>
      )}
    </div>
  );
}
