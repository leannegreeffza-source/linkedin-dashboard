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
      console.log('Loaded:', data.length, 'accounts');
      setAccounts(data);
    } catch (err) {
      console.error('Load error:', err);
    }
    setLoading(false);
  }

  const filtered = accounts.filter(acc =>
    search === '' || acc.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!session) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>LinkedIn Campaign Dashboard</h1>
        <button onClick={() => signIn('linkedin')} 
          style={{ padding: '12px 24px', fontSize: '16px', marginTop: '20px' }}>
          Sign in with LinkedIn
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading accounts...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0 }}>LinkedIn Campaign Dashboard</h1>
          <p style={{ color: '#666', margin: '5px 0' }}>{accounts.length} accounts loaded</p>
        </div>
        <button onClick={() => signOut()} 
          style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
        {/* Sidebar */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0 }}>Accounts ({accounts.length})</h2>
          
          <input 
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
          />

          {search && (
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              Found {filtered.length} accounts
            </p>
          )}

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filtered.map(acc => (
              <label key={acc.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px', 
                  marginBottom: '8px', 
                  background: selected.includes(acc.id) ? '#eff6ff' : '#f9fafb',
                  border: selected.includes(acc.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}>
                <input 
                  type="checkbox"
                  checked={selected.includes(acc.id)}
                  onChange={() => {
                    if (selected.includes(acc.id)) {
                      setSelected(selected.filter(id => id !== acc.id));
                    } else {
                      setSelected([...selected, acc.id]);
                    }
                  }}
                  style={{ marginRight: '12px', width: '18px', height: '18px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{acc.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>ID: {acc.id}</div>
                </div>
              </label>
            ))}
          </div>

          {selected.length > 0 && (
            <button onClick={() => setSelected([])}
              style={{ width: '100%', marginTop: '15px', padding: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
              Clear Selection ({selected.length})
            </button>
          )}
        </div>

        {/* Main Area */}
        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          {selected.length === 0 ? (
            <>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
              <h2>Select Accounts to View Reports</h2>
              <p style={{ color: '#666' }}>Use the checkboxes on the left to select one or more accounts</p>
            </>
          ) : (
            <>
              <h2>{selected.length} Account{selected.length > 1 ? 's' : ''} Selected</h2>
              <div style={{ marginTop: '30px', textAlign: 'left' }}>
                <h3>Selected Accounts:</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {accounts.filter(a => selected.includes(a.id)).map(acc => (
                    <li key={acc.id} style={{ padding: '8px', background: '#f9fafb', marginBottom: '8px', borderRadius: '4px' }}>
                      {acc.name} <span style={{ color: '#666', fontSize: '12px' }}>({acc.id})</span>
                    </li>
                  ))}
                </ul>
                <p style={{ marginTop: '30px', padding: '20px', background: '#fef3c7', borderRadius: '6px', fontSize: '14px' }}>
                  <strong>Next step:</strong> Campaign data loading will be added in the next update
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
