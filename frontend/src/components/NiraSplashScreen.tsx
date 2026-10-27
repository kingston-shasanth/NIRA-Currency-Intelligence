import React, { useEffect, useState } from 'react';
import { NiraLogo } from './NiraLogo';

interface Props {
  onFinish?: () => void;
  autoDismissMs?: number;
}

export const NiraSplashScreen: React.FC<Props> = ({ onFinish, autoDismissMs = 1500 }) => {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / autoDismissMs) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        if (onFinish) {
          setTimeout(onFinish, 180);
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [autoDismissMs, onFinish]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#111417] text-[#F5EFEB] animate-in fade-in duration-300"
    >
      <div className="flex-1" />

      {/* Screen 1: Minimal Geometric NIRA Branding */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-xs animate-in zoom-in-95 duration-500">
        <NiraLogo variant="gold" size="xl" showSubtitle={true} className="flex-col !gap-3 text-center" />
      </div>

      <div className="flex-1" />

      {/* Bottom Progress Bar & AI Subtext with subtle Tricolor badge */}
      <div className="w-full max-w-xs space-y-4 text-center pb-6">
        <div className="w-full h-1 bg-[#1C2127] rounded-full overflow-hidden border border-[#2D343E]">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] via-[#E8DFC8] to-[#D4AF37] rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#A0AAB5] font-medium tracking-wide">
          <span>Accessible Currency Intelligence • Made for India</span>
        </div>
      </div>
    </div>
  );
};
