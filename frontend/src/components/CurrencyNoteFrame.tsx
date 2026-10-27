import React from 'react';
import type { CurrencyMode } from '../types';

interface CurrencyNoteFrameProps {
  imagePreview?: string | null;
  isScanning?: boolean;
  isValidating?: boolean;
  isConfirmed?: boolean;
  mode?: CurrencyMode;
}

export const CurrencyNoteFrame: React.FC<CurrencyNoteFrameProps> = ({
  imagePreview,
  isScanning = true,
  isValidating = false,
  isConfirmed = false,
  mode = 'auto',
}) => {
  const isCoinMode = mode === 'coin';

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none select-none overflow-hidden">
      {/* 1. Captured Image Preview (if present) */}
      {imagePreview && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-black/90">
          <img
            src={imagePreview}
            alt="Captured currency"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* 2. Reticle Viewfinder Geometry matching official reference specification */}
      {isCoinMode ? (
        // Circular Coin Frame
        <div
          className={`relative z-10 transition-all duration-300 w-[240px] sm:w-[280px] aspect-square rounded-full flex items-center justify-center ${
            isConfirmed
              ? 'border-4 border-[#00C853] shadow-[0_0_36px_rgba(0,200,83,0.6)]'
              : isValidating
              ? 'border-4 border-[#1DE9B6] animate-pulse shadow-[0_0_24px_rgba(29,233,182,0.5)]'
              : 'border-3 border-dashed border-[#00C853]/80'
          }`}
        >
          {isScanning && !imagePreview && !isValidating && (
            <div className="scanner-laser" aria-hidden="true" />
          )}
          <div className="w-3 h-3 rounded-full bg-[#00C853]" />
        </div>
      ) : (
        // Banknote Proportional Frame with Rounded Emerald Corner Brackets (Screens 5 & 6)
        <div
          className="relative z-10 w-[84%] max-w-[390px] aspect-[1.95/1] flex items-center justify-center"
        >
          {/* Corner Brackets */}
          <div className="absolute -top-1 -left-1 w-9 h-9 border-t-[4px] border-l-[4px] border-[#00C853] rounded-tl-2xl shadow-xs" />
          <div className="absolute -top-1 -right-1 w-9 h-9 border-t-[4px] border-r-[4px] border-[#00C853] rounded-tr-2xl shadow-xs" />
          <div className="absolute -bottom-1 -left-1 w-9 h-9 border-b-[4px] border-l-[4px] border-[#00C853] rounded-bl-2xl shadow-xs" />
          <div className="absolute -bottom-1 -right-1 w-9 h-9 border-b-[4px] border-r-[4px] border-[#00C853] rounded-br-2xl shadow-xs" />

          {/* Sweeping laser line inside frame */}
          {(isScanning || isValidating) && !imagePreview && (
            <div className="scanner-laser" aria-hidden="true" />
          )}

          {/* Subtle translucent backdrop inside frame */}
          <div className="w-full h-full rounded-xl bg-white/[0.02]" />
        </div>
      )}
    </div>
  );
};
