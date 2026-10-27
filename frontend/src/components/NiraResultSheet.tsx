import React from 'react';
import { Volume2, CheckCircle2, RotateCcw } from 'lucide-react';
import type { PredictionResponse } from '../types';
import { CurrencyVisual } from './CurrencyVisual';
import { useSettings } from '../hooks/useSettings';
import { getPhrases } from '../utils/i18n';

interface Props {
  prediction: PredictionResponse | null;
  imagePreview: string | null;
  clientTurnaroundMs?: number | null;
  onScanAgain: () => void;
  onDone: () => void;
  onRepeatAudio: () => void;
}

export const NiraResultSheet: React.FC<Props> = ({
  prediction,
  imagePreview,
  clientTurnaroundMs,
  onScanAgain,
  onDone,
  onRepeatAudio,
}) => {
  const { settings } = useSettings();
  const phrases = getPhrases(settings.speechLanguage);

  if (!prediction) return null;

  const isRejected = prediction.rejected || !prediction.is_currency;
  const denom = prediction.predicted_denomination || '₹--';
  const isCoin = prediction.currency_type === 'coin';
  const confidence = Math.min(prediction.confidence * 100, 99.9).toFixed(1);

  // =========================================================================
  // SCREEN 14 — Non-Currency Feedback
  // =========================================================================
  if (isRejected) {
    return (
      <div
        role="region"
        aria-label="Non-Currency Feedback"
        className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-safe animate-in slide-in-from-bottom duration-300 pointer-events-auto"
      >
        <div className="w-full max-w-sm mx-auto bg-[#181C20] border border-[#2D343E] rounded-3xl p-5 shadow-2xl text-[#F5EFEB] space-y-4 text-center">
          {/* Currency Visual Placeholder showing Non-Currency */}
          <div className="flex justify-center">
            <CurrencyVisual denomination="uncertain" size="md" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#F5EFEB] font-['Outfit']">{phrases.rejectedUiTitle}</h3>
            <p className="text-xs text-[#A0AAB5] leading-relaxed">
              {phrases.rejectedUiNotice}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onRepeatAudio}
              className="touch-target p-3.5 rounded-full bg-[#1B5E3F] hover:bg-[#2E7D32] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0"
              title="Repeat audio guidance"
              aria-label="Repeat audio guidance"
            >
              <Volume2 className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={onScanAgain}
              className="touch-target flex-1 py-3.5 rounded-full bg-[#232931] hover:bg-[#2A313A] text-[#D4AF37] font-bold text-xs border border-[#D4AF37]/50 transition-all flex items-center justify-center gap-1.5 active:scale-95 whitespace-nowrap shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Scan Again</span>
            </button>

            <button
              onClick={onDone}
              className="touch-target px-4 py-3.5 rounded-full bg-[#181C20] hover:bg-[#232931] text-[#A0AAB5] hover:text-white font-semibold text-xs border border-[#2D343E] shadow-xs active:scale-98 transition-all flex items-center justify-center"
            >
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 7 — Recognized Scan Result with Session Info & Voice Button
  // =========================================================================
  return (
    <div
      role="region"
      aria-label="Scan Result"
      className="absolute bottom-0 left-0 right-0 z-30 p-4 pb-safe animate-in slide-in-from-bottom duration-300 pointer-events-auto"
    >
      <div className="w-full max-w-sm mx-auto bg-[#181C20] border border-[#2D343E] rounded-3xl p-5 shadow-2xl text-[#F5EFEB] space-y-3.5 max-h-[85vh] overflow-y-auto">
        {/* Top Row: Camera Thumbnail + Heading + Voice Repeat Button */}
        <div className="flex items-center gap-3">
          {/* Note Thumbnail */}
          <div className="relative w-14 h-11 rounded-xl bg-[#232931] border border-[#2D343E] overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt={`Captured frame of ${denom}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-xs font-bold text-[#D4AF37]">{denom}</div>
            )}
          </div>

          {/* Heading */}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-[#A0AAB5] font-medium leading-none">
              Identified Indian Currency
            </div>
            <div className="text-lg font-black text-[#F5EFEB] tracking-tight leading-snug font-['Outfit']">
              {denom} {isCoin ? 'coin' : 'banknote'}
            </div>
          </div>

          {/* Green Circular Speaker Button (Screen 7) */}
          <button
            onClick={onRepeatAudio}
            className="w-11 h-11 rounded-full bg-[#1B5E3F] hover:bg-[#2E7D32] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0"
            title="Repeat voice output"
            aria-label="Repeat voice announcement"
          >
            <Volume2 className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Canonical Currency Visual Illustration */}
        <div className="flex items-center justify-center py-1.5 px-3 rounded-2xl bg-[#111417] border border-[#2D343E]/80 shadow-inner">
          <CurrencyVisual
            denomination={denom}
            currencyType={prediction.currency_type}
            size="lg"
            showDetails={true}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-[#2D343E]" />

        {/* Metadata Table (Screen 7) */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[#A0AAB5]">Denomination</span>
            <span className="font-bold text-[#F5EFEB]">{denom}</span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[#A0AAB5]">Type</span>
            <span className="font-semibold text-[#F5EFEB] capitalize">
              {isCoin ? 'Coin' : 'Banknote'}
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[#A0AAB5]">Result</span>
            <span className="font-semibold text-[#E8DFC8] bg-[#1B5E3F]/40 border border-[#1B5E3F] px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Recognized</span>
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[#A0AAB5]">Confidence</span>
            <span className="font-semibold text-[#D4AF37]">{confidence}%</span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-[#A0AAB5]">Model Inference (CUDA)</span>
            <span className="font-mono text-[#F5EFEB]">{Math.round(prediction.inference_ms)} ms</span>
          </div>
          {prediction.backend_processing_ms !== undefined && prediction.backend_processing_ms !== null && (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#A0AAB5]">Backend Processing</span>
              <span className="font-mono text-[#A0AAB5]">{Math.round(prediction.backend_processing_ms)} ms</span>
            </div>
          )}
          {clientTurnaroundMs !== undefined && clientTurnaroundMs !== null && (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#A0AAB5]">Client Turnaround</span>
              <span className="font-mono text-[#A0AAB5]">{clientTurnaroundMs} ms</span>
            </div>
          )}
        </div>


        {/* Action Buttons (Screen 7) */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onScanAgain}
            className="touch-target flex-1 py-3 rounded-full bg-[#232931] hover:bg-[#2A313A] text-[#D4AF37] font-bold text-xs border border-[#D4AF37]/50 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Scan Again</span>
          </button>

          <button
            onClick={onDone}
            className="touch-target flex-1 py-3 rounded-full bg-[#1B5E3F] hover:bg-[#2E7D32] text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center"
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
