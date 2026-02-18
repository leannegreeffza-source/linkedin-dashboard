'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Search, Download, RefreshCw, Calendar, TrendingUp, Eye, MousePointer, DollarSign, Target, Activity } from 'lucide-react';

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
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [allAccounts, setAllAccounts] = useState([]);
  const [campaignData, setCampaignData] = useState(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const defaultDates = PRESETS[0].getValue();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [activePreset, setActivePreset] = useState('This Month');

  // Load account list
  const fetchAccounts = useCallback(async () => {
    if (!session?.accessToken) return;
    setIsLoadingAccounts(true);
    try {
      const res = await fetch('/api/linkedin?mode=accounts');
      if (res.ok) {
        const accounts = await res.json();
        setAllAccounts(accounts);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    }
    setIsLoadingAccounts(false);
  }, [session]);

  // Load campaign data for selected account
  const fetchCampaignData = useCallback(async (accountId) => {
    if (!session?.accessToken || !accountId) return;
    setIsLoadingCampaigns(true);
    try {
      const res = await fetch(`/api/linkedin/report?accountId=${accountId}&startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setCampaignData(data);
      }
    } catch (err) {
      console.error('Error loading campaign data:', err);
    }
    setIsLoadingCampaigns(false);
    setLastUpdated(new Date());
  }, [session, startDate, endDate]);

  useEffect(() => {
    if (session?.accessToken) fetchAccounts();
  }, [session, fetchAccounts]);

  useEffect(() => {
    if (selectedAccount) {
      fetchCampaignData(selectedAccount.clientId);
    }
  }, [selectedAccount, startDate, endDate]);

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

  const MetricCard = ({ label, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-100 hover:border-blue-200 transition-all">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <Icon className={`w-5 h-5 text-${color}-500`} />
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
          <p className="text-gray-600 mb-8">Professional reporting dashboard for your LinkedIn campaigns</p>
          <button onClick={() => signIn('linkedin')} 
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
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
                <p className="text-sm text-gray-500">{allAccounts.length} accounts • Updated {lastUpdated.toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{activePreset}</span>
                </button>
                {showDatePicker && (
                  <div className="absolute right-0 top-12 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 z-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Select</p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {PRESETS.map(p => (
                        <button key={p.label} onClick={() => handleDatePreset(p)}
                          className={`px-3 py-2 text-xs rounded-lg font-medium transition-colors ${activePreset === p.label ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Client List */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Select Account</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search accounts..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              {searchTerm && (
                <p className="text-xs text-gray-500 mb-2">Found {filteredAccounts.length} account{filteredAccounts.length !== 1 ? 's' : ''}</p>
              )}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAccounts.map(account => (
                  <button key={account.clientId}
                    onClick={() => setSelectedAccount(account)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${selectedAccount?.clientId === account.clientId ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}>
                    <div className="font-semibold">{account.clientName}</div>
                    <div className={`text-xs ${selectedAccount?.clientId === account.clientId ? 'text-blue-100' : 'text-gray-500'}`}>
                      ID: {account.clientId}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Report Area */}
          <div className="col-span-8">
            {!selectedAccount ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select an Account</h3>
                <p className="text-gray-600">Choose an account from the sidebar to view its campaign performance report</p>
              </div>
            ) : isLoadingCampaigns ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-800">Loading Campaign Data...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Report Header */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedAccount.clientName}</h2>
                      <p className="text-sm text-gray-500">Report for {startDate} - {endDate}</p>
                      <p className="text-xs text-gray-400 mt-1">Account ID: {selectedAccount.clientId}</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Export PDF</span>
                    </button>
                  </div>
                </div>

                {/* Campaign Performance Metrics */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Campaign Performance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <MetricCard label="Impressions" value="Loading..." icon={Eye} />
                    <MetricCard label="Clicks" value="Loading..." icon={MousePointer} />
                    <MetricCard label="CTR" value="Loading..." icon={TrendingUp} />
                    <MetricCard label="Spend" value="Loading..." icon={DollarSign} />
                    <MetricCard label="CPC" value="Loading..." icon={DollarSign} />
                    <MetricCard label="Conversions" value="Loading..." icon={Target} />
                  </div>
                </div>

                {/* Top Performing Ads */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performing Ads</h3>
                  <div className="text-sm text-gray-500 text-center py-8">
                    Campaign data will load here from LinkedIn API
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
