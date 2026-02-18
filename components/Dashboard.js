'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (session?.accessToken) {
      loadAccounts();
    }
  }, [session]);

  async function loadAccounts() {
    setLoading(true);
    try {
      const res = await fetch('/api/linkedin');
      const data = await res.json();
      console.log('✅ Loaded:', data.length, 'accounts');
      setAccounts(data);
    } catch (err) {
      console.error('❌ Load error:', err);
    }
    setLoading(false);
  }

  const filtered = accounts.filter(acc => {
    if (search === '') return true;
    return acc.name.toLowerCase().includes(search.toLowerCase());
  });

  if (!session) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#f9fafb', minHeight: '100vh' }}>
        <h1 style={{ color: '#111827' }}>LinkedIn Campaign Dashboard</h1>
        <button onClick={() => signIn('linkedin')} 
          style={{ padding: '12px 24px', fontSize: '16px', marginTop: '20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Sign in with LinkedIn
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#f9fafb', minHeight: '100vh' }}>
        <h2 style={{ color: '#111827' }}>Loading accounts...</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '20px 40px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, color: '#111827' }}>LinkedIn Campaign Dashboard</h1>
          <p style={{ color: '#6b7280', margin: '5px 0 0 0' }}>{accounts.length} accounts • {filtered.length} showing • {selected.length} selected</p>
        </div>
        <button onClick={() => signOut()} style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Sign Out</button>
      </div>

      <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0, color: '#111827' }}>Select Accounts</h2>
          
          <input 
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '12px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#111827' }}
          />

          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', padding: '8px', background: '#f3f4f6', borderRadius: '6px' }}>
            {search ? <strong style={{ color: '#111827' }}>Found {filtered.length}</strong> : `${accounts.length} accounts`}
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {filtered.map(acc => (
              <label key={acc.id} 
                style={{ display: 'flex', alignItems: 'flex-start', padding: '14px', marginBottom: '8px', background: selected.includes(acc.id) ? '#dbeafe' : '#f9fafb', border: selected.includes(acc.id) ? '2px solid #2563eb' : '2px solid transparent', borderRadius: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={selected.includes(acc.id)}
                  onChange={() => setSelected(selected.includes(acc.id) ? selected.filter(id => id !== acc.id) : [...selected, acc.id])}
                  style={{ marginRight: '12px', marginTop: '2px', width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{acc.name}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {acc.id}</div>
                </div>
              </label>
            ))}
          </div>

          {selected.length > 0 && (
            <button onClick={() => setSelected([])} style={{ width: '100%', marginTop: '16px', padding: '12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
              Clear ({selected.length})
            </button>
          )}
        </div>

        <div style={{ background: '#ffffff', padding: '48px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: selected.length === 0 ? 'center' : 'left' }}>
          {selected.length === 0 ? (
            <>
              <div style={{ fontSize: '80px' }}>📊</div>
              <h2 style={{ fontSize: '28px', color: '#111827' }}>Select Accounts</h2>
              <p style={{ color: '#6b7280' }}>Use checkboxes to select accounts</p>
            </>
          ) : (
            <>
              <h2 style={{ color: '#111827' }}>{selected.length} Selected</h2>
              {accounts.filter(a => selected.includes(a.id)).map(acc => (
                <div key={acc.id} style={{ padding: '16px', marginBottom: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: '600', color: '#111827' }}>{acc.name}</div>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>ID: {acc.id}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}