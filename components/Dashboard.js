'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Search, Download, RefreshCw, TrendingUp, DollarSign, Eye, MousePointer, Users, Calendar, CheckSquare, Square } from 'lucide-react';

const PRESETS = [
  { label: 'This Month', getValue: () => { const n = new Date(); return { start: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`, end: n.toISOString().split('T')[0] }; }},
  { label: 'Last Month', getValue: () => { const n = new Date(); const f = new Date(n.getFullYear(), n.getMonth()-1, 1); const l = new Date(n.getFullYear(), n.getMonth(), 0); return { start: f.toISOString().split('T')[0], end: l.toISOString().split('T')[0] }; }},
  { label: 'Last 7 Days', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-7); return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] }; }},
  { label: 'Last 30 Days', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-30); return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] }; }},
  { label: 'Last 90 Days', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-90); return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] }; }},
  { label: 'This Year', getValue: () => { const n = new Date(); return { start: `${n.getFullYear()}-01-01`, end: n.toISOString().split('T')[0] }; }},
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveData, setIsLiveData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const defaultDates = PRESETS[0].getValue();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [activePreset, setActivePreset] = useState('This Month');

  // Step 1: Load account list only (fast!)
  const fetchAccountList = useCallback(async () => {
    if (!session?.accessToken) return;
    
    setIsLoading(true);
    setSelectedClients([]);
    
    try {
      const response = await fetch('/api/linkedin?mode=accounts');
      if (response.ok) {
        const accounts = await response.json();
        console.log(`Loaded ${accounts.length} accounts`);
        
        if (Array.isArray(accounts) && accounts.length > 0) {
          // Convert to full format with empty campaigns
          const formattedAccounts = accounts.map(acc => ({
            clientId: acc.clientId,
            clientName: acc.clientName,
            campaigns: [],
          }));
          
          setAllAccounts(formattedAccounts);
          setIsLiveData(true);
        }
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
    
    setIsLoading(false);
    setLastUpdated(new Date());
  }, [session]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchAccountList();
    }
  }, [session, fetchAccountList]);

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

  const handleRefresh = () => {
    setSelectedClients([]);
    fetchAccountList();
  };

  // Filter accounts based on search
  const filteredAccounts = allAccounts.filter(account => {
    if (!searchTerm) return true;
    return account.clientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleClientToggle = (clientId) => {
    setSelectedClients(prev =>
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId) 
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredAccounts.length && filteredAccounts.length > 0) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredAccounts.map(c => c.clientId));
    }
  };

  const allSelected = filteredAccounts.length > 0 && selectedClients.length === filteredAccounts.length;
  const someSelected = selectedClients.length > 0 && selectedClients.length < filteredAccounts.length;

  // Calculate aggregated metrics
  const aggregatedMetrics = selectedClients.length > 0
    ? allAccounts
        .filter(client => selectedClients.includes(client.clientId))
        .reduce((acc, client) => {
          client.campaigns.forEach(campaign => {
            acc.impressions += campaign.impressions || 0;
            acc.clicks += campaign.clicks || 0;
            acc.spend += campaign.spend || 0;
            acc.conversions += campaign.conversions || 0;
          });
          return acc;
        }, { impressions: 0, clicks: 0, spend: 0, conversions: 0 })
    : null;

  if (aggregatedMetrics) {
    aggregatedMetrics.ctr = aggregatedMetrics.impressions > 0 
      ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions * 100).toFixed(2) 
      : 0;
    aggregatedMetrics.cpc = aggregatedMetrics.clicks > 0 
      ? (aggregatedMetrics.spend / aggregatedMetrics.clicks).toFixed(2) 
      : 0;
    aggregatedMetrics.conversionRate = aggregatedMetrics.clicks > 0 
      ? (aggregatedMetrics.conversions / aggregatedMetrics.clicks * 100).toFixed(2) 
      : 0;
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon }) => (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-600 text-sm font-medium">{title}</div>
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
    </div>
  );

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Loading LinkedIn accounts...</p>
          <p className="text-gray-500 text-sm mt-2">This usually takes 20-30 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {!session && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Connect to LinkedIn</h3>
            <p className="text-sm text-blue-700">Sign in to view your campaign data</p>
          </div>
          <button onClick={() => signIn('linkedin')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Sign in with LinkedIn
          </button>
        </div>
      )}

      {session && (
        <div className={`mb-6 border rounded-lg p-4 flex items-center justify-between ${isLiveData ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div>
            <h3 className={`text-lg font-semibold ${isLiveData ? 'text-green-900' : 'text-yellow-900'}`}>
              {isLiveData ? '✅ Connected to LinkedIn - Account List Loaded' : '⏳ Connected to LinkedIn'}
            </h3>
            <p className={`text-sm ${isLiveData ? 'text-green-700' : 'text-yellow-700'}`}>
              {isLiveData ? `${allAccounts.length} accounts loaded • Search to find your accounts` : 'Loading...'}
            </p>
          </div>
          <button onClick={() => signOut()} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Sign Out
          </button>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">LinkedIn Campaign Manager Dashboard</h1>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-gray-600">Multi-client campaign performance tracking</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <button onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{activePreset}</span>
                <span className="text-xs text-gray-500">({startDate} → {endDate})</span>
              </button>
              {showDatePicker && (
                <div className="absolute right-0 top-12 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-96">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Select</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {PRESETS.map(p => (
                      <button key={p.label} onClick={() => handleDatePreset(p)}
                        className={`px-3 py-2 text-xs rounded-lg border ${activePreset === p.label ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Custom Range</p>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">From</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">To</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                    <button onClick={handleCustomDateApply} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      Apply Custom Range
                    </button>
                  </div>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500">Updated: {lastUpdated.toLocaleTimeString()}</span>
            <button onClick={handleRefresh} disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${isLoading ? 'opacity-50' : ''}`}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 bg-white rounded-lg shadow p-6 border border-gray-200" style={{ maxHeight: '800px', display: 'flex', flexDirection: 'column' }}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Accounts ({allAccounts.length})
          </h2>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={`Search ${allAccounts.length} accounts...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          {searchTerm && (
            <p className="text-xs text-gray-600 mb-2 px-1">
              {filteredAccounts.length > 0 
                ? `Found ${filteredAccounts.length} account${filteredAccounts.length !== 1 ? 's' : ''}`
                : `No results for "${searchTerm}"`}
            </p>
          )}

          <button onClick={handleSelectAll}
            className="w-full flex items-center gap-2 px-3 py-2 mb-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 flex-shrink-0">
            {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : someSelected ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4 text-gray-400" />}
            <span className="font-medium">
              {allSelected ? 'Deselect All' : `Select All (${filteredAccounts.length})`}
            </span>
          </button>

          <div className="space-y-1 overflow-y-auto flex-1">
            {filteredAccounts.length === 0 && searchTerm ? (
              <p className="text-sm text-gray-500 text-center py-8">No accounts match your search</p>
            ) : (
              filteredAccounts.map(account => (
                <label 
                  key={account.clientId} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200">
                  <input 
                    type="checkbox" 
                    checked={selectedClients.includes(account.clientId)}
                    onChange={() => handleClientToggle(account.clientId)}
                    className="w-4 h-4 text-blue-600 rounded" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate" title={account.clientName}>
                      {account.clientName}
                    </div>
                    <div className="text-xs text-gray-400">Click to select</div>
                  </div>
                </label>
              ))
            )}
          </div>

          {selectedClients.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
              <button onClick={() => setSelectedClients([])} className="w-full py-2 text-sm text-red-600 hover:text-red-800 font-medium">
                Clear Selection ({selectedClients.length})
              </button>
            </div>
          )}
        </div>

        <div className="col-span-9">
          {selectedClients.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Accounts to View Metrics</h3>
              <p className="text-gray-600 mb-4">Use the search box to find accounts, then select them to view campaign performance.</p>
              {isLiveData && (
                <div className="inline-block bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <p className="text-sm text-green-700 font-medium">
                    ✅ {allAccounts.length} accounts ready • Try searching for "Allume" or your company name
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Note:</strong> Campaign data will be loaded in the next update. Currently showing account list only.
                  <br />You have selected <strong>{selectedClients.length}</strong> account{selectedClients.length !== 1 ? 's' : ''}.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <MetricCard title="Total Impressions" value="0" icon={Eye} subtitle="Pending data load" />
                <MetricCard title="Total Clicks" value="0" icon={MousePointer} subtitle="Pending data load" />
                <MetricCard title="Total Spend" value="$0" icon={DollarSign} subtitle="Pending data load" />
                <MetricCard title="Conversions" value="0" icon={TrendingUp} subtitle="Pending data load" />
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Data Loading Feature</h3>
                <p className="text-gray-600">
                  Selected accounts: {allAccounts.filter(a => selectedClients.includes(a.clientId)).map(a => a.clientName).join(', ')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
