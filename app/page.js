'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Search, TrendingUp, TrendingDown, DollarSign, MousePointer, Eye, Target, Users, RefreshCw, ChevronDown, Calendar } from 'lucide-react';

function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [tempStart, setTempStart] = useState(value.start);
  const [tempEnd, setTempEnd] = useState(value.end);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const presets = [
    { label: 'Today', fn: () => { const d = today(); return { start: d, end: d }; } },
    { label: 'Yesterday', fn: () => { const d = daysAgo(1); return { start: d, end: d }; } },
    { label: 'Last 7 days', fn: () => ({ start: daysAgo(6), end: today() }) },
    { label: 'Last 30 days', fn: () => ({ start: daysAgo(29), end: today() }) },
    { label: 'Last 90 days', fn: () => ({ start: daysAgo(89), end: today() }) },
    { label: 'This month', fn: () => ({ start: firstOfMonth(), end: today() }) },
    { label: 'Last month', fn: () => lastMonth() },
    { label: 'This quarter', fn: () => thisQuarter() },
    { label: 'Last quarter', fn: () => lastQuarter() },
    { label: 'All time', fn: () => ({ start: '2020-01-01', end: today() }) },
  ];

  function today() { return new Date().toISOString().split('T')[0]; }
  function daysAgo(n) { return new Date(Date.now() - n * 86400000).toISOString().split('T')[0]; }
  function firstOfMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; }
  function lastMonth() {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-1);
    const start = d.toISOString().split('T')[0];
    const last = new Date(d.getFullYear(), d.getMonth()+1, 0);
    return { start, end: last.toISOString().split('T')[0] };
  }
  function thisQuarter() {
    const d = new Date(); const q = Math.floor(d.getMonth()/3);
    return { start: new Date(d.getFullYear(), q*3, 1).toISOString().split('T')[0], end: today() };
  }
  function lastQuarter() {
    const d = new Date(); const q = Math.floor(d.getMonth()/3);
    const sq = q === 0 ? 3 : q-1; const yr = q === 0 ? d.getFullYear()-1 : d.getFullYear();
    return {
      start: new Date(yr, sq*3, 1).toISOString().split('T')[0],
      end: new Date(yr, sq*3+3, 0).toISOString().split('T')[0]
    };
  }

  function applyPreset(fn) {
    const range = fn();
    setTempStart(range.start); setTempEnd(range.end);
    onChange(range); setOpen(false);
  }

  function applyCustom() {
    onChange({ start: tempStart, end: tempEnd });
    setOpen(false);
  }

  function formatDisplay(start, end) {
    const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium text-white hover:bg-slate-600">
        <Calendar className="w-4 h-4 text-slate-400" />
        {formatDisplay(value.start, value.end)}
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl flex" style={{minWidth: 560}}>
          <div className="w-40 border-r border-gray-100 py-2">
            {presets.map(p => (
              <button key={p.label} onClick={() => applyPreset(p.fn)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                {p.label}
              </button>
            ))}
          </div>
          <div className="p-4 flex-1">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start date</label>
                <input type="date" value={tempStart} onChange={e => setTempStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End date</label>
                <input type="date" value={tempEnd} onChange={e => setTempEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={applyCustom}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium">
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarSection({ title, loading, items, selectedIds, onToggle, onSelectAll, onClear, searchValue, onSearchChange, searchPlaceholder, emptyMessage }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h2 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">
        {title} {loading && <span className="text-slate-400 font-normal text-xs">(loading...)</span>}
      </h2>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input type="text" placeholder={searchPlaceholder}
          value={searchValue} onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" />
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={onSelectAll}
          className="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
          All
        </button>
        {selectedIds.length > 0 && (
          <button onClick={onClear}
            className="flex-1 px-2 py-1.5 bg-slate-600 text-slate-200 rounded-lg text-xs font-medium hover:bg-slate-500">
            Clear ({selectedIds.length})
          </button>
        )}
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {items.map(item => (
          <label key={item.id}
            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border text-sm ${
              selectedIds.includes(item.id)
                ? 'bg-blue-900 border-blue-500 text-white'
                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}>
            <input type="checkbox" checked={selectedIds.includes(item.id)}
              onChange={() => onToggle(item.id)} className="w-4 h-4 accent-blue-500" />
            <div className="min-w-0">
              <div className="font-medium truncate text-xs">{item.name}</div>
              <div className="text-xs text-slate-400">ID: {item.id}</div>
            </div>
          </label>
        ))}
        {items.length === 0 && !loading && (
          <p className="text-slate-400 text-xs text-center py-4">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [accountSearch, setAccountSearch] = useState('');

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [ads, setAds] = useState([]);
  const [selectedAds, setSelectedAds] = useState([]);
  const [adSearch, setAdSearch] = useState('');
  const [loadingAds, setLoadingAds] = useState(false);

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(18.5);
  const [manualBudget, setManualBudget] = useState('');

  const [showReport, setShowReport] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  const [currentRange, setCurrentRange] = useState({
    start: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [previousRange, setPreviousRange] = useState({
    start: new Date(Date.now() - 13 * 86400000).toISOString().split('T')[0],
    end: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  });

  useEffect(() => { if (session) loadAccounts(); }, [session]);

  useEffect(() => {
    if (selectedAccounts.length > 0) {
      loadCampaigns();
      setSelectedCampaigns([]);
      setAds([]);
      setSelectedAds([]);
    } else {
      setCampaigns([]); setSelectedCampaigns([]);
      setAds([]); setSelectedAds([]);
      setReportData(null);
    }
  }, [selectedAccounts]);

  useEffect(() => {
    if (selectedCampaigns.length > 0) {
      loadAds();
      setSelectedAds([]);
    } else {
      setAds([]); setSelectedAds([]);
    }
  }, [selectedCampaigns]);

  useEffect(() => {
    if (selectedAccounts.length > 0) loadAnalytics();
  }, [selectedAds, selectedCampaigns, currentRange, previousRange]);

  async function loadAccounts() {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) setAccounts(await res.json());
    } catch (err) { console.error(err); }
  }

  async function loadCampaigns() {
    setLoadingCampaigns(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: selectedAccounts })
      });
      if (res.ok) setCampaigns(await res.json());
    } catch (err) { console.error(err); }
    setLoadingCampaigns(false);
  }

  async function loadAds() {
    setLoadingAds(true);
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignIds: selectedCampaigns })
      });
      if (res.ok) setAds(await res.json());
    } catch (err) { console.error(err); }
    setLoadingAds(false);
  }

  async function loadAnalytics() {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: selectedAccounts,
          campaignIds: selectedCampaigns.length > 0 ? selectedCampaigns : null,
          adIds: selectedAds.length > 0 ? selectedAds : null,
          currentRange,
          previousRange,
          exchangeRate
        })
      });
      if (res.ok) setReportData(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function generateReport() {
    if (!reportData) return;
    setGeneratingReport(true);
    setShowReport(true);
    setReportContent('');
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current: reportData.current,
          previous: reportData.previous,
          topAds: reportData.topAds,
          budgetPacing: reportData.budgetPacing,
          currentRange,
          previousRange,
          selectedCampaigns,
          exchangeRate
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReportContent(data.report);
      } else {
        setReportContent('Failed to generate report. Please try again.');
      }
    } catch (err) {
      setReportContent('Failed to generate report. Please try again.');
    }
    setGeneratingReport(false);
  }

  const filteredAccounts = accounts.filter(a => !accountSearch || a.name.toLowerCase().includes(accountSearch.toLowerCase()));
  const filteredCampaigns = campaigns.filter(c => !campaignSearch || c.name.toLowerCase().includes(campaignSearch.toLowerCase()));
  const filteredAds = ads.filter(a => !adSearch || a.name.toLowerCase().includes(adSearch.toLowerCase()));

  function toggle(setter) {
    return (id) => setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  if (status === 'loading') return <LoadingScreen />;
  if (!session) return <SignInScreen />;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #0f172a !important; }
          @page { margin: 1cm; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-900">

        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 shadow-lg">
          <div className="max-w-screen-2xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">LinkedIn Campaign Manager</h1>
              <p className="text-sm text-slate-400">{accounts.length} accounts • {selectedAccounts.length} selected</p>
            </div>
            <div className="flex gap-3 no-print">
              {reportData && (
                <>
                  <button onClick={generateReport} disabled={generatingReport}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm flex items-center gap-2 disabled:opacity-50">
                    {generatingReport ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>✦</span>}
                    {generatingReport ? 'Generating...' : 'AI Report'}
                  </button>
                  <button onClick={() => window.print()}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm">
                    ↓ Export PDF
                  </button>
                </>
              )}
              <button onClick={() => signOut()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm">
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto p-6">
          <div className="grid grid-cols-12 gap-6">

            {/* Sidebar */}
            <div className="col-span-3 space-y-4 no-print">
              <SidebarSection
                title="Accounts"
                loading={false}
                items={filteredAccounts}
                selectedIds={selectedAccounts}
                onToggle={toggle(setSelectedAccounts)}
                onSelectAll={() => setSelectedAccounts(filteredAccounts.map(a => a.id))}
                onClear={() => setSelectedAccounts([])}
                searchValue={accountSearch}
                onSearchChange={setAccountSearch}
                searchPlaceholder="Search accounts..."
                emptyMessage="No accounts found"
              />

              {selectedAccounts.length > 0 && (
                <SidebarSection
                  title="Campaigns"
                  loading={loadingCampaigns}
                  items={filteredCampaigns}
                  selectedIds={selectedCampaigns}
                  onToggle={toggle(setSelectedCampaigns)}
                  onSelectAll={() => setSelectedCampaigns(filteredCampaigns.map(c => c.id))}
                  onClear={() => setSelectedCampaigns([])}
                  searchValue={campaignSearch}
                  onSearchChange={setCampaignSearch}
                  searchPlaceholder="Search campaigns..."
                  emptyMessage="No campaigns found"
                />
              )}

              {selectedCampaigns.length > 0 && (
                <SidebarSection
                  title="Ads"
                  loading={loadingAds}
                  items={filteredAds}
                  selectedIds={selectedAds}
                  onToggle={toggle(setSelectedAds)}
                  onSelectAll={() => setSelectedAds(filteredAds.map(a => a.id))}
                  onClear={() => setSelectedAds([])}
                  searchValue={adSearch}
                  onSearchChange={setAdSearch}
                  searchPlaceholder="Search ads..."
                  emptyMessage="No ads found"
                />
              )}
            </div>

            {/* Main Content */}
            <div className="col-span-9 print:col-span-12">
              {!reportData ? (
                <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                  <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Select Accounts to View Report</h2>
                  <p className="text-slate-400">Choose one or more accounts from the sidebar</p>
                </div>
              ) : (
                <>
                  {/* Active filter pills */}
                  <div className="flex gap-2 mb-4 flex-wrap no-print">
                    <span className="px-3 py-1 bg-blue-900 border border-blue-700 rounded-full text-xs text-blue-300 font-medium">
                      {selectedAccounts.length} Account{selectedAccounts.length !== 1 ? 's' : ''}
                    </span>
                    {selectedCampaigns.length > 0 && (
                      <span className="px-3 py-1 bg-purple-900 border border-purple-700 rounded-full text-xs text-purple-300 font-medium">
                        {selectedCampaigns.length} Campaign{selectedCampaigns.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {selectedAds.length > 0 && (
                      <span className="px-3 py-1 bg-emerald-900 border border-emerald-700 rounded-full text-xs text-emerald-300 font-medium">
                        {selectedAds.length} Ad{selectedAds.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Controls Bar */}
                  <div className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700 no-print">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Current Period</p>
                        <DateRangePicker value={currentRange} onChange={setCurrentRange} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Compare Period</p>
                        <DateRangePicker value={previousRange} onChange={setPreviousRange} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Exchange Rate (ZAR/USD)</p>
                        <input type="number" step="0.01" value={exchangeRate}
                          onChange={e => setExchangeRate(parseFloat(e.target.value))}
                          className="w-28 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500" />
                      </div>
                      <div className="ml-auto">
                        <button onClick={loadAnalytics} disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm">
                          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Print header */}
                  <div className="hidden print:block mb-6">
                    <h2 className="text-xl font-bold text-white">LinkedIn Campaign Report</h2>
                    <p className="text-slate-400 text-sm">Period: {currentRange.start} to {currentRange.end} | Compare: {previousRange.start} to {previousRange.end}</p>
                  </div>

                  {/* Metrics Grid */}
                  <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-6">Campaign Performance</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: 'Impressions', key: 'impressions', format: 'number', icon: Eye },
                        { label: 'Clicks', key: 'clicks', format: 'number', icon: MousePointer },
                        { label: 'CTR', key: 'ctr', format: 'percent', icon: TrendingUp },
                        { label: 'Spent', key: 'spent', format: 'decimal', icon: DollarSign },
                        { label: 'CPM', key: 'cpm', format: 'decimal', icon: DollarSign },
                        { label: 'CPC', key: 'cpc', format: 'decimal', icon: DollarSign },
                        { label: 'Website Visits', key: 'websiteVisits', format: 'number', icon: Target },
                        { label: 'Leads', key: 'leads', format: 'number', icon: Users },
                        { label: 'CPL', key: 'cpl', format: 'decimal', icon: DollarSign },
                        { label: 'Engagement Rate', key: 'engagementRate', format: 'percent', icon: TrendingUp },
                        { label: 'Engagements', key: 'engagements', format: 'number', icon: Users },
                      ].map(metric => (
                        <MetricCard key={metric.key}
                          label={metric.label}
                          current={reportData.current[metric.key]}
                          previous={reportData.previous[metric.key]}
                          format={metric.format}
                          icon={metric.icon} />
                      ))}
                    </div>
                  </div>

                  {/* Top Campaigns Table */}
                  {reportData.topAds?.length > 0 && (
                    <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
                      <h3 className="text-lg font-bold text-white mb-4">Top Performing Campaigns</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="pb-3 text-left text-xs font-bold text-slate-400 uppercase">ID</th>
                            <th className="pb-3 text-right text-xs font-bold text-slate-400 uppercase">Impressions</th>
                            <th className="pb-3 text-right text-xs font-bold text-slate-400 uppercase">Clicks</th>
                            <th className="pb-3 text-right text-xs font-bold text-slate-400 uppercase">CTR</th>
                            <th className="pb-3 text-right text-xs font-bold text-slate-400 uppercase">Spent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {reportData.topAds.map(ad => (
                            <tr key={ad.id} className="hover:bg-slate-700/50">
                              <td className="py-3 text-sm font-semibold text-white">{ad.id}</td>
                              <td className="py-3 text-sm text-right text-slate-300">{ad.impressions.toLocaleString()}</td>
                              <td className="py-3 text-sm text-right text-slate-300">{ad.clicks.toLocaleString()}</td>
                              <td className="py-3 text-sm text-right text-slate-300">{ad.ctr}%</td>
                              <td className="py-3 text-sm text-right text-slate-300">{ad.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Budget Pacing */}
                  <BudgetPacingCard
                    pacing={reportData.budgetPacing}
                    manualBudget={manualBudget}
                    onBudgetChange={setManualBudget}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* AI Report Modal */}
        {showReport && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-6 overflow-y-auto no-print">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl my-6">
              <div className="flex justify-between items-center p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">✦ AI Campaign Report</h2>
                <div className="flex gap-3">
                  {reportContent && !generatingReport && (
                    <button
                      onClick={() => {
                        const blob = new Blob([reportContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `linkedin-report-${currentRange.start}-${currentRange.end}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-medium">
                      ↓ Download
                    </button>
                  )}
                  <button onClick={() => setShowReport(false)}
                    className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-500">
                    Close
                  </button>
                </div>
              </div>
              <div className="p-6">
                {generatingReport ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                    <p className="text-white font-semibold text-lg">Analyzing your campaigns...</p>
                    <p className="text-slate-400 text-sm mt-2">This may take 15-30 seconds</p>
                  </div>
                ) : (
                  <div className="max-w-none">
                    {reportContent.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) return (
                        <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3 border-b border-slate-700 pb-2">
                          {line.replace('## ', '')}
                        </h2>
                      );
                      if (line.startsWith('### ')) return (
                        <h3 key={i} className="text-lg font-bold text-slate-200 mt-4 mb-2">
                          {line.replace('### ', '')}
                        </h3>
                      );
                      if (line.startsWith('- **')) {
                        const match = line.match(/- \*\*(.+?)\*\*(.*)$/);
                        if (match) return (
                          <p key={i} className="text-slate-300 mb-2 ml-4">
                            • <strong className="text-white">{match[1]}</strong>{match[2]}
                          </p>
                        );
                      }
                      if (line.startsWith('- ')) return (
                        <p key={i} className="text-slate-300 mb-1 ml-4">• {line.replace('- ', '')}</p>
                      );
                      if (line.startsWith('**') && line.endsWith('**')) return (
                        <p key={i} className="text-white font-semibold mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>
                      );
                      if (line.trim() === '') return <div key={i} className="mb-2" />;
                      return <p key={i} className="text-slate-300 mb-2 leading-relaxed">{line}</p>;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function MetricCard({ label, current, previous, format, icon: Icon }) {
  const change = previous > 0 ? ((current - previous) / previous * 100) : 0;
  const isPositive = change >= 0;

  function formatValue(val) {
    if (format === 'decimal') return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (format === 'percent') return `${val.toFixed(2)}%`;
    return val.toLocaleString();
  }

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</span>
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="text-2xl font-bold text-white mb-1">{formatValue(current)}</div>
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(change).toFixed(1)}% vs previous
      </div>
    </div>
  );
}

function BudgetPacingCard({ pacing, manualBudget, onBudgetChange }) {
  if (!pacing) return null;

  const budget = parseFloat(manualBudget) || 0;
  const pacingPercent = budget > 0 ? Math.min((pacing.spent / budget * 100), 100).toFixed(1) : 0;

  // Time progress = today's date vs total days in current month
  const now = new Date();
  const todayDate = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayProgress = ((todayDate / daysInMonth) * 100).toFixed(1);

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-bold text-white mb-6">Budgeting and Pacing</h3>
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Budget</label>
          <input type="number" placeholder="Enter budget..."
            value={manualBudget} onChange={e => onBudgetChange(e.target.value)}
            className="no-print w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-blue-500" />
          {manualBudget && (
            <div className="hidden print:block text-2xl font-bold text-white">
              {parseFloat(manualBudget).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Spent</label>
          <div className="text-2xl font-bold text-white">
            {pacing.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Pacing</label>
          <div className={`text-2xl font-bold ${parseFloat(pacingPercent) > 90 ? 'text-red-400' : parseFloat(pacingPercent) > 70 ? 'text-yellow-400' : 'text-emerald-400'}`}>
            {budget > 0 ? `${pacingPercent}%` : '—'}
          </div>
        </div>
      </div>

      {budget > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-300">Budget Progress</span>
            <span className="text-slate-400">{pacingPercent}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full transition-all rounded-full ${parseFloat(pacingPercent) > 90 ? 'bg-red-500' : parseFloat(pacingPercent) > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${pacingPercent}%` }} />
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-slate-300">Time Progress</span>
          <span className="text-slate-400">{todayDate}/{daysInMonth} days ({dayProgress}%)</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-slate-500 transition-all rounded-full" style={{ width: `${dayProgress}%` }} />
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-xl font-semibold text-white">Loading...</p>
      </div>
    </div>
  );
}

function SignInScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-12 max-w-md border border-slate-700">
        <h1 className="text-3xl font-bold mb-3 text-white">LinkedIn Campaign Manager</h1>
        <p className="text-slate-400 mb-8">Sign in to view your campaign analytics</p>
        <button onClick={() => signIn('linkedin')}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700">
          Sign in with LinkedIn
        </button>
      </div>
    </div>
  );
}