'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Search, TrendingUp, TrendingDown, DollarSign, MousePointer, Eye, Target, Users, RefreshCw, ChevronDown, Calendar, ExternalLink, Layers, Video, Globe, Zap, BarChart2 } from 'lucide-react';

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
    return `${fmt(start)} - ${fmt(end)}`;
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
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={applyCustom}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarSection({ title, loading, items, selectedIds, onToggle, onSelectAll, onClear, searchValue, onSearchChange, searchPlaceholder, emptyMessage, accentColor = 'blue' }) {
  const accents = {
    blue:    { selected: 'bg-blue-900 border-blue-500',    btn: 'bg-blue-600 hover:bg-blue-700',    badge: 'bg-blue-800 text-blue-300' },
    purple:  { selected: 'bg-purple-900 border-purple-500', btn: 'bg-purple-600 hover:bg-purple-700', badge: 'bg-purple-800 text-purple-300' },
    emerald: { selected: 'bg-emerald-900 border-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700', badge: 'bg-emerald-800 text-emerald-300' },
    orange:  { selected: 'bg-orange-900 border-orange-500', btn: 'bg-orange-600 hover:bg-orange-700', badge: 'bg-orange-800 text-orange-300' },
  };
  const accent = accents[accentColor];

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-white text-sm uppercase tracking-wide">{title}</h2>
        <div className="flex items-center gap-2">
          {loading && <span className="text-slate-400 text-xs">(loading...)</span>}
          {selectedIds.length > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accent.badge}`}>{selectedIds.length} selected</span>
          )}
        </div>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input type="text" placeholder={searchPlaceholder}
          value={searchValue} onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500" />
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={onSelectAll} className={`flex-1 px-2 py-1.5 text-white rounded-lg text-xs font-medium ${accent.btn}`}>Select All</button>
        {selectedIds.length > 0 && (
          <button onClick={onClear} className="flex-1 px-2 py-1.5 bg-slate-600 text-slate-200 rounded-lg text-xs font-medium hover:bg-slate-500">
            Clear ({selectedIds.length})
          </button>
        )}
      </div>
      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
        {items.map(item => (
          <label key={item.id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
            selectedIds.includes(item.id) ? `${accent.selected} text-white` : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
          }`}>
            <input type="checkbox" checked={selectedIds.includes(item.id)}
              onChange={() => onToggle(item.id)} className="w-4 h-4 accent-blue-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-white leading-snug truncate">{item.name}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {item.id}</div>
            </div>
          </label>
        ))}
        {items.length === 0 && !loading && (
          <p className="text-slate-400 text-xs text-center py-6">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}

function TopPerformingBlock({ title, items, accountId, type, nameMap }) {
  if (!items || items.length === 0) return null;

  function getUrl(id) {
    const base = `https://www.linkedin.com/campaignmanager/accounts/${accountId}`;
    if (type === 'campaign') return `${base}/campaigns/${id}`;
    return `${base}/campaigns`;
  }

  function getName(id) {
    return nameMap?.[String(id)] || `${type === 'campaign' ? 'Campaign' : 'Ad'} ${id}`;
  }

  if (type === 'ad') {
    return (
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left pb-2 px-2 text-slate-400 font-semibold whitespace-nowrap">Creative ID</th>
                <th className="text-left pb-2 px-2 text-slate-400 font-semibold">Title</th>
                <th className="text-left pb-2 px-2 text-slate-400 font-semibold">URL</th>
                <th className="text-right pb-2 px-2 text-slate-400 font-semibold">Impressions</th>
                <th className="text-right pb-2 px-2 text-slate-400 font-semibold">Clicks</th>
                <th className="text-right pb-2 px-2 text-slate-400 font-semibold">CTR</th>
                <th className="text-right pb-2 px-2 text-slate-400 font-semibold whitespace-nowrap">Engagements</th>
                <th className="text-right pb-2 px-2 text-slate-400 font-semibold whitespace-nowrap">Eng. Rate</th>
                <th className="text-right pb-2 px-2 text-slate-400 font-semibold whitespace-nowrap">Other Eng.</th>
                <th className="text-right pb-2 px-2 text-slate-400 font-semibold whitespace-nowrap">Social Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const name = getName(item.id);
                const ctr = item.impressions > 0 ? (item.clicks / item.impressions * 100).toFixed(2) : '0.00';
                const engagements = (item.clicks || 0) + (item.likes || 0) + (item.comments || 0) + (item.shares || 0) + (item.follows || 0);
                const engRate = item.impressions > 0 ? (engagements / item.impressions * 100).toFixed(2) : '0.00';
                const otherEng = item.otherEngagements || 0;
                const socialActions = (item.likes || 0) + (item.comments || 0) + (item.shares || 0) + (item.follows || 0);
                return (
                  <tr key={item.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="py-3 px-2 font-mono text-slate-300 whitespace-nowrap">{item.id}</td>
                    <td className="py-3 px-2 text-slate-200 max-w-xs">
                      <div className="flex items-start gap-2">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0 border border-slate-600" />
                        )}
                        <span className="leading-snug">{name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <a href={item.destinationUrl || getUrl(item.id)} target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                    <td className="py-3 px-2 text-right text-white font-medium">{item.impressions.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right text-white font-medium">{item.clicks.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right text-emerald-400 font-medium">{ctr}%</td>
                    <td className="py-3 px-2 text-right text-white font-medium">{engagements.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right text-white font-medium">{engRate}%</td>
                    <td className="py-3 px-2 text-right text-white font-medium">{otherEng.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right text-white font-medium">{socialActions.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={item.id} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
            <div className="flex items-start justify-between gap-2 mb-1">
              <a href={getUrl(item.id)} target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 min-w-0">
                <span className="truncate">{getName(item.id)}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
              <span className="text-xs text-slate-500 flex-shrink-0">#{i + 1}</span>
            </div>
            <div className="text-xs text-slate-500 font-mono mb-2">ID: {item.id}</div>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div><div className="text-xs text-slate-400">Impr.</div><div className="text-xs font-bold text-white">{item.impressions.toLocaleString()}</div></div>
              <div><div className="text-xs text-slate-400">Clicks</div><div className="text-xs font-bold text-white">{item.clicks.toLocaleString()}</div></div>
              <div><div className="text-xs text-slate-400">CTR</div><div className="text-xs font-bold text-emerald-400">{item.ctr || (item.impressions > 0 ? (item.clicks / item.impressions * 100).toFixed(2) : '0.00')}%</div></div>
              <div><div className="text-xs text-slate-400">Spent</div><div className="text-xs font-bold text-white">${item.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FXCalculatorBlock({ reportData, currentRange }) {
  const [periods, setPeriods] = useState([
    { start: currentRange.start, end: '', rate: '' },
    { start: '', end: '', rate: '' },
    { start: '', end: currentRange.end, rate: '' },
  ]);

  function updatePeriod(index, field, value) {
    setPeriods(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  const totalSpendUSD = reportData?.current?.spent || 0;
  const totalImpressions = reportData?.current?.impressions || 0;
  const totalClicks = reportData?.current?.clicks || 0;

  const rangeStart = new Date(currentRange.start + 'T00:00:00');
  const rangeEnd = new Date(currentRange.end + 'T00:00:00');
  const totalRangeDays = Math.max(1, Math.round((rangeEnd - rangeStart) / 86400000) + 1);

  let zarTotalSpend = 0;
  const periodResults = periods.map((p, i) => {
    if (!p.start || !p.end || !p.rate || isNaN(parseFloat(p.rate))) {
      return { label: `Period ${i + 1}`, days: 0, usdSpend: 0, zarSpend: 0, rate: 0, valid: false };
    }
    const pStart = new Date(p.start + 'T00:00:00');
    const pEnd = new Date(p.end + 'T00:00:00');
    const days = Math.max(0, Math.round((pEnd - pStart) / 86400000) + 1);
    const proportion = days / totalRangeDays;
    const usdSpend = totalSpendUSD * proportion;
    const rate = parseFloat(p.rate);
    const zarSpend = usdSpend * rate;
    zarTotalSpend += zarSpend;
    return { label: `Period ${i + 1}`, days, usdSpend, zarSpend, rate, valid: true, start: p.start, end: p.end };
  });

  const blendedRate = totalSpendUSD > 0 ? zarTotalSpend / totalSpendUSD : 0;
  const zarCPM = totalImpressions > 0 ? (zarTotalSpend / totalImpressions) * 1000 : 0;
  const zarCPC = totalClicks > 0 ? zarTotalSpend / totalClicks : 0;

  const periodColors = ['border-blue-500 bg-blue-900/20', 'border-purple-500 bg-purple-900/20', 'border-emerald-500 bg-emerald-900/20'];
  const labelColors = ['text-blue-400', 'text-purple-400', 'text-emerald-400'];
  const barColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500'];

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-yellow-600 flex items-center justify-center text-white font-bold text-sm">R</div>
        <div>
          <h3 className="text-lg font-bold text-white">FX Rate Calculator</h3>
          <p className="text-xs text-slate-400">Split your reporting period across up to 3 exchange rates to calculate ZAR totals</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {periods.map((p, i) => (
          <div key={i} className={`rounded-xl p-4 border-2 ${periodColors[i]}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold uppercase tracking-wide ${labelColors[i]}`}>Period {i + 1}</span>
              {periodResults[i].valid && (
                <span className="text-xs text-slate-400 font-mono">{periodResults[i].days} days</span>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Start Date</label>
                <input type="date" value={p.start}
                  onChange={e => updatePeriod(i, 'start', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">End Date</label>
                <input type="date" value={p.end}
                  onChange={e => updatePeriod(i, 'end', e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Exchange Rate (R per $1)</label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-slate-400 text-xs font-bold">R</span>
                  <input type="number" step="0.01" placeholder="18.50" value={p.rate}
                    onChange={e => updatePeriod(i, 'rate', e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              {periodResults[i].valid && (
                <div className="mt-3 pt-3 border-t border-slate-600 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">USD Spend</span>
                    <span className="text-white font-mono">${periodResults[i].usdSpend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">ZAR Spend</span>
                    <span className={`font-bold font-mono ${labelColors[i]}`}>R{periodResults[i].zarSpend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {zarTotalSpend > 0 && (
        <>
          <div className="border-t border-slate-700 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wide">ZAR Summary</h4>
              <span className="text-xs text-slate-500">Blended Rate: R{blendedRate.toFixed(4)} / $1</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-700/50 rounded-xl p-5 border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">ZAR Total Spend</span>
                  <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full font-bold">R</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  R{zarTotalSpend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div className="text-xs text-slate-400">
                  = ${totalSpendUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
                </div>
                <div className="mt-3 h-2 bg-slate-600 rounded-full overflow-hidden flex">
                  {periodResults.map((pr, i) => {
                    if (!pr.valid) return null;
                    const pct = (pr.days / totalRangeDays * 100).toFixed(1);
                    return <div key={i} className={`h-full ${barColors[i]}`} style={{width: `${pct}%`}} title={`Period ${i+1}: ${pct}%`} />;
                  })}
                </div>
                <div className="flex gap-3 mt-2">
                  {periodResults.filter(pr => pr.valid).map((pr, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${barColors[i]}`}></div>
                      <span className="text-xs text-slate-400">P{i+1}: {(pr.days / totalRangeDays * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-5 border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">ZAR CPM</span>
                  <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full font-bold">R</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  R{zarCPM.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div className="text-xs text-slate-400">per 1,000 impressions</div>
                <div className="mt-3 pt-3 border-t border-slate-600">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">USD CPM</span>
                    <span className="text-slate-300 font-mono">${(totalImpressions > 0 ? (totalSpendUSD / totalImpressions) * 1000 : 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-5 border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">ZAR CPC</span>
                  <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full font-bold">R</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  R{zarCPC.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div className="text-xs text-slate-400">per click</div>
                <div className="mt-3 pt-3 border-t border-slate-600">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">USD CPC</span>
                    <span className="text-slate-300 font-mono">${(totalClicks > 0 ? totalSpendUSD / totalClicks : 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Period Breakdown</h5>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left pb-2 text-slate-400 font-semibold">Period</th>
                  <th className="text-left pb-2 text-slate-400 font-semibold">Dates</th>
                  <th className="text-right pb-2 text-slate-400 font-semibold">Days</th>
                  <th className="text-right pb-2 text-slate-400 font-semibold">Rate</th>
                  <th className="text-right pb-2 text-slate-400 font-semibold">USD Spend</th>
                  <th className="text-right pb-2 text-slate-400 font-semibold">ZAR Spend</th>
                </tr>
              </thead>
              <tbody>
                {periodResults.filter(pr => pr.valid).map((pr, i) => (
                  <tr key={i} className="border-b border-slate-700">
                    <td className={`py-2 font-semibold ${labelColors[i]}`}>Period {i + 1}</td>
                    <td className="py-2 text-slate-300 font-mono">{pr.start} to {pr.end}</td>
                    <td className="py-2 text-right text-slate-300">{pr.days}</td>
                    <td className="py-2 text-right text-slate-300">R{pr.rate.toFixed(2)}</td>
                    <td className="py-2 text-right text-slate-300">${pr.usdSpend.toFixed(2)}</td>
                    <td className={`py-2 text-right font-bold ${labelColors[i]}`}>R{pr.zarSpend.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-700/50">
                  <td colSpan={4} className="py-2 font-bold text-white text-right pr-2">Total</td>
                  <td className="py-2 text-right font-bold text-white">${totalSpendUSD.toFixed(2)}</td>
                  <td className="py-2 text-right font-bold text-yellow-400">R{zarTotalSpend.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {zarTotalSpend === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          Enter dates and exchange rates above to calculate ZAR totals
        </div>
      )}
    </div>
  );
}

function AIReportModal({ show, onClose, generatingReport, reportData, reportResult, currentRange, previousRange, campaignNameMap }) {
  const reportRef = useRef(null);

  function downloadHTML() {
    if (!reportResult) return;
    const html = generateFullHTML(reportResult, reportData, currentRange, previousRange, campaignNameMap);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-report-${currentRange.start}-${currentRange.end}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!show) return null;

  const report = reportResult?.report;
  const metrics = reportResult?.metrics;

  function statusColor(status) {
    if (status === 'critical') return '#ff5252';
    if (status === 'warning') return '#ff9800';
    return '#4caf50';
  }

  function trendArrow(trend) {
    if (trend === 'up') return 'up';
    if (trend === 'down') return 'down';
    return 'stable';
  }

  function perfBadge(perf) {
    if (!perf) return '';
    if (perf.includes('above')) return 'Above Benchmark';
    if (perf.includes('below')) return 'Below Benchmark';
    return 'At Benchmark';
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-6xl my-4 overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center px-6 py-3 bg-gray-100 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">AI Campaign Report</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Editable</span>
          </div>
          <div className="flex gap-2">
            {report && !generatingReport && (
              <button onClick={downloadHTML}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-medium">
                Download HTML
              </button>
            )}
            <button onClick={onClose}
              className="px-4 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700">
              Close
            </button>
          </div>
        </div>

        {generatingReport ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <p className="text-gray-800 font-semibold text-xl">Analyzing your campaigns...</p>
            <p className="text-gray-400 text-sm mt-2">This may take 15-30 seconds</p>
          </div>
        ) : report ? (
          <div ref={reportRef} style={{fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", background: '#f4fbff', padding: '20px'}}>
            <div style={{maxWidth: '100%', margin: '0 auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden'}}>
              <div style={{background: '#0e1034', color: 'white', padding: '30px'}} contentEditable suppressContentEditableWarning>
                <h1 style={{fontSize: '28px', marginBottom: '10px', margin: 0}}>Campaign Optimization Summary</h1>
                <p style={{opacity: 0.9, fontSize: '14px', marginTop: '10px'}}>
                  <strong>Report Period:</strong> {currentRange.start} to {currentRange.end} | <strong>Compare Period:</strong> {previousRange.start} to {previousRange.end}
                </p>
              </div>
              <div style={{padding: '20px 30px', background: '#f0f4ff', borderBottom: '1px solid #e0e0e0'}}>
                <p style={{fontSize: '14px', color: '#333', lineHeight: 1.7}} contentEditable suppressContentEditableWarning>
                  {report.executiveSummary}
                </p>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '30px'}}>
                {[
                  { label: 'Total Spend', value: `$${metrics?.current?.spent?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, sub: `vs $${metrics?.previous?.spent?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} prev` },
                  { label: 'Impressions', value: metrics?.current?.impressions?.toLocaleString(), sub: `${report.keyMetrics?.impressionsChange || ''} vs previous` },
                  { label: 'Clicks', value: metrics?.current?.clicks?.toLocaleString(), sub: `${report.keyMetrics?.clicksChange || ''} vs previous` },
                  { label: 'CTR', value: `${metrics?.current?.ctr?.toFixed(2)}%`, sub: `${report.keyMetrics?.ctrChange || ''} vs previous` },
                  { label: 'CPL', value: `$${metrics?.current?.cpl?.toFixed(2)}`, sub: `${report.keyMetrics?.cplChange || ''} vs previous` },
                  { label: 'Total Leads', value: metrics?.current?.leads, sub: `vs ${metrics?.previous?.leads} prev period` },
                ].map((card, i) => (
                  <div key={i} style={{background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                    <h3 style={{fontSize: '12px', color: '#666', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{card.label}</h3>
                    <div style={{fontSize: '28px', fontWeight: 'bold', color: '#0e1034', marginBottom: '5px'}} contentEditable suppressContentEditableWarning>{card.value}</div>
                    <div style={{fontSize: '13px', color: '#999'}} contentEditable suppressContentEditableWarning>{card.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{padding: '30px', borderTop: '1px solid #e0e0e0'}}>
                <h2 style={{fontSize: '22px', marginBottom: '20px', color: '#0e1034'}}>Campaign Performance Comparison</h2>
                <div style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px'}}>
                    <thead>
                      <tr>
                        {['Campaign', 'Impressions', 'Clicks', 'CTR', 'Spent (USD)', 'Leads', 'CPL', 'Performance', 'Trend'].map(h => (
                          <th key={h} style={{textAlign: 'left', padding: '12px', borderBottom: '1px solid #e0e0e0', background: '#f5f5f5', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics?.topCampaigns?.map((c, i) => {
                        const analysis = report.campaignAnalysis?.find(a => String(a.id) === String(c.id));
                        const name = campaignNameMap?.[String(c.id)] || `Campaign ${c.id}`;
                        return (
                          <tr key={c.id} style={{background: i % 2 === 0 ? 'white' : '#fafafa'}}>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0'}} contentEditable suppressContentEditableWarning>
                              <strong>{name}</strong><br/>
                              <span style={{fontSize: '11px', color: '#999', fontFamily: 'monospace'}}>ID: {c.id}</span>
                            </td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0'}} contentEditable suppressContentEditableWarning>{c.impressions.toLocaleString()}</td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0'}} contentEditable suppressContentEditableWarning>{c.clicks.toLocaleString()}</td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0'}} contentEditable suppressContentEditableWarning>{c.ctr}%</td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0'}} contentEditable suppressContentEditableWarning>${c.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0'}} contentEditable suppressContentEditableWarning>{c.leads || 0}</td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0'}} contentEditable suppressContentEditableWarning>{c.leads > 0 ? `$${(c.spent / c.leads).toFixed(2)}` : '-'}</td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0', color: statusColor(analysis?.status)}} contentEditable suppressContentEditableWarning>{perfBadge(analysis?.performance)}</td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0'}} contentEditable suppressContentEditableWarning>{trendArrow(analysis?.trend)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{padding: '30px', borderTop: '1px solid #e0e0e0'}}>
                <h2 style={{fontSize: '22px', marginBottom: '20px', color: '#0e1034'}}>Performance Charts</h2>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                  {[
                    { id: 'spendChart', title: 'Spend (USD) by Campaign' },
                    { id: 'ctrChart', title: 'CTR by Campaign' },
                    { id: 'clicksChart', title: 'Clicks by Campaign' },
                    { id: 'impressionsChart', title: 'Impressions by Campaign' },
                  ].map(chart => (
                    <div key={chart.id} style={{padding: '20px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px'}}>
                      <h3 style={{marginBottom: '15px', color: '#0e1034', fontSize: '16px'}}>{chart.title}</h3>
                      <canvas id={chart.id} style={{maxHeight: '300px'}}></canvas>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{padding: '30px', borderTop: '1px solid #e0e0e0'}}>
                <h2 style={{fontSize: '22px', marginBottom: '20px', color: '#0e1034'}}>Optimization Recommendations</h2>
                {report.campaignAnalysis?.map((analysis, i) => {
                  const name = campaignNameMap?.[String(analysis.id)] || `Campaign ${analysis.id}`;
                  return (
                    <div key={i} style={{background: '#f9f9f9', borderLeft: '4px solid #2196F3', padding: '15px', margin: '10px 0', borderRadius: '4px'}}>
                      <h4 style={{color: '#0e1034', marginBottom: '10px', fontSize: '15px'}} contentEditable suppressContentEditableWarning>
                        {name} <span style={{fontSize: '12px', color: '#999', fontFamily: 'monospace'}}>(ID: {analysis.id})</span>
                      </h4>
                      <ul style={{listStyle: 'none', padding: 0}}>
                        {analysis.recommendations?.map((rec, j) => (
                          <li key={j} style={{padding: '5px 0', paddingLeft: '20px', position: 'relative', color: '#444', fontSize: '14px'}} contentEditable suppressContentEditableWarning>
                            <span style={{position: 'absolute', left: 0, color: '#2196F3'}}>-&gt;</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <div style={{padding: '30px', borderTop: '1px solid #e0e0e0'}}>
                <h2 style={{fontSize: '22px', marginBottom: '20px', color: '#0e1034'}}>Key Insights and Action Items</h2>
                {[
                  { title: 'Top Performers', items: report.topPerformers, color: '#4caf50' },
                  { title: 'Areas for Improvement', items: report.areasForImprovement, color: '#ff9800' },
                  { title: 'Strategic Recommendations', items: report.strategicRecommendations, color: '#2196F3' },
                  { title: 'Immediate Next Steps', items: report.immediateActions, color: '#ff5252' },
                ].map((section, si) => (
                  <div key={si} style={{background: '#f9f9f9', borderLeft: `4px solid ${section.color}`, padding: '15px', margin: '10px 0', borderRadius: '4px'}}>
                    <h4 style={{color: '#0e1034', marginBottom: '10px', fontSize: '15px'}}>{section.title}</h4>
                    <ul style={{listStyle: 'none', padding: 0}}>
                      {section.items?.map((item, j) => (
                        <li key={j} style={{padding: '5px 0', paddingLeft: '20px', position: 'relative', color: '#444', fontSize: '14px'}} contentEditable suppressContentEditableWarning>
                          <span style={{position: 'absolute', left: 0, color: section.color}}>-&gt;</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {report.budgetRecommendation && (
                  <div style={{background: '#e8f5e9', borderLeft: '4px solid #4caf50', padding: '15px', margin: '10px 0', borderRadius: '4px'}}>
                    <h4 style={{color: '#0e1034', marginBottom: '10px', fontSize: '15px'}}>Budget Recommendation</h4>
                    <p style={{color: '#444', fontSize: '14px'}} contentEditable suppressContentEditableWarning>{report.budgetRecommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
        {report && metrics?.topCampaigns?.length > 0 && (
          <ChartRenderer campaigns={metrics.topCampaigns} campaignNameMap={campaignNameMap} />
        )}
      </div>
    </div>
  );
}

function ChartRenderer({ campaigns, campaignNameMap }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = () => {
      const labels = campaigns.map(c => {
        const n = campaignNameMap?.[String(c.id)] || `Campaign ${c.id}`;
        return n.length > 25 ? n.substring(0, 25) + '...' : n;
      });
      const makeChart = (id, data, label, color) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el._chart) el._chart.destroy();
        el._chart = new window.Chart(el, {
          type: 'bar',
          data: { labels, datasets: [{ label, data, backgroundColor: color }] },
          options: {
            responsive: true, maintainAspectRatio: true, indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true } }
          }
        });
      };
      makeChart('spendChart', campaigns.map(c => c.spent), 'Spend', '#2196F3');
      makeChart('ctrChart', campaigns.map(c => parseFloat(c.ctr)), 'CTR %', '#4caf50');
      makeChart('clicksChart', campaigns.map(c => c.clicks), 'Clicks', '#ff9800');
      makeChart('impressionsChart', campaigns.map(c => c.impressions), 'Impressions', '#9c27b0');
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch(e) {} };
  }, [campaigns]);
  return null;
}

function generateFullHTML(reportResult, reportData, currentRange, previousRange, campaignNameMap) {
  const report = reportResult?.report;
  const metrics = reportResult?.metrics;
  const campaigns = metrics?.topCampaigns || [];
  const statusColor = (s) => s === 'critical' ? '#ff5252' : s === 'warning' ? '#ff9800' : '#4caf50';
  const trendArrow = (t) => t === 'up' ? 'up' : t === 'down' ? 'down' : 'stable';
  const perfBadge = (p) => p?.includes('above') ? 'Above Benchmark' : p?.includes('below') ? 'Below Benchmark' : 'At Benchmark';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Campaign Optimization Summary</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4fbff;padding:20px;line-height:1.6}
.container{max-width:1200px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden}
header{background:#0e1034;color:white;padding:30px}
header h1{font-size:28px;margin-bottom:10px}
.exec{padding:20px 30px;background:#f0f4ff;border-bottom:1px solid #e0e0e0;font-size:14px;color:#333;line-height:1.7}
.summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;padding:30px}
.card{background:white;border:1px solid #e0e0e0;border-radius:8px;padding:20px;box-shadow:0 2px 4px rgba(0,0,0,0.05)}
.card h3{font-size:12px;color:#666;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px}
.card .value{font-size:28px;font-weight:bold;color:#0e1034;margin-bottom:5px}
.card .sub{font-size:13px;color:#999}
section{padding:30px;border-top:1px solid #e0e0e0}
section h2{font-size:22px;margin-bottom:20px;color:#0e1034}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:12px;border-bottom:1px solid #e0e0e0}
th{background:#f5f5f5;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666}
.chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.chart-box{padding:20px;background:white;border:1px solid #e0e0e0;border-radius:8px}
.chart-box h3{margin-bottom:15px;color:#0e1034;font-size:16px}
canvas{max-height:280px!important}
.rec{background:#f9f9f9;padding:15px;margin:10px 0;border-radius:4px}
.rec h4{color:#0e1034;margin-bottom:10px;font-size:15px}
.rec ul{list-style:none;padding:0}
.rec li{padding:5px 0 5px 20px;position:relative;color:#444;font-size:14px}
</style>
</head>
<body>
<div class="container">
<header>
<h1>Campaign Optimization Summary</h1>
<p><strong>Report Period:</strong> ${currentRange.start} to ${currentRange.end} | <strong>Compare Period:</strong> ${previousRange.start} to ${previousRange.end}</p>
</header>
<div class="exec">${report?.executiveSummary || ''}</div>
<div class="summary-grid">
${[
  { label: 'Total Spend', value: `$${metrics?.current?.spent?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`, sub: `vs $${metrics?.previous?.spent?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} prev` },
  { label: 'Impressions', value: metrics?.current?.impressions?.toLocaleString(), sub: `${report?.keyMetrics?.impressionsChange||''} vs previous` },
  { label: 'Clicks', value: metrics?.current?.clicks?.toLocaleString(), sub: `${report?.keyMetrics?.clicksChange||''} vs previous` },
  { label: 'CTR', value: `${metrics?.current?.ctr?.toFixed(2)}%`, sub: `${report?.keyMetrics?.ctrChange||''} vs previous` },
  { label: 'CPL', value: `$${metrics?.current?.cpl?.toFixed(2)}`, sub: `${report?.keyMetrics?.cplChange||''} vs previous` },
  { label: 'Total Leads', value: metrics?.current?.leads, sub: `vs ${metrics?.previous?.leads} prev period` },
].map(c => `<div class="card"><h3>${c.label}</h3><div class="value">${c.value}</div><div class="sub">${c.sub}</div></div>`).join('')}
</div>
<section>
<h2>Campaign Performance Comparison</h2>
<table>
<thead><tr>${['Campaign','Impressions','Clicks','CTR','Spent (USD)','Leads','CPL','Performance','Trend'].map(h=>`<th>${h}</th>`).join('')}</tr></thead>
<tbody>
${campaigns.map((c,i)=>{
  const a=report?.campaignAnalysis?.find(x=>String(x.id)===String(c.id));
  const name=campaignNameMap?.[String(c.id)]||`Campaign ${c.id}`;
  return `<tr style="background:${i%2===0?'white':'#fafafa'}">
<td><strong>${name}</strong><br/><span style="font-size:11px;color:#999;font-family:monospace">ID: ${c.id}</span></td>
<td>${c.impressions.toLocaleString()}</td><td>${c.clicks.toLocaleString()}</td><td>${c.ctr}%</td>
<td>$${c.spent.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
<td>${c.leads||0}</td><td>${c.leads>0?`$${(c.spent/c.leads).toFixed(2)}`:'-'}</td>
<td style="color:${statusColor(a?.status)}">${perfBadge(a?.performance)}</td>
<td>${trendArrow(a?.trend)}</td></tr>`;
}).join('')}
</tbody></table>
</section>
<section>
<h2>Performance Charts</h2>
<div class="chart-grid">
<div class="chart-box"><h3>Spend (USD) by Campaign</h3><canvas id="spendChart"></canvas></div>
<div class="chart-box"><h3>CTR by Campaign</h3><canvas id="ctrChart"></canvas></div>
<div class="chart-box"><h3>Clicks by Campaign</h3><canvas id="clicksChart"></canvas></div>
<div class="chart-box"><h3>Impressions by Campaign</h3><canvas id="impressionsChart"></canvas></div>
</div>
</section>
<section>
<h2>Optimization Recommendations</h2>
${(report?.campaignAnalysis||[]).map(a=>{
  const name=campaignNameMap?.[String(a.id)]||`Campaign ${a.id}`;
  return `<div class="rec" style="border-left:4px solid #2196F3">
<h4>${name} <span style="font-size:11px;color:#999">(ID: ${a.id})</span></h4>
<ul>${(a.recommendations||[]).map(r=>`<li>${r}</li>`).join('')}</ul>
</div>`;
}).join('')}
</section>
<section>
<h2>Key Insights and Action Items</h2>
${[
  {title:'Top Performers',items:report?.topPerformers,color:'#4caf50'},
  {title:'Areas for Improvement',items:report?.areasForImprovement,color:'#ff9800'},
  {title:'Strategic Recommendations',items:report?.strategicRecommendations,color:'#2196F3'},
  {title:'Immediate Next Steps',items:report?.immediateActions,color:'#ff5252'},
].map(s=>`<div class="rec" style="border-left:4px solid ${s.color}">
<h4>${s.title}</h4>
<ul>${(s.items||[]).map(i=>`<li>${i}</li>`).join('')}</ul>
</div>`).join('')}
${report?.budgetRecommendation?`<div class="rec" style="border-left:4px solid #4caf50;background:#e8f5e9">
<h4>Budget Recommendation</h4><p style="color:#444;font-size:14px">${report.budgetRecommendation}</p></div>`:''}
</section>
</div>
<script>
const labels=${JSON.stringify(campaigns.map(c=>{const n=campaignNameMap?.[String(c.id)]||`Campaign ${c.id}`;return n.length>25?n.substring(0,25)+'...':n;}))};
function mc(id,data,label,color){new Chart(document.getElementById(id),{type:'bar',data:{labels,datasets:[{label,data,backgroundColor:color}]},options:{responsive:true,maintainAspectRatio:true,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}}})}
mc('spendChart',${JSON.stringify(campaigns.map(c=>c.spent))},'Spend','#2196F3');
mc('ctrChart',${JSON.stringify(campaigns.map(c=>parseFloat(c.ctr)))},'CTR %','#4caf50');
mc('clicksChart',${JSON.stringify(campaigns.map(c=>c.clicks))},'Clicks','#ff9800');
mc('impressionsChart',${JSON.stringify(campaigns.map(c=>c.impressions))},'Impressions','#9c27b0');
<\/script>
</body></html>`;
}

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [accountSearch, setAccountSearch] = useState('');

  const [campaignGroups, setCampaignGroups] = useState([]);
  const [selectedCampaignGroups, setSelectedCampaignGroups] = useState([]);
  const [campaignGroupSearch, setCampaignGroupSearch] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(false);

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
  const [activeObjectiveTab, setActiveObjectiveTab] = useState('all');
  const [campaignStart, setCampaignStart] = useState('');
  const [campaignEnd, setCampaignEnd] = useState('');

  const [showReport, setShowReport] = useState(false);
  const [reportResult, setReportResult] = useState(null);
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
      loadCampaignGroups();
      loadCampaigns();
      setSelectedCampaignGroups([]);
      setSelectedCampaigns([]);
      setAds([]); setSelectedAds([]);
    } else {
      setCampaignGroups([]); setSelectedCampaignGroups([]);
      setCampaigns([]); setSelectedCampaigns([]);
      setAds([]); setSelectedAds([]);
      setReportData(null);
    }
  }, [selectedAccounts]);

  useEffect(() => {
    if (selectedCampaigns.length > 0) { loadAds(); setSelectedAds([]); }
    else { setAds([]); setSelectedAds([]); }
  }, [selectedCampaigns]);

  useEffect(() => {
    if (selectedAccounts.length > 0) loadAnalytics();
  }, [selectedAds, selectedCampaigns, selectedCampaignGroups, currentRange, previousRange]);

  async function loadAccounts() {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) setAccounts(await res.json());
    } catch (err) { console.error(err); }
  }

  async function loadCampaignGroups() {
    setLoadingGroups(true);
    try {
      const res = await fetch('/api/campaigngroups', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: selectedAccounts })
      });
      if (res.ok) setCampaignGroups(await res.json());
    } catch (err) { console.error(err); }
    setLoadingGroups(false);
  }

  async function loadCampaigns() {
    setLoadingCampaigns(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountIds: selectedAccounts,
          campaignGroupIds: selectedCampaignGroups.length > 0 ? selectedCampaignGroups : null,
          campaignIds: selectedCampaigns.length > 0 ? selectedCampaigns : null,
          adIds: selectedAds.length > 0 ? selectedAds : null,
          currentRange, previousRange, exchangeRate
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
    setReportResult(null);
    try {
      const res = await fetch('/api/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current: reportData.current,
          previous: reportData.previous,
          topCampaigns: reportData.topCampaigns,
          topAds: reportData.topAds,
          budgetPacing: reportData.budgetPacing,
          currentRange, previousRange, selectedCampaigns, exchangeRate
        })
      });
      if (res.ok) setReportResult(await res.json());
      else setReportResult({ error: 'Failed to generate report.' });
    } catch (err) {
      setReportResult({ error: 'Failed to generate report.' });
    }
    setGeneratingReport(false);
  }

  function exportToCSV() {
    if (!reportData) return;
    const { current, previous, topCampaigns } = reportData;
    const rows = [
      ['LinkedIn Campaign Dashboard Export'],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      ['SUMMARY METRICS', 'CURRENT PERIOD', 'PREVIOUS PERIOD', 'CHANGE %'],
      ['Period', `${currentRange.start} to ${currentRange.end}`, `${previousRange.start} to ${previousRange.end}`, ''],
      ['Impressions', current.impressions, previous.impressions, previous.impressions > 0 ? (((current.impressions - previous.impressions) / previous.impressions) * 100).toFixed(1) + '%' : 'N/A'],
      ['Clicks', current.clicks, previous.clicks, previous.clicks > 0 ? (((current.clicks - previous.clicks) / previous.clicks) * 100).toFixed(1) + '%' : 'N/A'],
      ['CTR (%)', current.ctr.toFixed(2), previous.ctr.toFixed(2), previous.ctr > 0 ? (((current.ctr - previous.ctr) / previous.ctr) * 100).toFixed(1) + '%' : 'N/A'],
      ['Spend ($)', current.spent.toFixed(2), previous.spent.toFixed(2), previous.spent > 0 ? (((current.spent - previous.spent) / previous.spent) * 100).toFixed(1) + '%' : 'N/A'],
      ['CPM ($)', current.cpm.toFixed(2), previous.cpm.toFixed(2), previous.cpm > 0 ? (((current.cpm - previous.cpm) / previous.cpm) * 100).toFixed(1) + '%' : 'N/A'],
      ['CPC ($)', current.cpc.toFixed(2), previous.cpc.toFixed(2), previous.cpc > 0 ? (((current.cpc - previous.cpc) / previous.cpc) * 100).toFixed(1) + '%' : 'N/A'],
      ['Leads', current.leads, previous.leads, previous.leads > 0 ? (((current.leads - previous.leads) / previous.leads) * 100).toFixed(1) + '%' : 'N/A'],
      ['CPL ($)', current.cpl.toFixed(2), previous.cpl.toFixed(2), previous.cpl > 0 ? (((current.cpl - previous.cpl) / previous.cpl) * 100).toFixed(1) + '%' : 'N/A'],
      ['Engagements', current.engagements, previous.engagements, previous.engagements > 0 ? (((current.engagements - previous.engagements) / previous.engagements) * 100).toFixed(1) + '%' : 'N/A'],
      ['Engagement Rate (%)', current.engagementRate.toFixed(2), previous.engagementRate.toFixed(2), previous.engagementRate > 0 ? (((current.engagementRate - previous.engagementRate) / previous.engagementRate) * 100).toFixed(1) + '%' : 'N/A'],
      [],
      ['TOP CAMPAIGNS', 'ID', 'IMPRESSIONS', 'CLICKS', 'CTR (%)', 'SPENT ($)', 'LEADS', 'CPL ($)'],
      ...(topCampaigns || []).map(c => [
        campaignNameMap[String(c.id)] || `Campaign ${c.id}`,
        c.id, c.impressions, c.clicks, c.ctr,
        c.spent.toFixed(2), c.leads || 0,
        c.leads > 0 ? (c.spent / c.leads).toFixed(2) : '-'
      ]),
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-dashboard-${currentRange.start}-${currentRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => window.open('https://sheets.new', '_blank'), 500);
  }

  const campaignNameMap = Object.fromEntries(campaigns.map(c => [String(c.id), c.name]));
  const adNameMap = Object.fromEntries(ads.map(a => [String(a.id), a.name]));
  const primaryAccountId = selectedAccounts[0];

  // Map campaign ID → objectiveType for tab filtering
  const campaignObjectiveMap = Object.fromEntries(
    campaigns.map(c => [String(c.id), (c.objectiveType || c.type || '').toUpperCase()])
  );

  const OBJECTIVE_TABS = [
    { id: 'all',         label: 'All',              icon: BarChart2,   types: null,
      metrics: ['impressions','clicks','ctr','spent','cpm','cpc','websiteVisits','leads','cpl','engagementRate','engagements'] },
    { id: 'engagement',  label: 'Engagement',        icon: Zap,         types: ['ENGAGEMENT','BRAND_AWARENESS','SPONSORED_UPDATES'],
      metrics: ['impressions','clicks','ctr','cpc','landingPageClicks','landingPageCTR','engagementRate','engagements'] },
    { id: 'leads',       label: 'Lead Generation',   icon: Users,       types: ['LEAD_GENERATION','SPONSORED_INMAILS'],
      metrics: ['impressions','clicks','ctr','spent','leads','cpl','leadFormOpens','leadFormCompletionRate'] },
    { id: 'video',       label: 'Video Views',       icon: Video,       types: ['VIDEO_VIEWS','SPONSORED_VIDEO'],
      metrics: ['impressions','clicks','ctr','spent','cpm','cpc'] },
    { id: 'website',     label: 'Website Visits',    icon: Globe,       types: ['WEBSITE_VISITS','WEBSITE_CONVERSIONS'],
      metrics: ['impressions','clicks','ctr','spent','cpm','cpc','websiteVisits'] },
  ];

  const activeTabConfig = OBJECTIVE_TABS.find(t => t.id === activeObjectiveTab) || OBJECTIVE_TABS[0];

  // Filter topCampaigns by objective type for the active tab
  const filteredTopCampaigns = activeTabConfig.types === null
    ? (reportData?.topCampaigns || [])
    : (reportData?.topCampaigns || []).filter(c => {
        const obj = campaignObjectiveMap[String(c.id)] || '';
        return activeTabConfig.types.some(t => obj.includes(t));
      });

  // All metrics config (used to selectively show per tab)
  const ALL_METRICS = [
    { label: 'Impressions',     key: 'impressions',     format: 'number',  icon: Eye,          prefix: '' },
    { label: 'Clicks',          key: 'clicks',          format: 'number',  icon: MousePointer, prefix: '' },
    { label: 'CTR',             key: 'ctr',             format: 'percent', icon: TrendingUp,   prefix: '' },
    { label: 'Spent (USD)',     key: 'spent',           format: 'decimal', icon: DollarSign,   prefix: '$' },
    { label: 'CPM (USD)',       key: 'cpm',             format: 'decimal', icon: DollarSign,   prefix: '$' },
    { label: 'CPC (USD)',       key: 'cpc',             format: 'decimal', icon: DollarSign,   prefix: '$' },
    { label: 'Landing Page Clicks', key: 'landingPageClicks', format: 'number',  icon: MousePointer, prefix: '' },
    { label: 'Landing Page CTR',    key: 'landingPageCTR',    format: 'percent', icon: TrendingUp,   prefix: '' },
    { label: 'Website Visits',  key: 'websiteVisits',   format: 'number',  icon: Target,       prefix: '' },
    { label: 'Leads',           key: 'leads',           format: 'number',  icon: Users,        prefix: '' },
    { label: 'CPL (USD)',       key: 'cpl',             format: 'decimal', icon: DollarSign,   prefix: '$' },
    { label: 'Lead Form Opens',       key: 'leadFormOpens',          format: 'number',  icon: Users,        prefix: '' },
    { label: 'Lead Form Completion',  key: 'leadFormCompletionRate', format: 'percent', icon: TrendingUp,   prefix: '' },
    { label: 'Engagement Rate', key: 'engagementRate',  format: 'percent', icon: TrendingUp,   prefix: '' },
    { label: 'Engagements',     key: 'engagements',     format: 'number',  icon: Users,        prefix: '' },
  ];

  const visibleMetrics = ALL_METRICS.filter(m => activeTabConfig.metrics.includes(m.key));

  const filteredAccounts = accounts.filter(a => !accountSearch || a.name.toLowerCase().includes(accountSearch.toLowerCase()) || String(a.id).includes(accountSearch));
  const filteredGroups = campaignGroups.filter(g => !campaignGroupSearch || g.name.toLowerCase().includes(campaignGroupSearch.toLowerCase()) || String(g.id).includes(campaignGroupSearch));
  const filteredCampaigns = campaigns.filter(c => !campaignSearch || c.name.toLowerCase().includes(campaignSearch.toLowerCase()) || String(c.id).includes(campaignSearch));
  const filteredAds = ads.filter(a => !adSearch || a.name.toLowerCase().includes(adSearch.toLowerCase()) || String(a.id).includes(adSearch));

  function toggle(setter) {
    return (id) => setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  if (status === 'loading') return <LoadingScreen />;
  if (!session) return <SignInScreen />;

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } body { background: #0f172a !important; } @page { margin: 1cm; } }`}</style>
      <div className="min-h-screen bg-slate-900">
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
                  <button onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm flex items-center gap-2">
                    <span>📊</span> Google Sheets
                  </button>
                  <button onClick={() => window.print()}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-sm">
                    Export PDF
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
            <div className="col-span-3 space-y-3 no-print">
              <div className="flex items-center gap-2 px-1">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Account</span>
              </div>
              <SidebarSection title="Accounts" loading={false} items={filteredAccounts}
                selectedIds={selectedAccounts} onToggle={toggle(setSelectedAccounts)}
                onSelectAll={() => setSelectedAccounts(filteredAccounts.map(a => a.id))}
                onClear={() => setSelectedAccounts([])} searchValue={accountSearch}
                onSearchChange={setAccountSearch} searchPlaceholder="Search by name or ID..."
                emptyMessage="No accounts found" accentColor="blue" />

              {selectedAccounts.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-1 pt-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Campaign Group</span>
                  </div>
                  <SidebarSection title="Campaign Groups" loading={loadingGroups} items={filteredGroups}
                    selectedIds={selectedCampaignGroups} onToggle={toggle(setSelectedCampaignGroups)}
                    onSelectAll={() => setSelectedCampaignGroups(filteredGroups.map(g => g.id))}
                    onClear={() => setSelectedCampaignGroups([])} searchValue={campaignGroupSearch}
                    onSearchChange={setCampaignGroupSearch} searchPlaceholder="Search by name or ID..."
                    emptyMessage="No campaign groups found" accentColor="purple" />

                  <div className="flex items-center gap-2 px-1 pt-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Campaign / Ad Set</span>
                  </div>
                  <SidebarSection title="Campaigns" loading={loadingCampaigns} items={filteredCampaigns}
                    selectedIds={selectedCampaigns} onToggle={toggle(setSelectedCampaigns)}
                    onSelectAll={() => setSelectedCampaigns(filteredCampaigns.map(c => c.id))}
                    onClear={() => setSelectedCampaigns([])} searchValue={campaignSearch}
                    onSearchChange={setCampaignSearch} searchPlaceholder="Search by name or ID..."
                    emptyMessage="No campaigns found" accentColor="emerald" />
                </>
              )}

              {selectedCampaigns.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-1 pt-2">
                    <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">4</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Ads</span>
                  </div>
                  <SidebarSection title="Ads" loading={loadingAds} items={filteredAds}
                    selectedIds={selectedAds} onToggle={toggle(setSelectedAds)}
                    onSelectAll={() => setSelectedAds(filteredAds.map(a => a.id))}
                    onClear={() => setSelectedAds([])} searchValue={adSearch}
                    onSearchChange={setAdSearch} searchPlaceholder="Search by name or ID..."
                    emptyMessage="No ads found" accentColor="orange" />
                </>
              )}
            </div>

            <div className="col-span-9 print:col-span-12">
              {!reportData ? (
                <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                  <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Select an Account to Begin</h2>
                  <p className="text-slate-400">Use the sidebar steps to filter by account, campaign group, campaign and ad</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4 flex-wrap no-print">
                    <span className="px-3 py-1 bg-blue-900 border border-blue-700 rounded-full text-xs text-blue-300 font-medium">
                      {selectedAccounts.length} Account{selectedAccounts.length !== 1 ? 's' : ''}
                    </span>
                    {selectedCampaignGroups.length > 0 && (
                      <span className="px-3 py-1 bg-purple-900 border border-purple-700 rounded-full text-xs text-purple-300 font-medium">
                        {selectedCampaignGroups.length} Group{selectedCampaignGroups.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {selectedCampaigns.length > 0 && (
                      <span className="px-3 py-1 bg-emerald-900 border border-emerald-700 rounded-full text-xs text-emerald-300 font-medium">
                        {selectedCampaigns.length} Campaign{selectedCampaigns.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {selectedAds.length > 0 && (
                      <span className="px-3 py-1 bg-orange-900 border border-orange-700 rounded-full text-xs text-orange-300 font-medium">
                        {selectedAds.length} Ad{selectedAds.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

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
                      <div className="ml-auto">
                        <button onClick={loadAnalytics} disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm">
                          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="hidden print:block mb-6">
                    <h2 className="text-xl font-bold text-white">LinkedIn Campaign Report</h2>
                    <p className="text-slate-400 text-sm">Period: {currentRange.start} to {currentRange.end} | Compare: {previousRange.start} to {previousRange.end}</p>
                  </div>

                  {/* ── Objective Tabs ── */}
                  <div className="bg-slate-800 rounded-xl border border-slate-700 mb-6 overflow-hidden">
                    <div className="flex overflow-x-auto border-b border-slate-700">
                      {OBJECTIVE_TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeObjectiveTab === tab.id;
                        // Count campaigns for this tab
                        const count = tab.types === null
                          ? (reportData?.topCampaigns?.length || 0)
                          : (reportData?.topCampaigns || []).filter(c => {
                              const obj = campaignObjectiveMap[String(c.id)] || '';
                              return tab.types.some(t => obj.includes(t));
                            }).length;

                        const activeColors = {
                          all:        'border-blue-500    text-blue-400    bg-blue-950/40',
                          engagement: 'border-yellow-500  text-yellow-400  bg-yellow-950/40',
                          leads:      'border-purple-500  text-purple-400  bg-purple-950/40',
                          video:      'border-rose-500    text-rose-400    bg-rose-950/40',
                          website:    'border-emerald-500 text-emerald-400 bg-emerald-950/40',
                        };

                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveObjectiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                              isActive
                                ? `${activeColors[tab.id]} border-b-2`
                                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {count > 0 && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                                isActive ? 'bg-slate-700 text-white' : 'bg-slate-700 text-slate-400'
                              }`}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Campaign Performance Metrics */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-white mb-6">Campaign Performance</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {visibleMetrics.map(metric => (
                          <MetricCard key={metric.key} label={metric.label}
                            current={reportData.current[metric.key]}
                            previous={reportData.previous[metric.key]}
                            format={metric.format} icon={metric.icon} prefix={metric.prefix} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Top Campaigns — filtered by active tab */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <TopPerformingBlock
                      title={activeObjectiveTab === 'all' ? 'Top Campaigns' : `Top ${activeTabConfig.label} Campaigns`}
                      items={filteredTopCampaigns}
                      accountId={primaryAccountId} type="campaign" nameMap={campaignNameMap} />
                  </div>
                  {reportData.topAds && reportData.topAds.length > 0 && (
                    <div className="mb-6">
                      <TopPerformingBlock title="Top Performing Ads" items={reportData.topAds}
                        accountId={primaryAccountId} type="ad" nameMap={adNameMap} />
                    </div>
                  )}

                  <BudgetPacingCard pacing={reportData.budgetPacing}
                    manualBudget={manualBudget} onBudgetChange={setManualBudget}
                    campaignStart={campaignStart} campaignEnd={campaignEnd}
                    onCampaignStartChange={setCampaignStart} onCampaignEndChange={setCampaignEnd} />

                  <FXCalculatorBlock reportData={reportData} currentRange={currentRange} />
                </>
              )}
            </div>
          </div>
        </div>

        <AIReportModal
          show={showReport}
          onClose={() => setShowReport(false)}
          generatingReport={generatingReport}
          reportData={reportData}
          reportResult={reportResult}
          currentRange={currentRange}
          previousRange={previousRange}
          campaignNameMap={campaignNameMap}
        />
      </div>
    </>
  );
}

function MetricCard({ label, current, previous, format, icon: Icon, prefix = '' }) {
  const change = previous > 0 ? ((current - previous) / previous * 100) : 0;
  const isPositive = change >= 0;

  function formatValue(val) {
    if (format === 'decimal') return `${prefix}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (format === 'percent') return `${val.toFixed(2)}%`;
    return `${prefix}${val.toLocaleString()}`;
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

function BudgetPacingCard({ pacing, manualBudget, onBudgetChange, campaignStart, campaignEnd, onCampaignStartChange, onCampaignEndChange }) {
  if (!pacing) return null;
  const budget = parseFloat(manualBudget) || 0;
  const pacingPercent = budget > 0 ? Math.min((pacing.spent / budget * 100), 100).toFixed(2) : null;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0].replace(/-/g, '/');

  let daysElapsed = null, daysTotal = null;
  if (campaignStart && campaignEnd) {
    const start = new Date(campaignStart);
    const end = new Date(campaignEnd);
    daysTotal = Math.ceil((end - start) / 86400000) + 1;
    daysElapsed = Math.min(Math.ceil((today - start) / 86400000), daysTotal);
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-bold text-white mb-6">Budgeting and Pacing</h3>
      <div className="grid grid-cols-2 gap-6">

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Budget</p>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-400 mb-1">Current Spent</p>
              <p className="text-2xl font-bold text-slate-900">
                R {pacing.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pacing</p>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-400 mb-1">Date Pacing</p>
              <p className={`text-2xl font-bold ${pacingPercent ? (parseFloat(pacingPercent) > 90 ? 'text-red-500' : parseFloat(pacingPercent) > 70 ? 'text-yellow-500' : 'text-slate-900') : 'text-slate-900'}`}>
                {pacingPercent ? `${pacingPercent}%` : '-'}
              </p>
              <div className="no-print mt-3 space-y-1">
                <p className="text-xs text-slate-400">Manual Budget (R)</p>
                <input type="number" placeholder="Enter total budget..." value={manualBudget}
                  onChange={e => onBudgetChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Campaign Duration</p>
          <div className="border-t border-slate-100 pt-3 space-y-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Duration</p>
              <p className="text-sm font-bold text-slate-900">
                {campaignStart && campaignEnd
                  ? `${campaignStart.replace(/-/g, '/')} - ${campaignEnd.replace(/-/g, '/')}`
                  : <span className="text-sm text-slate-400 font-normal">Set dates below</span>}
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-400 mb-1">Current Date</p>
              <p className="text-sm font-bold text-slate-900">{todayStr}</p>
            </div>
            {daysTotal !== null && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-400 mb-1">Progress</p>
                <p className="text-sm font-bold text-slate-900">{daysElapsed}/{daysTotal} days</p>
              </div>
            )}
            <div className="no-print border-t border-slate-100 pt-3 space-y-2">
              <div>
                <p className="text-xs text-slate-400 mb-1">Campaign Start Date</p>
                <input type="date" value={campaignStart || ''} onChange={e => onCampaignStartChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Campaign End Date</p>
                <input type="date" value={campaignEnd || ''} onChange={e => onCampaignEndChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
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