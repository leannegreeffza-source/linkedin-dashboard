'use client';

import { useState } from 'react';
import { Search, Download, Calendar, CheckSquare, Square, Eye, MousePointer, DollarSign, TrendingUp, Target, Users } from 'lucide-react';

// SAMPLE DATA - Mimics real LinkedIn accounts
const SAMPLE_ACCOUNTS = [
  { id: '503883545', name: 'LL_TLM_BCX_BA_GroupM_Sept20' },
  { id: '500683410', name: 'Sogolytics' },
  { id: '500829793', name: 'PartnersEMEA_Test' },
  { id: '500902648', name: "Hannah's Test BA - Partners" },
  { id: '500907518', name: 'SES Africa_SU_Spark_15940702' },
  { id: '500907762', name: 'Volvo Trucks South Africa_SU_Spark_15962492' },
  { id: '500908379', name: 'Mercantile Bank South Africa_SU_Spark_15939982' },
  { id: '500909675', name: 'Standard Bank Group_SU_TurnLeftMedia_16075242' },
  { id: '501357221', name: 'Allume UK' },
  { id: '501892449', name: 'Bendigo Bank Private Banking' },
];

// SAMPLE CAMPAIGN DATA - Mimics TurnLeftMedia report
const SAMPLE_REPORT = {
  impressions: 283829,
  clicks: 4012,
  ctr: 1.41,
  cpm: 181.10,
  cpc: 12.81,
  engagements: 4019,
  spent: 51402,
  socialActions: 204,
  engagementRate: 1.42,
  otherEngagements: 3440,
  topAds: [
    { id: '294475193', impressions: 229885, clicks: 3680, ctr: '1.60', engagements: 3685, socialActions: 176 },
    { id: '295767253', impressions: 298, clicks: 4, ctr: '1.34', engagements: 4, socialActions: 0 },
    { id: '294483823', impressions: 4254, clicks: 42, ctr: '0.99', engagements: 43, socialActions: 4 },
    { id: '294501563', impressions: 4770, clicks: 47, ctr: '0.99', engagements: 47, socialActions: 5 },
    { id: '294501573', impressions: 4794, clicks: 44, ctr: '0.92', engagements: 44, socialActions: 1 },
  ]
};

export default function SampleCampaignManager() {
  const [accounts] = useState(SAMPLE_ACCOUNTS);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportData, setReportData] = useState(null);
  const [dateRange] = useState({
    start: '2026-02-01',
    end: '2026-02-18'
  });

  const filtered = accounts.filter(a => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const name = (a.name || '').toLowerCase();
    const id = (a.id || '').toString().toLowerCase();
    return name.includes(search) || id.includes(search);
  });

  const allSelected = filtered.length > 0 && selectedAccounts.length === filtered.length;

  function toggleAccount(id) {
    const newSelected = selectedAccounts.includes(id) 
      ? selectedAccounts.filter(x => x !== id) 
      : [...selectedAccounts, id];
    
    setSelectedAccounts(newSelected);
    
    // Show report when accounts are selected
    if (newSelected.length > 0) {
      setReportData(SAMPLE_REPORT);
    } else {
      setReportData(null);
    }
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedAccounts([]);
      setReportData(null);
    } else {
      setSelectedAccounts(filtered.map(a => a.id));
      setReportData(SAMPLE_REPORT);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">LinkedIn Campaign Manager</h1>
            <p className="text-sm text-gray-600 font-medium">
              {accounts.length} accounts • {selectedAccounts.length} selected • SAMPLE DATA
            </p>
          </div>
          <div className="flex gap-3">
            <input type="date" value={dateRange.start} disabled
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50" />
            <input type="date" value={dateRange.end} disabled
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-gray-50" />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
              Sign In for Real Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            🎨 <strong>This is a SAMPLE APP</strong> with fake data. Sign in with LinkedIn to see your real campaign data!
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-bold text-lg mb-4 text-gray-900">Select Accounts</h2>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search accounts..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              {searchTerm && (
                <p className="text-xs text-gray-600 mb-2 font-medium">
                  {filtered.length > 0 
                    ? `Found ${filtered.length} account${filtered.length !== 1 ? 's' : ''}`
                    : `No results for "${searchTerm}"`}
                </p>
              )}

              <button onClick={toggleSelectAll}
                className="w-full flex items-center gap-2 p-3 mb-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-400 transition-all">
                {allSelected 
                  ? <CheckSquare className="w-5 h-5 text-blue-600" /> 
                  : <Square className="w-5 h-5 text-gray-600" />}
                <span className="font-semibold text-sm text-gray-900">
                  {allSelected ? 'Deselect All' : `Select All (${filtered.length})`}
                </span>
              </button>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filtered.length === 0 && searchTerm ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">No accounts match "{searchTerm}"</p>
                    <button onClick={() => setSearchTerm('')}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Clear search
                    </button>
                  </div>
                ) : (
                  filtered.map(acc => (
                    <label key={acc.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all ${
                        selectedAccounts.includes(acc.id) 
                          ? 'bg-blue-50 border-blue-500 shadow-sm' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}>
                      <input type="checkbox" checked={selectedAccounts.includes(acc.id)}
                        onChange={() => toggleAccount(acc.id)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate text-gray-900">
                          {acc.name}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          ID: {acc.id}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {selectedAccounts.length > 0 && (
                <button onClick={() => { setSelectedAccounts([]); setReportData(null); }}
                  className="w-full mt-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold text-sm transition-colors">
                  Clear Selection ({selectedAccounts.length})
                </button>
              )}
            </div>
          </div>

          {/* Main Report */}
          <div className="col-span-9">
            {!reportData ? (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-gray-900">Select Accounts to View Report</h2>
                <p className="text-gray-600 mb-4">Choose one or more accounts from the sidebar to see their campaign performance</p>
                <div className="inline-block bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <p className="text-sm text-green-700 font-medium">
                    ✅ {accounts.length} sample accounts ready (try searching for "Allume" or "Bendigo")
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Campaign Performance Report</h2>
                      <p className="text-sm text-gray-600 font-medium">{dateRange.start} to {dateRange.end}</p>
                      <p className="text-sm text-gray-600">{selectedAccounts.length} account{selectedAccounts.length > 1 ? 's' : ''} selected</p>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors">
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-bold mb-6 text-gray-900">Campaign Performance</h3>
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

                {reportData.topAds && reportData.topAds.length > 0 && (
                  <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-900">Top Performing Ads</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Creative ID</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Impressions</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Clicks</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">CTR</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Engagements</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Social Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {reportData.topAds.map(ad => (
                            <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">{ad.id}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">{ad.impressions.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">{ad.clicks.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">{ad.ctr}%</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">{ad.engagements.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-right text-gray-900">{ad.socialActions}</td>
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
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border-2 border-gray-200 hover:border-blue-300 transition-all shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
