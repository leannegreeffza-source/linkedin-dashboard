'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Calendar, Download, RefreshCw, Search, CheckSquare, Square, Eye, MousePointer, DollarSign, TrendingUp, Target, Users } from 'lucide-react';

export default function CampaignManager() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Load accounts on mount
  useEffect(() => {
    if (session?.accessToken) loadAccounts();
  }, [session]);

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

  // Load campaign data when selection changes
  useEffect(() => {
    if (selectedAccounts.length > 0) {
      loadCampaignData();
    } else {
      setReportData(null);
    }
  }, [selectedAccounts, dateRange]);

  async function loadCampaignData() {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: selectedAccounts,
          startDate: dateRange.start,
          endDate: dateRange.end
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

  const allSelected = filtered.length > 0 && selectedAccounts.length === filtered.length;

  function toggleAccount(id) {
    setSelectedAccounts(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    setSelectedAccounts(allSelected ? [] : filtered.map(a => a.id));
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <h1 className="text-3xl font-bold mb-4">LinkedIn Campaign Manager</h1>
          <p className="text-gray-600 mb-6">Professional campaign reporting dashboard</p>
          <button onClick={() => signIn('linkedin')} 
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
            Sign in with LinkedIn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">LinkedIn Campaign Manager</h1>
            <p className="text-sm text-gray-500">
              {accounts.length} accounts • {selectedAccounts.length} selected
            </p>
          </div>
          <div className="flex gap-3">
            <input type="date" value={dateRange.start} 
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="px-3 py-2 border rounded-lg text-sm" />
            <input type="date" value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="px-3 py-2 border rounded-lg text-sm" />
            <button onClick={() => signOut()} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Account Selection */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-bold text-lg mb-4">Select Accounts</h2>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
              </div>

              <button onClick={toggleSelectAll}
                className="w-full flex items-center gap-2 p-3 mb-3 border-2 rounded-lg hover:bg-gray-50">
                {allSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                <span className="font-medium text-sm">Select All ({filtered.length})</span>
              </button>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filtered.map(acc => (
                  <label key={acc.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 ${
                      selectedAccounts.includes(acc.id) ? 'bg-blue-50 border-blue-400' : 'border-transparent hover:bg-gray-50'
                    }`}>
                    <input type="checkbox" checked={selectedAccounts.includes(acc.id)}
                      onChange={() => toggleAccount(acc.id)}
                      className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{acc.name}</div>
                      <div className="text-xs text-gray-500">ID: {acc.id}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main Report Area */}
          <div className="col-span-9">
            {!reportData ? (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Select Accounts to View Report</h2>
                <p className="text-gray-600">Choose one or more accounts from the sidebar</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Report Header */}
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">Campaign Performance Report</h2>
                      <p className="text-sm text-gray-500">
                        {dateRange.start} to {dateRange.end}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedAccounts.length} account{selectedAccounts.length > 1 ? 's' : ''} selected
                      </p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-bold mb-6">Campaign Performance</h3>
                  <div className="grid grid-cols-5 gap-4">
                    <MetricCard label="Impressions" value={reportData.impressions.toLocaleString()} icon={Eye} />
                    <MetricCard label="Clicks" value={reportData.clicks.toLocaleString()} icon={MousePointer} />
                    <MetricCard label="CTR" value={reportData.ctr + '%'} icon={TrendingUp} />
                    <MetricCard label="CPM" value={'R ' + reportData.cpm.toFixed(2)} icon={DollarSign} />
                    <MetricCard label="CPC" value={'R ' + reportData.cpc.toFixed(2)} icon={DollarSign} />
                  </div>
                  <div className="grid grid-cols-5 gap-4 mt-4">
                    <MetricCard label="Engagements" value={reportData.engagements.toLocaleString()} icon={Users} />
                    <MetricCard label="Spent" value={'R ' + reportData.spent.toLocaleString()} icon={DollarSign} />
                    <MetricCard label="Social Actions" value={reportData.socialActions.toLocaleString()} icon={Target} />
                    <MetricCard label="Engagement Rate" value={reportData.engagementRate + '%'} icon={TrendingUp} />
                    <MetricCard label="Other Engagements" value={reportData.otherEngagements.toLocaleString()} icon={Users} />
                  </div>
                </div>

                {/* Top Performing Ads */}
                {reportData.topAds && reportData.topAds.length > 0 && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-bold mb-4">Top Performing Ads</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Creative ID</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Impressions</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Clicks</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">CTR</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Engagements</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Social Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {reportData.topAds.map(ad => (
                            <tr key={ad.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium">{ad.id}</td>
                              <td className="px-4 py-3 text-sm text-right">{ad.impressions.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-right">{ad.clicks.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-right">{ad.ctr}%</td>
                              <td className="px-4 py-3 text-sm text-right">{ad.engagements.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-right">{ad.socialActions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
