'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Search, Calendar, TrendingUp, TrendingDown, DollarSign, MousePointer, Eye, Target, Users, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  
  // State
  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(18.5); // ZAR to USD default
  
  // Date ranges
  const [currentRange, setCurrentRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [previousRange, setPreviousRange] = useState({
    start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Load accounts on mount
  useEffect(() => {
    if (session) loadAccounts();
  }, [session]);

  // Load data when selection changes
  useEffect(() => {
    if (selectedAccounts.length > 0) {
      loadCampaignData();
    }
  }, [selectedAccounts, currentRange, previousRange]);

  async function loadAccounts() {
    setLoading(true);
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
    setLoading(false);
  }

  async function loadCampaignData() {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: selectedAccounts,
          currentRange,
          previousRange,
          exchangeRate
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Error loading campaign data:', err);
    }
    setLoading(false);
  }

  const filtered = accounts.filter(a => 
    !searchTerm || a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function toggleAccount(id) {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedAccounts(filtered.map(a => a.id));
  }

  function clearSelection() {
    setSelectedAccounts([]);
    setReportData(null);
  }

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (!session) {
    return <SignInScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        accountCount={accounts.length}
        selectedCount={selectedAccounts.length}
        onSignOut={() => signOut()}
      />

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Account Selection */}
          <div className="col-span-3">
            <AccountSelector
              accounts={filtered}
              selectedAccounts={selectedAccounts}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onToggle={toggleAccount}
              onSelectAll={selectAll}
              onClear={clearSelection}
            />
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {!reportData ? (
              <EmptyState accountCount={accounts.length} />
            ) : (
              <>
                {/* Date Range & Exchange Rate */}
                <DateRangeCard
                  currentRange={currentRange}
                  previousRange={previousRange}
                  exchangeRate={exchangeRate}
                  onCurrentRangeChange={setCurrentRange}
                  onPreviousRangeChange={setPreviousRange}
                  onExchangeRateChange={setExchangeRate}
                  loading={loading}
                  onRefresh={loadCampaignData}
                />

                {/* Campaign Performance Metrics */}
                <MetricsGrid 
                  current={reportData.current}
                  previous={reportData.previous}
                  exchangeRate={exchangeRate}
                />

                {/* Top Performing Ads */}
                <TopAdsTable ads={reportData.topAds} />

                {/* Budget Pacing */}
                <BudgetPacing pacing={reportData.budgetPacing} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== COMPONENTS ==========

function Header({ accountCount, selectedCount, onSignOut }) {
  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn Campaign Manager</h1>
          <p className="text-sm text-gray-600">{accountCount} accounts • {selectedCount} selected</p>
        </div>
        <button onClick={onSignOut} 
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">
          Sign Out
        </button>
      </div>
    </div>
  );
}

function AccountSelector({ accounts, selectedAccounts, searchTerm, onSearchChange, onToggle, onSelectAll, onClear }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="font-bold text-lg mb-4">Select Accounts</h2>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search accounts..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={onSelectAll} 
          className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100">
          Select All
        </button>
        {selectedAccounts.length > 0 && (
          <button onClick={onClear}
            className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
            Clear ({selectedAccounts.length})
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {accounts.map(acc => (
          <label key={acc.id} 
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border ${
              selectedAccounts.includes(acc.id) ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
            }`}>
            <input
              type="checkbox"
              checked={selectedAccounts.includes(acc.id)}
              onChange={() => onToggle(acc.id)}
              className="w-4 h-4"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{acc.name}</div>
              <div className="text-xs text-gray-500">ID: {acc.id}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function DateRangeCard({ currentRange, previousRange, exchangeRate, onCurrentRangeChange, onPreviousRangeChange, onExchangeRateChange, loading, onRefresh }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Period</label>
          <div className="flex gap-2">
            <input type="date" value={currentRange.start} 
              onChange={e => onCurrentRangeChange({...currentRange, start: e.target.value})}
              className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <input type="date" value={currentRange.end}
              onChange={e => onCurrentRangeChange({...currentRange, end: e.target.value})}
              className="flex-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Previous Period (Compare)</label>
          <div className="flex gap-2">
            <input type="date" value={previousRange.start}
              onChange={e => onPreviousRangeChange({...previousRange, start: e.target.value})}
              className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <input type="date" value={previousRange.end}
              onChange={e => onPreviousRangeChange({...previousRange, end: e.target.value})}
              className="flex-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Exchange Rate (ZAR to USD)</label>
          <div className="flex gap-2">
            <input type="number" step="0.01" value={exchangeRate}
              onChange={e => onExchangeRateChange(parseFloat(e.target.value))}
              className="flex-1 px-3 py-2 border rounded-lg text-sm" />
            <button onClick={onRefresh} disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricsGrid({ current, previous, exchangeRate }) {
  const metrics = [
    { label: 'Impressions', key: 'impressions', format: 'number', icon: Eye },
    { label: 'Clicks', key: 'clicks', format: 'number', icon: MousePointer },
    { label: 'CTR', key: 'ctr', format: 'percent', icon: TrendingUp },
    { label: 'Spent', key: 'spent', format: 'currency', icon: DollarSign },
    { label: 'CPM', key: 'cpm', format: 'currency', icon: DollarSign },
    { label: 'CPC', key: 'cpc', format: 'currency', icon: DollarSign },
    { label: 'Website Visits', key: 'websiteVisits', format: 'number', icon: Target },
    { label: 'Leads', key: 'leads', format: 'number', icon: Users },
    { label: 'CPL', key: 'cpl', format: 'currency', icon: DollarSign },
    { label: 'Engagement Rate', key: 'engagementRate', format: 'percent', icon: TrendingUp },
    { label: 'Engagements', key: 'engagements', format: 'number', icon: Users },
  ];

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h3 className="text-lg font-bold mb-6">Campaign Performance</h3>
      <div className="grid grid-cols-4 gap-4">
        {metrics.map(metric => (
          <MetricCard
            key={metric.key}
            label={metric.label}
            current={current[metric.key]}
            previous={previous[metric.key]}
            format={metric.format}
            icon={metric.icon}
            exchangeRate={exchangeRate}
          />
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, current, previous, format, icon: Icon, exchangeRate }) {
  const change = previous > 0 ? ((current - previous) / previous * 100) : 0;
  const isPositive = change >= 0;
  
  function formatValue(val) {
    if (format === 'currency') return `$${(val / exchangeRate).toFixed(2)}`;
    if (format === 'percent') return `${val.toFixed(2)}%`;
    return val.toLocaleString();
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-600 uppercase">{label}</span>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {formatValue(current)}
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(change).toFixed(1)}% vs previous
      </div>
    </div>
  );
}

function TopAdsTable({ ads }) {
  if (!ads || ads.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h3 className="text-lg font-bold mb-4">Top Performing Ads</h3>
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Creative ID</th>
            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Impressions</th>
            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Clicks</th>
            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">CTR</th>
            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Spent</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {ads.map(ad => (
            <tr key={ad.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-semibold">{ad.id}</td>
              <td className="px-4 py-3 text-sm text-right">{ad.impressions.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm text-right">{ad.clicks.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm text-right">{ad.ctr}%</td>
              <td className="px-4 py-3 text-sm text-right">R {ad.spent.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BudgetPacing({ pacing }) {
  if (!pacing) return null;

  const pacingPercent = (pacing.spent / pacing.budget * 100).toFixed(1);
  const daysElapsed = pacing.daysElapsed;
  const daysTotal = pacing.daysTotal;
  const dayProgress = (daysElapsed / daysTotal * 100).toFixed(1);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-bold mb-6">Budgeting and Pacing</h3>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="text-sm font-medium text-gray-600">Budget</label>
          <div className="text-2xl font-bold text-gray-900">R {pacing.budget.toLocaleString()}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Spent</label>
          <div className="text-2xl font-bold text-gray-900">R {pacing.spent.toLocaleString()}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Pacing</label>
          <div className="text-2xl font-bold text-gray-900">{pacingPercent}%</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Budget Progress</span>
          <span className="text-gray-600">{pacingPercent}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all" 
            style={{ width: `${Math.min(pacingPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Time Progress</span>
          <span className="text-gray-600">{daysElapsed}/{daysTotal} days ({dayProgress}%)</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-600 transition-all" 
            style={{ width: `${dayProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ accountCount }) {
  return (
    <div className="bg-white rounded-xl shadow p-12 text-center">
      <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Select Accounts to View Report</h2>
      <p className="text-gray-600">Choose one or more accounts from the sidebar</p>
      {accountCount > 0 && (
        <div className="mt-4 inline-block bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <p className="text-sm text-green-700 font-medium">✅ {accountCount} accounts loaded</p>
        </div>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-xl font-semibold">Loading...</p>
      </div>
    </div>
  );
}

function SignInScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md">
        <h1 className="text-3xl font-bold mb-3">LinkedIn Campaign Manager</h1>
        <p className="text-gray-600 mb-8">Sign in to view your campaign analytics</p>
        <button onClick={() => signIn('linkedin')} 
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700">
          Sign in with LinkedIn
        </button>
      </div>
    </div>
  );
}
