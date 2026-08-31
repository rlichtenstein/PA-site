'use client';

import { useState } from 'react';
import AdminSlots from './AdminSlots';
import AdminReimbursements from './AdminReimbursements';

export default function AdminPage() {
  const [tab, setTab] = useState('slots');

  return (
    <div>
      <h2>PA Admin</h2>
      <div className="tabs">
        <button className={tab === 'slots' ? 'active' : ''} onClick={() => setTab('slots')}>
          Volunteer Slots
        </button>
        <button
          className={tab === 'reimbursements' ? 'active' : ''}
          onClick={() => setTab('reimbursements')}
        >
          Reimbursements
        </button>
      </div>

      {tab === 'slots' ? <AdminSlots /> : <AdminReimbursements />}
    </div>
  );
}
