'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Search, Download, RefreshCw, TrendingUp, DollarSign, Eye, MousePointer, Users, Calendar, CheckSquare, Square } from 'lucide-react';

const mockCampaignData = [
  { clientId: 1, clientName: "Acme Corp", campaigns: [{ name: "Q1 Product Launch", impressions: 125000, clicks: 3200, spend: 4500, conversions: 145, ctr: 2.56, cpc: 1.41 }] },
  { clientId: 2, clientName: "TechStart Inc", campaigns: [{ name: "Lead Generation", impressions: 156000, clicks: 4100, spend: 5200, conversions: 203, ctr: 2.63, cpc: 1.27 }] },
  { clientId: 3, clientName: "Global Solutions", campaigns: [{ name: "Summer Promotion", impressions: 203000, clicks: 5600, spend: 7200, conversions: 267, ctr: 2.76, cpc: 1.29 }] },
];

const PRESETS = [
  { label: 'This Month', getValue: () => { const now = new Date(); return { start: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, end: now.toISOString().split('T')[0] }; }},
  { label: 'Last Month', getValue: () => { const now = new Date(); const first = new Date(now.getFullYear(), now.getMonth()-1, 1); const last = new Date(now.getFullYear(), now.getMonth(), 0); return { start: first.toISOString().split('T')[0], end: last.toISOString().split('T')[0] }; }},
  { label: 'Last 7 Days', getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate()-7); return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }; }},
  { label: 'Last 30 Days', getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate()-30); return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }; }},
  { label: 'Last 90 Days', getValue: () => { const end = new Date(); const start = new Date(); start.setDate(start.getDate()-90); return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }; }},
  { label: 'This Year', getValue: () => { const now = new Date(); return { start: `${now.getFullYear()}-01-01`, end: now.toISOString().split('T')[0] }; }},
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [campaignData, setCampaignData] = useState([]);
  const [isLiveData, setIsLiveData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);

  const defaultDates = PRESETS[0].getValue();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [activePreset, setActivePreset] = useState('This Month');

  const fetchLinkedInData = useCallback(async (start, end) => {
    const s = start || startDate;
    const e = end || endDate;
    setIsLoading(true);
    setDataLoaded(false);
    setSearchTerm(''); // Clear search when fetching new data
    setSelectedClients([]); // Clear selections
    try {
      const response = await fetch(`/api/linkedin?startDate=${s}&endDate=${e}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setCampaignData(data);
          setTotalAccounts(data.length);
          setIsLiveData(true);
        } else {
          setCampaignData(mockCampaignData);
          setTotalAccounts(mockCampaignData.length);
          setIsLiveData(false);
        }
      } else {
        setCampaignData(mockCampaignData);
        setTotalAccounts(mockCampaignData.length);
        setIsLiveData(false);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setCampaignData(mockCampaignData);
      setTotalAccounts(mockCampaignData.length);
      setIsLiveData(false);
    }
    setIsLoading(false);
    setDataLoaded(true);
    setLastUpdated(new Date());
  }, [startDate, endDate]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchLinkedInData();
    } else if (status === 'unauthenticated') {
      setCampaignData(mockCampaignData);
      setTotalAccounts(mockCampaignData.length);
      setDataLoaded(true);
    }
  }, [session, status]);

  const handleDatePreset = (preset) => {
    const dates = preset.getValue();
    setStartDate(dates.start);
    setEndDate(dates.end);
    setActivePreset(preset.label);
    setShowDatePicker(false);
    if (session?.accessToken) {
      fetchLinkedInData(dates.start, dates.end);
    }
  };

  const handleCustomDateApply = () => {
    setActivePreset('Custom');
    setShowDatePicker(false);
    if (session?.accessToken) {
      fetchLinkedInData(startDate, endDate);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLinkedInData();
    setIsRefreshing(false);
  };

  // Filter clients based on search - only when data is loaded
  const filteredClients = dataLoaded
    ? campaignData.filter(client =>
        client.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleClientToggle = (clientId) => {
    setSelectedClients(prev =>
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length && filteredClients.length > 0) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.clientId));
    }
  };

  const allSelected = filteredClients.length > 0 && selectedClients.length === filteredClients.length;
  const someSelected = selectedClients.length > 0 && selectedClients.length < filteredClients.length;

  const aggregatedMetrics = selectedClients.length > 0
    ? campaignData
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
    aggregatedMetrics.ctr = aggregatedMetrics.impressions > 0 ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions * 100).toFixed(2) : 0;
    aggregatedMetrics.cpc = aggregatedMetrics.clicks > 0 ? (aggregatedMetrics.spend / aggregatedMetrics.clicks).toFixed(2) : 0;
    aggregatedMetrics.conversionRate = aggregatedMetrics.clicks > 0 ? (aggregatedMetrics.conversions / aggregatedMetrics.clicks * 100).toFixed(2) : 0;
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
          <p className="text-gray-600 text-lg font-medium">Loading dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching LinkedIn data - this may take 30-60 seconds for large accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {!session && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Connect to LinkedIn</h3>
              <p className="text-sm text-blue-700">Sign in to view your actual campaign data</p>
            </div>
            <button onClick={() => signIn('linkedin')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Sign in with LinkedIn
            </button>
          </div>
        </div>
      )}

      {session && (
        <div className={`mb-6 border rounded-lg p-4 ${isLiveData ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${isLiveData ? 'text-green-900' : 'text-yellow-900'}`}>
                {isLiveData ? `✅ Connected to LinkedIn - Live Data` : '⏳ Connected to LinkedIn'}
              </h3>
              <p className={`text-sm ${isLiveData ? 'text-green-700' : 'text-yellow-700'}`}>
                {isLiveData ? `Showing live data from ${totalAccounts} LinkedIn ad accounts` : 'Showing sample data'}
              </p>
            </div>
            <button onClick={() => signOut()} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Sign Out</button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">LinkedIn Campaign Manager Dashboard</h1>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-gray-600">Multi-client campaign performance tracking</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative">
              <button onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{activePreset}</span>
                <span className="text-xs text-gray-500">({startDate} → {endDate})</span>
              </button>

              {showDatePicker && (
                <div className="absolute right-0 top-12 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-96">
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Select</p>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESETS.map(preset => (
                        <button key={preset.label} onClick={() => handleDatePreset(preset)}
                          className={`px-3 py-2 text-xs rounded-lg border transition-colors ${activePreset === preset.label ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Range</p>
                    <div className="flex gap-2 items-center mb-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">From</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">To</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                    <button onClick={handleCustomDateApply}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                      Apply Custom Range
                    </button>
                  </div>
                </div>
              )}
            </div>

            <span className="text-sm text-gray-500">Updated: {lastUpdated.toLocaleTimeString()}</span>
            <button onClick={handleRefresh} disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${isRefreshing ? 'opacity-50' : ''}`}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 bg-white rounded-lg shadow p-6 h-fit border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Accounts ({totalAccounts})
            </h2>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={`Search ${totalAccounts} accounts...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
          </div>

          {searchTerm && (
            <p className="text-xs text-gray-500 mb-2">
              Found {filteredClients.length} result{filteredClients.length !== 1 ? 's' : ''} for "{searchTerm}"
            </p>
          )}

          <button onClick={handleSelectAll}
            className="w-full flex items-center gap-2 px-3 py-2 mb-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm text-gray-700">
            {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : someSelected ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4 text-gray-400" />}
            <span className="font-medium">
              {allSelected ? 'Deselect All' : `Select All (${filteredClients.length})`}
            </span>
          </button>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredClients.length === 0 && searchTerm ? (
              <p className="text-sm text-gray-500 text-center py-4">No accounts match "{searchTerm}"</p>
            ) : filteredClients.length === 0 && !searchTerm && dataLoaded ? (
              <p className="text-sm text-gray-500 text-center py-4">No accounts found</p>
            ) : (
              filteredClients.map(client => (
                <label key={client.clientId}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                  <input type="checkbox" checked={selectedClients.includes(client.clientId)}
                    onChange={() => handleClientToggle(client.clientId)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{client.clientName}</div>
                    <div className="text-xs text-gray-500">{client.campaigns.length} campaign{client.campaigns.length !== 1 ? 's' : ''}</div>
                  </div>
                </label>
              ))
            )}
          </div>

          {selectedClients.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button onClick={() => setSelectedClients([])}
                className="w-full py-2 text-sm text-red-600 hover:text-red-800 transition-colors font-medium">
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
              <p className="text-gray-600">Search for accounts or click "Select All" to see combined campaign performance.</p>
              {isLiveData && <p className="text-sm text-green-600 mt-3 font-medium">✅ {totalAccounts} LinkedIn accounts loaded</p>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <MetricCard title="Total Impressions" value={aggregatedMetrics.impressions.toLocaleString()} icon={Eye} subtitle="Reach" />
                <MetricCard title="Total Clicks" value={aggregatedMetrics.clicks.toLocaleString()} icon={MousePointer} subtitle={`${aggregatedMetrics.ctr}% CTR`} />
                <MetricCard title="Total Spend" value={`$${aggregatedMetrics.spend.toLocaleString()}`} icon={DollarSign} subtitle={`$${aggregatedMetrics.cpc} CPC`} />
                <MetricCard title="Conversions" value={aggregatedMetrics.conversions.toLocaleString()} icon={TrendingUp} subtitle={`${aggregatedMetrics.conversionRate}% rate`} />
              </div>

              <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Showing data for: <strong>{startDate}</strong> to <strong>{endDate}</strong></span>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Campaign Breakdown</h2>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4" />
                      Export Data
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Campaign</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Impressions</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Clicks</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">CTR</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Spend</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">CPC</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Conversions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campaignData
                        .filter(client => selectedClients.includes(client.clientId))
                        .map(client =>
                          client.campaigns.map((campaign, idx) => (
                            <tr key={`${client.clientId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.clientName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{campaign.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{(campaign.impressions || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{(campaign.clicks || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{campaign.ctr || 0}%</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${(campaign.spend || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${campaign.cpc || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{campaign.conversions || 0}</td>
                            </tr>
                          ))
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}