'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Search, RefreshCw, Calendar, TrendingUp, Eye, MousePointer,
  DollarSign, Target, Activity, CheckSquare, Square,
  LayoutDashboard, Layers, ChevronDown, CheckCircle, AlertTriangle, Clock
} from 'lucide-react';
import ObjectiveTabs from './ObjectiveTabs';

const PRESETS = [
  { label: 'This Month',   getValue: () => { const n = new Date(); return { start: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`, end: n.toISOString().split('T')[0] }; }},
  { label: 'Last Month',   getValue: () => { const n = new Date(); const f = new Date(n.getFullYear(), n.getMonth()-1, 1); const l = new Date(n.getFullYear(), n.getMonth(), 0); return { start: f.toISOString().split('T')[0], end: l.toISOString().split('T')[0] }; }},
  { label: 'Last 7 Days',  getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-7);  return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] }; }},
  { label: 'Last 30 Days', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-30); return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] }; }},
  { label: 'Last 90 Days', getValue: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate()-90); return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] }; }},
];

const MAIN_TABS = [
  { id: 'summary',     label: 'Summary',                icon: LayoutDashboard },
  { id: 'performance', label: 'Performance by Objective', icon: Layers },
];

// ─── CAMPAIGN BUDGET CONFIG (edit per campaign) ──────────────
const CAMPAIGN_BUDGETS = [
  {
    id:         'C03482',
    name:       'Pain Points | Website Visits',
    budget:     1311.94,   // total manual budget for the period
    currency:   '€',
    startDate:  '2025-12-01',
    endDate:    '2026-01-06',
    spent:      1311.94,
  },
  {
    id:         'C03482-V',
    name:       'Cold Unaware | Video Views',
    budget:     1400,
    currency:   '€',
    startDate:  '2025-12-01',
    endDate:    '2026-01-06',
    spent:      1360.70,
  },
  {
    id:         'C03510',
    name:       'cTrader | Lead Generation',
    budget:     700,
    currency:   '€',
    startDate:  '2025-12-04',
    endDate:    '2026-01-06',
    spent:      636.56,
  },
  {
    id:         'C02877',
    name:       'Ben v Cornell | Engagement',
    budget:     800,
    currency:   '$',
    startDate:  '2025-12-01',
    endDate:    '2026-01-05',
    spent:      741.46,
  },
];

function getPacingStatus(spent, budget, startDate, endDate) {
  const now   = new Date();
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const totalDays   = Math.max(1, (end - start)  / 86400000);
  const elapsedDays = Math.min(totalDays, Math.max(0, (now - start) / 86400000));
  const datePacing  = (elapsedDays / totalDays) * 100;
  const spendPacing = (spent / budget) * 100;
  const diff        = spendPacing - datePacing;
  const onTrack     = Math.abs(diff) <= 10;
  const ahead       = diff > 10;
  return {
    datePacing:   datePacing.toFixed(1),
    spendPacing:  spendPacing.toFixed(1),
    elapsedDays:  Math.round(elapsedDays),
    totalDays:    Math.round(totalDays),
    onTrack,
    ahead,
  };
}

function BudgetPacingCard({ campaign }) {
  const p = getPacingStatus(campaign.spent, campaign.budget, campaign.startDate, campaign.endDate);
  const spendPct = Math.min(100, parseFloat(p.spendPacing));
  const datePct  = Math.min(100, parseFloat(p.datePacing));

  return (
    <div className="bg-[#0e1034] rounded-xl p-5 text-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-0.5">Campaign</p>
          <p className="text-sm font-bold text-white truncate">{campaign.name}</p>
          <p className="text-xs text-gray-400">ID: {campaign.id}</p>
        </div>
        {/* On-track badge */}
        {p.onTrack ? (
          <span className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30 rounded-full px-2.5 py-1">
            <CheckCircle className="w-3.5 h-3.5" /> On Track
          </span>
        ) : p.ahead ? (
          <span className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2.5 py-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Pacing Ahead
          </span>
        ) : (
          <span className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 rounded-full px-2.5 py-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Pacing Behind
          </span>
        )}
      </div>

      {/* Budget row */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current Spent</p>
          <p className="text-xl font-bold text-white">{campaign.currency}{campaign.spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400">of {campaign.currency}{campaign.budget.toLocaleString()} budget</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Date Progress</p>
          <p className="text-xl font-bold text-white">{p.elapsedDays}/{p.totalDays} days</p>
          <p className="text-xs text-gray-400">{p.datePacing}% of period elapsed</p>
        </div>
      </div>

      {/* Spend progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Spend Pacing</span>
          <span className={`text-xs font-bold ${spendPct > datePct + 10 ? 'text-amber-300' : spendPct < datePct - 10 ? 'text-red-300' : 'text-green-300'}`}>
            {p.spendPacing}%
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              spendPct > datePct + 10 ? 'bg-amber-400' : spendPct < datePct - 10 ? 'bg-red-400' : 'bg-green-400'
            }`}
            style={{ width: `${spendPct}%` }}
          />
        </div>
      </div>

      {/* Date progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Date Pacing</span>
          <span className="text-xs font-bold text-blue-300">{p.datePacing}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${datePct}%` }} />
        </div>
      </div>
    </div>
  );
}

function SummaryTab({ selectedAccounts, allAccounts, startDate, endDate, MetricCard }) {
  if (selectedAccounts.length === 0) {
    return (
      <div className="p-6 py-12 text-center">
        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Select Accounts to View Reports</h3>
        <p className="text-gray-500 mb-4">Use the search and checkboxes on the left to select accounts</p>
        <div className="inline-block bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          <p className="text-sm text-green-700 font-medium">✅ {allAccounts.length} accounts ready</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {selectedAccounts.length} Account{selectedAccounts.length !== 1 ? 's' : ''} Selected
        </h2>
        <p className="text-sm text-gray-500">Period: {startDate} → {endDate}</p>
      </div>

      {/* Aggregate Performance */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Aggregate Performance</h3>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard label="Total Impressions" value="—" icon={Eye} />
          <MetricCard label="Total Clicks"      value="—" icon={MousePointer} />
          <MetricCard label="Avg CTR"           value="—" icon={TrendingUp} />
          <MetricCard label="Total Spend"       value="—" icon={DollarSign} />
          <MetricCard label="Avg CPC"           value="—" icon={DollarSign} />
          <MetricCard label="Conversions"       value="—" icon={Target} />
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Switch to <strong>Performance by Objective</strong> to view detailed breakdowns
        </p>
      </div>

      {/* Budgeting & Pacing */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-bold text-gray-900">Budgeting &amp; Pacing</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAMPAIGN_BUDGETS.map(c => (
            <BudgetPacingCard key={c.id} campaign={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm]           = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [allAccounts, setAllAccounts]         = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [showDatePicker, setShowDatePicker]   = useState(false);
  const [lastUpdated, setLastUpdated]         = useState(new Date());
  const [mainTab, setMainTab]                 = useState('summary');

  const defaultDates = PRESETS[0].getValue();
  const [startDate, setStartDate]             = useState(defaultDates.start);
  const [endDate, setEndDate]                 = useState(defaultDates.end);
  const [activePreset, setActivePreset]       = useState('This Month');

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

  const allSelected  = filteredAccounts.length > 0 && selectedAccounts.length === filteredAccounts.length;
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

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Campaign Reports</h1>
                <p className="text-sm text-gray-500">
                  {allAccounts.length} accounts loaded · Updated {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{activePreset}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
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

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">

          {/* ── Sidebar ──────────────────────────────────────── */}
          <div className="col-span-4">
            <div
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24 flex flex-col"
              style={{ maxHeight: 'calc(100vh - 120px)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Select Accounts</h2>
                <span className="text-sm text-gray-500">({allAccounts.length} total)</span>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search accounts…" value={searchTerm}
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
                {allSelected
                  ? <CheckSquare className="w-5 h-5 text-blue-600" />
                  : someSelected
                    ? <CheckSquare className="w-5 h-5 text-blue-400" />
                    : <Square className="w-5 h-5 text-gray-400" />
                }
                {allSelected
                  ? `Deselect All (${filteredAccounts.length})`
                  : `Select All (${filteredAccounts.length})`}
              </button>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                {filteredAccounts.map(account => (
                  <label key={account.clientId}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-all ${
                      selectedAccounts.includes(account.clientId)
                        ? 'bg-blue-50 border-blue-400'
                        : 'bg-gray-50 border-transparent hover:border-gray-300'
                    }`}>
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

          {/* ── Main Area ─────────────────────────────────────── */}
          <div className="col-span-8">

            {/* ── Main Tab Bar ─────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
              <div className="flex border-b border-gray-200 bg-gray-50">
                {MAIN_TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setMainTab(id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                      mainTab === id
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {id === 'performance' && selectedAccounts.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {selectedAccounts.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Summary Tab ──────────────────────────────── */}
              {mainTab === 'summary' && (
                <SummaryTab
                  selectedAccounts={selectedAccounts}
                  allAccounts={allAccounts}
                  startDate={startDate}
                  endDate={endDate}
                  MetricCard={MetricCard}
                />
              )}

              {/* ── Performance by Objective Tab ─────────────── */}
              {mainTab === 'performance' && (
                <ObjectiveTabs
                  selectedAccounts={selectedAccounts}
                  allAccounts={allAccounts}
                  startDate={startDate}
                  endDate={endDate}
                  activePreset={activePreset}
                />
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}