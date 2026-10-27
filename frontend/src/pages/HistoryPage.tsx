import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Coins,
  FileText,
  AlertTriangle,
  XCircle,
  Download,
  Printer,
} from 'lucide-react';
import { api } from '../services/api';
import type { RecognitionRecord } from '../types';
import { EmptyState } from '../components/EmptyState';
import { CurrencyVisual } from '../components/CurrencyVisual';

const DENOMINATIONS = [
  'All',
  '₹10',
  '₹20',
  '₹50',
  '₹100',
  '₹200',
  '₹500',
  '₹2000',
  '₹1 Coin',
  '₹2 Coin',
  '₹5 Coin',
  '₹10 Coin',
  '₹20 Coin',
  '25 Paisa Coin',
  '50 Paisa Coin',
];

export const HistoryPage: React.FC = () => {
  const [records, setRecords] = useState<RecognitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDenom, setSelectedDenom] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'banknote' | 'coin' | 'rejected'>('All');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory({
        search: search.trim() || undefined,
        denomination: selectedDenom !== 'All' ? selectedDenom : undefined,
        currency_type: typeFilter !== 'All' ? typeFilter : undefined,
      });
      setRecords(res.records || []);
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedDenom, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  // CSV Export for empirical audit tracking
  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = [
      'ID',
      'Timestamp (ISO)',
      'Timestamp (Local)',
      'Predicted Denomination',
      'Currency Type',
      'Confidence (%)',
      'Safety Status',
      'Safety Concern',
      'Model Version',
      'Inference Time (ms)',
      'Device',
      'Filename',
    ];

    const rows = records.map((r) => [
      r.id,
      new Date(r.timestamp).toISOString(),
      `"${new Date(r.timestamp).toLocaleString()}"`,
      `"${r.predicted_denomination || ''}"`,
      r.currency_type || 'banknote',
      r.confidence !== null ? (r.confidence * 100).toFixed(1) : '',
      `"${r.safety_status || 'active_circulation'}"`,
      `"${r.safety_concern || ''}"`,
      r.model_version || '1.0.0',
      r.inference_ms || '',
      r.device || 'cuda:0',
      `"${r.image_filename || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `nira_currency_audit_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Printable Audit Report
  const handlePrintReport = () => {
    window.print();
  };

  const isRejectedRecord = (r: RecognitionRecord) => {
    const denom = (r.predicted_denomination || '').toLowerCase();
    const safety = (r.safety_status || '').toLowerCase();
    return (
      denom.includes('uncertain') ||
      denom.includes('non-currency') ||
      denom.includes('unknown') ||
      safety.includes('reject') ||
      !r.predicted_denomination
    );
  };

  const parseDenomNumeric = (denom: string | null | undefined): number => {
    if (!denom) return 0;
    const lower = denom.toLowerCase();
    if (
      lower.includes('uncertain') ||
      lower.includes('non-currency') ||
      lower.includes('unknown') ||
      lower.includes('rejected')
    ) {
      return 0;
    }
    if (denom.includes('25 Paisa')) return 0.25;
    if (denom.includes('50 Paisa')) return 0.50;
    const cleaned = denom.replace('₹', '').replace(' Coin', '').replace(' Paisa', '').trim();
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
  };

  // Aggregated Counters
  const totalScans = records.length;
  const rejectedCount = records.filter(isRejectedRecord).length;
  const coinCount = records.filter((r) => !isRejectedRecord(r) && (r.currency_type === 'coin' || r.predicted_denomination?.includes('Coin') || r.predicted_denomination?.includes('Paisa'))).length;
  const banknoteCount = records.filter((r) => !isRejectedRecord(r) && r.currency_type !== 'coin' && !r.predicted_denomination?.includes('Coin') && !r.predicted_denomination?.includes('Paisa')).length;

  const totalRecognizedValue = records
    .filter((r) => !isRejectedRecord(r))
    .reduce((sum, r) => sum + parseDenomNumeric(r.predicted_denomination), 0);

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full">
      {/* Printable Report Header */}
      <div className="hidden print:block border-b-2 border-stone-800 pb-3 mb-4">
        <h1 className="text-xl font-black text-white uppercase">
          NIRA — Currency Recognition Audit Trail
        </h1>
        <p className="text-xs text-[#9EABA6] mt-0.5">
          Generated: {new Date().toLocaleString()} | Total Records: {totalScans}
        </p>
      </div>

      {/* Screen Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22332E] pb-3 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-['Outfit'] text-[#00C853]">
              Recognition History
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#161F1D] text-[#9EABA6] border border-[#22332E]">
              {totalScans} events
            </span>
          </div>
          <p className="text-xs text-[#9EABA6] mt-0.5">
            Verified scan events persisted in local SQLite database.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121212] hover:bg-[#161F1D] text-white text-xs font-bold border border-[#22332E] transition-colors shadow-2xs disabled:opacity-50"
            title="Export audit records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#00C853]" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            disabled={records.length === 0}
            className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121212] hover:bg-[#161F1D] text-white text-xs font-bold border border-[#22332E] transition-colors shadow-2xs disabled:opacity-50"
            title="Print report"
          >
            <Printer className="w-3.5 h-3.5 text-[#00C853]" />
            <span>Print</span>
          </button>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161F1D] hover:bg-[#22332E] text-white text-xs font-semibold border border-[#22332E] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Empirical Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className="rounded-xl border border-[#22332E] bg-[#121212] p-3">
          <div className="text-[10px] uppercase font-bold text-[#9EABA6]">Total Scans</div>
          <div className="text-lg font-black text-white font-['Outfit']">{totalScans}</div>
          <div className="text-[10px] text-[#64746E]">SQLite records</div>
        </div>
        <div className="rounded-xl border border-[#22332E] bg-[#121212] p-3">
          <div className="text-[10px] uppercase font-bold text-[#9EABA6]">Recognized Notes</div>
          <div className="text-lg font-black text-[#00C853] font-['Outfit']">{banknoteCount}</div>
          <div className="text-[10px] text-[#64746E]">Valid banknotes</div>
        </div>
        <div className="rounded-xl border border-[#22332E] bg-[#121212] p-3">
          <div className="text-[10px] uppercase font-bold text-[#9EABA6]">Recognized Coins</div>
          <div className="text-lg font-black text-[#1DE9B6] font-['Outfit']">{coinCount}</div>
          <div className="text-[10px] text-[#64746E]">Valid metallic coins</div>
        </div>
        <div className="rounded-xl border border-[#22332E] bg-[#121212] p-3">
          <div className="text-[10px] uppercase font-bold text-[#9EABA6]">Total Value (Scans)</div>
          <div className="text-lg font-black text-[#FFD700] font-['Outfit']">
            ₹{totalRecognizedValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-[#64746E] truncate" title="Sum of face values from recognized scan events. Note: camera scans cannot determine unique physical banknote identity.">
            Sum of recognized scan events
          </div>
        </div>
      </div>

      {/* Compact Filter Deck */}
      <div className="rounded-2xl border border-[#22332E] bg-[#121212] p-3 space-y-2.5 shadow-xs print:hidden">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64746E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by filename or denomination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#161F1D] border border-[#22332E] text-white text-xs placeholder:text-[#64746E] focus:outline-none focus:ring-2 focus:ring-[#00C853]"
            />
          </div>
          <button
            type="submit"
            className="touch-target px-4 py-2 rounded-xl bg-[#00C853] hover:bg-[#00B048] text-black text-xs font-bold transition-all shadow-xs"
          >
            Search
          </button>
        </form>

        {/* Currency Type & Denomination Filters */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-[#22332E] text-xs">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setTypeFilter('All')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                typeFilter === 'All'
                  ? 'bg-[#00C853] text-[#0B1F1A]'
                  : 'text-[#9EABA6] hover:bg-[#161F1D]'
              }`}
            >
              All ({totalScans})
            </button>
            <button
              onClick={() => setTypeFilter('banknote')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                typeFilter === 'banknote'
                  ? 'bg-[#00C853] text-[#0B1F1A]'
                  : 'text-[#9EABA6] hover:bg-[#161F1D]'
              }`}
            >
              <FileText className="w-3 h-3 text-[#1DE9B6]" />
              <span>Notes ({banknoteCount})</span>
            </button>
            <button
              onClick={() => setTypeFilter('coin')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                typeFilter === 'coin'
                  ? 'bg-[#00C853] text-[#0B1F1A]'
                  : 'text-[#9EABA6] hover:bg-[#161F1D]'
              }`}
            >
              <Coins className="w-3 h-3 text-[#1DE9B6]" />
              <span>Coins ({coinCount})</span>
            </button>
            <button
              onClick={() => setTypeFilter('rejected')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all ${
                typeFilter === 'rejected'
                  ? 'bg-[#DC2626] text-white'
                  : 'text-[#9EABA6] hover:bg-[#161F1D]'
              }`}
            >
              <XCircle className="w-3 h-3 text-[#DC2626]" />
              <span>Rejected ({rejectedCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
            <Filter className="w-3 h-3 text-[#9EABA6] shrink-0" />
            {DENOMINATIONS.slice(0, 8).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDenom(d)}
                className={`text-[11px] px-2 py-0.5 rounded font-bold shrink-0 transition-all ${
                  selectedDenom === d
                    ? 'bg-[#00C853] text-[#0B1F1A]'
                    : 'bg-[#161F1D] text-[#9EABA6] hover:bg-[#22332E]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Records List */}
      {loading ? (
        <div className="py-10 text-center text-xs text-[#9EABA6] space-y-2">
          <div className="w-7 h-7 border-2 border-[#161F1D] border-t-[#00C853] rounded-full animate-spin mx-auto" />
          <p>Loading recognition history...</p>
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Recognition Records Found"
          description={
            search || selectedDenom !== 'All' || typeFilter !== 'All'
              ? 'No matching scan events found with current filter parameters.'
              : 'Historical scans will be recorded here automatically once currency is recognized.'
          }
        />
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const dateStr = r.timestamp ? new Date(r.timestamp).toLocaleString() : '--';
            const isRej = isRejectedRecord(r);
            const isWithdrawn = r.safety_status === 'withdrawn_legal_tender' || r.safety_status === 'withdrawn_demonetized';
            const hasAnomaly = Boolean(r.safety_concern);

            return (
              <div
                key={r.id}
                className={`rounded-2xl border p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs transition-colors ${
                  isRej
                    ? 'border-red-950/40 bg-[#161113] hover:border-red-800/60'
                    : 'border-[#22332E] bg-[#121212] hover:border-[#38544C]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CurrencyVisual
                    denomination={r.predicted_denomination}
                    currencyType={r.currency_type}
                    size="xs"
                  />

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-lg font-black font-['Outfit'] ${
                          isRej ? 'text-red-400' : 'text-[#00C853]'
                        }`}
                      >
                        {r.predicted_denomination || 'Uncertain / Non-Currency'}
                      </span>

                      {isRej && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/60">
                          Rejected / Non-Currency
                        </span>
                      )}

                      {!isRej && r.confidence !== null && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#161F1D] text-[#00C853] border border-[#22332E]">
                          {(r.confidence * 100).toFixed(1)}%
                        </span>
                      )}

                      {isRej && r.confidence !== null && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-950/40 text-red-400 border border-red-900/50">
                          conf: {(r.confidence * 100).toFixed(1)}%
                        </span>
                      )}

                      {isWithdrawn && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                          Withdrawn
                        </span>
                      )}

                      {hasAnomaly && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>Anomaly</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#9EABA6] font-mono truncate max-w-xs sm:max-w-md">
                      {r.image_filename}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#9EABA6] self-end sm:self-center">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Calendar className="w-3 h-3 text-[#64746E]" />
                    {dateStr}
                  </span>
                  {r.inference_ms && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161F1D] text-[#9EABA6] border border-[#22332E]">
                      {Math.round(r.inference_ms)}ms
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
