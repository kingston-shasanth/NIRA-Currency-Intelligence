import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, ChevronRight, Coins, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';
import { useSettings } from '../hooks/useSettings';
import type { RecognitionRecord } from '../types';
import { CurrencyVisual } from './CurrencyVisual';

const EMPTY_SCANS: RecognitionRecord[] = [];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recentScans?: RecognitionRecord[];
}

export const NiraHistoryModal: React.FC<Props> = ({ isOpen, onClose, recentScans = EMPTY_SCANS }) => {
  const { announceDenomination } = useSettings();
  const [filter, setFilter] = useState<'all' | 'notes' | 'coins'>('all');
  const [records, setRecords] = useState<RecognitionRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecognitionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const recentScansRef = useRef(recentScans);
  recentScansRef.current = recentScans;

  useEffect(() => {
    if (!isOpen) {
      setSelectedRecord(null);
      return;
    }

    let isSubscribed = true;
    setIsLoading(true);

    api
      .getHistory({ limit: 100 })
      .then((res) => {
        if (!isSubscribed) return;
        // Merge real database records with any active session scans
        const dbRecords = res.records || [];
        const activeScans = recentScansRef.current;
        const combined = [...activeScans];
        for (const r of dbRecords) {
          if (!combined.some((c) => c.id === r.id)) {
            combined.push(r);
          }
        }
        setRecords(combined);
      })
      .catch(() => {
        if (!isSubscribed) return;
        setRecords(recentScansRef.current);
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRecords = records.filter((r) => {
    const isCoin = r.currency_type === 'coin' || r.predicted_denomination?.toLowerCase().includes('coin');
    if (filter === 'notes') return !isCoin;
    if (filter === 'coins') return isCoin;
    return true;
  });

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  const handleListenAgain = (record: RecognitionRecord) => {
    const denom = record.predicted_denomination || 'Currency';
    const conf = record.confidence ? `${Math.min(Math.round(record.confidence * 100), 99)}%` : '99%';
    announceDenomination(denom, conf, false, record.safety_status);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-[#111417] text-[#F5EFEB] animate-in slide-in-from-right duration-200"
    >
      {/* =========================================================================
          SCREEN 13 — Scan Details (History Detail View)
         ========================================================================= */}
      {selectedRecord ? (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 border-b border-[#2D343E] px-4 flex items-center gap-3 pt-safe shrink-0">
            <button
              onClick={() => setSelectedRecord(null)}
              className="touch-target p-2 rounded-xl text-[#A0AAB5] hover:text-white hover:bg-[#181C20] transition-colors"
              aria-label="Back to History"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg text-[#F5EFEB]">
              Scan Details
            </h2>
          </div>

          {/* Detail Body */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-md mx-auto w-full flex flex-col justify-between">
            <div className="space-y-5">
              {/* Image Preview Box */}
              <div className="w-full aspect-[2/1] rounded-2xl bg-[#111417] border border-[#2D343E] overflow-hidden flex items-center justify-center p-3 relative shadow-md">
                {selectedRecord.image_filename ? (
                  <img
                    src={
                      selectedRecord.image_filename.startsWith('data:')
                        ? selectedRecord.image_filename
                        : `${api.getApiBaseUrl()}/uploads/${selectedRecord.image_filename}`
                    }
                    alt={selectedRecord.predicted_denomination || 'Scanned currency'}
                    className="w-full h-full object-contain rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center text-[#A0AAB5] space-y-1">
                    <ImageIcon className="w-8 h-8 mx-auto text-[#D4AF37]" />
                    <span className="text-xs">Camera Snapshot</span>
                  </div>
                )}
              </div>

              {/* Canonical Currency Visual Illustration */}
              <div className="flex justify-center py-2 px-3 rounded-2xl bg-[#181C20] border border-[#2D343E]">
                <CurrencyVisual
                  denomination={selectedRecord.predicted_denomination}
                  currencyType={selectedRecord.currency_type}
                  size="lg"
                  showDetails={true}
                />
              </div>

              {/* Title Result */}
              <div>
                <h3 className="text-xl font-bold text-[#F5EFEB]">
                  This is a {selectedRecord.predicted_denomination?.replace('₹', '') || ''} rupee{' '}
                  {selectedRecord.currency_type === 'coin' ? 'coin' : 'note'}.
                </h3>
              </div>

              {/* Breakdown Table */}
              <div className="rounded-2xl bg-[#181C20] border border-[#2D343E] divide-y divide-[#2D343E] text-xs">
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-[#A0AAB5] font-medium">Denomination</span>
                  <span className="font-bold text-[#F5EFEB] text-sm">
                    {selectedRecord.predicted_denomination || '₹--'}
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-[#A0AAB5] font-medium">Type</span>
                  <span className="font-bold text-[#F5EFEB] capitalize">
                    {selectedRecord.currency_type || 'Banknote'}
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-[#A0AAB5] font-medium">Result</span>
                  <span className="font-bold text-[#E8DFC8] bg-[#1B5E3F]/40 border border-[#1B5E3F] px-2 py-0.5 rounded-md">
                    Recognized
                  </span>
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-[#A0AAB5] font-medium">Date & Time</span>
                  <span className="font-mono text-[#F5EFEB]">
                    {formatTimestamp(selectedRecord.timestamp)}
                  </span>
                </div>
              </div>
            </div>

            {/* Listen Again Action Button */}
            <div className="pt-4 pb-6">
              <button
                onClick={() => handleListenAgain(selectedRecord)}
                className="touch-target w-full py-3.5 rounded-xl bg-[#1B5E3F] hover:bg-[#154a32] text-white font-bold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <Volume2 className="w-5 h-5 fill-current text-[#D4AF37]" />
                <span>Listen Again</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            SCREEN 12 — History List Screen
           ========================================================================= */
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 border-b border-[#2D343E] px-4 flex items-center gap-3 pt-safe shrink-0">
            <button
              onClick={onClose}
              className="touch-target p-2 rounded-xl text-[#A0AAB5] hover:text-white hover:bg-[#181C20] transition-colors"
              aria-label="Back to Camera"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg text-[#F5EFEB]">
              History
            </h2>
          </div>

          {/* Segmented Filter Control: [All] [Notes] [Coins] */}
          <div className="px-4 py-3 shrink-0 max-w-md mx-auto w-full">
            <div className="p-1 rounded-2xl bg-[#181C20] border border-[#2D343E] flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`touch-target flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === 'all'
                    ? 'bg-[#232931] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                    : 'text-[#A0AAB5] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('notes')}
                className={`touch-target flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === 'notes'
                    ? 'bg-[#232931] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                    : 'text-[#A0AAB5] hover:text-white'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setFilter('coins')}
                className={`touch-target flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === 'coins'
                    ? 'bg-[#232931] text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm'
                    : 'text-[#A0AAB5] hover:text-white'
                }`}
              >
                Coins
              </button>
            </div>
          </div>

          {/* List of Scanned Cards */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5 max-w-md mx-auto w-full pb-8">
            {isLoading ? (
              <div className="text-center py-12 text-[#A0AAB5] text-xs">
                Loading recognition records...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-16 text-[#A0AAB5] space-y-2">
                <Coins className="w-10 h-10 mx-auto text-[#D4AF37]/60" />
                <p className="text-sm font-bold text-[#F5EFEB]">No scans yet</p>
                <p className="text-xs">Tap the scanner to recognize any Indian currency note or coin.</p>
              </div>
            ) : (
              filteredRecords.map((item) => {
                const isCoin = item.currency_type === 'coin';
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedRecord(item)}
                    className="touch-target w-full p-3.5 rounded-2xl bg-[#181C20] border border-[#2D343E] hover:border-[#D4AF37]/50 flex items-center justify-between transition-colors text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Currency Visual Thumbnail */}
                      <CurrencyVisual
                        denomination={item.predicted_denomination}
                        currencyType={item.currency_type}
                        size="xs"
                      />

                      <div>
                        <div className="text-sm font-bold text-[#F5EFEB]">
                          {item.predicted_denomination}{' '}
                          <span className="text-xs font-medium text-[#A0AAB5]">
                            {isCoin ? 'Coin' : 'Banknote'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#A0AAB5]">
                          {formatTimestamp(item.timestamp)}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#A0AAB5]" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
