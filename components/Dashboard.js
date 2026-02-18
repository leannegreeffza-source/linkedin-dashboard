'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Search, Download, RefreshCw, Calendar, TrendingUp, Eye, MousePointer, DollarSign, Target, Activity, CheckSquare, Square } from 'lucide-react';

const PRESETS = [
  { label: 'This Month', getValue: () => { const n = new Date(); return { start: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`, end: n.toISOString().split('T')[0] }; }},
  { label: 'Last Month', getValue: () => { const n = new Date(); const f = new Date(n.getFullYear(), n.getMonth()-1, 1); const l = new Date(n.getFullYear(), n.getMonth(), 0); return { start: f.toISOString().split('T')[0], end: l.toISOString().split('T')[0] }; }},
  { label: 'Last 7 Days', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-7); return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] }; }},
  { label: 'Last 30 Days', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-30); return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] }; }},
  { label: 'Last 90 Days', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-90); return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] }; }},
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const defaultDates = PRESETS[0].getValue();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [activePreset, setActivePreset] = useState('This Month');

  const fetchAccounts = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoadingAccounts(true);
    try {
      const res = await fetch('/api/linkedin?mode=accounts');
      if (res.ok) {
        const accounts = await res.json();
        console.log(`Loaded ${accounts.length} accounts`);
        setAllAccounts(accounts);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
    setIsLoadingAccounts(false);
    setLastUpdated(new Date());
  }, [session]);

  useEffect(() => {
    if (session?.accessToken) fetchAccounts();
  }, [session, fetchAccounts]);

  const handleDatePreset = (preset) => {
    const dates = preset.getValue();
    setStartDate(dates.start);
    setEndDate(dates.end);
    setActivePreset(preset.label);
    setShowDatePicker(false);
  };

  const handleCustomDateApply = () => {
    setActivePreset('Custom');
    setShowDatePicker(false);
  };

  const filteredAccounts = allAccounts.filter(acc =>
    !searchTerm || acc.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAccountToggle = (accountId) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(filteredAccounts.map(a => a.clientId));
    }
  };

  const allSelected = filteredAccounts.length > 0 && selectedAccounts.length === filteredAccounts.length;
  const someSelected = selectedAccounts.length > 0 && selectedAccounts.length < filteredAccounts.length;

  const MetricCard = ({ label, value, icon: Icon }) => (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-100 hover:border-blue-200 transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <Icon className="w-5 h-5 text-blue-500" />
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );

  if (status === 'loading' || isLoadingAccounts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-800">Loading LinkedIn Accounts...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">LinkedIn Campaign Reports</h1>
          <p className="text-gray-600 mb-8">Professional reporting dashboard</p>
          <button onClick={() => signIn('linkedin')} 
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700">
            Sign in with LinkedIn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Campaign Reports</h1>
                <p className="text-sm text-gray-500">{allAccounts.length} accounts loaded • Updated {lastUpdated.toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{activePreset}</span>
                </button>
                {showDatePicker && (
                  <div className="absolute right-0 top-12 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 z-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Select</p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {PRESETS.map(p => (
                        <button key={p.label} onClick={() => handleDatePreset(p)}
                          className={`px-3 py-2 text-xs rounded-lg font-medium ${activePreset === p.label ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Custom Range</p>
                      <div className="flex gap-2 mb-3">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} 
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} 
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <button onClick={handleCustomDateApply} 
                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => signOut()} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24" style={{ maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Select Accounts</h2>
                <span className="text-sm text-gray-500">({allAccounts.length} total)</span>
              </div>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search accounts..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>

              {searchTerm && (
                <p className="text-xs text-gray-600 mb-2 px-1">
                  Found {filteredAccounts.length} of {allAccounts.length} accounts
                </p>
              )}

              <button onClick={handleSelectAll}
                className="w-full flex items-center gap-2 px-4 py-3 mb-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-sm font-medium text-gray-700">
                {allSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : someSelected ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-gray-400" />}
                <span>
                  {allSelected ? `Deselect All (${filteredAccounts.length})` : `Select All (${filteredAccounts.length})`}
                </span>
              </button>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                {filteredAccounts.map(account => (
                  <label key={account.clientId}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all ${selectedAccounts.includes(account.clientId) ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-transparent hover:border-gray-300'}`}>
                    <input type="checkbox" checked={selectedAccounts.includes(account.clientId)}
                      onChange={() => handleAccountToggle(account.clientId)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{account.clientName}</div>
                      <div className="text-xs text-gray-500">ID: {account.clientId}</div>
                    </div>
                  </label>
                ))}
              </div>

              {selectedAccounts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button onClick={() => setSelectedAccounts([])} 
                    className="w-full py-2 text-sm text-red-600 hover:text-red-800 font-medium">
                    Clear Selection ({selectedAccounts.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Area */}
          <div className="col-span-8">
            {selectedAccounts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select Accounts to View Reports</h3>
                <p className="text-gray-600 mb-4">Use the search box and checkboxes on the left to select one or more accounts</p>
                <div className="inline-block bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <p className="text-sm text-green-700 font-medium">
                    ✅ {allAccounts.length} accounts ready
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedAccounts.length} Account{selectedAccounts.length !== 1 ? 's' : ''} Selected
                  </h2>
                  <p className="text-sm text-gray-500">
                    Report period: {startDate} to {endDate}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Aggregate Performance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <MetricCard label="Total Impressions" value="Loading..." icon={Eye} />
                    <MetricCard label="Total Clicks" value="Loading..." icon={MousePointer} />
                    <MetricCard label="Avg CTR" value="Loading..." icon={TrendingUp} />
                    <MetricCard label="Total Spend" value="Loading..." icon={DollarSign} />
                    <MetricCard label="Avg CPC" value="Loading..." icon={DollarSign} />
                    <MetricCard label="Conversions" value="Loading..." icon={Target} />
                  </div>
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Campaign data loading will be implemented in next update
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
