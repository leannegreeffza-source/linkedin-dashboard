'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Search, TrendingUp, TrendingDown, DollarSign, MousePointer, Eye, Target, Users, RefreshCw, ChevronDown, Calendar, ExternalLink } from 'lucide-react';

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
              <div>
                <div className="text-xs text-slate-400">Impr.</div>
                <div className="text-xs font-bold text-white">{item.impressions.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Clicks</div>
                <div className="text-xs font-bold text-white">{item.clicks.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">CTR</div>
                <div className="text-xs font-bold text-emerald-400">
                  {item.ctr || (item.impressions > 0 ? (item.clicks / item.impressions * 100).toFixed(2) : '0.00')}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Spent</div>
                <div className="text-xs font-bold text-white">
                  {item.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIReportModal({ show, onClose, generatingReport, reportData, reportResult, currentRange, previousRange, campaignNameMap }) {
  const reportRef = useRef(null);

  function downloadHTML() {
    if (!reportRef.current) return;
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
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  }

  function perfBadge(perf) {
    if (!perf) return '';
    if (perf.includes('above')) return '✅ Above Benchmark';
    if (perf.includes('below')) return '❌ Below Benchmark';
    return '➖ At Benchmark';
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-6xl my-4 overflow-hidden shadow-2xl">

        {/* Modal toolbar */}
        <div className="flex justify-between items-center px-6 py-3 bg-gray-100 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">✦ AI Campaign Report</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Editable</span>
          </div>
          <div className="flex gap-2">
            {report && !generatingReport && (
              <button onClick={downloadHTML}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-medium">
                ↓ Download HTML
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
            <p className="text-gray-400 text-sm mt-2">This may take 15–30 seconds</p>
          </div>
        ) : report ? (
          <div ref={reportRef} style={{fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", background: '#f4fbff', padding: '20px'}}>
            <div style={{maxWidth: '100%', margin: '0 auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden'}}>

              {/* Header */}
              <div style={{background: '#0e1034', color: 'white', padding: '30px'}} contentEditable suppressContentEditableWarning>
                <h1 style={{fontSize: '28px', marginBottom: '10px', margin: 0}}>📊 Campaign Optimization Summary</h1>
                <p style={{opacity: 0.9, fontSize: '14px', marginTop: '10px'}}>
                  <strong>Report Period:</strong> {currentRange.start} to {currentRange.end} &nbsp;|&nbsp;
                  <strong>Compare Period:</strong> {previousRange.start} to {previousRange.end}
                </p>
              </div>

              {/* Executive Summary */}
              <div style={{padding: '20px 30px', background: '#f0f4ff', borderBottom: '1px solid #e0e0e0'}}>
                <p style={{fontSize: '14px', color: '#333', lineHeight: 1.7}} contentEditable suppressContentEditableWarning>
                  {report.executiveSummary}
                </p>
              </div>

              {/* Summary Cards */}
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '30px'}}>
                {[
                  { label: 'Total Spend', value: metrics?.current?.spent?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}), sub: `vs ${metrics?.previous?.spent?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} prev` },
                  { label: 'Total Impressions', value: metrics?.current?.impressions?.toLocaleString(), sub: `${report.keyMetrics?.impressionsChange || ''} vs previous` },
                  { label: 'Total Clicks', value: metrics?.current?.clicks?.toLocaleString(), sub: `${report.keyMetrics?.clicksChange || ''} vs previous` },
                  { label: 'CTR', value: `${metrics?.current?.ctr?.toFixed(2)}%`, sub: `${report.keyMetrics?.ctrChange || ''} vs previous` },
                  { label: 'CPL', value: metrics?.current?.cpl?.toFixed(2), sub: `${report.keyMetrics?.cplChange || ''} vs previous` },
                  { label: 'Total Leads', value: metrics?.current?.leads, sub: `vs ${metrics?.previous?.leads} prev period` },
                ].map((card, i) => (
                  <div key={i} style={{background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                    <h3 style={{fontSize: '12px', color: '#666', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{card.label}</h3>
                    <div style={{fontSize: '28px', fontWeight: 'bold', color: '#0e1034', marginBottom: '5px'}} contentEditable suppressContentEditableWarning>{card.value}</div>
                    <div style={{fontSize: '13px', color: '#999'}} contentEditable suppressContentEditableWarning>{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* Campaign Performance Table */}
              <div style={{padding: '30px', borderTop: '1px solid #e0e0e0'}}>
                <h2 style={{fontSize: '22px', marginBottom: '20px', color: '#0e1034'}}>Campaign Performance Comparison</h2>
                <div style={{overflowX: 'auto'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px'}}>
                    <thead>
                      <tr>
                        {['Campaign', 'Impressions', 'Clicks', 'CTR', 'Spent', 'Leads', 'CPL', 'Performance', 'Trend'].map(h => (
                          <th key={h} style={{textAlign: 'left', padding: '12px', borderBottom: '1px solid #e0e0e0', background: '#f5f5f5', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#666'}}>
                            {h}
                          </th>
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
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0'}} contentEditable suppressContentEditableWarning>{c.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0'}} contentEditable suppressContentEditableWarning>{c.leads || 0}</td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0'}} contentEditable suppressContentEditableWarning>
                              {c.leads > 0 ? (c.spent / c.leads).toFixed(2) : '—'}
                            </td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0', color: statusColor(analysis?.status)}} contentEditable suppressContentEditableWarning>
                              {perfBadge(analysis?.performance)}
                            </td>
                            <td style={{padding: '12px', borderBottom: '1px solid #e0e0e0', fontSize: '20px'}} contentEditable suppressContentEditableWarning>
                              {trendArrow(analysis?.trend)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Charts Section */}
              <div style={{padding: '30px', borderTop: '1px solid #e0e0e0'}}>
                <h2 style={{fontSize: '22px', marginBottom: '20px', color: '#0e1034'}}>Performance Charts</h2>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                  <div style={{padding: '20px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px'}}>
                    <h3 style={{marginBottom: '15px', color: '#0e1034', fontSize: '16px'}}>Spend by Campaign</h3>
                    <canvas id="spendChart" style={{maxHeight: '300px'}}></canvas>
                  </div>
                  <div style={{padding: '20px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px'}}>
                    <h3 style={{marginBottom: '15px', color: '#0e1034', fontSize: '16px'}}>CTR by Campaign</h3>
                    <canvas id="ctrChart" style={{maxHeight: '300px'}}></canvas>
                  </div>
                  <div style={{padding: '20px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px'}}>
                    <h3 style={{marginBottom: '15px', color: '#0e1034', fontSize: '16px'}}>Clicks by Campaign</h3>
                    <canvas id="clicksChart" style={{maxHeight: '300px'}}></canvas>
                  </div>
                  <div style={{padding: '20px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px'}}>
                    <h3 style={{marginBottom: '15px', color: '#0e1034', fontSize: '16px'}}>Impressions by Campaign</h3>
                    <canvas id="impressionsChart" style={{maxHeight: '300px'}}></canvas>
                  </div>
                </div>
              </div>

              {/* Recommendations per Campaign */}
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
                            <span style={{position: 'absolute', left: 0, color: '#2196F3'}}>→</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Key Insights */}
              <div style={{padding: '30px', borderTop: '1px solid #e0e0e0'}}>
                <h2 style={{fontSize: '22px', marginBottom: '20px', color: '#0e1034'}}>Key Insights & Action Items</h2>

                <div style={{background: '#f9f9f9', borderLeft: '4px solid #4caf50', padding: '15px', margin: '10px 0', borderRadius: '4px'}}>
                  <h4 style={{color: '#0e1034', marginBottom: '10px', fontSize: '15px'}}>🎯 Top Performers</h4>
                  <ul style={{listStyle: 'none', padding: 0}}>
                    {report.topPerformers?.map((item, i) => (
                      <li key={i} style={{padding: '5px 0', paddingLeft: '20px', position: 'relative', color: '#444', fontSize: '14px'}} contentEditable suppressContentEditableWarning>
                        <span style={{position: 'absolute', left: 0, color: '#4caf50'}}>→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{background: '#f9f9f9', borderLeft: '4px solid #ff9800', padding: '15px', margin: '10px 0', borderRadius: '4px'}}>
                  <h4 style={{color: '#0e1034', marginBottom: '10px', fontSize: '15px'}}>⚠️ Areas for Improvement</h4>
                  <ul style={{listStyle: 'none', padding: 0}}>
                    {report.areasForImprovement?.map((item, i) => (
                      <li key={i} style={{padding: '5px 0', paddingLeft: '20px', position: 'relative', color: '#444', fontSize: '14px'}} contentEditable suppressContentEditableWarning>
                        <span style={{position: 'absolute', left: 0, color: '#ff9800'}}>→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{background: '#f9f9f9', borderLeft: '4px solid #2196F3', padding: '15px', margin: '10px 0', borderRadius: '4px'}}>
                  <h4 style={{color: '#0e1034', marginBottom: '10px', fontSize: '15px'}}>💡 Strategic Recommendations</h4>
                  <ul style={{listStyle: 'none', padding: 0}}>
                    {report.strategicRecommendations?.map((item, i) => (
                      <li key={i} style={{padding: '5px 0', paddingLeft: '20px', position: 'relative', color: '#444', fontSize: '14px'}} contentEditable suppressContentEditableWarning>
                        <span style={{position: 'absolute', left: 0, color: '#2196F3'}}>→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{background: '#f9f9f9', borderLeft: '4px solid #ff5252', padding: '15px', margin: '10px 0', borderRadius: '4px'}}>
                  <h4 style={{color: '#0e1034', marginBottom: '10px', fontSize: '15px'}}>🚀 Immediate Next Steps</h4>
                  <ul style={{listStyle: 'none', padding: 0}}>
                    {report.immediateActions?.map((item, i) => (
                      <li key={i} style={{padding: '5px 0', paddingLeft: '20px', position: 'relative', color: '#444', fontSize: '14px'}} contentEditable suppressContentEditableWarning>
                        <span style={{position: 'absolute', left: 0, color: '#ff5252'}}>→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {report.budgetRecommendation && (
                  <div style={{background: '#e8f5e9', borderLeft: '4px solid #4caf50', padding: '15px', margin: '10px 0', borderRadius: '4px'}}>
                    <h4 style={{color: '#0e1034', marginBottom: '10px', fontSize: '15px'}}>💰 Budget Recommendation</h4>
                    <p style={{color: '#444', fontSize: '14px'}} contentEditable suppressContentEditableWarning>{report.budgetRecommendation}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : null}

        {/* Chart init script injected after render */}
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
      const labels = campaigns.map(c => campaignNameMap?.[String(c.id)] || `Campaign ${c.id}`);
      const truncate = (s) => s.length > 25 ? s.substring(0, 25) + '...' : s;
      const shortLabels = labels.map(truncate);

      const chartConfig = (id, data, label, color) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el._chart) el._chart.destroy();
        el._chart = new window.Chart(el, {
          type: 'bar',
          data: {
            labels: shortLabels,
            datasets: [{ label, data, backgroundColor: color }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true } }
          }
        });
      };

      chartConfig('spendChart', campaigns.map(c => c.spent), 'Spend', '#2196F3');
      chartConfig('ctrChart', campaigns.map(c => parseFloat(c.ctr)), 'CTR %', '#4caf50');
      chartConfig('clicksChart', campaigns.map(c => c.clicks), 'Clicks', '#ff9800');
      chartConfig('impressionsChart', campaigns.map(c => c.impressions), 'Impressions', '#9c27b0');
    };
    document.head.appendChild(script);

    return () => { document.head.removeChild(script); };
  }, [campaigns]);

  return null;
}

function generateFullHTML(reportResult, reportData, currentRange, previousRange, campaignNameMap) {
  const report = reportResult?.report;
  const metrics = reportResult?.metrics;
  const campaigns = metrics?.topCampaigns || [];

  const statusColor = (s) => s === 'critical' ? '#ff5252' : s === 'warning' ? '#ff9800' : '#4caf50';
  const trendArrow = (t) => t === 'up' ? '↑' : t === 'down' ? '↓' : '→';
  const perfBadge = (p) => p?.includes('above') ? '✅ Above Benchmark' : p?.includes('below') ? '❌ Below Benchmark' : '➖ At Benchmark';

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
.summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;padding:30px}
.summary-card{background:white;border:1px solid #e0e0e0;border-radius:8px;padding:20px;box-shadow:0 2px 4px rgba(0,0,0,0.05)}
.summary-card h3{font-size:12px;color:#666;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px}
.summary-card .value{font-size:28px;font-weight:bold;color:#0e1034;margin-bottom:5px}
.summary-card .subtext{font-size:13px;color:#999}
section{padding:30px;border-top:1px solid #e0e0e0}
section h2{font-size:22px;margin-bottom:20px;color:#0e1034}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:12px;border-bottom:1px solid #e0e0e0}
th{background:#f5f5f5;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#666}
.chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.chart-box{padding:20px;background:white;border:1px solid #e0e0e0;border-radius:8px}
.chart-box h3{margin-bottom:15px;color:#0e1034;font-size:16px}
canvas{max-height:280px!important}
.rec-box{background:#f9f9f9;padding:15px;margin:10px 0;border-radius:4px}
.rec-box ul{list-style:none;padding:0}
.rec-box li{padding:5px 0 5px 20px;position:relative;color:#444;font-size:14px}
.exec-summary{padding:20px 30px;background:#f0f4ff;border-bottom:1px solid #e0e0e0;font-size:14px;color:#333;line-height:1.7}
</style>
</head>
<body>
<div class="container">
<header>
<h1>📊 Campaign Optimization Summary</h1>
<p><strong>Report Period:</strong> ${currentRange.start} to ${currentRange.end} | <strong>Compare Period:</strong> ${previousRange.start} to ${previousRange.end}</p>
</header>
<div class="exec-summary">${report?.executiveSummary || ''}</div>
<div class="summary-grid">
${[
  { label: 'Total Spend', value: metrics?.current?.spent?.toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2}), sub: `vs ${metrics?.previous?.spent?.toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2})} prev` },
  { label: 'Impressions', value: metrics?.current?.impressions?.toLocaleString(), sub: `${report?.keyMetrics?.impressionsChange || ''} vs previous` },
  { label: 'Clicks', value: metrics?.current?.clicks?.toLocaleString(), sub: `${report?.keyMetrics?.clicksChange || ''} vs previous` },
  { label: 'CTR', value: `${metrics?.current?.ctr?.toFixed(2)}%`, sub: `${report?.keyMetrics?.ctrChange || ''} vs previous` },
  { label: 'CPL', value: metrics?.current?.cpl?.toFixed(2), sub: `${report?.keyMetrics?.cplChange || ''} vs previous` },
  { label: 'Total Leads', value: metrics?.current?.leads, sub: `vs ${metrics?.previous?.leads} prev period` },
].map(c => `<div class="summary-card"><h3>${c.label}</h3><div class="value">${c.value}</div><div class="subtext">${c.sub}</div></div>`).join('')}
</div>
<section>
<h2>Campaign Performance Comparison</h2>
<table>
<thead><tr><th>Campaign</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Spent</th><th>Leads</th><th>CPL</th><th>Performance</th><th>Trend</th></tr></thead>
<tbody>
${campaigns.map((c, i) => {
  const analysis = report?.campaignAnalysis?.find(a => String(a.id) === String(c.id));
  const name = campaignNameMap?.[String(c.id)] || `Campaign ${c.id}`;
  return `<tr style="background:${i%2===0?'white':'#fafafa'}">
<td><strong>${name}</strong><br/><span style="font-size:11px;color:#999;font-family:monospace">ID: ${c.id}</span></td>
<td>${c.impressions.toLocaleString()}</td>
<td>${c.clicks.toLocaleString()}</td>
<td>${c.ctr}%</td>
<td>${c.spent.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
<td>${c.leads||0}</td>
<td>${c.leads>0?(c.spent/c.leads).toFixed(2):'—'}</td>
<td style="color:${statusColor(analysis?.status)}">${perfBadge(analysis?.performance)}</td>
<td style="font-size:20px">${trendArrow(analysis?.trend)}</td>
</tr>`;
}).join('')}
</tbody>
</table>
</section>
<section>
<h2>Performance Charts</h2>
<div class="chart-grid">
<div class="chart-box"><h3>Spend by Campaign</h3><canvas id="spendChart"></canvas></div>
<div class="chart-box"><h3>CTR by Campaign</h3><canvas id="ctrChart"></canvas></div>
<div class="chart-box"><h3>Clicks by Campaign</h3><canvas id="clicksChart"></canvas></div>
<div class="chart-box"><h3>Impressions by Campaign</h3><canvas id="impressionsChart"></canvas></div>
</div>
</section>
<section>
<h2>Optimization Recommendations</h2>
${report?.campaignAnalysis?.map(a => {
  const name = campaignNameMap?.[String(a.id)] || `Campaign ${a.id}`;
  return `<div class="rec-box" style="border-left:4px solid #2196F3">
<h4 style="color:#0e1034;margin-bottom:10px;font-size:15px">${name} <span style="font-size:11px;color:#999">(ID: ${a.id})</span></h4>
<ul>${a.recommendations?.map(r => `<li style="padding-left:20px;position:relative"><span style="position:absolute;left:0;color:#2196F3">→</span>${r}</li>`).join('')}</ul>
</div>`;
}).join('')}
</section>
<section>
<h2>Key Insights & Action Items</h2>
${[
  {title:'🎯 Top Performers', items: report?.topPerformers, color:'#4caf50'},
  {title:'⚠️ Areas for Improvement', items: report?.areasForImprovement, color:'#ff9800'},
  {title:'💡 Strategic Recommendations', items: report?.strategicRecommendations, color:'#2196F3'},
  {title:'🚀 Immediate Next Steps', items: report?.immediateActions, color:'#ff5252'},
].map(s => `<div class="rec-box" style="border-left:4px solid ${s.color}">
<h4 style="color:#0e1034;margin-bottom:10px;font-size:15px">${s.title}</h4>
<ul>${(s.items||[]).map(i => `<li style="padding-left:20px;position:relative"><span style="position:absolute;left:0;color:${s.color}">→</span>${i}</li>`).join('')}</ul>
</div>`).join('')}
${report?.budgetRecommendation ? `<div class="rec-box" style="border-left:4px solid #4caf50;background:#e8f5e9">
<h4 style="color:#0e1034;margin-bottom:10px;font-size:15px">💰 Budget Recommendation</h4>
<p style="color:#444;font-size:14px">${report.budgetRecommendation}</p>
</div>` : ''}
</section>
</div>
<script>
const labels = ${JSON.stringify(campaigns.map(c => { const n = campaignNameMap?.[String(c.id)] || `Campaign ${c.id}`; return n.length > 25 ? n.substring(0,25)+'...' : n; }))};
function makeChart(id, data, label, color) {
  new Chart(document.getElementById(id), {
    type: 'bar',
    data: { labels, datasets: [{ label, data, backgroundColor: color }] },
    options: { responsive:true, maintainAspectRatio:true, indexAxis:'y', plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true}} }
  });
}
makeChart('spendChart', ${JSON.stringify(campaigns.map(c => c.spent))}, 'Spend', '#2196F3');
makeChart('ctrChart', ${JSON.stringify(campaigns.map(c => parseFloat(c.ctr)))}, 'CTR %', '#4caf50');
makeChart('clicksChart', ${JSON.stringify(campaigns.map(c => c.clicks))}, 'Clicks', '#ff9800');
makeChart('impressionsChart', ${JSON.stringify(campaigns.map(c => c.impressions))}, 'Impressions', '#9c27b0');
<\/script>
</body>
</html>`;
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

  const campaignNameMap = Object.fromEntries(campaigns.map(c => [String(c.id), c.name]));
  const adNameMap = Object.fromEntries(ads.map(a => [String(a.id), a.name]));
  const primaryAccountId = selectedAccounts[0];

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

                  <div className="hidden print:block mb-6">
                    <h2 className="text-xl font-bold text-white">LinkedIn Campaign Report</h2>
                    <p className="text-slate-400 text-sm">Period: {currentRange.start} to {currentRange.end} | Compare: {previousRange.start} to {previousRange.end}</p>
                  </div>

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
                        <MetricCard key={metric.key} label={metric.label}
                          current={reportData.current[metric.key]}
                          previous={reportData.previous[metric.key]}
                          format={metric.format} icon={metric.icon} />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <TopPerformingBlock title="Top Campaigns" items={reportData.topCampaigns}
                      accountId={primaryAccountId} type="campaign" nameMap={campaignNameMap} />
                    <TopPerformingBlock title="Top Ads" items={reportData.topAds}
                      accountId={primaryAccountId} type="ad" nameMap={adNameMap} />
                  </div>

                  <BudgetPacingCard pacing={reportData.budgetPacing}
                    manualBudget={manualBudget} onBudgetChange={setManualBudget} />
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
          <input type="number" placeholder="Enter budget..." value={manualBudget}
            onChange={e => onBudgetChange(e.target.value)}
            className="no-print w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-blue-500" />
          {manualBudget && <div className="hidden print:block text-2xl font-bold text-white">{parseFloat(manualBudget).toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2})}</div>}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-2">Spent</label>
          <div className="text-2xl font-bold text-white">{pacing.spent.toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
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